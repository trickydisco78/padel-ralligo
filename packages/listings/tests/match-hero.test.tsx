import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { MatchHero } from '../src/presentation/components/match-hero';

describe('MatchHero', () => {
  it('is a pink block with the court motif, hidden from assistive technology', async () => {
    await render(<MatchHero />);
    const hero = screen.getByTestId('match-hero', { includeHiddenElements: true });
    expect(StyleSheet.flatten(hero.props.style)).toMatchObject({ backgroundColor: '#E6005C', height: 250 });
    expect(hero.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(screen.queryByRole('image')).toBeNull();
  });
});
