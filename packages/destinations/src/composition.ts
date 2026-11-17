import { supabase } from '@padel/supabase';

import { createSupabaseDestinationRepository } from './infrastructure/supabase-destination.repository';

/** The one place the Supabase implementation is wired to the rest of the package. */
export const destinationRepository = createSupabaseDestinationRepository(supabase);
