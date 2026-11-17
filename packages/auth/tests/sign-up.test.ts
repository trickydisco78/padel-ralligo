import { validateSignUp } from '../src/domain/sign-up';

describe('validateSignUp', () => {
  const valid = {
    email: 'a@example.com',
    password: '12345678',
    termsAccepted: true,
    ageConfirmed: true,
  };

  it('accepts valid input, including an 8-character password', () => {
    expect(validateSignUp(valid)).toEqual({ ok: true });
  });

  it.each(['', 'nope', 'a@b', 'a b@c.com', '@c.com'])('rejects the email %j', (email) => {
    const result = validateSignUp({ ...valid, email });
    expect(result.ok ? {} : result.errors).toHaveProperty('email');
  });

  it('rejects a 7-character password', () => {
    const result = validateSignUp({ ...valid, password: '1234567' });
    expect(result.ok ? {} : result.errors).toHaveProperty('password');
  });

  it('requires the terms and the age confirmation separately', () => {
    const terms = validateSignUp({ ...valid, termsAccepted: false });
    const age = validateSignUp({ ...valid, ageConfirmed: false });
    expect(terms.ok ? {} : terms.errors).toHaveProperty('termsAccepted');
    expect(terms.ok ? {} : terms.errors).not.toHaveProperty('ageConfirmed');
    expect(age.ok ? {} : age.errors).toHaveProperty('ageConfirmed');
  });
});
