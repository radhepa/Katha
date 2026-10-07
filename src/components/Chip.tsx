import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  // 'filter' = selectable pill; 'link' = soft accent pill that navigates.
  variant?: 'filter' | 'link';
}

export function Chip({ label, active = false, onPress, variant = 'filter' }: ChipProps) {
  const theme = useTheme();
  const isLink = variant === 'link';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={isLink ? undefined : { selected: active }}
      hitSlop={4}
      style={{
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? theme.colors.accent : isLink ? theme.colors.accent + '55' : theme.colors.border,
        backgroundColor: active ? theme.colors.accent : isLink ? theme.colors.accentSoft : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: active ? theme.fonts.uiBold : theme.fonts.ui,
          fontSize: theme.fontSize.sm,
          color: active ? theme.colors.bgPrimary : theme.colors.textPrimary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Horizontally scrolling single-select row of filter chips.
export function ChipRow<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: 8 }}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((o) => (
        <Chip key={o.key} label={o.label} active={o.key === value} onPress={() => onChange(o.key)} />
      ))}
    </ScrollView>
  );
}

// Wrapping row of link chips (people in an event, relations of a character).
export function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}
