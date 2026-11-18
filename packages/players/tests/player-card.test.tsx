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
    expect(screen.getByText('Marbella · Padel · Advanced')).toBeOnTheScreen();
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

  it('reads Sign in for a guest and Connect otherwise', async () => {
    const onConnect = jest.fn();
    await render(<PlayerCard player={player} guest onConnect={onConnect} />);
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  describe('with overlap', () => {
    const base = { startDate: '2026-06-17' as const, endDate: '2026-06-23' as const, tripDays: 8 };

    it('shows the dates and a partial overlap', async () => {
      await render(<PlayerCard player={player} overlap={{ ...base, days: 5 }} />);
      expect(screen.getByText('Marbella · Jun 17–23')).toBeOnTheScreen();
      expect(screen.getByText('5 days overlap · Advanced')).toBeOnTheScreen();
      expect(screen.queryByText(/Padel/)).toBeNull();
      expect(screen.getByLabelText('Jordi M., Marbella, Jun 17–23, 5 days overlap, Advanced')).toBeOnTheScreen();
    });

    it('says All n days when the whole trip overlaps', async () => {
      await render(<PlayerCard player={player} overlap={{ ...base, days: 8 }} />);
      expect(screen.getByText('All 8 days overlap · Advanced')).toBeOnTheScreen();
      expect(screen.getByLabelText(/All 8 days overlap/)).toBeOnTheScreen();
    });

    it('says 1 day for a single shared day, even on a one-day trip', async () => {
      await render(<PlayerCard player={player} overlap={{ ...base, days: 1 }} />);
      expect(screen.getByText('1 day overlap · Advanced')).toBeOnTheScreen();
      await render(<PlayerCard player={player} overlap={{ ...base, days: 1, tripDays: 1 }} />);
      expect(screen.getAllByText('1 day overlap · Advanced').length).toBeGreaterThan(0);
      expect(screen.queryByText(/All 1/)).toBeNull();
    });

    it('keeps a single button', async () => {
      await render(<PlayerCard player={player} overlap={{ ...base, days: 5 }} />);
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });
  });
});
