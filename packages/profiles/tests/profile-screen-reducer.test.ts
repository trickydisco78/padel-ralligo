import { initialProfileScreenState, profileScreenReducer, type ProfileScreenEvent } from '../src/domain/profile-screen';

const run = (events: ProfileScreenEvent[]) => events.reduce(profileScreenReducer, initialProfileScreenState);

describe('profileScreenReducer', () => {
  it('starts viewing', () => {
    expect(initialProfileScreenState).toEqual({ mode: 'viewing' });
  });

  it('edits when asked to', () => {
    expect(run([{ type: 'EDIT_STARTED' }]).mode).toBe('editing');
  });

  it('returns to viewing on cancel and on save', () => {
    expect(run([{ type: 'EDIT_STARTED' }, { type: 'EDIT_CANCELLED' }]).mode).toBe('viewing');
    expect(run([{ type: 'EDIT_STARTED' }, { type: 'EDIT_SAVED' }]).mode).toBe('viewing');
  });

  it('returns to viewing when the screen is left', () => {
    expect(run([{ type: 'EDIT_STARTED' }, { type: 'SCREEN_LEFT' }]).mode).toBe('viewing');
  });

  it('ignores cancel and save when not editing, and keeps the same state object', () => {
    const viewing = initialProfileScreenState;
    expect(profileScreenReducer(viewing, { type: 'EDIT_CANCELLED' })).toBe(viewing);
    expect(profileScreenReducer(viewing, { type: 'EDIT_SAVED' })).toBe(viewing);
    expect(profileScreenReducer(viewing, { type: 'SCREEN_LEFT' })).toBe(viewing);
  });

  it('ignores a second editStarted', () => {
    const editing = run([{ type: 'EDIT_STARTED' }]);
    expect(profileScreenReducer(editing, { type: 'EDIT_STARTED' })).toBe(editing);
  });
});
