import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// Small uppercase heading used above groups of content.
export function SectionLabel({ children, style }: { children: string; style?: TextStyle }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          fontFamily: theme.fonts.ui,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: theme.spacing.xs,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
