import { goToIntent } from '@/session/intent-routes';

function navigator() {
  return { navigate: jest.fn(), push: jest.fn() };
}

describe('goToIntent', () => {
  it('pushes the match for a join intent, so back returns to where the user is', () => {
    const nav = navigator();
    goToIntent(nav, { type: 'joinMatch', matchId: 'm1' }, '/');
    expect(nav.push).toHaveBeenCalledWith('/match/m1');
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('does nothing for a join intent when the user is already on that match', () => {
    const nav = navigator();
    goToIntent(nav, { type: 'joinMatch', matchId: 'm1' }, '/match/m1');
    expect(nav.push).not.toHaveBeenCalled();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('still pushes when the user is on a different match', () => {
    const nav = navigator();
    goToIntent(nav, { type: 'joinMatch', matchId: 'm1' }, '/match/m2');
    expect(nav.push).toHaveBeenCalledWith('/match/m1');
  });

  it.each([
    [{ type: 'connectPlayer' }, '/discover?view=players'],
    [{ type: 'createMatch' }, '/create'],
    [{ type: 'openMessages' }, '/matches'],
    [{ type: 'openPersonalMatches' }, '/matches'],
    [{ type: 'openProfile' }, '/profile'],
  ] as const)('opens the right tab for %j', (intent, route) => {
    const nav = navigator();
    goToIntent(nav, intent);
    expect(nav.navigate).toHaveBeenCalledWith(route);
    expect(nav.push).not.toHaveBeenCalled();
  });
});
