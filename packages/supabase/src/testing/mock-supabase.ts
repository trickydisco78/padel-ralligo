// A controllable stand-in for the Supabase client, used by render tests via jest.mock('@/lib/supabase').
type Listener = (event: string, session: unknown) => void;

export const mockState = {
  session: null as unknown,
  profile: null as unknown,
  destinations: [] as unknown[],
  listings: [] as unknown[],
  myListings: [] as Record<string, unknown>[],
  updates: [] as { table: string; values: Record<string, unknown>; id: unknown }[],
  updateError: null as unknown,
  listingsError: null as unknown,
  destinationsError: null as unknown,
  trip: null as unknown,
  inserts: [] as { table: string; values: Record<string, unknown> }[],
  insertError: null as unknown,
  upserts: [] as { table: string; values: Record<string, unknown> }[],
  upsertError: null as unknown,
  listeners: new Set<Listener>(),
};

export function resetMockSupabase() {
  mockState.session = null;
  mockState.profile = null;
  mockState.destinations = [];
  mockState.listings = [];
  mockState.myListings = [];
  mockState.updates = [];
  mockState.updateError = null;
  mockState.listingsError = null;
  mockState.destinationsError = null;
  mockState.trip = null;
  mockState.inserts = [];
  mockState.insertError = null;
  mockState.upserts = [];
  mockState.upsertError = null;
  mockState.listeners.clear();
}

export const fakeSession = (id = 'user-1', confirmed = true) => ({
  user: { id, email: 'a@example.com', email_confirmed_at: confirmed ? '2026-01-01T00:00:00Z' : null },
});

export const supabase = {
  auth: {
    getSession: jest.fn(async () => ({ data: { session: mockState.session }, error: null })),
    onAuthStateChange: jest.fn((listener: Listener) => {
      mockState.listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => mockState.listeners.delete(listener) } } };
    }),
    signOut: jest.fn(async () => {
      mockState.session = null;
      mockState.listeners.forEach((l) => l('SIGNED_OUT', null));
      return { error: null };
    }),
    signUp: jest.fn(async () => ({ data: { user: { identities: [{}] }, session: null }, error: null })),
    signInWithPassword: jest.fn(async () => ({ data: {}, error: null })),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  },
  from: jest.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        order: async () => ({ data: mockState.myListings, error: null }),
        maybeSingle: async () => ({
          data: table === 'profile_trips' ? mockState.trip : mockState.profile,
          error: null,
        }),
      }),
      order: async () =>
        table === 'discover_listings'
          ? {
              data: mockState.listingsError ? null : mockState.listings,
              error: mockState.listingsError,
            }
          : {
              data: mockState.destinationsError ? null : mockState.destinations,
              error: mockState.destinationsError,
            },
    }),
    delete: () => ({
      eq: async () => {
        mockState.trip = null;
        return { error: null };
      },
    }),
    update: (values: Record<string, unknown>) => ({
      eq: async (_column: string, id: unknown) => {
        mockState.updates.push({ table, values, id });
        if (!mockState.updateError) {
          mockState.myListings = mockState.myListings.map((l) => (l.id === id ? { ...l, ...values } : l));
        }
        return { error: mockState.updateError };
      },
    }),
    insert: async (values: Record<string, unknown>) => {
      mockState.inserts.push({ table, values });
      return { error: mockState.insertError };
    },
    upsert: async (values: Record<string, unknown>) => {
      mockState.upserts.push({ table, values });
      if (!mockState.upsertError) {
        // Keep the fake profile in step with what was saved, as the real database would.
        const current = (mockState.profile as Record<string, unknown> | null) ?? { profile_sports: [] };
        if (table === 'profiles') {
          mockState.profile = { ...current, id: values.id, display_name: values.display_name, home_city: values.home_city, bio: values.bio };
        } else if (table === 'profile_trips') {
          mockState.trip = {
            destination_id: values.destination_id,
            start_date: values.start_date,
            end_date: values.end_date,
          };
        } else if (table === 'profile_sports') {
          mockState.profile = { ...current, profile_sports: [{ skill_tier: values.skill_tier }] };
        }
      }
      return { error: mockState.upsertError };
    },
  })),
};
