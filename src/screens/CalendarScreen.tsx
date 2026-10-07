import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { StackScreen } from '@/components/StackScreen';
import { useTheme } from '@/theme/ThemeProvider';
import { getUpcomingHolidays, daysUntil } from '@/lib/calendar';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatHolidayDate(dateStr: string): { month: string; day: number } {
  const [, m, d] = dateStr.split('-').map(Number);
  return { month: MONTH_NAMES[m - 1].slice(0, 3), day: d };
}

function whenLabel(n: number): string {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `In ${n} days`;
}

export function CalendarScreen() {
  const theme = useTheme();
  const upcoming = getUpcomingHolidays(20);

  return (
    <StackScreen>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          paddingBottom: theme.spacing.xl,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary }}
        >
          Festivals
        </Text>
        <View style={{ height: 3, width: 32, borderRadius: 2, backgroundColor: theme.colors.accent, marginTop: 8, marginBottom: theme.spacing.md, opacity: 0.85 }} />

        {upcoming.length === 0 ? (
          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSize.base, color: theme.colors.textSecondary }}>
            No upcoming festivals in this year's calendar.
          </Text>
        ) : (
          upcoming.map((h) => {
            const { month, day } = formatHolidayDate(h.date);
            const n = daysUntil(h.date);
            return (
              <View
                key={h.id}
                style={{
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: 1,
                }}
              >
                {/* Date tile */}
                <View
                  style={{
                    width: 52,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: n <= 7 ? theme.colors.accent : theme.colors.accentSoft,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.ui,
                      fontSize: theme.fontSize.xs,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: n <= 7 ? theme.colors.bgPrimary : theme.colors.textSecondary,
                    }}
                  >
                    {month}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.display,
                      fontSize: theme.fontSize.lg,
                      color: n <= 7 ? theme.colors.bgPrimary : theme.colors.textPrimary,
                    }}
                  >
                    {day}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.fonts.ui, fontSize: theme.fontSize.xs, color: theme.colors.accent, marginBottom: 2 }}>
                    {whenLabel(n)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={{ fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary }}>
                      {h.name}
                    </Text>
                    {h.name_hi ? (
                      <Text style={{ fontFamily: theme.fonts.devanagari, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
                        {h.name_hi}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSize.base,
                      lineHeight: theme.fontSize.base * 1.55,
                      color: theme.colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    {h.description_en}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.xs,
            lineHeight: theme.fontSize.xs * 1.6,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.md,
          }}
        >
          Festival dates follow the lunar calendar and can differ by a day depending on where you are. Check your local panchang.
        </Text>
      </ScrollView>
    </StackScreen>
  );
}
