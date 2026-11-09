export type SupabaseConfig = { url: string; anonKey: string };

/** Fails loudly at startup if the app was built without its Supabase settings. */
export function readSupabaseConfig(url: string | undefined, anonKey: string | undefined): SupabaseConfig {
  const missing: string[] = [];
  if (!url) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(' and ')}. Copy apps/mobile/.env.example to apps/mobile/.env.local and fill it in.`,
    );
  }

  if (anonKey!.startsWith('sb_secret_')) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY holds a secret key. Use the publishable key only.');
  }

  return { url: url!, anonKey: anonKey! };
}
