import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Flame, Info, Users } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/settings';
import { saveSetting } from '@/db/settings';

const SLIDES = [
  {
    Icon: BookOpen,
    title: 'Katha',
    body: 'The Bhagavad Gita, Ramayana, and Mahabharata — Sanskrit, transliteration, and English translation in every verse.',
    sub: 'Three sacred texts. One place.',
  },
  {
    Icon: Flame,
    title: 'Build a daily practice',
    body: 'Set a verse goal and track your reading streak. Your progress is saved across all three texts so you never lose your place.',
    sub: 'Even five minutes a day adds up.',
  },
  {
    Icon: Info,
    title: 'Understand as you read',
    body: 'The Bhagavad Gita includes an explanation for every verse. Tap the ⓘ button while reading to see what each verse means in context.',
    sub: null,
  },
  {
    Icon: Users,
    title: 'Know who’s who',
    body: 'Characters and Events explain who everyone is, why things happen, and the hard choices at the heart of each story — with a link to the passage itself.',
    sub: null,
  },
] as const;

export function OnboardingScreen() {
  const theme = useTheme();
  const patch = useSettingsStore((s) => s.patch);
  const [slide, setSlide] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  const goTo = (next: number) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setSlide(next);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
  };

  const finish = async () => {
    patch({ onboarding_complete: true });
    await saveSetting('onboarding_complete', true);
  };

  const isLast = slide === SLIDES.length - 1;
  const { Icon, title, body, sub } = SLIDES[slide];

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }}
    >
      {/* Skip — top right */}
      {!isLast ? (
        <Pressable
          onPress={finish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          style={{ position: 'absolute', top: 52, right: 24, zIndex: 10 }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.ui,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
          >
            Skip
          </Text>
        </Pressable>
      ) : null}

      {/* Slide content */}
      <Animated.View
        style={{
          flex: 1,
          opacity,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 36,
        }}
      >
        {/* Icon circle */}
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
          }}
        >
          <Icon size={44} strokeWidth={1.4} color={theme.colors.accent} />
        </View>

        {/* Title */}
        <Text
          style={{
            fontFamily: theme.fonts.display,
            fontSize: theme.fontSize.xxl,
            color: theme.colors.textPrimary,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {title}
        </Text>

        {/* Body */}
        <Text
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSize.base,
            color: theme.colors.textPrimary,
            textAlign: 'center',
            lineHeight: theme.fontSize.base * 1.65,
            marginBottom: sub ? 12 : 0,
          }}
        >
          {body}
        </Text>

        {/* Sub-caption */}
        {sub ? (
          <Text
            style={{
              fontFamily: theme.fonts.bodyItalic,
              fontStyle: 'italic',
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {sub}
          </Text>
        ) : null}
      </Animated.View>

      {/* Bottom area: dots + button */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 40, alignItems: 'center', gap: 28 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === slide ? 20 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === slide ? theme.colors.accent : theme.colors.border,
              }}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <Pressable
          onPress={isLast ? finish : () => goTo(slide + 1)}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next'}
          style={{
            alignSelf: 'stretch',
            backgroundColor: theme.colors.accent,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.uiBold,
              fontSize: theme.fontSize.base,
              color: theme.colors.bgPrimary,
            }}
          >
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
