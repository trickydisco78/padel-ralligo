import { identityLine } from '../src/domain/identity-line';

describe('identityLine', () => {
  it('joins the skill tier and home city with a middle dot', () => {
    expect(identityLine({ tier: 'Intermediate', city: 'Málaga' })).toBe('Intermediate · Málaga');
  });

  it('shows only the part that exists', () => {
    expect(identityLine({ tier: 'Intermediate', city: '' })).toBe('Intermediate');
    expect(identityLine({ tier: undefined, city: 'Málaga' })).toBe('Málaga');
  });

  it('ignores blank text and trims the parts', () => {
    expect(identityLine({ tier: '  ', city: ' Málaga ' })).toBe('Málaga');
  });

  it('is empty when there is nothing to show', () => {
    expect(identityLine({ tier: undefined, city: '' })).toBe('');
  });
});
