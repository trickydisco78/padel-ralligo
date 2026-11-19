import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Animated, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppBar } from '../src/components/organisms';
import { colors } from '../src/theme/tokens';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
const inApp = (ui: React.ReactElement) => render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);

describe('AppBar', () => {
  it('large shows the title as a header with a muted subtitle and one pink action', async () => {
    const onPress = jest.fn();
    await inApp(
      <AppBar title="Games" subtitle="Find your kind of game" action={{ icon: 'plus', accessibilityLabel: 'New game', onPress }} />,
    );
    expect(screen.getByRole('header', { name: 'Games' })).toBeTruthy();
    expect(screen.getByText('Find your kind of game')).toBeTruthy();
    const action = screen.getByRole('button', { name: 'New game' });
    expect(StyleSheet.flatten(action.props.style)).toMatchObject({ width: 56, backgroundColor: colors.pink500 });
    await fireEvent.press(action);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sits below the status bar', async () => {
    await inApp(<AppBar title="Games" />);
    const header = screen.getByRole('header', { name: 'Games' });
    // The bar's outer view pads by the safe-area top inset.
    let node = header.parent;
    let padded = false;
    while (node) {
      if (StyleSheet.flatten(node.props.style as never)?.paddingTop === 47) padded = true;
      node = node.parent;
    }
    expect(padded).toBe(true);
  });

  it('collapses from the large title to the 24 point title as the content scrolls', async () => {
    const scrollY = new Animated.Value(0);
    await inApp(<AppBar title="Games" scrollY={scrollY} />);
    expect(StyleSheet.flatten(screen.getByRole('header', { name: 'Games' }).props.style).fontSize).toBe(44);
    await act(async () => {
      scrollY.setValue(100);
    });
    expect(StyleSheet.flatten(screen.getByRole('header', { name: 'Games' }).props.style).fontSize).toBe(24);
  });

  it('detail has a soft back button and a centred title', async () => {
    const onBack = jest.fn();
    await inApp(<AppBar variant="detail" title="Edit profile" onBack={onBack} />);
    expect(screen.getByRole('header', { name: 'Edit profile' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('overlay is transparent, floats over the content and has no title', async () => {
    await inApp(<AppBar variant="overlay" title="Match" onBack={() => {}} />);
    expect(screen.queryByRole('header')).toBeNull();
    const back = screen.getByRole('button', { name: 'Back' });
    expect(StyleSheet.flatten(back.props.style).backgroundColor).toBe(colors.surface);
  });
});
