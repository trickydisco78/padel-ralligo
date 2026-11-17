import { supabase } from '@padel/supabase';

import { createSupabaseProfileRepository } from './infrastructure/supabase-profile.repository';
import { createSupabaseTripRepository } from './infrastructure/supabase-trip.repository';

/** The one place the Supabase implementations are wired to the rest of the package. */
export const profileRepository = createSupabaseProfileRepository(supabase);
export const tripRepository = createSupabaseTripRepository(supabase);
