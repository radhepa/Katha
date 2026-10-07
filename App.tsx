import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { WebPhoneFrame } from '@/components/WebPhoneFrame';
import { RootNavigator } from '@/nav/RootNavigator';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { useFontLoader } from '@/theme/fonts';
import { initDb } from '@/db/sqlite';
import { loadSettings } from '@/db/settings';
import { useSettingsStore } from '@/store/settings';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already prevented or platform doesn't support it — non-fatal.
});

export default function App() {
  const fontLoader = useFontLoader();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const onboardingComplete = useSettingsStore((s) => s.settings.onboarding_complete);
  const [dbReady, setDbReady] = useState(false);
  const [bootError, setBootError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        const settings = await loadSettings();
        hydrate(settings);
        setDbReady(true);
      } catch (e) {
        setBootError(e as Error);
        setDbReady(true); // surface the error rather than hang on splash
      }
    })();
  }, [hydrate]);

  const ready = fontLoader.loaded && dbReady && (hydrated || bootError !== null);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (bootError && fontLoader.loaded) {
    // Surface the boot failure as soon as we have fonts to render with.
    SplashScreen.hideAsync().catch(() => {});
    return (
      <View style={{ flex: 1, padding: 32, justifyContent: 'center', backgroundColor: '#FAF8F4' }}>
        <Text style={{ fontSize: 16, color: '#1C1814', marginBottom: 8 }}>
          Katha failed to start.
        </Text>
        <Text style={{ fontSize: 13, color: '#6B5E52' }}>
          {bootError.message}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return null; // splash screen holds the view; nothing to render yet
  }

  // On web, GestureHandlerRootView installs wheel/touch listeners that can
  // intercept native scroll. We don't use react-native-gesture-handler in any
  // screen (the drawer uses RN PanResponder), so skip it on web entirely.
  const Wrapper = Platform.OS === 'web'
    ? ({ children }: { children: React.ReactNode }) => <View style={{ flex: 1 }}>{children}</View>
    : ({ children }: { children: React.ReactNode }) => <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>;

  return (
    <Wrapper>
      <SafeAreaProvider>
        <ThemeProvider>
          <WebPhoneFrame>
            {onboardingComplete ? <RootNavigator /> : <OnboardingScreen />}
            <StatusBar style="auto" />
          </WebPhoneFrame>
        </ThemeProvider>
      </SafeAreaProvider>
    </Wrapper>
  );
}
