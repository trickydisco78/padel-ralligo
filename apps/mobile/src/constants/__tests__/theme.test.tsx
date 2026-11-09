import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius } from '@/constants/theme';

describe('theme tokens', () => {
  it('uses the green accent and rounded card and chip radii', () => {
    expect(Colors.light.primary).toBe('#12A150');
    expect(Radius.card).toBe(20);
    expect(Radius.chip).toBeGreaterThanOrEqual(999);
  });

  it('ThemedText resolves a theme colour from the tokens', async () => {
    await render(<ThemedText themeColor="primary">Accent</ThemedText>);
    expect(StyleSheet.flatten(screen.getByText('Accent').props.style).color).toBe(
      Colors.light.primary,
    );
  });
});
