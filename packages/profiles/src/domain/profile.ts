import {
  SKILL_TIERS,
  validationResult,
  type FieldErrors,
  type SkillTier,
  type ValidationResult,
} from '@padel/core';

export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 40;
export const MAX_BIO_LENGTH = 300;
export const MAX_HOME_CITY_LENGTH = 80;

export type Profile = {
  displayName: string;
  homeCity: string;
  bio: string;
  skillTier: SkillTier | null;
};

export type ProfileInput = {
  displayName: string;
  homeCity?: string;
  bio: string;
  skillTier: SkillTier | null;
};

/**
 * Field errors are translation keys in the `profiles` namespace; `validation.nameLength` takes
 * `{ nameMin: MIN_DISPLAY_NAME_LENGTH, nameMax: MAX_DISPLAY_NAME_LENGTH }`, `validation.homeCityTooLong` takes
 * `{ homeCityMax: MAX_HOME_CITY_LENGTH }` and `validation.bioTooLong` takes `{ bioMax: MAX_BIO_LENGTH }`.
 */
export function validateProfile(input: ProfileInput): ValidationResult {
  const errors: FieldErrors = {};
  const name = input.displayName.trim();

  if (name.length < MIN_DISPLAY_NAME_LENGTH || name.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.displayName = 'validation.nameLength';
  }

  if ((input.homeCity ?? '').length > MAX_HOME_CITY_LENGTH) {
    errors.homeCity = 'validation.homeCityTooLong';
  }

  if (input.bio.length > MAX_BIO_LENGTH) {
    errors.bio = 'validation.bioTooLong';
  }

  if (!input.skillTier || !SKILL_TIERS.includes(input.skillTier)) {
    errors.skillTier = 'validation.skillTierRequired';
  }

  return validationResult(errors);
}
