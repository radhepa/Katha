import React, { useEffect, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// Below this width (phones, small tablets in portrait) the web build fills
// the whole screen like a native app. Wider screens get the phone-shaped
// preview frame so it doesn't stretch into a desktop web page.
const FULL_BLEED_MAX_WIDTH = 600;

function useIsNarrow(): boolean {
  const query = `(max-width: ${FULL_BLEED_MAX_WIDTH}px)`;
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query]);
  return narrow;
}

// On web, wrap the app so it feels like an app rather than a webpage.
// On native, this is a transparent passthrough.
export function WebPhoneFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  return <WebFrame>{children}</WebFrame>;
}

function WebFrame({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const narrow = useIsNarrow();

  // Keep the browser chrome (address bar tint, overscroll areas) in the
  // active theme's colour.
  useEffect(() => {
    document.body.style.background = narrow ? theme.colors.bgPrimary : '#0d0d0d';
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme.colors.bgPrimary;
  }, [narrow, theme.colors.bgPrimary]);

  // We deliberately drop into raw DOM here because RN Web's CSS pipeline
  // doesn't give us `position: fixed` + viewport math cleanly.
  if (narrow) {
    return (
      <div style={{ ...styles.fill, background: theme.colors.bgPrimary }}>
        <style>{globalCss}</style>
        <View style={{ flex: 1, height: '100%' as any, width: '100%' as any }}>{children}</View>
      </div>
    );
  }

  return (
    <div style={styles.outer as any}>
      <style>{globalCss}</style>
      <div
        style={{
          width: 'min(390px, calc(100vw - 24px))' as any,
          height: 'min(844px, calc(100dvh - 24px))' as any,
          borderRadius: 24,
          overflow: 'hidden',
          background: theme.colors.bgPrimary,
          boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 0 6px #1a1a1a, 0 0 0 7px #2a2a2a',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <View style={{ flex: 1, height: '100%' as any, width: '100%' as any }}>{children}</View>
      </div>
    </div>
  );
}

const styles = {
  outer: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #2a2a2a 0%, #0d0d0d 100%)',
  },
  // Full-screen on phones. 100dvh tracks the visible viewport as mobile
  // browser toolbars slide in and out, so nothing hides behind them.
  fill: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
};

// Global CSS injected once on web: hide browser scrollbars, stop the page
// itself from scrolling or rubber-banding (all scroll happens inside the
// app), and keep mobile browsers from resizing text or flashing on tap.
const globalCss = `
  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  * { -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  * { scrollbar-width: none; -ms-overflow-style: none; }
`;
