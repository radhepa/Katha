import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  // Small uppercase label shown in the bar (e.g. "Character").
  label?: string;
  right?: ReactNode;
  children: ReactNode;
}

// Full-screen pages pushed above the tabs (Character, Event, Calendar,
// Settings, Bookmarks): a slim bar with a back arrow, then the content.
export function StackScreen({ label, right, children }: Props) {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.bgPrimary }]}>
      <View style={[styles.bar, { paddingHorizontal: theme.spacing.xs }]}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.iconBtn}
        >
          <ArrowLeft size={22} strokeWidth={1.6} color={theme.colors.textPrimary} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: theme.fonts.ui,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          {label ?? ''}
        </Text>
        <View style={[styles.iconBtn, { flexDirection: 'row', width: undefined, minWidth: 44 }]}>{right}</View>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

// 44×44 tap target (UI.md accessibility minimum) for header icons.
export function HeaderIconButton({
  onPress,
  label,
  children,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.iconBtn}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
});
