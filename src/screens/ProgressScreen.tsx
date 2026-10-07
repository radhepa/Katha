import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Bookmark, Clock, Flame, Settings as IconSettings } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { HeaderIconButton } from '@/components/StackScreen';
import { useTheme } from '@/theme/ThemeProvider';
import { getCurrentStreak, getWeeklyConsistency } from '@/db/streak';
import { countVersesRead } from '@/db/progress';
import { getTotalReadingSeconds } from '@/db/readingTime';
import { formatReadingTime } from '@/lib/format';
import { getBookMeta } from '@/lib/scripture';
import type { BookId } from '@/types/scripture';

const BOOKS: BookId[] = ['gita', 'ramayana', 'mahabharata'];

const ZERO: Record<BookId, number> = { gita: 0, ramayana: 0, mahabharata: 0 };

// Single-letter day names for the 7-day row, oldest first, ending today.
function weekdayInitials(now = new Date()): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toLocaleDateString('en-US', { weekday: 'narrow' }));
  }
  return out;
}

export function ProgressScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const days = weekdayInitials();
  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [counts, setCounts] = useState<Record<BookId, number>>(ZERO);
  const [seconds, setSeconds] = useState<Record<BookId, number>>(ZERO);

  // Refresh on focus so a just-finished reading session is reflected.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [s, w] = await Promise.all([getCurrentStreak(), getWeeklyConsistency()]);
        const nextCounts = { ...ZERO };
        const nextSeconds = { ...ZERO };
        for (const b of BOOKS) {
          nextCounts[b] = await countVersesRead(b);
          nextSeconds[b] = await getTotalReadingSeconds(b);
        }
        if (!cancelled) {
          setStreak(s);
          setWeek(w);
          setCounts(nextCounts);
          setSeconds(nextSeconds);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <Screen
      title="Progress"
      right={
        <>
          <HeaderIconButton label="Bookmarks" onPress={() => navigation.navigate('Bookmarks')}>
            <Bookmark size={21} strokeWidth={1.5} color={theme.colors.textSecondary} />
          </HeaderIconButton>
          <HeaderIconButton label="Settings" onPress={() => navigation.navigate('Settings')}>
            <IconSettings size={21} strokeWidth={1.5} color={theme.colors.textSecondary} />
          </HeaderIconButton>
        </>
      }
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: theme.spacing.md,
          }}
        >
          <Flame color={theme.colors.accent} size={36} strokeWidth={1.5} />
          <Text
            style={{
              fontFamily: theme.fonts.display,
              fontSize: theme.fontSize.xl,
              color: theme.colors.textPrimary,
            }}
          >
            {streak} day streak
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            marginBottom: theme.spacing.lg,
          }}
        >
          {week.map((hit, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <View
                accessibilityLabel={`${days[i]}: ${hit ? 'goal met' : 'goal not met'}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: hit ? theme.colors.accent : theme.colors.accentSoft,
                  borderWidth: i === 6 ? 1.5 : 0,
                  borderColor: theme.colors.accent,
                }}
              />
              <Text style={{ fontFamily: theme.fonts.ui, fontSize: 10, color: theme.colors.textSecondary }}>{days[i]}</Text>
            </View>
          ))}
        </View>

        <Text
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Per book
        </Text>
        {BOOKS.map((b) => {
          const meta = getBookMeta(b);
          const total = meta.total_verses;
          const read = counts[b];
          const pct = total > 0 ? Math.round((read / total) * 100) : 0;
          return (
            <View
              key={b}
              style={{
                paddingVertical: theme.spacing.sm,
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSize.base,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {meta.title}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.ui,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {read.toLocaleString()} of {total.toLocaleString()} ({pct}%)
                </Text>
              </View>
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.accentSoft,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: 4,
                    backgroundColor: theme.colors.accent,
                  }}
                />
              </View>
              {/* Per-book reading-time tracker */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Clock size={12} strokeWidth={1.5} color={theme.colors.textSecondary} />
                <Text
                  style={{
                    fontFamily: theme.fonts.ui,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {formatReadingTime(seconds[b])} read
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
