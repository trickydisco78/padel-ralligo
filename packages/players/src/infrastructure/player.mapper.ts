import { SKILL_TIERS, type SkillTier } from '@padel/core';

import type { Player } from '../domain/player';

export type PlayerRow = {
  player_id?: string | null;
  display_name?: string | null;
  destination_id?: string | null;
  destination_name?: string | null;
  skill_tier?: string | null;
  total_count?: number | string | null;
};

const isTier = (value: unknown): value is SkillTier => (SKILL_TIERS as readonly unknown[]).includes(value);

/** Maps an RPC row to a player; rows with an unknown tier or missing fields are dropped. */
export function toPlayer(row: PlayerRow): Player | null {
  if (!isTier(row.skill_tier)) return null;
  if (row.display_name == null || row.destination_id == null || row.destination_name == null) return null;
  return {
    id: row.player_id ?? null,
    displayName: row.display_name,
    destinationId: row.destination_id,
    destinationName: row.destination_name,
    skillTier: row.skill_tier,
  };
}

/** `total_count` is a bigint in Postgres and may arrive as a string. */
export function toTotal(rows: PlayerRow[]): number {
  const n = Number(rows[0]?.total_count ?? 0);
  return Number.isFinite(n) ? n : 0;
}
