import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BookOpen, CalendarDays, ChevronRight, Flame, Scale, Settings as IconSettings } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { AnimatedCard } from '@/components/AnimatedCard';
import { GoalRing } from '@/components/GoalRing';
import { HeaderIconButton } from '@/components/StackScreen';
import { SectionLabel } from '@/components/SectionLabel';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/settings';
import {
  getBookMeta,
  getDailyVerse,
  positionLabel,
  resolveTranslation,
  translationKeyForLanguage,
  verseShortReference,
} from '@/lib/scripture';
import { getDailyEvent } from '@/lib/companions';
import { openPassage } from '@/lib/openPassage';
import { getNextHolidayWithin, daysUntil } from '@/lib/calendar';
import { getCurrentStreak, countVersesReadToday } from '@/db/streak';
import { getLastPosition } from '@/db/position';
import type { BookId } from '@/types/scripture';

const BOOKS: BookId[] = ['gita', 'ramayana', 'mahabharata'];

interface ContinueEntry {
  bookId: BookId;
  verseId: string;
  label: string;
}

function greetingFor(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const HINDU_MONTHS = [
  'Pausha', 'Magha', 'Phalguna', 'Chaitra', 'Vaishakha', 'Jyeshtha',
  'Ashadha', 'Shravana', 'Bhadrapada', 'Ashvina', 'Kartika', 'Margashirsha',
];

function hinduMonthApprox(now = new Date()): string {
  // Approximate mapping of Gregorian months to nearest Hindu month.
  // Real panchang is lunar — this is a placeholder per CONTENT_STATUS.md.
  return HINDU_MONTHS[now.getMonth()];
}

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const userName = useSettingsStore((s) => s.settings.user_name);
  const language = useSettingsStore((s) => s.settings.language);
  const dailyGoal = useSettingsStore((s) => s.settings.daily_goal);
  const preferredTranslation = translationKeyForLanguage(language);

  const [streak, setStreak] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [continueEntry, setContinueEntry] = useState<ContinueEntry | null>(null);

  // Refresh streak, today's count, and last reading position whenever Home
  // regains focus, so a reading session shows the moment the reader returns.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [s, n, ...positions] = await Promise.all([
          getCurrentStreak(),
          countVersesReadToday(),
          ...BOOKS.map((id) => getLastPosition(id)),
        ]);
        if (cancelled) return;
        setStreak(s as number);
        setTodayCount(n as number);
        // Most recently read book wins. Labels come from the verse id, so no
        // scripture file is loaded just to draw this card.
        type Pos = { verseId: string; updatedAt: number } | null;
        let best: (ContinueEntry & { updatedAt: number }) | null = null;
        (positions as Pos[]).forEach((pos, i) => {
          if (!pos) return;
          const label = positionLabel(pos.verseId);
          if (!label) return;
          if (!best || pos.updatedAt > best.updatedAt) {
            best = { bookId: BOOKS[i], verseId: pos.verseId, label, updatedAt: pos.updatedAt };
          }
        });
        setContinueEntry(best);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const now = new Date();
  const greeting = greetingFor(now);
  const dateLine = `${now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })} · ${hinduMonthApprox(now)}`;

  const upcomingHoliday = getNextHolidayWithin(7, now);
  const story = getDailyEvent(now);
  const goalMet = todayCount >= dailyGoal;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          paddingBottom: theme.spacing.xl,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: theme.fonts.display,
                fontSize: theme.fontSize.xxl,
                lineHeight: theme.fontSize.xxl * 1.2,
                color: theme.colors.textPrimary,
                marginBottom: 6,
              }}
            >
              {greeting}
              {userName ? `, ${userName}` : ''}
            </Text>
            <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
              {dateLine}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginRight: -10, marginTop: -4 }}>
            <HeaderIconButton label="Festival calendar" onPress={() => navigation.navigate('Calendar')}>
              <CalendarDays size={21} strokeWidth={1.5} color={theme.colors.textSecondary} />
            </HeaderIconButton>
            <HeaderIconButton label="Settings" onPress={() => navigation.navigate('Settings')}>
              <IconSettings size={21} strokeWidth={1.5} color={theme.colors.textSecondary} />
            </HeaderIconButton>
          </View>
        </View>

        {/* Streak badge inside the daily goal ring — prominent, centered. */}
        <Pressable
          onPress={() => navigation.navigate('Progress')}
          accessibilityRole="button"
          accessibilityLabel={`${streak} day streak. ${todayCount} of ${dailyGoal} verses today. Open progress`}
          style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}
        >
          <GoalRing progress={dailyGoal > 0 ? todayCount / dailyGoal : 0}>
            <Flame
              color={theme.colors.accent}
              fill={streak > 0 ? theme.colors.accent : 'transparent'}
              size={22}
              strokeWidth={1.5}
            />
            <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary, marginTop: 2 }}>
              {streak}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              day streak
            </Text>
          </GoalRing>
          <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
            {goalMet ? `Goal met · ${todayCount} verses today` : `${todayCount} of ${dailyGoal} verses today`}
          </Text>
        </Pressable>

        {/* Continue Reading shortcut — shown once a book has a saved position. */}
        {continueEntry ? (
          <AnimatedCard
            onPress={() => openPassage(navigation, continueEntry.verseId)}
            accessibilityRole="button"
            accessibilityLabel={`Continue reading ${getBookMeta(continueEntry.bookId).title}, ${continueEntry.label}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              backgroundColor: theme.colors.accentSoft,
              borderColor: theme.colors.accent + '44',
              borderWidth: 1,
              borderRadius: 16,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: 14,
              marginBottom: theme.spacing.lg,
            }}
          >
            <BookOpen size={20} strokeWidth={1.5} color={theme.colors.accent} />
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
                Continue reading
              </Text>
              <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.base, color: theme.colors.textPrimary, marginTop: 2 }}>
                {getBookMeta(continueEntry.bookId).title}
              </Text>
              <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 1 }}>
                {continueEntry.label}
              </Text>
            </View>
            <ChevronRight size={18} strokeWidth={1.5} color={theme.colors.accent} />
          </AnimatedCard>
        ) : null}

        <SectionLabel>Today's verses</SectionLabel>

        {BOOKS.map((bookId) => {
          const verse = getDailyVerse(bookId, now);
          if (!verse) return null;
          const trans = resolveTranslation(verse, preferredTranslation);
          return (
            <AnimatedCard
              key={bookId}
              onPress={() => openPassage(navigation, verse.id)}
              accessibilityRole="button"
              accessibilityLabel={`${getBookMeta(bookId).title}, ${verseShortReference(verse)}. Read in context`}
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
                <View style={{ backgroundColor: theme.colors.accentSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
                  <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textPrimary }}>
                    {getBookMeta(bookId).title}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ flexShrink: 1, fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}
                >
                  {verseShortReference(verse)}
                </Text>
              </View>
              <Text
                numberOfLines={3}
                style={{
                  fontFamily: theme.fonts.devanagari,
                  fontSize: theme.fontSize.md,
                  color: theme.colors.textPrimary,
                  lineHeight: theme.fontSize.md * 1.9,
                  marginBottom: 10,
                }}
              >
                {verse.sanskrit}
              </Text>
              <Text
                numberOfLines={3}
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textPrimary,
                  lineHeight: theme.fontSize.base * 1.6,
                  marginBottom: 12,
                }}
              >
                {trans?.text ?? '—'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.accent }}>
                  Read in context
                </Text>
                <ChevronRight size={15} strokeWidth={2} color={theme.colors.accent} />
              </View>
            </AnimatedCard>
          );
        })}

        {/* One story moment a day — a doorway into Events. */}
        {story ? (
          <>
            <SectionLabel style={{ marginTop: theme.spacing.md }}>From the epics</SectionLabel>
            <AnimatedCard
              onPress={() => navigation.navigate('Event', { id: story.id })}
              accessibilityRole="button"
              accessibilityLabel={`${story.title}. Open event`}
              style={{
                borderRadius: 16,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.accent + '44',
                backgroundColor: theme.colors.bgSecondary,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.ui,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {getBookMeta(story.book).title} · {story.where}
              </Text>
              <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary, marginBottom: 8 }}>
                {story.title}
              </Text>
              {story.dilemma ? (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <Scale size={16} strokeWidth={1.6} color={theme.colors.accent} style={{ marginTop: 3 }} />
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: theme.fonts.bodyItalic,
                      fontStyle: 'italic',
                      fontSize: theme.fontSize.base,
                      lineHeight: theme.fontSize.base * 1.55,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {story.dilemma.title}
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.sm, color: theme.colors.accent }}>
                  What happens, and why
                </Text>
                <ChevronRight size={15} strokeWidth={2} color={theme.colors.accent} />
              </View>
            </AnimatedCard>
          </>
        ) : null}

        {upcomingHoliday ? (
          <AnimatedCard
            onPress={() => navigation.navigate('Calendar')}
            accessibilityRole="button"
            accessibilityLabel={`${upcomingHoliday.name}, upcoming. Open festival calendar`}
            style={{
              marginTop: theme.spacing.sm,
              borderRadius: 16,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.accentSoft,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.ui,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              {(() => {
                const n = daysUntil(upcomingHoliday.date, now);
                return n === 0 ? 'Festival · today' : n === 1 ? 'Festival · tomorrow' : `Festival · in ${n} days`;
              })()}
            </Text>
            <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary }}>
              {upcomingHoliday.name}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSize.base,
                color: theme.colors.textPrimary,
                lineHeight: theme.fontSize.base * 1.5,
                marginTop: 4,
              }}
            >
              {upcomingHoliday.description_en}
            </Text>
          </AnimatedCard>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
