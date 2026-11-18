import { fireEvent, render, screen } from '@testing-library/react-native';

import { PlayerCard } from '../src/presentation/components/player-card';

const player = {
  id: null,
  displayName: 'Jordi M.',
  destinationId: 'd1',
  destinationName: 'Marbella',
  skillTier: 'Advanced' as const,
};

describe('PlayerCard', () => {
  it('exposes one accessible text element with name, destination and tier', async () => {
    await render(<PlayerCard player={player} />);
    expect(screen.getByLabelText('Jordi M., Marbella, Advanced')).toBeOnTheScreen();
    expect(screen.getByText('Marbella · Advanced')).toBeOnTheScreen();
  });

  it('calls onConnect when Connect is pressed', async () => {
    const onConnect = jest.fn();
    await render(<PlayerCard player={player} onConnect={onConnect} />);
    fireEvent.press(screen.getByRole('button', { name: 'Connect' }));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('disables Connect with the hint and does not fire', async () => {
    const onConnect = jest.fn();
    await render(
      <PlayerCard
        player={player}
        onConnect={onConnect}
        connectDisabled
        connectHint="Connecting with players isn't available yet"
      />,
    );
    const button = screen.getByRole('button', { name: 'Connect' });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(button.props.accessibilityHint).toBe("Connecting with players isn't available yet");
    fireEvent.press(button);
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('is not pressable as a whole', async () => {
    const onConnect = jest.fn();
    await render(<PlayerCard player={player} onConnect={onConnect} />);
    fireEvent.press(screen.getByText('Jordi M.'));
    expect(onConnect).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
