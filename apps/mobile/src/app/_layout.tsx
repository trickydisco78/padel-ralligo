import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { I18nextProvider } from '@padel/i18n';
import { QueryProvider } from '@padel/query';

import { AppShell } from '@/components/app-shell';
import { i18n } from '@/i18n';
import { colors } from '@padel/ui';

// Keep the splash screen up until Outfit is loaded, so no text shows in a fallback font.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Visitors start on the tabs; the auth screens are opened from them, never the other way round.
export const unstable_settings = { anchor: '(tabs)' };

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.pink500,
    background: colors.surface,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Fall back to the system font if loading fails rather than blocking the app.
  if (!ready) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider value={theme}>
        <QueryProvider>
          <AppShell />
        </QueryProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
