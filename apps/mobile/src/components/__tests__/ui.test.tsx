import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { PrimaryButton } from '@/components/primary-button';
import { Colors } from '@/constants/theme';

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
