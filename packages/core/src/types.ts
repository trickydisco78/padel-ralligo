export const SKILL_TIERS = ["Beginner", "Intermediate", "Advanced"] as const;
export type SkillTier = (typeof SKILL_TIERS)[number];

/** Calendar date as `YYYY-MM-DD`. */
export type IsoDate = string;
