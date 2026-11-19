import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { PlayerRow } from '../src/presentation/components/player-row';

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('PlayerRow', () => {
  it('playing shows the name and "Playing" as one readable element', async () => {
    await render(<PlayerRow name="Carlos M." status="playing" />);
    expect(screen.getByLabelText('Carlos M., Playing')).toBeOnTheScreen();
    expect(screen.getByText('Playing')).toBeOnTheScreen();
  });

  it('requesting has labelled accept and decline buttons that include the name', async () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    await render(<PlayerRow name="David K." status="requesting" onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText('Requesting to join')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Accept David K.' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Decline David K.' }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('is at least 68 points tall', async () => {
    await render(<PlayerRow name="Carlos M." status="playing" />);
    // The row is the outermost styled view around the label.
    let node = screen.getByLabelText('Carlos M., Playing').parent;
    while (node && flat(node).minHeight === undefined) node = node.parent;
    expect(flat(node!).minHeight).toBe(68);
  });

  it('organiser is a button with a chevron only when it can be opened', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<PlayerRow name="Alex M." status="organiser" />);
    expect(screen.getByText('Match organiser')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
    await rerender(<PlayerRow name="Alex M." status="organiser" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Alex M., Match organiser' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a requesting row can be opened to review without touching accept or decline', async () => {
    const onPress = jest.fn();
    const onAccept = jest.fn();
    await render(<PlayerRow name="David K." status="requesting" onPress={onPress} onAccept={onAccept} onDecline={() => {}} />);
    await fireEvent.press(screen.getByRole('button', { name: "Review David K.'s request" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Accept David K.' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decline David K.' })).toBeTruthy();
  });

  it('a requesting row with no onPress is not a review button', async () => {
    await render(<PlayerRow name="David K." status="requesting" onAccept={() => {}} onDecline={() => {}} />);
    expect(screen.queryByRole('button', { name: /^Review/ })).toBeNull();
    expect(screen.getByLabelText('David K., Requesting to join')).toBeOnTheScreen();
  });
});
