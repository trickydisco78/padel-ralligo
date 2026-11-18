import type { IsoDate, SkillTier } from '@padel/core';

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

/** A player who shares a destination and dates with one of the member's trips. */
export type OverlapPlayer = Player & { tripStart: IsoDate; tripEnd: IsoDate; overlapDays: number };

export type OverlapFilters = { myLevel: boolean; thisWeek: boolean; query: string };

export type OverlapPage = { players: OverlapPlayer[]; total: number };
