import type { PlayerFilters, PlayersPage } from './player';

export interface PlayerRepository {
  search(filters: PlayerFilters, offset: number): Promise<PlayersPage>;
}
