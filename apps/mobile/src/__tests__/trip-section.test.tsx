import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SessionProvider } from '@/auth/session';
import { TripSection } from '@/components/trip-section';
import { activeTrip } from '@/data/trip';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

const dest = (id: string, name: string) => ({ id, name, country: 'Spain', tagline: '', open_listings: 0 });

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession();
  mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
  mockState.destinations = [dest('m', 'Marbella'), dest('t', 'Tenerife')];
});

const renderSection = (today = '2026-02-10') =>
  render(
    <SessionProvider>
      <TripSection today={today} />
    </SessionProvider>,
  );

describe('TripSection', () => {
  it('saves a trip with a destination and valid dates', async () => {
    await renderSection();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Marbella' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Marbella' }));
    await fireEvent.changeText(screen.getByLabelText('Start date'), '2026-02-15');
    await fireEvent.changeText(screen.getByLabelText('End date'), '2026-02-22');
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));

    await waitFor(() => expect(screen.getByText('Trip saved')).toBeTruthy());
    expect(mockState.trip).toEqual({ destination_id: 'm', start_date: '2026-02-15', end_date: '2026-02-22' });
  });

  it('does not save when the end date is before the start date', async () => {
    await renderSection();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Marbella' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Marbella' }));
    await fireEvent.changeText(screen.getByLabelText('Start date'), '2026-02-22');
    await fireEvent.changeText(screen.getByLabelText('End date'), '2026-02-15');
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));

    expect(screen.getByText("End date can't be before the start date")).toBeTruthy();
    expect(mockState.trip).toBeNull();
  });

  it('asks for the date format when the text is not a real date', async () => {
    await renderSection();
    await waitFor(() => expect(screen.getByLabelText('Start date')).toBeTruthy());
    await fireEvent.changeText(screen.getByLabelText('Start date'), '2026-02-30');
    expect(screen.getByText('Use the format YYYY-MM-DD')).toBeTruthy();
  });

  it('requires a destination and both dates', async () => {
    await renderSection();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save trip' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Save trip' }));

    expect(screen.getAllByText('Choose a destination').length).toBeGreaterThan(0);
    expect(screen.getByText('Choose a start date')).toBeTruthy();
    expect(screen.getByText('Choose an end date')).toBeTruthy();
  });

  it('shows the saved trip and notes when it has ended', async () => {
    mockState.trip = { destination_id: 't', start_date: '2026-01-01', end_date: '2026-01-08' };
    await renderSection('2026-02-10');

    await waitFor(() => expect(screen.getByText('This trip has ended.')).toBeTruthy());
    expect(screen.getByDisplayValue('2026-01-01')).toBeTruthy();
  });

  it('clears the saved trip', async () => {
    mockState.trip = { destination_id: 't', start_date: '2026-02-12', end_date: '2026-02-18' };
    await renderSection('2026-02-10');
    await waitFor(() => expect(screen.getByDisplayValue('2026-02-12')).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Clear trip' }));
    await waitFor(() => expect(screen.getByText('Trip cleared')).toBeTruthy());
    expect(mockState.trip).toBeNull();
  });
});

describe('activeTrip', () => {
  const trip = { destinationId: 't', startDate: '2026-02-01', endDate: '2026-02-10' };

  it('keeps a trip until its end date has passed', () => {
    expect(activeTrip(trip, '2026-02-10')).toEqual(trip);
    expect(activeTrip(trip, '2026-02-11')).toBeNull();
  });

  it('returns null when there is no trip', () => {
    expect(activeTrip(null, '2026-02-10')).toBeNull();
  });
});
