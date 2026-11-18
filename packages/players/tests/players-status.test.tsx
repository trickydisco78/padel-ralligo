import { fireEvent, render, screen } from '@testing-library/react-native';

import { PlayersStatus } from '../src/presentation/components/players-status';

describe('PlayersStatus', () => {
  it('shows a spinner while loading', async () => {
    await render(<PlayersStatus state="loading" />);
    expect(screen.getByTestId('players-loading')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the empty message and clears filters', async () => {
    const onClearFilters = jest.fn();
    await render(<PlayersStatus state="empty" onClearFilters={onClearFilters} />);
    expect(screen.getByText('No players here yet')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('shows the error message and retries', async () => {
    const onRetry = jest.fn();
    await render(<PlayersStatus state="error" onRetry={onRetry} />);
    expect(screen.getByText('Could not load players')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
