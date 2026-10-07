import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRight, CaseSensitive, List as IconList, Milestone } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useReaderStore } from '@/store/reader';
import { useSettingsStore } from '@/store/settings';
import {
  getBookMeta,
  getChapter,
  getChapters,
  getVersesInChapter,
  resolveTranslation,
  subUnitOf,
  translationKeyForLanguage,
} from '@/lib/scripture';
import { eventsStartingAt } from '@/lib/companions';
import { VerseBlock } from '@/components/VerseBlock';
import { ExplainDrawer } from '@/components/ExplainDrawer';
import { ChapterSelector } from '@/components/ChapterSelector';
import { markVerseRead, getReadVerseIds } from '@/db/progress';
import { updateTodayStreak } from '@/db/streak';
import { addReadingSeconds } from '@/db/readingTime';
import { setLastPosition } from '@/db/position';
import { getBookmarkedVerseIds, toggleBookmark } from '@/db/bookmarks';
import type { BookMeta, TranslationKey, Verse } from '@/types/scripture';

// Full kandas run to ~3,700 verses — far too many blocks to mount at once.
// The reader stays a single continuous scroll (no pagination per DONTS.md);
// we just mount verse blocks incrementally as the user approaches the bottom.
const INITIAL_RENDER = 60;
// Small batches, rendered as a low-priority transition, so growing the list
// never blocks the scroll that triggered it.
const RENDER_BATCH = 60;
const EXTEND_THRESHOLD_PX = 3000;
// Height of the top bar. It floats over the text and slides away while the
// reader scrolls down, then returns on any upward scroll.
const BAR_H = 56;
// Font scale cycles: normal → large → small → normal.
const FONT_SCALES = [1.0, 1.2, 0.85] as const;

