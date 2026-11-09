export const SKILL_TIERS = ["Beginner", "Intermediate", "Advanced"] as const;
export type SkillTier = (typeof SKILL_TIERS)[number];

export const LEVELS_WANTED = ["Any", ...SKILL_TIERS] as const;
export type LevelWanted = (typeof LEVELS_WANTED)[number];

export type Sport = "padel";

/** Calendar date as `YYYY-MM-DD`. */
export type IsoDate = string;

export type Destination = {
  id: string;
  name: string;
  country: string;
  tagline: string;
};

export type ListingStatus = "open" | "closed";

export type Listing = {
  id: string;
  posterId: string;
  destinationId: string;
  sport: Sport;
  startDate: IsoDate;
  endDate: IsoDate | null;
  startTime: string | null;
  venue: string | null;
  levelWanted: LevelWanted;
  playersNeeded: number;
  description: string;
  status: ListingStatus;
};

export type Trip = {
  destinationId: string;
  startDate: IsoDate;
  endDate: IsoDate;
};
