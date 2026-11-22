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
  players: [] as unknown[],
  playersError: null as unknown,
  overlapPlayers: [] as unknown[],
  overlapPlayersError: null as unknown,
  trips: [] as Record<string, unknown>[],
  tripsError: null as unknown,
  tripsOverview: [] as unknown[],
  /** Rows returned by the match_people function (a header repeated on each row, one row per person). */
  matchPeople: [] as unknown[],
  /** Error message (a join error code) returned by request_to_join, withdraw_join_request and decide_join_request. */
  joinError: null as string | null,
  /** When set, request_to_join, withdraw_join_request and decide_join_request wait for it, so a test can hold one in flight. */
  joinGate: null as Promise<void> | null,
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
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
  mockState.players = [];
  mockState.playersError = null;
  mockState.overlapPlayers = [];
  mockState.overlapPlayersError = null;
  mockState.trips = [];
  mockState.tripsError = null;
  mockState.tripsOverview = [];
  mockState.matchPeople = [];
  mockState.joinError = null;
  mockState.joinGate = null;
  mockState.rpcCalls = [];
  mockState.listeners.clear();
}

export const fakeSession = (id = 'user-1', confirmed = true) => ({
  user: { id, email: 'a@example.com', email_confirmed_at: confirmed ? '2026-01-01T00:00:00Z' : null },
});

type Row = Record<string, unknown>;

// `trips` rows live in mockState.trips (snake_case, as the table). Select joins the destination name;
// every call can be failed with mockState.tripsError. Filters chain with eq() and can be awaited.
function tripsTable() {
  let nextId = mockState.trips.length;
  const chain = (run: (matches: (row: Row) => boolean) => unknown) => {
    const filters: [string, unknown][] = [];
    const matches = (row: Row) => filters.every(([column, value]) => row[column] === value);
    const api = {
      eq(column: string, value: unknown) {
        filters.push([column, value]);
        return api;
      },
      order: () => api,
      then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
        return Promise.resolve(run(matches)).then(resolve, reject);
      },
    };
    return api;
  };
  return {
    select: () =>
      chain((matches) => {
        if (mockState.tripsError) return { data: null, error: mockState.tripsError };
        const data = mockState.trips.filter(matches).map((row) => {
          const destination = (mockState.destinations as Row[]).find((d) => d.id === row.destination_id);
          return { ...row, destinations: destination ? { name: destination.name } : null };
        });
        return { data, error: null };
      }),
    insert: async (values: Row) => {
      mockState.inserts.push({ table: 'trips', values });
      if (mockState.tripsError) return { error: mockState.tripsError };
      mockState.trips = [...mockState.trips, { id: `trip-${++nextId}`, visibility: 'hidden', ...values }];
      return { error: null };
    },
    update: (values: Row) =>
      chain((matches) => {
        mockState.updates.push({ table: 'trips', values, id: mockState.trips.find(matches)?.id });
        if (mockState.tripsError) return { error: mockState.tripsError };
        mockState.trips = mockState.trips.map((row) => (matches(row) ? { ...row, ...values } : row));
        return { error: null };
      }),
    delete: () =>
      chain((matches) => {
        if (mockState.tripsError) return { error: mockState.tripsError };
        mockState.trips = mockState.trips.filter((row) => !matches(row));
        return { error: null };
      }),
  };
}

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
  rpc: jest.fn(async (name: string, args: Record<string, unknown> = {}) => {
    mockState.rpcCalls.push({ name, args });
    if (name === 'search_players') {
      return mockState.playersError
        ? { data: null, error: mockState.playersError }
        : { data: mockState.players, error: null };
    }
    if (name === 'find_overlapping_players') {
      return mockState.overlapPlayersError
        ? { data: null, error: mockState.overlapPlayersError }
        : { data: mockState.overlapPlayers, error: null };
    }
    if (name === 'my_trips_overview') {
      return mockState.tripsError
        ? { data: null, error: mockState.tripsError }
        : { data: mockState.tripsOverview, error: null };
    }
    if (name === 'match_people') {
      return mockState.joinError
        ? { data: null, error: { message: mockState.joinError } }
        : { data: mockState.matchPeople, error: null };
    }
    if (name === 'request_to_join' || name === 'withdraw_join_request' || name === 'decide_join_request') {
      await mockState.joinGate;
      return mockState.joinError ? { data: null, error: { message: mockState.joinError } } : { data: null, error: null };
    }
    return { data: null, error: { message: `unknown rpc ${name}` } };
  }),
  from: jest.fn((table: string) => table === 'trips' ? tripsTable() : ({
    select: () => ({
      eq: (column: string, value: unknown) => ({
        order: async () => ({ data: mockState.myListings, error: null }),
        maybeSingle: async () => {
          if (table === 'discover_listings') {
            const rows = mockState.listings as Record<string, unknown>[];
            return {
              data: mockState.listingsError ? null : (rows.find((row) => row[column] === value) ?? null),
              error: mockState.listingsError,
            };
          }
          return { data: table === 'profile_trips' ? mockState.trip : mockState.profile, error: null };
        },
      }),
      // `gt` is used to hide full matches: rows with no numeric value for the column are kept.
      gt: (column: string, limit: number) => ({
        order: async () => ({
          data: mockState.listingsError
            ? null
            : (mockState.listings as Record<string, unknown>[]).filter(
                (row) => typeof row[column] !== 'number' || (row[column] as number) > limit,
              ),
          error: mockState.listingsError,
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
