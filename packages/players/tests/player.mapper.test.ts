import { toPlayer, toTotal } from '../src/infrastructure/player.mapper';

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
