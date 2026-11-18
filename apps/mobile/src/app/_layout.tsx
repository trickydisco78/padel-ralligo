import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, ThemeProvider } from 'expo-router';

import { I18nextProvider } from '@padel/i18n';
import { QueryProvider } from '@padel/query';

import { AppShell } from '@/components/app-shell';
import { i18n } from '@/i18n';
import { Colors } from '@padel/ui';

// Visitors start on the tabs; the auth screens are opened from them, never the other way round.
export const unstable_settings = { anchor: '(tabs)' };

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  // Fall back to the system font if loading fails rather than blocking the app.
  if (!fontsLoaded && !fontError) return null;

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
