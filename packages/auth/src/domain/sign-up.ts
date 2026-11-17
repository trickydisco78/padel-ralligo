import { validationResult, type FieldErrors, type ValidationResult } from '@padel/core';

export const MIN_PASSWORD_LENGTH = 8;

export type SignUpInput = {
  email: string;
  password: string;
  termsAccepted: boolean;
  ageConfirmed: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignUp(input: SignUpInput): ValidationResult {
  const errors: FieldErrors = {};

  if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = 'Enter a valid email address';
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!input.termsAccepted) errors.termsAccepted = 'You need to accept the terms';
  if (!input.ageConfirmed) errors.ageConfirmed = 'You need to confirm you are 18 or over';

  return validationResult(errors);
}
