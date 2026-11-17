import type { SkillTier } from '@padel/core';

import type { Profile } from './profile';

export type SaveProfileInput = Omit<Profile, 'skillTier'> & { skillTier: SkillTier };

export interface ProfileRepository {
  get(userId: string): Promise<Profile | null>;
  /** Creates or updates the user's profile and their padel skill tier. */
  save(userId: string, input: SaveProfileInput): Promise<void>;
  /** A profile is complete once it exists and has a skill tier. */
  isComplete(userId: string): Promise<boolean>;
}
