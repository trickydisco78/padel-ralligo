import { validationResult, type FieldErrors, type ValidationResult } from '@padel/core';

export const MIN_PASSWORD_LENGTH = 8;

export type SignUpInput = {
  email: string;
  password: string;
  termsAccepted: boolean;
  ageConfirmed: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field errors are translation keys in the `auth` namespace; `validation.passwordLength` takes `{ min: MIN_PASSWORD_LENGTH }`. */
export function validateSignUp(input: SignUpInput): ValidationResult {
  const errors: FieldErrors = {};

  if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = 'validation.email';
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'validation.passwordLength';
  }
  if (!input.termsAccepted) errors.termsAccepted = 'validation.terms';
  if (!input.ageConfirmed) errors.ageConfirmed = 'validation.age';

  return validationResult(errors);
}
