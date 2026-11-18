import { SessionProvider } from '@padel/auth';
import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase } from '@padel/supabase/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { TripsSection } from '../src/presentation/components/trips-section';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

const dest = (id: string, name: string) => ({ id, name, country: 'Spain', tagline: '', open_listings: 0 });
const row = (id: string, destination_id: string, start_date: string, end_date: string, visibility = 'hidden') => ({
  id, profile_id: 'user-1', destination_id, start_date, end_date, visibility,
});

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession();
  mockState.destinations = [dest('m', 'Marbella'), dest('t', 'Tenerife')];
});

const renderSection = (today = '2026-06-10') =>
  render(
    <QueryTestProvider>
      <SessionProvider>
        <TripsSection today={today} />
      </SessionProvider>
    </QueryTestProvider>,
  );

const destinationsShown = () => screen.queryAllByText(/^(Marbella|Tenerife)$/).map((n) => n.props.children as string);

describe('TripsSection', () => {
  it('renders nothing without a signed-in user', async () => {
    mockState.session = null;
    await renderSection();
    expect(screen.queryByText('My trips')).toBeNull();
    expect(mockState.rpcCalls).toEqual([]);
  });

  it('shows the empty state with an Add a trip button', async () => {
    await renderSection();
    await waitFor(() => expect(screen.getByText('No trips yet')).toBeTruthy());
    expect(screen.getByText('My trips')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a trip' })).toBeTruthy();
  });

  it('lists upcoming trips soonest first with sharing state, then ended trips marked and deletable', async () => {
    mockState.trips = [
      row('late', 't', '2026-08-01', '2026-08-05', 'members'),
      row('old', 'm', '2026-05-01', '2026-05-08'),
      row('soon', 'm', '2026-06-14', '2026-06-21'),
    ];
    await renderSection();
    await waitFor(() => expect(screen.getByText('Jun 14–21')).toBeTruthy());

    expect(destinationsShown()).toEqual(['Marbella', 'Tenerife', 'Marbella']);
    expect(screen.getByText('Only you')).toBeTruthy();
    expect(screen.getByText('Shared with members')).toBeTruthy();
    expect(screen.getByText('Ended')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit Marbella trip' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Delete Marbella trip' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Edit / })).toHaveLength(2);
  });

  it('adds a trip with the share switch off by default', async () => {
    await renderSection();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add a trip' }));
    expect(screen.getByRole('checkbox', { name: 'Let other members see this trip' }).props.accessibilityState).toMatchObject({ checked: false });
    expect(
      screen.getByText(
        "Other signed-in members who are listed in Find players can see this trip's destination and dates. You can turn this off at any time.",
      ),
    ).toBeTruthy();

    await fireEvent.press(await screen.findByRole('button', { name: 'Marbella' }));
    await fireEvent.changeText(screen.getByLabelText('Start date'), '2026-06-14');
    await fireEvent.changeText(screen.getByLabelText('End date'), '2026-06-21');
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));

    await waitFor(() => expect(screen.getByText('Trip saved')).toBeTruthy());
    expect(mockState.trips).toEqual([
      expect.objectContaining({ profile_id: 'user-1', destination_id: 'm', start_date: '2026-06-14', end_date: '2026-06-21', visibility: 'hidden' }),
    ]);
    await waitFor(() => expect(screen.getByText('Only you')).toBeTruthy());
  });

  it('adds a shared trip when the switch is turned on', async () => {
    await renderSection();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add a trip' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Tenerife' }));
    await fireEvent.changeText(screen.getByLabelText('Start date'), '2026-06-14');
    await fireEvent.changeText(screen.getByLabelText('End date'), '2026-06-21');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Let other members see this trip' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));

    await waitFor(() => expect(screen.getByText('Shared with members')).toBeTruthy());
    expect(mockState.trips[0]).toMatchObject({ destination_id: 't', visibility: 'members' });
  });

  it('shows field errors and does not save an invalid trip', async () => {
    await renderSection();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add a trip' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));
    expect(screen.getByText('Choose a start date')).toBeTruthy();
    expect(screen.getByText('Choose an end date')).toBeTruthy();
    expect(screen.getAllByText('Choose a destination').length).toBeGreaterThan(0);

    await fireEvent.changeText(screen.getByLabelText('Start date'), '2026-06-22');
    await fireEvent.changeText(screen.getByLabelText('End date'), '2026-06-15');
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));
    expect(screen.getByText("End date can't be before the start date")).toBeTruthy();
    expect(mockState.trips).toEqual([]);
  });

  it('edits a trip: the form is prefilled and saving updates it', async () => {
    mockState.trips = [row('a', 'm', '2026-06-14', '2026-06-21')];
    await renderSection();
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit Marbella trip' }));
    expect(screen.getByText('Edit trip')).toBeTruthy();
    expect(screen.getByDisplayValue('2026-06-14')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('End date'), '2026-06-25');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Let other members see this trip' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));

    await waitFor(() => expect(screen.getByText('Trip saved')).toBeTruthy());
    expect(mockState.trips).toEqual([expect.objectContaining({ id: 'a', end_date: '2026-06-25', visibility: 'members' })]);
    expect(mockState.inserts.filter((i) => i.table === 'trips')).toHaveLength(0);
    await waitFor(() => expect(screen.getByText('Jun 14–25')).toBeTruthy());
  });

  it('cancels the form without saving', async () => {
    await renderSection();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add a trip' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Add a trip' })).toBeTruthy();
    expect(mockState.trips).toEqual([]);
  });

  it('deletes a trip, including an ended one', async () => {
    mockState.trips = [row('a', 'm', '2026-06-14', '2026-06-21'), row('old', 't', '2026-05-01', '2026-05-08')];
    await renderSection();
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete Tenerife trip' }));
    await waitFor(() => expect(screen.getByText('Trip deleted')).toBeTruthy());
    expect(mockState.trips.map((t) => t.id)).toEqual(['a']);
    expect(screen.queryByText('Ended')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Marbella trip' }));
    await waitFor(() => expect(screen.getByText('No trips yet')).toBeTruthy());
  });

  it('replaces Add a trip with the limit message at 10 trips', async () => {
    mockState.trips = Array.from({ length: 10 }, (_, i) => row(`t${i}`, 'm', `2026-07-${String(i + 1).padStart(2, '0')}`, `2026-07-${String(i + 1).padStart(2, '0')}`));
    await renderSection();
    await waitFor(() =>
      expect(screen.getByText('You can save up to 10 trips. Delete a trip to add another.')).toBeTruthy(),
    );
    expect(screen.queryByRole('button', { name: 'Add a trip' })).toBeNull();
  });

  it('shows an error when saving or deleting fails, and when loading fails', async () => {
    mockState.trips = [row('a', 'm', '2026-06-14', '2026-06-21')];
    await renderSection();
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit Marbella trip' }));
    mockState.tripsError = new Error('boom');
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));
    await waitFor(() => expect(screen.getByText('Could not save your trip. Please try again.')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Marbella trip' }));
    await waitFor(() => expect(screen.getByText('Could not delete your trip. Please try again.')).toBeTruthy());
  });

  it('offers a retry when the trips cannot be loaded', async () => {
    mockState.tripsError = new Error('boom');
    await renderSection();
    await waitFor(() => expect(screen.getByText('Could not load your trips.')).toBeTruthy());
    mockState.tripsError = null;
    mockState.trips = [row('a', 'm', '2026-06-14', '2026-06-21')];
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText('Jun 14–21')).toBeTruthy());
  });
});
