import { supabase } from '@padel/supabase';

import { createSupabaseAuthService } from './infrastructure/supabase-auth.service';

/** The one place the Supabase implementation is wired to the rest of the package. */
export const authService = createSupabaseAuthService(supabase);
