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

export function validateProfile(input: ProfileInput): ValidationResult {
  const errors: FieldErrors = {};
  const name = input.displayName.trim();

  if (name.length < MIN_DISPLAY_NAME_LENGTH || name.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.displayName = `Name must be ${MIN_DISPLAY_NAME_LENGTH} to ${MAX_DISPLAY_NAME_LENGTH} characters`;
  }

  if ((input.homeCity ?? '').length > MAX_HOME_CITY_LENGTH) {
    errors.homeCity = `Home city must be ${MAX_HOME_CITY_LENGTH} characters or fewer`;
  }

  if (input.bio.length > MAX_BIO_LENGTH) {
    errors.bio = `Bio must be ${MAX_BIO_LENGTH} characters or fewer`;
  }

  if (!input.skillTier || !SKILL_TIERS.includes(input.skillTier)) {
    errors.skillTier = 'Choose a skill level';
  }

  return validationResult(errors);
}
