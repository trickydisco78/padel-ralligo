import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Card } from '../src/components/card';
import { Chip } from '../src/components/chip';
import { PrimaryButton } from '../src/components/primary-button';
import { SecondaryButton } from '../src/components/secondary-button';
import { Colors } from '../src/theme/tokens';

describe('Card', () => {
  it('renders its children', async () => {
    await render(
      <Card>
        <Chip label="Inside" />
      </Card>,
    );
    expect(screen.getByText('Inside')).toBeTruthy();
  });
});

describe('Chip', () => {
  it('is a button that reports selection and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Advanced" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Advanced' });
    expect(chip.props.accessibilityState.selected).toBe(true);
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses the accent tint when selected and neutral when not', async () => {
    await render(
      <>
        <Chip label="On" selected onPress={() => {}} />
        <Chip label="Off" onPress={() => {}} />
      </>,
    );
    const bg = (name: string) =>
      StyleSheet.flatten(screen.getByRole('button', { name }).props.style).backgroundColor;
    expect(bg('On')).toBe(Colors.light.primaryTint);
    expect(bg('Off')).toBe(Colors.light.backgroundSelected);
  });

  it('is not a button when it has no onPress', async () => {
    await render(<Chip label="Static" />);
    expect(screen.queryByRole('button', { name: 'Static' })).toBeNull();
    expect(screen.getByText('Static')).toBeTruthy();
  });
});

describe('PrimaryButton', () => {
  it('calls onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton title="Post" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Post' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton title="Post" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Post' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('button accessibility', () => {
  it('PrimaryButton conveys a hint, disabled and busy state', async () => {
    await render(<PrimaryButton title="Join match" onPress={() => {}} disabled busy accessibilityHint="Joining is not available yet" />);
    const button = screen.getByRole('button', { name: 'Join match' });
    expect(button.props.accessibilityHint).toBe('Joining is not available yet');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });

  it('PrimaryButton is not busy by default', async () => {
    await render(<PrimaryButton title="Post" onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Post' }).props.accessibilityState.busy).toBe(false);
  });
});

describe('SecondaryButton', () => {
  it('calls onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(<SecondaryButton title="Sign in" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled and says so', async () => {
    const onPress = jest.fn();
    await render(<SecondaryButton title="Sign in" onPress={onPress} disabled accessibilityHint="Unavailable" />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(button.props.accessibilityHint).toBe('Unavailable');
  });

  it('is outlined rather than filled and has a 48 point minimum height', async () => {
    await render(<SecondaryButton title="Sign in" onPress={() => {}} />);
    const style = StyleSheet.flatten(screen.getByRole('button', { name: 'Sign in' }).props.style);
    expect(style.borderWidth).toBeGreaterThan(0);
    expect(style.backgroundColor).toBe(Colors.light.background);
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });
});
