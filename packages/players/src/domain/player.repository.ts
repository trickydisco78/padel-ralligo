import type { IsoDate } from '@padel/core';

import type { OverlapFilters, OverlapPage, PlayerFilters, PlayersPage } from './player';

export interface PlayerRepository {
  search(filters: PlayerFilters, offset: number): Promise<PlayersPage>;
  /** Players overlapping one of the signed-in member's trips; `today` is the device's date. */
  searchOverlapping(tripId: string, filters: OverlapFilters, offset: number, today: IsoDate): Promise<OverlapPage>;
}
