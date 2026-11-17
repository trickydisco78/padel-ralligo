import type { Trip } from './trip';

export interface TripRepository {
  get(userId: string): Promise<Trip | null>;
  save(userId: string, trip: Trip): Promise<void>;
  clear(userId: string): Promise<void>;
}
