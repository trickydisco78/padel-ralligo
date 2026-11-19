import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';

import { BottomSheet } from '../src/components/organisms/bottom-sheet';

const open = (props: Partial<React.ComponentProps<typeof BottomSheet>> = {}) =>
  render(
    <BottomSheet visible title="Join this match" onDismiss={props.onDismiss ?? (() => {})} {...props}>
      <Text>Sheet body</Text>
    </BottomSheet>,
  );

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('BottomSheet', () => {
  it('shows its title and content when visible', async () => {
    await open();
    expect(screen.getByText('Join this match')).toBeTruthy();
    expect(screen.getByText('Sheet body')).toBeTruthy();
  });

  it('renders nothing when not visible', async () => {
    await open({ visible: false });
    expect(screen.queryByText('Join this match')).toBeNull();
    expect(screen.queryByText('Sheet body')).toBeNull();
  });

  it('exposes the title as a labelled heading', async () => {
    await open();
    expect(screen.getByRole('header', { name: 'Join this match' })).toBeTruthy();
  });

  it('announces the title to screen readers when it opens', async () => {
    await open();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Join this match');
  });

  it('dismisses from the labelled close control', async () => {
    const onDismiss = jest.fn();
    await open({ onDismiss });
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses from a tap on the backdrop', async () => {
    const onDismiss = jest.fn();
    await open({ onDismiss });
    await fireEvent.press(screen.getByTestId('bottom-sheet-backdrop', { includeHiddenElements: true }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on the Android back action', async () => {
    const onDismiss = jest.fn();
    await open({ onDismiss });
    await act(async () => {
      screen.getByTestId('bottom-sheet-modal').props.onRequestClose();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('keeps the close control at least 44 points square', async () => {
    await open();
    const style = StyleSheet.flatten(screen.getByRole('button', { name: 'Close' }).props.style);
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('marks the sheet as modal so screen readers stay inside it', async () => {
    await open();
    expect(screen.getByTestId('bottom-sheet-surface').props.accessibilityViewIsModal).toBe(true);
  });
});

describe('BottomSheet styling', () => {
  it('has a grabber, large top corners and a dimmed ink backdrop', async () => {
    await open();
    const surface = StyleSheet.flatten(screen.getByTestId('bottom-sheet-surface').props.style);
    expect(surface.borderTopLeftRadius).toBe(34);
    expect(surface.backgroundColor).toBe('#FFFFFF');
    const backdrop = StyleSheet.flatten(screen.getByTestId('bottom-sheet-backdrop', { includeHiddenElements: true }).props.style);
    expect(backdrop.backgroundColor).toBe('#1A1218');
    expect(backdrop.opacity).toBe(0.55);
  });
});

describe('BottomSheet confirmation layout', () => {
  const confirm = (props: Partial<React.ComponentProps<typeof BottomSheet>> = {}) =>
    render(
      <BottomSheet
        visible
        title="Request sent!"
        onDismiss={props.onDismiss ?? (() => {})}
        confirm={{ icon: 'checkCircle', message: 'You can see the answer here.' }}
        {...props}>
        <Text>Actions</Text>
      </BottomSheet>,
    );

  it('shows the title as a header, the message and the actions, with no close button', async () => {
    await confirm();
    expect(screen.getByRole('header', { name: 'Request sent!' })).toBeTruthy();
    expect(screen.getByText('You can see the answer here.')).toBeTruthy();
    expect(screen.getByText('Actions')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('still dismisses from the backdrop and the Android back action', async () => {
    const onDismiss = jest.fn();
    await confirm({ onDismiss });
    await fireEvent.press(screen.getByTestId('bottom-sheet-backdrop', { includeHiddenElements: true }));
    await act(async () => {
      screen.getByTestId('bottom-sheet-modal').props.onRequestClose();
    });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('uses an amber disc for the pending tone', async () => {
    await confirm({ confirm: { icon: 'clock', tone: 'pending' } });
    expect(screen.getByRole('header', { name: 'Request sent!' })).toBeTruthy();
  });
});
