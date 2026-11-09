import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import { secureStorage } from '@/lib/secure-storage';
import { readSupabaseConfig } from '@/lib/supabase-config';

// Expo only inlines EXPO_PUBLIC_ variables that are read with this exact literal form.
const config = readSupabaseConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
