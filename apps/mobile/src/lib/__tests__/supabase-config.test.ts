import { readSupabaseConfig } from '../supabase-config';

describe('readSupabaseConfig', () => {
  it('returns the url and key when both are set', () => {
    expect(readSupabaseConfig('https://x.supabase.co', 'sb_publishable_abc')).toEqual({
      url: 'https://x.supabase.co',
      anonKey: 'sb_publishable_abc',
    });
  });

  it('names the missing variable when the url is absent', () => {
    expect(() => readSupabaseConfig(undefined, 'sb_publishable_abc')).toThrow(
      /Missing EXPO_PUBLIC_SUPABASE_URL\b/,
    );
  });

  it('names both when both are absent', () => {
    expect(() => readSupabaseConfig('', undefined)).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it('refuses a secret key', () => {
    expect(() => readSupabaseConfig('https://x.supabase.co', 'sb_secret_abc')).toThrow(/secret key/);
  });
});
