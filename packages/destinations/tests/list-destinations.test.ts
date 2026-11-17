import { listDestinations } from '../src/application/list-destinations';
import type { DestinationWithCount } from '../src/domain/destination';
import type { DestinationRepository } from '../src/domain/destination.repository';

const dest = (name: string): DestinationWithCount => ({
  id: name.toLowerCase(),
  name,
  country: 'Spain',
  tagline: '',
  openListings: 0,
});

describe('listDestinations', () => {
  it('returns the repository destinations alphabetically', async () => {
    const repository: DestinationRepository = { list: async () => [dest('Tenerife'), dest('Barcelona'), dest('Marbella')] };
    const names = (await listDestinations(repository)).map((d) => d.name);
    expect(names).toEqual(['Barcelona', 'Marbella', 'Tenerife']);
  });

  it('does not mutate the list the repository returned', async () => {
    const original = [dest('Tenerife'), dest('Barcelona')];
    await listDestinations({ list: async () => original });
    expect(original.map((d) => d.name)).toEqual(['Tenerife', 'Barcelona']);
  });

  it('propagates repository failures', async () => {
    const failing: DestinationRepository = { list: async () => Promise.reject(new Error('down')) };
    await expect(listDestinations(failing)).rejects.toThrow('down');
  });
});
