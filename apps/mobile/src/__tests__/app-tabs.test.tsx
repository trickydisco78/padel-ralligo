import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import TabsLayout from '@/app/(tabs)/_layout';

const names = ['index', 'discover', 'create', 'matches', 'profile'];

describe('tab bar', () => {
  it('has Home, Discover, Create, Matches and Profile, in that order, and opens on Home', async () => {
    await renderRouter({
      '(tabs)/_layout': TabsLayout,
      ...Object.fromEntries(names.map((n) => [`(tabs)/${n}`, () => <Text>{`${n} screen`}</Text>])),
    });

    expect(screen.getByText('index screen')).toBeTruthy();
    const tree = JSON.stringify(screen.toJSON());
    const labels = ['Home', 'Discover', 'Create', 'Matches', 'Profile'];
    const positions = labels.map((l) => tree.indexOf(`"${l}"`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