// Largest index whose offset is <= y (offsets are increasing with index).
// Unmeasured rows (undefined) only ever appear at the tail, so treat them as +∞.
function lastIndexAtOrAbove(offsets: number[], count: number, y: number): number {
  let lo = 0;
  let hi = count - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = offsets[mid];
    if (v !== undefined && v <= y) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

export function ReaderScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const activeBookId = useReaderStore((s) => s.activeBookId);
  const activeChapter = useReaderStore((s) => s.activeChapter);
  const pendingScrollVerseId = useReaderStore((s) => s.pendingScrollVerseId);
  const setChapter = useReaderStore((s) => s.setChapter);
  const openBook = useReaderStore((s) => s.openBook);
  const setPendingScroll = useReaderStore((s) => s.setPendingScroll);

  const language = useSettingsStore((s) => s.settings.language);
  // Single source of truth: language drives translation. Sanskrit and Roman
  // (transliteration) are always shown above the translation in VerseBlock.
  const translationKey = translationKeyForLanguage(language);

  const [chapterSelectorOpen, setChapterSelectorOpen] = useState(false);
  const [explainVerse, setExplainVerse] = useState<Verse | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [explained, setExplained] = useState<Set<string>>(new Set());
  const [renderLimit, setRenderLimit] = useState(INITIAL_RENDER);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  // Index of the verse at the top of the screen — drives the header counter
  // and the progress line. Only set when it changes.
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fontScaleIdx, setFontScaleIdx] = useState(0);
  const fontScale = FONT_SCALES[fontScaleIdx];

  const scrollRef = useRef<ScrollView>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Content-space y of each mounted verse row, by index.
  const offsets = useRef<number[]>([]);
  const readIds = useRef<Set<string>>(new Set());
  const scrollY = useRef(0);
  const lastMarkY = useRef<number | null>(null);
  const layoutH = useRef(600);
  // The verse closest to the top of the visible area — flushed to the DB
  // debounced while scrolling and immediately on blur.
  const currentVerseIdRef = useRef<string | null>(null);
  const savePositionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Programmatic jumps shouldn't hide the bar or count as reading.
  const jumpingUntil = useRef(0);

  // --- Auto-hiding top bar ----------------------------------------------
  const barShift = useRef(new Animated.Value(0)).current;
  const barHidden = useRef(false);
  const setBarHidden = useCallback(
    (hidden: boolean) => {
      if (barHidden.current === hidden) return;
      barHidden.current = hidden;
      Animated.timing(barShift, {
        toValue: hidden ? -BAR_H : 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    },
    [barShift]
  );

  // Per-book reading-time tracker: accrue seconds against the open book while
  // the Reader is focused. 30s heartbeat plus a flush of the remainder on
  // blur/book-change, so an abrupt exit loses at most 30 seconds.
  useFocusEffect(
    useCallback(() => {
      if (!activeBookId) return;
      const book = activeBookId;
      let lastFlush = Date.now();
      const heartbeat = setInterval(() => {
        addReadingSeconds(book, (Date.now() - lastFlush) / 1000);
        lastFlush = Date.now();
      }, 30000);
      return () => {
        clearInterval(heartbeat);
        addReadingSeconds(book, (Date.now() - lastFlush) / 1000);
        // Flush the current scroll position immediately on blur so leaving
        // the reader by any route always saves the right place.
        if (savePositionTimerRef.current) clearTimeout(savePositionTimerRef.current);
        if (currentVerseIdRef.current) setLastPosition(book, currentVerseIdRef.current);
      };
    }, [activeBookId])
  );

  const meta = useMemo(() => (activeBookId ? getBookMeta(activeBookId) : null), [activeBookId]);
  const chapter = useMemo(
    () => (activeBookId && activeChapter != null ? getChapter(activeBookId, activeChapter) : null),
    [activeBookId, activeChapter]
  );
  const verses = useMemo(
    () => (activeBookId && activeChapter != null ? getVersesInChapter(activeBookId, activeChapter) : ([] as Verse[])),
    [activeBookId, activeChapter]
  );
  const nextChapter = useMemo(() => {
    if (!activeBookId || activeChapter == null) return null;
    return getChapters(activeBookId).find((c) => c.number > activeChapter) ?? null;
  }, [activeBookId, activeChapter]);

  // Reset the render window and scroll position when the chapter changes.
  useEffect(() => {
    if (!activeBookId || activeChapter == null) return;
    if (currentVerseIdRef.current) {
      if (savePositionTimerRef.current) clearTimeout(savePositionTimerRef.current);
      setLastPosition(activeBookId, currentVerseIdRef.current);
    }
    currentVerseIdRef.current = null;
    offsets.current = [];
    lastMarkY.current = null;
    setCurrentIdx(0);
    setRenderLimit(INITIAL_RENDER);
    setBarHidden(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeBookId, activeChapter, setBarHidden]);

  // Grow the window to cover a pending scroll target (daily verse, last
  // position, a character or event link) so it is mounted and measurable.
  useEffect(() => {
    if (!pendingScrollVerseId) return;
    const idx = verses.findIndex((v) => v.id === pendingScrollVerseId);
    if (idx >= 0) setRenderLimit((c) => Math.max(c, idx + 40));
  }, [pendingScrollVerseId, verses]);

  // Hydrate bookmark + read state when book/chapter changes.
  useEffect(() => {
    if (!activeBookId || activeChapter == null) return;
    let cancelled = false;
    (async () => {
      const bm = await getBookmarkedVerseIds(activeBookId);
      const rd = await getReadVerseIds(activeBookId);
      if (cancelled) return;
      setBookmarked(bm);
      readIds.current = rd;
      setExplained((prev) => {
        const next = new Set(prev);
        for (const v of verses) if (rd.has(v.id)) next.add(v.id);
        return next;
      });
      // Seed the position with this chapter's first verse so leaving right
      // after opening still saves something useful.
      if (verses[0] && !currentVerseIdRef.current) {
        currentVerseIdRef.current = verses[0].id;
        setLastPosition(verses[0].book, verses[0].id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeBookId, activeChapter, verses]);

  // Mark as read the verses that have actually been on screen. A steady
  // scroll covers the whole stretch between two scroll events; a jump (a link,
  // the chapter picker, dragging the scrollbar) only counts what is visible
  // where it lands — never everything it skipped over.
  const markVisible = useCallback(() => {
    const count = Math.min(renderLimit, verses.length);
    if (count === 0) return;
    const y = scrollY.current;
    const h = layoutH.current;
    const prev = lastMarkY.current;
    const continuous = prev !== null && Math.abs(y - prev) < h * 2;
    const top = continuous ? Math.min(prev!, y) : y;
    const bottom = (continuous ? Math.max(prev!, y) : y) + h;
    lastMarkY.current = y;
    const first = Math.max(0, lastIndexAtOrAbove(offsets.current, count, top));
    const last = lastIndexAtOrAbove(offsets.current, count, bottom - 40);
    const toMark: Verse[] = [];
    for (let i = first; i <= last; i++) {
      const v = verses[i];
      if (!readIds.current.has(v.id)) {
        readIds.current.add(v.id);
        toMark.push(v);
      }
    }
    if (toMark.length === 0) return;
    Promise.all(toMark.map((v) => markVerseRead(v.book, v.id))).then(() => {
      updateTodayStreak(useSettingsStore.getState().settings.daily_goal);
    });
  }, [verses, renderLimit]);

  // Count the first screenful once the opening rows have laid out.
  useEffect(() => {
    const t = setTimeout(() => {
      if (Date.now() >= jumpingUntil.current) markVisible();
    }, 500);
    return () => clearTimeout(t);
  }, [markVisible]);

  const updateCurrentVerse = useCallback(() => {
    const count = Math.min(renderLimit, verses.length);
    const idx = Math.max(0, lastIndexAtOrAbove(offsets.current, count, scrollY.current + BAR_H + 24));
    const v = verses[idx];
    if (v && v.id !== currentVerseIdRef.current) {
      currentVerseIdRef.current = v.id;
      setCurrentIdx(idx);
    }
  }, [verses, renderLimit]);

  // Scroll to a pending verse once its row has been measured.
  useEffect(() => {
    if (!pendingScrollVerseId || verses.length === 0) return;
    const idx = verses.findIndex((v) => v.id === pendingScrollVerseId);
    if (idx < 0) {
      setPendingScroll(null); // not in this chapter — give up quietly
      return;
    }
    let tries = 0;
    let t: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const y = offsets.current[idx];
      if (typeof y === 'number') {
        jumpingUntil.current = Date.now() + 400;
        lastMarkY.current = null;
        setBarHidden(false);
        scrollRef.current?.scrollTo({ y: Math.max(0, y - BAR_H - 8), animated: false });
        currentVerseIdRef.current = verses[idx].id;
        setCurrentIdx(idx);
        setLastPosition(verses[idx].book, verses[idx].id);
        setPendingScroll(null);
      } else if (++tries < 30) {
        t = setTimeout(attempt, 100);
      } else {
        setPendingScroll(null);
      }
    };
    t = setTimeout(attempt, 60);
    return () => clearTimeout(t);
  }, [pendingScrollVerseId, verses, setPendingScroll, setBarHidden]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const dy = y - scrollY.current;
      scrollY.current = y;
      layoutH.current = layoutMeasurement.height;
      if (y + layoutMeasurement.height > contentSize.height - EXTEND_THRESHOLD_PX && renderLimit < verses.length) {
        startTransition(() => setRenderLimit((c) => Math.min(c + RENDER_BATCH, verses.length)));
      }
      // A move of most of a screen in one event is a jump (a link, the
      // chapter picker, the scrollbar), not a finger — leave the bar alone.
      const jumping = Date.now() < jumpingUntil.current || Math.abs(dy) > layoutMeasurement.height * 0.75;
      if (jumping) {
        // Count only what is on screen where the jump lands.
        lastMarkY.current = null;
        markVisible();
      } else {
        if (y < BAR_H) setBarHidden(false);
        else if (dy > 6) setBarHidden(true);
        else if (dy < -10) setBarHidden(false);
        markVisible();
      }
      updateCurrentVerse();
      // Debounced DB write — fires 1.5 s after the last scroll event.
      if (savePositionTimerRef.current) clearTimeout(savePositionTimerRef.current);
      savePositionTimerRef.current = setTimeout(() => {
        if (currentVerseIdRef.current && activeBookId) setLastPosition(activeBookId, currentVerseIdRef.current);
      }, 1500);
    },
    [verses.length, renderLimit, markVisible, updateCurrentVerse, activeBookId, setBarHidden]
  );

  const onRowLayout = useCallback((index: number, y: number) => {
    offsets.current[index] = y;
  }, []);

  const onPressExplain = useCallback((verse: Verse) => {
    setExplainVerse(verse);
    setExplained((prev) => {
      const next = new Set(prev);
      next.add(verse.id);
      return next;
    });
    markVerseRead(verse.book, verse.id);
    setLastPosition(verse.book, verse.id);
  }, []);

  const showToast = useCallback(
    (msg: string) => {
      setToastMsg(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastOpacity.stopAnimation();
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => setToastMsg(null));
      }, 1400);
    },
    [toastOpacity]
  );

  const onToggleBookmark = useCallback(
    async (verse: Verse) => {
      const nowBookmarked = await toggleBookmark(verse.book, verse.id);
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (nowBookmarked) next.add(verse.id);
        else next.delete(verse.id);
        return next;
      });
      showToast(nowBookmarked ? 'Verse bookmarked' : 'Bookmark removed');
    },
    [showToast]
  );

  const onOpenEvent = useCallback((id: string) => navigation.navigate('Event', { id }), [navigation]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs');
  }, [navigation]);

  if (!activeBookId || activeChapter == null || !meta || !chapter) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSize.base, color: theme.colors.textSecondary }}>
            No text is open. Pick one from the Library.
          </Text>
          <Pressable onPress={goBack} accessibilityRole="button" style={{ padding: 12 }}>
            <Text style={{ fontFamily: theme.fonts.uiBold, color: theme.colors.accent }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const total = verses.length;
  const progress = total > 0 ? (currentIdx + 1) / total : 0;
  const allMounted = renderLimit >= total;
  // The progress line rides the bottom edge of the bar, and stays pinned to
  // the top of the screen while the bar is tucked away.
  const lineY = barShift.interpolate({ inputRange: [-BAR_H, 0], outputRange: [0, BAR_H - 2] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }} edges={['top']}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {/* Verse list — continuous scroll, no pagination. */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: BAR_H, paddingBottom: theme.spacing.xxl }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onLayout={(e) => {
            layoutH.current = e.nativeEvent.layout.height;
          }}
        >
          <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: theme.spacing.md }}>
            {/* Chapter heading */}
            <View style={{ alignItems: 'center', paddingTop: theme.spacing.md, paddingBottom: theme.spacing.xs }}>
              <Text
                style={{
                  fontFamily: theme.fonts.ui,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                {meta.structure_label} {chapter.number}
              </Text>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: theme.fonts.display,
                  fontSize: theme.fontSize.xl,
                  color: theme.colors.textPrimary,
                  textAlign: 'center',
                }}
              >
                {chapter.name}
              </Text>
              <Ornament />
            </View>

            {total === 0 ? (
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textSecondary,
                  padding: theme.spacing.md,
                }}
              >
                No verses are bundled for this {meta.structure_label.toLowerCase()} yet.
              </Text>
            ) : (
              <VerseList
                verses={verses}
                renderLimit={renderLimit}
                meta={meta}
                translationKey={translationKey}
                bookmarked={bookmarked}
                explained={explained}
                fontScale={fontScale}
                onRowLayout={onRowLayout}
                onPressExplain={onPressExplain}
                onToggleBookmark={onToggleBookmark}
                onOpenEvent={onOpenEvent}
              />
            )}

            {/* End of chapter: carry straight on, like turning the page. */}
            {allMounted && total > 0 ? (
              <View style={{ alignItems: 'center', paddingTop: theme.spacing.xl, gap: theme.spacing.sm }}>
                <Ornament />
                <Text
                  style={{
                    fontFamily: theme.fonts.ui,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                  }}
                >
                  End of {meta.structure_label} {chapter.number}
                </Text>
                {nextChapter ? (
                  <Pressable
                    onPress={() => openBook(activeBookId, nextChapter.number)}
                    accessibilityRole="button"
                    accessibilityLabel={`Continue to ${meta.structure_label} ${nextChapter.number}, ${nextChapter.name}`}
                    style={({ pressed }) => ({
                      alignSelf: 'stretch',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: theme.spacing.md,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: theme.colors.accent + '55',
                      backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.bgSecondary,
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: theme.fonts.ui,
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.accent,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        Continue to {meta.structure_label} {nextChapter.number}
                      </Text>
                      <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary, marginTop: 2 }}>
                        {nextChapter.name}
                      </Text>
                    </View>
                    <ArrowRight size={20} strokeWidth={1.6} color={theme.colors.accent} />
                  </Pressable>
                ) : (
                  <Text style={{ fontFamily: theme.fonts.bodyItalic, fontStyle: 'italic', fontSize: theme.fontSize.base, color: theme.colors.textSecondary }}>
                    You have reached the end of the {meta.title}.
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Floating top bar */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: BAR_H,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 4,
            backgroundColor: theme.colors.bgPrimary,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            transform: [{ translateY: barShift }],
          }}
        >
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={22} strokeWidth={1.5} color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => setChapterSelectorOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${meta.title}, ${meta.structure_label} ${chapter.number}. Choose chapter`}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: 10,
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {meta.title}
              {total > 0 ? ` · ${currentIdx + 1} of ${total}` : ''}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.base, color: theme.colors.textPrimary }}
            >
              {meta.structure_label} {chapter.number} · {chapter.name}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFontScaleIdx((i) => (i + 1) % FONT_SCALES.length)}
            accessibilityRole="button"
            accessibilityLabel="Change text size"
            style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <CaseSensitive size={20} strokeWidth={1.5} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setChapterSelectorOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose chapter"
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <IconList size={22} strokeWidth={1.5} color={theme.colors.textPrimary} />
          </Pressable>
        </Animated.View>

        {/* Reading progress through this chapter */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 2,
            width: `${Math.round(progress * 1000) / 10}%`,
            backgroundColor: theme.colors.accent,
            transform: [{ translateY: lineY }],
          }}
        />

        {/* Bookmark toast — always mounted; opacity animates in/out */}
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center', opacity: toastOpacity }}
        >
          <View style={{ backgroundColor: theme.colors.textPrimary, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 }}>
            <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.bgPrimary }}>
              {toastMsg ?? ''}
            </Text>
          </View>
        </Animated.View>
      </View>

      <ChapterSelector
        bookId={activeBookId}
        visible={chapterSelectorOpen}
        activeChapter={activeChapter}
        onSelect={(c, verseId) => {
          setChapterSelectorOpen(false);
          if (verseId) openBook(activeBookId, c, verseId);
          else setChapter(c);
        }}
        onClose={() => setChapterSelectorOpen(false)}
      />

      {/* Explain drawer — bottom drawer, preserves underlying scroll position. */}
      <ExplainDrawer verse={explainVerse} visible={!!explainVerse} onClose={() => setExplainVerse(null)} />
    </SafeAreaView>
  );
}

function Ornament() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: theme.spacing.xs }}>
      <View style={{ height: 1, width: 36, backgroundColor: theme.colors.accent, opacity: 0.5 }} />
      <View style={{ width: 5, height: 5, transform: [{ rotate: '45deg' }], backgroundColor: theme.colors.accent, opacity: 0.8 }} />
      <View style={{ height: 1, width: 36, backgroundColor: theme.colors.accent, opacity: 0.5 }} />
    </View>
  );
}

interface ListProps {
  verses: Verse[];
  renderLimit: number;
  meta: BookMeta;
  translationKey: TranslationKey;
  bookmarked: Set<string>;
  explained: Set<string>;
  fontScale: number;
  onRowLayout: (index: number, y: number) => void;
  onPressExplain: (v: Verse) => void;
  onToggleBookmark: (v: Verse) => void;
  onOpenEvent: (id: string) => void;
}

// The mounted verses. Memoised so scroll-driven state in the screen (the
// verse counter, the progress line) never re-renders the text.
const VerseList = memo(function VerseList({
  verses,
  renderLimit,
  meta,
  translationKey,
  bookmarked,
  explained,
  fontScale,
  onRowLayout,
  onPressExplain,
  onToggleBookmark,
  onOpenEvent,
}: ListProps) {
  const rows = [];
  const n = Math.min(renderLimit, verses.length);
  for (let idx = 0; idx < n; idx++) {
    const v = verses[idx];
    const sub = subUnitOf(v);
    const showSub = sub != null && sub !== (idx > 0 ? subUnitOf(verses[idx - 1]) : undefined);
    rows.push(
      <VerseRow
        key={v.id}
        index={idx}
        verse={v}
        subLabel={showSub ? `${meta.sub_structure_unit === 'adhyaya' ? 'Adhyaya' : 'Sarga'} ${sub}` : null}
        sargaName={showSub && v.book === 'ramayana' && v.sarga_name ? v.sarga_name : null}
        translationKey={translationKey}
        bookmarked={bookmarked.has(v.id)}
        explained={explained.has(v.id)}
        fontScale={fontScale}
        onRowLayout={onRowLayout}
        onPressExplain={onPressExplain}
        onToggleBookmark={onToggleBookmark}
        onOpenEvent={onOpenEvent}
      />
    );
  }
  return <>{rows}</>;
});

interface RowProps {
  index: number;
  verse: Verse;
  subLabel: string | null;
  sargaName: string | null;
  translationKey: TranslationKey;
  bookmarked: boolean;
  explained: boolean;
  fontScale: number;
  onRowLayout: (index: number, y: number) => void;
  onPressExplain: (v: Verse) => void;
  onToggleBookmark: (v: Verse) => void;
  onOpenEvent: (id: string) => void;
}

const VerseRow = memo(function VerseRow({
  index,
  verse,
  subLabel,
  sargaName,
  translationKey,
  bookmarked,
  explained,
  fontScale,
  onRowLayout,
  onPressExplain,
  onToggleBookmark,
  onOpenEvent,
}: RowProps) {
  const theme = useTheme();
  const trans = resolveTranslation(verse, translationKey);
  const notes = eventsStartingAt(verse.id);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => onRowLayout(index, e.nativeEvent.layout.y),
    [index, onRowLayout]
  );

  return (
    <View onLayout={onLayout}>
      {subLabel ? (
        <View style={{ alignItems: 'center', paddingTop: index === 0 ? theme.spacing.sm : theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
          <Text
            style={{
              fontFamily: theme.fonts.ui,
              fontSize: theme.fontSize.xs,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: theme.colors.textSecondary,
            }}
          >
            {subLabel}
          </Text>
          {sargaName ? (
            <Text
              style={{
                fontFamily: theme.fonts.display,
                fontSize: theme.fontSize.lg,
                color: theme.colors.textPrimary,
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              {sargaName}
            </Text>
          ) : null}
          <View style={{ height: 1, width: 60, marginTop: theme.spacing.xs, backgroundColor: theme.colors.accent, opacity: 0.5 }} />
        </View>
      ) : index > 0 ? (
        <View style={{ height: 1, backgroundColor: theme.colors.border, opacity: 0.35 }} />
      ) : null}

      {/* Story note: this verse is where an Event begins. */}
      {notes.map((e) => (
        <Pressable
          key={e.id}
          onPress={() => onOpenEvent(e.id)}
          accessibilityRole="button"
          accessibilityLabel={`Story note: ${e.title}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: theme.spacing.sm,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.accent + '55',
            backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.bgSecondary,
          })}
        >
          <Milestone size={16} strokeWidth={1.7} color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: 10,
                color: theme.colors.accent,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {e.dilemma ? 'Story note · moral dilemma' : 'Story note'}
            </Text>
            <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
              {e.title}
            </Text>
          </View>
          <ArrowRight size={16} strokeWidth={1.6} color={theme.colors.accent} />
        </Pressable>
      ))}

      <VerseBlock
        verse={verse}
        translationKey={trans?.key ?? translationKey}
        translationText={trans?.text ?? null}
        bookmarked={bookmarked}
        explained={explained}
        fontScale={fontScale}
        onPressExplain={onPressExplain}
        onToggleBookmark={onToggleBookmark}
      />
    </View>
  );
});
