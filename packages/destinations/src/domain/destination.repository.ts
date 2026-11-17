import type { DestinationWithCount } from './destination';

export interface DestinationRepository {
  list(): Promise<DestinationWithCount[]>;
}
