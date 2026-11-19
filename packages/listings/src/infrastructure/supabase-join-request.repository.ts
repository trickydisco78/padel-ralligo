import type { TypedSupabaseClient } from '@padel/supabase';

import { joinErrorCode, JoinRequestError } from '../domain/join-request';
import type { JoinRequestRepository } from '../domain/join-request.repository';
import { toMatchPeople } from './join-request.mapper';

/** Postgres error code for a value that is not valid for its type, such as a malformed uuid. */
const INVALID_TEXT_REPRESENTATION = '22P02';

function fail(error: { message: string }): never {
  throw new JoinRequestError(joinErrorCode(error));
}

/**
 * Every call goes through a database function that checks the caller, the match and its capacity. The
 * table cannot be written directly, so there is nothing else to call.
 */
export function createSupabaseJoinRequestRepository(client: TypedSupabaseClient): JoinRequestRepository {
  return {
    async getPeople(listingId) {
      const { data, error } = await client.rpc('match_people', { p_listing: listingId });
      // A malformed id (a mistyped or stale link) cannot match anything: "not found", not a failure.
      if ((error as { code?: string } | null)?.code === INVALID_TEXT_REPRESENTATION) return null;
      if (error) fail(error);
      return toMatchPeople(data ?? []);
    },

    async request(listingId) {
      const { error } = await client.rpc('request_to_join', { p_listing: listingId });
      if (error) fail(error);
    },

    async withdraw(listingId) {
      const { error } = await client.rpc('withdraw_join_request', { p_listing: listingId });
      if (error) fail(error);
    },

    async decide(requestId, accept) {
      const { error } = await client.rpc('decide_join_request', { p_request: requestId, p_accept: accept });
      if (error) fail(error);
    },
  };
}
