/**
 * Design tokens for the app: colours, spacing and radii.
 */

import './global.css';

import { Platform } from 'react-native';

/** Light theme only for v1. Bright green accent, matching the Ralligo "Explore" mock. */
export const Colors = {
  light: {
    text: '#0F1A14',
    textSecondary: '#6B7570',
    background: '#FFFFFF',
    backgroundElement: '#F7F8F7',
    backgroundSelected: '#E8EBE9',
    border: '#E8EBE9',
    primary: '#22DB6E',
    primaryDark: '#0E7A45',
    primaryTint: '#C9F7DD',
    onPrimary: '#04281A',
    accentBook: '#12A37A',
    hero: '#0B2E22',
    brand: '#0D1B2E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

/** Plus Jakarta Sans: geometric, heavy headings like the Ralligo wordmark. Loaded in the root layout. */
export const Typeface = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  card: 20,
  button: 999,
  chip: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
