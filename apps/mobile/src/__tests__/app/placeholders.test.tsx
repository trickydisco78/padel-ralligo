import { render, screen, waitFor } from '@testing-library/react-native';

import MatchesScreen from '@/app/(tabs)/matches';
import { SessionProvider } from '@/auth/session';
import { fakeSession, mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

beforeEach(() => resetMockSupabase());

describe('Matches placeholder screen', () => {
  it('shows its title and a coming soon message to a signed-in user', async () => {
    mockState.session = fakeSession();
    mockState.profile = { id: 'user-1', profile_sports: [{ skill_tier: 'Beginner' }] };
    await render(
      <SessionProvider>
        <MatchesScreen />
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByText('Coming soon')).toBeTruthy());
    expect(screen.getByText('Matches')).toBeTruthy();
  });
});
