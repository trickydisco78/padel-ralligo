import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

export { supabase } from './client';
export type { Database } from './database.types';
export type { Session, User } from '@supabase/supabase-js';

/** The client type, for repositories that take the client as a parameter. */
export type TypedSupabaseClient = SupabaseClient<Database>;
