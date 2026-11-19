import type { SkillTier } from '@padel/core';
import type { Database } from '@padel/supabase';

import type { JoinStatus, MatchPeople, PersonKind, ViewerRole } from '../domain/join-request';

export type MatchPeopleRow = Database['public']['Functions']['match_people']['Returns'][number];

/** The rows of `match_people` carry the same header on every row; an empty result means no such match. */
export function toMatchPeople(rows: readonly MatchPeopleRow[]): MatchPeople | null {
  const first = rows[0];
  if (!first) return null;
  return {
    viewerRole: first.viewer_role as ViewerRole,
    ownStatus: (first.own_status as JoinStatus | null) ?? null,
    playersNeeded: first.players_needed,
    acceptedCount: first.accepted_count,
    pendingCount: first.pending_count ?? 0,
    people: rows.map((row) => ({
      kind: row.person_kind as PersonKind,
      requestId: row.request_id ?? null,
      name: row.person_name,
      skillTier: (row.skill_tier as SkillTier | null) ?? null,
    })),
  };
}
