import React from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  accessibilityLabel: string;
}

export function SearchField({ value, onChangeText, placeholder, accessibilityLabel }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        minHeight: 44,
      }}
    >
      <Search size={16} strokeWidth={1.5} color={theme.colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel}
        style={[
          {
            flex: 1,
            paddingVertical: 10,
            fontFamily: theme.fonts.ui,
            // 16px keeps iOS Safari from zooming the page when the field is focused.
            fontSize: Platform.OS === 'web' ? 16 : theme.fontSize.sm,
            color: theme.colors.textPrimary,
          },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
        ]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <X size={16} strokeWidth={1.5} color={theme.colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
