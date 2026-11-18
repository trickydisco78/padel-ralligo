import { fireEvent, render, screen } from '@testing-library/react-native';

import type { TripOverview } from '../src/domain/trip';
import { SavedTripsRow } from '../src/presentation/components/saved-trips-row';

const trip = (over: Partial<TripOverview>): TripOverview => ({
  id: 't1',
  destinationId: 'm',
  destinationName: 'Marbella',
  destinationCountry: 'Spain',
  startDate: '2026-06-14',
  endDate: '2026-06-21',
  visibility: 'members',
  days: 8,
  overlapPlayers: 3,
  ...over,
});

describe('SavedTripsRow', () => {
  it('shows destination, country and dates, days and overlap count', async () => {
    await render(<SavedTripsRow trips={[trip({})]} selectedTripId={null} onSelect={() => {}} />);
    expect(screen.getByText('Marbella')).toBeTruthy();
    expect(screen.getByText('Spain · Jun 14–21')).toBeTruthy();
    expect(screen.getByText('8 days · 3 players overlap')).toBeTruthy();
  });

  it('words one player, one day and no overlaps', async () => {
    await render(
      <SavedTripsRow
        trips={[
          trip({ id: 'a', days: 1, startDate: '2026-06-14', endDate: '2026-06-14', overlapPlayers: 1 }),
          trip({ id: 'b', destinationName: 'Tarifa', startDate: '2026-06-28', endDate: '2026-07-03', days: 6, overlapPlayers: 0 }),
        ]}
        selectedTripId={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('1 day · 1 player overlaps')).toBeTruthy();
    expect(screen.getByText('6 days · No overlaps yet')).toBeTruthy();
    expect(screen.getByText('Spain · Jun 28 – Jul 3')).toBeTruthy();
  });

  it('selects a card on press and announces the selected one', async () => {
    const onSelect = jest.fn();
    await render(
      <SavedTripsRow
        trips={[trip({ id: 'a' }), trip({ id: 'b', destinationName: 'Tarifa', overlapPlayers: 0 })]}
        selectedTripId="a"
        onSelect={onSelect}
      />,
    );
    const selected = screen.getByRole('button', { name: /^Marbella/ });
    const other = screen.getByRole('button', { name: /^Tarifa/ });
    expect(selected.props.accessibilityState).toMatchObject({ selected: true });
    expect(other.props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getAllByText('✓')).toHaveLength(1);

    await fireEvent.press(other);
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('gives each card an accessible name with destination, dates, days, overlap and state', async () => {
    await render(
      <SavedTripsRow
        trips={[trip({ id: 'a' }), trip({ id: 'b', destinationName: 'Tarifa', overlapPlayers: 0 })]}
        selectedTripId="a"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Marbella, Jun 14–21, 8 days · 3 players overlap, selected' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tarifa, Jun 14–21, 8 days · No overlaps yet, not selected' })).toBeTruthy();
  });
});
