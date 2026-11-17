import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, type ThemeColor, Typeface } from '../theme/tokens';
import { useTheme } from '../theme/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'display' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontFamily: Typeface.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: Typeface.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: Typeface.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  display: {
    fontFamily: Typeface.extrabold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: Typeface.extrabold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: Typeface.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  link: {
    fontFamily: Typeface.semibold,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: Typeface.semibold,
    lineHeight: 30,
    fontSize: 14,
    color: Colors.light.primaryDark,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
