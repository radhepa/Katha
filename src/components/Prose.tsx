import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// Left-aligned reading paragraphs (UI.md: never center body text). Blank
// lines in the source string start a new paragraph.
export function Prose({ text, muted = false }: { text: string; muted?: boolean }) {
  const theme = useTheme();
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {paragraphs.map((p, i) => (
        <Text
          key={i}
          selectable
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSize.base,
            lineHeight: Math.round(theme.fontSize.base * 1.7),
            color: muted ? theme.colors.textSecondary : theme.colors.textPrimary,
            textAlign: 'left',
          }}
        >
          {p}
        </Text>
      ))}
    </View>
  );
}
