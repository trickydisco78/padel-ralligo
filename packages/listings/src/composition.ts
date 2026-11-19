import { supabase } from '@padel/supabase';

import { createSupabaseJoinRequestRepository } from './infrastructure/supabase-join-request.repository';
import { createSupabaseListingRepository } from './infrastructure/supabase-listing.repository';

/** The one place the Supabase implementation is wired to the rest of the package. */
export const listingRepository = createSupabaseListingRepository(supabase);
export const joinRequestRepository = createSupabaseJoinRequestRepository(supabase);
