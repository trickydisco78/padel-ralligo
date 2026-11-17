import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { secureStorage } from './secure-storage';
import { readSupabaseConfig } from './supabase-config';

// Expo only inlines EXPO_PUBLIC_ variables that are read with this exact literal form.
const config = readSupabaseConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
