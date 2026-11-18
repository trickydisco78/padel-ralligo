import type { Trip, TripDraft, TripOverview } from './trip';

export interface TripRepository {
  list(userId: string): Promise<Trip[]>;
  create(userId: string, draft: TripDraft): Promise<void>;
  update(userId: string, id: string, draft: TripDraft): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
  overview(today: string): Promise<TripOverview[]>;
}
