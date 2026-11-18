import type { SkillTier } from '@padel/core';

/** A listed player as shown publicly. `id` is null for guests; `displayName` is already abbreviated ("Jordi M."). */
export type Player = {
  id: string | null;
  displayName: string;
  destinationId: string;
  destinationName: string;
  skillTier: SkillTier;
};

export type PlayerFilters = {
  destinationId: string | null;
  level: SkillTier | null;
  query: string;
};

export type PlayersPage = { players: Player[]; total: number };
