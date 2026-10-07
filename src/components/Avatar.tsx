import React from 'react';
import { Text, View, type ImageSourcePropType } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { TintedIcon } from '@/components/TintedIcon';

// Characters that have hand-drawn portrait icons in assets/icons.
const PORTRAITS: Record<string, ImageSourcePropType> = {
  krishna: require('../../assets/icons/krishna.png'),
  rama: require('../../assets/icons/ram.png'),
  arjuna: require('../../assets/icons/arjuna.png'),
};

interface Props {
  id: string;
  name: string;
  size?: number;
}

// Round character mark: a portrait where one exists, otherwise the initial
// set in Lora on the soft accent.
export function Avatar({ id, name, size = 48 }: Props) {
  const theme = useTheme();
  const portrait = PORTRAITS[id];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.accentSoft,
        borderWidth: 1,
        borderColor: theme.colors.accent + '55',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {portrait ? (
        <TintedIcon source={portrait} size={size * 0.86} tintColor={theme.colors.textPrimary} />
      ) : (
        <Text
          style={{
            fontFamily: theme.fonts.display,
            fontSize: size * 0.42,
            color: theme.colors.textPrimary,
            marginTop: size * 0.02,
          }}
        >
          {name.charAt(0)}
        </Text>
      )}
    </View>
  );
}
