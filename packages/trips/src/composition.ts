import { supabase } from '@padel/supabase';

import { createSupabaseTripRepository } from './infrastructure/supabase-trip.repository';

/** The one place the Supabase implementation is wired to the rest of the package. */
export const tripRepository = createSupabaseTripRepository(supabase);
