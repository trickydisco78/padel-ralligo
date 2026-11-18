import type { DiscoverListing, MyListing, NewListing } from './listing';

export interface ListingRepository {
  create(userId: string, listing: NewListing): Promise<void>;
  update(id: string, listing: NewListing): Promise<void>;
  close(id: string): Promise<void>;
  /** The poster's own listings, soonest first. */
  listMine(userId: string): Promise<MyListing[]>;
  /** Open, current listings from every poster, soonest first. */
  listDiscoverable(): Promise<DiscoverListing[]>;
  /** One open, current listing by id, or null when it is closed, past or does not exist. */
  getDiscoverable(id: string): Promise<DiscoverListing | null>;
}
