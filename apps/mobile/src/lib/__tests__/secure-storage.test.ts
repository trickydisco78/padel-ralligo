import { secureStorage } from '../secure-storage';

const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

beforeEach(() => mockStore.clear());

describe('secureStorage', () => {
  it('round-trips a small value', async () => {
    await secureStorage.setItem('sb-auth', 'hello');
    expect(await secureStorage.getItem('sb-auth')).toBe('hello');
  });

  it('round-trips a value larger than one chunk, in several pieces', async () => {
    const big = JSON.stringify({ token: 'x'.repeat(6000), n: 'é'.repeat(100) });
    await secureStorage.setItem('sb-auth', big);
    expect(await secureStorage.getItem('sb-auth')).toBe(big);
    expect([...mockStore.keys()].filter((k) => k !== 'sb-auth.count').length).toBeGreaterThan(2);
  });

  it('returns null for an unknown key', async () => {
    expect(await secureStorage.getItem('nope')).toBeNull();
  });

  it('returns null if a chunk is missing', async () => {
    await secureStorage.setItem('sb-auth', 'x'.repeat(4000));
    mockStore.delete('sb-auth.1');
    expect(await secureStorage.getItem('sb-auth')).toBeNull();
  });

  it('removes every chunk and the count', async () => {
    await secureStorage.setItem('sb-auth', 'x'.repeat(4000));
    await secureStorage.removeItem('sb-auth');
    expect(mockStore.size).toBe(0);
  });

  it('replaces a longer old value without leaving stale chunks', async () => {
    await secureStorage.setItem('sb-auth', 'x'.repeat(6000));
    await secureStorage.setItem('sb-auth', 'short');
    expect(await secureStorage.getItem('sb-auth')).toBe('short');
    expect(mockStore.size).toBe(2);
  });
});
