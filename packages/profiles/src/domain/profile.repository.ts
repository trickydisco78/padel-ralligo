import type { SkillTier } from '@padel/core';

import type { Profile } from './profile';

/** `discoverable` is the switch; the repository decides the stored `discoverable_at` timestamp from it. */
export type SaveProfileInput = Omit<Profile, 'skillTier' | 'discoverableAt'> & {
  skillTier: SkillTier;
  discoverable: boolean;
};

export interface ProfileRepository {
  get(userId: string): Promise<Profile | null>;
  /** Creates or updates the user's profile and their padel skill tier. */
  save(userId: string, input: SaveProfileInput): Promise<void>;
  /** A profile is complete once it exists and has a skill tier. */
  isComplete(userId: string): Promise<boolean>;
}
