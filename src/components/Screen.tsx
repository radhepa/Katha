import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

interface ScreenProps {
  title?: string;
  // Small line under the title (e.g. a count or a one-line purpose).
  subtitle?: string;
  // Icon buttons shown at the right end of the title row.
  right?: ReactNode;
  children: ReactNode;
  contentStyle?: ViewStyle;
}

// Tab screens. Navigation between tabs is instant on purpose (UI.md: no
// fade-ins on basic navigation — they make the app feel slow).
export function Screen({ title, subtitle, right, children, contentStyle }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.bgPrimary }]}
    >
      {title ? (
        <View style={[styles.titleRow, { paddingHorizontal: theme.spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: theme.fonts.display,
                fontSize: theme.fontSize.xl,
                color: theme.colors.textPrimary,
              }}
            >
              {title}
            </Text>
            {/* Short accent rule — gives titles the deliberate, printed-book feel. */}
            <View
              style={{
                height: 3,
                width: 32,
                borderRadius: 2,
                backgroundColor: theme.colors.accent,
                marginTop: 8,
                opacity: 0.85,
              }}
            />
            {subtitle ? (
              <Text
                style={{
                  fontFamily: theme.fonts.ui,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginTop: 10,
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  titleRow: { paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  content: { flex: 1 },
});
