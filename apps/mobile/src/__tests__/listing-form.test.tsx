import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SessionProvider } from '@/auth/session';
import { ListingForm } from '@/components/listing-form';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

const dest = (id: string, name: string) => ({ id, name, country: 'Spain', tagline: '', open_listings: 0 });
const TODAY = '2026-02-10';

beforeEach(() => {
  resetMockSupabase();
  mockState.session = fakeSession();
  mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
  mockState.destinations = [dest('m', 'Marbella'), dest('t', 'Tenerife')];
});

const renderForm = (confirmed = true) => {
  mockState.session = fakeSession('user-1', confirmed);
  return render(
    <SessionProvider>
      <ListingForm today={TODAY} />
    </SessionProvider>,
  );
};

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);

async function ready() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Marbella' })).toBeTruthy());
}

describe('ListingForm', () => {
  it('posts a fixed match with a time, venue and 2 players needed', async () => {
    await renderForm();
    await ready();
    await press('Marbella');
    await type('Start date', '2026-02-15');
    await type('Start time (optional)', '20:00');
    await type('Venue (optional)', 'Ace Padel Club');
    await press('Intermediate');
    await press('2');
    await type('Description (optional)', 'Friendly doubles');
    await press('Post listing');

    await waitFor(() => expect(screen.getByText('Listing posted')).toBeTruthy());
    expect(mockState.inserts).toEqual([
      {
        table: 'listings',
        values: {
          poster_id: 'user-1',
          destination_id: 'm',
          start_date: '2026-02-15',
          end_date: null,
          start_time: '20:00',
          venue: 'Ace Padel Club',
          level_wanted: 'Intermediate',
          players_needed: 2,
          description: 'Friendly doubles',
        },
      },
    ]);
  });

  it('posts a loose invite with a date range and no time or venue', async () => {
    await renderForm();
    await ready();
    await press('Tenerife');
    await type('Start date', '2026-02-12');
    await type('End date (optional)', '2026-02-18');
    await press('1');
    await press('Post listing');

    await waitFor(() => expect(mockState.inserts).toHaveLength(1));
    expect(mockState.inserts[0]!.values).toMatchObject({
      destination_id: 't',
      start_date: '2026-02-12',
      end_date: '2026-02-18',
      start_time: null,
      venue: null,
      level_wanted: 'Any',
      players_needed: 1,
    });
  });

  it('rejects a missing destination and missing players needed', async () => {
    await renderForm();
    await ready();
    await type('Start date', '2026-02-15');
    await press('Post listing');

    expect(screen.getByText('Choose a destination')).toBeTruthy();
    expect(screen.getByText('Players needed must be 1 to 3')).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
  });

  it('rejects a start date in the past', async () => {
    await renderForm();
    await ready();
    await press('Marbella');
    await type('Start date', '2026-02-09');
    await press('1');
    await press('Post listing');

    expect(screen.getByText("Start date can't be in the past")).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
  });

  it('rejects an end date before the start date', async () => {
    await renderForm();
    await ready();
    await press('Marbella');
    await type('Start date', '2026-02-15');
    await type('End date (optional)', '2026-02-14');
    await press('1');
    await press('Post listing');

    expect(screen.getByText("End date can't be before the start date")).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
  });

  it('rejects a description over 500 characters', async () => {
    await renderForm();
    await ready();
    await press('Marbella');
    await type('Start date', '2026-02-15');
    await press('1');
    await type('Description (optional)', 'x'.repeat(501));
    await press('Post listing');

    expect(screen.getByText('Description must be 500 characters or fewer')).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
  });

  it('rejects a start time that is not HH:MM', async () => {
    await renderForm();
    await ready();
    await press('Marbella');
    await type('Start date', '2026-02-15');
    await press('1');
    await type('Start time (optional)', '8pm');
    await press('Post listing');

    expect(screen.getByText('Use the format HH:MM')).toBeTruthy();
    expect(mockState.inserts).toHaveLength(0);
  });

  it('tells a user with an unverified email to verify instead of showing the form', async () => {
    await renderForm(false);
    await waitFor(() => expect(screen.getByText(/Verify your email address/)).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Post listing' })).toBeNull();
  });

  it('shows an error if the listing cannot be saved', async () => {
    mockState.insertError = { message: 'row-level security' };
    await renderForm();
    await ready();
    await press('Marbella');
    await type('Start date', '2026-02-15');
    await press('1');
    await press('Post listing');

    await waitFor(() => expect(screen.getByText(/Could not save your listing/)).toBeTruthy());
    expect(screen.queryByText('Listing posted')).toBeNull();
  });

  it('clears the form after a successful post', async () => {
    await renderForm();
    await ready();
    await press('Marbella');
    await type('Start date', '2026-02-15');
    await press('1');
    await press('Post listing');

    await waitFor(() => expect(screen.getByText('Listing posted')).toBeTruthy());
    expect(screen.getByLabelText('Start date').props.value).toBe('');
  });
});
