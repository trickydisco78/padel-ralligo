import { supabase } from '@padel/supabase';

import { createSupabasePlayerRepository } from './infrastructure/supabase-player.repository';

/** The one place the Supabase implementation is wired to the rest of the package. */
export const playerRepository = createSupabasePlayerRepository(supabase);
