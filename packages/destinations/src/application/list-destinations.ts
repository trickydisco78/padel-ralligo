import type { DestinationWithCount } from '../domain/destination';
import type { DestinationRepository } from '../domain/destination.repository';

/** All destinations, alphabetically by name, as the app always presents them. */
export async function listDestinations(repository: DestinationRepository): Promise<DestinationWithCount[]> {
  const destinations = await repository.list();
  return [...destinations].sort((a, b) => a.name.localeCompare(b.name));
}
