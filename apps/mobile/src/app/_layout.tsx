import { DefaultTheme, ThemeProvider } from 'expo-router';

import { SessionProvider } from '@/auth/session';
import { RootStack } from '@/components/root-stack';
import { Colors } from '@/constants/theme';

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
  return (
    <ThemeProvider value={theme}>
      <SessionProvider>
        <RootStack />
      </SessionProvider>
    </ThemeProvider>
  );
}
