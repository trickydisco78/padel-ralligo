import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemedText } from '../src/components/atoms/themed-text';
import { borderWidth, colors, fontFamily, radius, shadows, spacing, type } from '../src/theme/tokens';

describe('design tokens', () => {
  it('uses the Padel Pink brand colours', () => {
    expect(colors.pink500).toBe('#E6005C');
    expect(colors.pink700).toBe('#B8004A');
    expect(colors.surface).toBe('#FFFFFF');
  });

  it('turns px into plain numbers and keeps the pill radius fully round', () => {
    expect(spacing.space4).toBe(16);
    expect(spacing.space5).toBe(20);
    expect(radius.lg).toBe(28);
    expect(radius.pill).toBe(999);
  });

  it('uses real 1.5 borders for hairlines', () => {
    expect(borderWidth).toBe(1.5);
  });

  it('has one Outfit family per weight and never sets a font weight', () => {
    expect(Object.keys(fontFamily).sort()).toEqual(['400', '500', '600', '700', '800']);
    expect(type.displayXl.fontFamily).toBe(fontFamily[800]);
    expect(type.label.fontFamily).toBe(fontFamily[600]);
    for (const style of Object.values(type)) {
      expect(Object.values(fontFamily)).toContain(style.fontFamily);
      expect(style).not.toHaveProperty('fontWeight');
    }
  });

  it('converts em letter spacing to pixels', () => {
    expect(type.displayXl.letterSpacing).toBeCloseTo(-0.03 * 44, 2);
    expect(type.overline.letterSpacing).toBeCloseTo(0.08 * 11, 2);
    expect(type.body).not.toHaveProperty('letterSpacing');
  });

  it('maps shadows to iOS props and an Android elevation', () => {
    expect(shadows.shadowBrand).toEqual({
      shadowColor: colors.pink500,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 11,
      elevation: 8,
    });
    expect(shadows.shadowFloat.shadowRadius).toBe(16);
    expect(shadows.shadowFloat.elevation).toBe(10);
    expect(shadows.shadowCard.shadowRadius).toBe(12);
    expect(shadows.shadowCard.elevation).toBe(2);
  });
});

describe('ThemedText', () => {
  it('resolves a colour and a text style from the tokens', async () => {
    await render(
      <ThemedText type="label" themeColor="pink700">
        Accent
      </ThemedText>,
    );
    const style = StyleSheet.flatten(screen.getByText('Accent').props.style);
    expect(style.color).toBe(colors.pink700);
    expect(style.fontFamily).toBe(type.label.fontFamily);
  });

  it('defaults to body text in ink', async () => {
    await render(<ThemedText>Plain</ThemedText>);
    const style = StyleSheet.flatten(screen.getByText('Plain').props.style);
    expect(style.color).toBe(colors.ink);
    expect(style.fontSize).toBe(type.body.fontSize);
  });
});
