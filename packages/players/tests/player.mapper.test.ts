import { toOverlapPlayer, toPlayer, toTotal } from '../src/infrastructure/player.mapper';

const row = {
  player_id: 'p1',
  display_name: 'Jordi M.',
  destination_id: 'd1',
  destination_name: 'Marbella',
  skill_tier: 'Advanced',
  total_count: 3,
};

describe('toPlayer', () => {
  it('maps a valid row', () => {
    expect(toPlayer(row)).toEqual({
      id: 'p1',
      displayName: 'Jordi M.',
      destinationId: 'd1',
      destinationName: 'Marbella',
      skillTier: 'Advanced',
    });
  });
  it('drops an unknown tier', () => {
    expect(toPlayer({ ...row, skill_tier: 'Pro' })).toBeNull();
  });
  it('tolerates a null id', () => {
    expect(toPlayer({ ...row, player_id: null })?.id).toBeNull();
  });
});

describe('toTotal', () => {
  it('converts a string total', () => expect(toTotal([{ ...row, total_count: '120' }])).toBe(120));
  it('is zero without rows', () => expect(toTotal([])).toBe(0));
});

describe('toOverlapPlayer', () => {
  const overlapRow = { ...row, trip_start: '2026-06-17', trip_end: '2026-06-23', overlap_days: '5' };

  it('maps a valid row, keeping the ISO dates and converting the days', () => {
    expect(toOverlapPlayer(overlapRow)).toEqual({
      id: 'p1',
      displayName: 'Jordi M.',
      destinationId: 'd1',
      destinationName: 'Marbella',
      skillTier: 'Advanced',
      tripStart: '2026-06-17',
      tripEnd: '2026-06-23',
      overlapDays: 5,
    });
  });
  it('drops an unknown tier', () => expect(toOverlapPlayer({ ...overlapRow, skill_tier: 'Pro' })).toBeNull());
  it('drops rows without dates or days', () => {
    expect(toOverlapPlayer({ ...overlapRow, trip_start: null })).toBeNull();
    expect(toOverlapPlayer({ ...overlapRow, trip_end: null })).toBeNull();
    expect(toOverlapPlayer({ ...overlapRow, overlap_days: null })).toBeNull();
  });
});
