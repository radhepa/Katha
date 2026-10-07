import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScrollView, Text, View, type ImageSourcePropType } from 'react-native';
import { Bookmark, ChevronRight, Clock } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { AnimatedCard } from '@/components/AnimatedCard';
import { TintedIcon } from '@/components/TintedIcon';
import { SearchField } from '@/components/SearchField';
import { HeaderIconButton } from '@/components/StackScreen';
import { useTheme } from '@/theme/ThemeProvider';
import { useReaderStore } from '@/store/reader';
import { getBookMeta, positionLabel, verseReferenceLabel } from '@/lib/scripture';
import { openPassage } from '@/lib/openPassage';
import { countVersesRead } from '@/db/progress';
import { getLastPosition } from '@/db/position';
import { getTotalReadingSeconds } from '@/db/readingTime';
import { searchVerses, SEARCH_LIMIT, SEARCH_MIN_CHARS } from '@/lib/search';
import { formatReadingTime, relativeTime } from '@/lib/format';
import type { BookId, Verse } from '@/types/scripture';

const BOOKS: BookId[] = ['gita', 'ramayana', 'mahabharata'];

interface CardData {
  bookId: BookId;
  title: string;
  subtitle: string;
  progressPct: number;
  positionLabel: string;
  lastReadLabel: string | null;
  readingTimeLabel: string;
  startVerseId?: string;
  icon: ImageSourcePropType;
}

// Deity-illustration icons per text. The require()s are static so Metro
// can bundle the assets ahead of time.
const ICONS: Record<BookId, ImageSourcePropType> = {
  gita: require('../../assets/images/icon-gita.png'),
  ramayana: require('../../assets/images/icon-ramayana.png'),
  mahabharata: require('../../assets/images/icon-mahabharata.png'),
};

const BOOK_DESCRIPTIONS: Record<BookId, string> = {
  gita: 'A 700-verse dialogue between Arjuna and Krishna on duty, the self, and devotion — spoken on the battlefield of Kurukshetra.',
  ramayana: 'The epic journey of Rama to rescue his beloved Sita, a timeless story of dharma, devotion, and the triumph of good over evil.',
  mahabharata: 'The world\'s longest epic poem — a sweeping tale of war, kinship, and justice between two branches of the Kuru dynasty.',
};

export function LibraryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const openBook = useReaderStore((s) => s.openBook);
  const [cards, setCards] = useState<CardData[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Verse[]>([]);

  // Debounced cross-book search. The fold/index work happens in lib/search;
  // first search builds the index lazily.
  useEffect(() => {
    const q = query.trim();
    if (q.length < SEARCH_MIN_CHARS) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => setResults(searchVerses(q)), 250);
    return () => clearTimeout(t);
  }, [query]);

  const searching = query.trim().length >= SEARCH_MIN_CHARS;

  const openCard = (card: CardData) => {
    if (card.startVerseId && openPassage(navigation, card.startVerseId)) return;
    openBook(card.bookId, 1);
    navigation.navigate('Reader');
  };

  // Refresh when the screen regains focus so progress reflects the last session.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const next: CardData[] = [];
        for (const bookId of BOOKS) {
          const meta = getBookMeta(bookId);
          const total = meta.total_verses;
          const [read, lastPos, seconds] = await Promise.all([
            countVersesRead(bookId),
            getLastPosition(bookId),
            getTotalReadingSeconds(bookId),
          ]);
          const label = lastPos ? positionLabel(lastPos.verseId) : null;
          next.push({
            bookId,
            title: meta.title,
            subtitle: `${meta.total_chapters} ${meta.structure_label}${meta.total_chapters === 1 ? '' : 's'} · ${meta.total_verses.toLocaleString()} Verses`,
            progressPct: total > 0 ? Math.min(100, (read / total) * 100) : 0,
            positionLabel: label ?? 'Not started',
            lastReadLabel: lastPos ? relativeTime(lastPos.updatedAt) : null,
            readingTimeLabel: `${formatReadingTime(seconds)} read`,
            startVerseId: label ? lastPos!.verseId : undefined,
            icon: ICONS[bookId],
          });
        }
        if (!cancelled) setCards(next);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <Screen
      title="Library"
      right={
        <HeaderIconButton label="Bookmarks" onPress={() => navigation.navigate('Bookmarks')}>
          <Bookmark size={21} strokeWidth={1.5} color={theme.colors.textSecondary} />
        </HeaderIconButton>
      }
    >
      {/* Cross-book verse search. */}
      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xs }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search verses in all texts"
          accessibilityLabel="Search verses"
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.xl,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {searching ? (
          <>
            <Text
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: theme.spacing.xs,
              }}
            >
              {results.length === 0
                ? 'No matches'
                : results.length >= SEARCH_LIMIT
                  ? `${SEARCH_LIMIT}+ results`
                  : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
            </Text>
            {results.length === 0 ? (
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textSecondary,
                  lineHeight: theme.fontSize.base * 1.5,
                }}
              >
                No verses match "{query.trim()}". Try fewer or different words.
              </Text>
            ) : (
              results.map((v) => (
                <AnimatedCard
                  key={v.id}
                  onPress={() => openPassage(navigation, v.id)}
                  accessibilityRole="button"
                  accessibilityLabel={verseReferenceLabel(v)}
                  style={{
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    backgroundColor: theme.colors.bgSecondary,
                    padding: theme.spacing.sm,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.accent, marginBottom: 4 }}>
                    {verseReferenceLabel(v)}
                  </Text>
                  <Text
                    numberOfLines={3}
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textPrimary,
                      lineHeight: theme.fontSize.sm * 1.5,
                    }}
                  >
                    {v.translations.english ?? v.transliteration}
                  </Text>
                </AnimatedCard>
              ))
            )}
          </>
        ) : (
          cards.map((card) => (
            <AnimatedCard
              key={card.bookId}
              onPress={() => openCard(card)}
              accessibilityRole="button"
              accessibilityLabel={`${card.title}. ${card.positionLabel}`}
              style={{
                alignSelf: 'stretch',
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                backgroundColor: theme.colors.bgSecondary,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                {/* Icon circle: fixed 64x64, overflow hidden, subtle accent ring,
                    flexShrink 0 so narrow screens never squeeze it. */}
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.accentSoft,
                    borderWidth: 1.5,
                    borderColor: theme.colors.accent + '55',
                    flexShrink: 0,
                  }}
                >
                  <TintedIcon source={card.icon} size={56} tintColor={theme.colors.textPrimary} accessibilityLabel={`${card.title} icon`} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary }}>
                    {card.title}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 }}>
                    {card.subtitle}
                  </Text>
                </View>
                <ChevronRight size={18} strokeWidth={1.5} color={theme.colors.textSecondary} />
              </View>

              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  lineHeight: theme.fontSize.sm * 1.55,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {BOOK_DESCRIPTIONS[card.bookId]}
              </Text>

              <View style={{ height: 5, borderRadius: 3, backgroundColor: theme.colors.accentSoft, overflow: 'hidden', marginBottom: theme.spacing.xs }}>
                <View style={{ width: `${card.progressPct}%`, height: 5, borderRadius: 3, backgroundColor: theme.colors.accent }} />
              </View>
              <Text
                numberOfLines={1}
                style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textPrimary, marginBottom: 3 }}
              >
                {card.positionLabel}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={11} strokeWidth={1.5} color={theme.colors.textSecondary} />
                <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                  {card.readingTimeLabel}
                  {card.lastReadLabel ? ` · ${card.lastReadLabel}` : ''}
                </Text>
              </View>
            </AnimatedCard>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
