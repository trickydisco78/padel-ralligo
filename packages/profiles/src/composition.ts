import { supabase } from '@padel/supabase';

import { createSupabaseProfileRepository } from './infrastructure/supabase-profile.repository';

/** The one place the Supabase implementation is wired to the rest of the package. */
export const profileRepository = createSupabaseProfileRepository(supabase);
