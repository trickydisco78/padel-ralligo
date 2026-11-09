import type { IsoDate, Listing, SkillTier } from "./types";

/** A listing with no end date occupies only its start date. */
export function listingEnd(listing: Pick<Listing, "startDate" | "endDate">): IsoDate {
  return listing.endDate ?? listing.startDate;
}

/** Inclusive overlap of two date ranges. */
export function datesOverlap(
  aStart: IsoDate,
  aEnd: IsoDate,
  bStart: IsoDate,
  bEnd: IsoDate,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export type ListingFilters = {
  destinationId?: string | null;
  startDate?: IsoDate | null;
  endDate?: IsoDate | null;
  level?: SkillTier | null;
};

export type Filterable = Pick<Listing, "destinationId" | "startDate" | "endDate" | "levelWanted">;

export function matchesFilters(listing: Filterable, filters: ListingFilters): boolean {
  if (filters.destinationId && listing.destinationId !== filters.destinationId) return false;

  const end = listingEnd(listing);
  if (filters.startDate && end < filters.startDate) return false;
  if (filters.endDate && listing.startDate > filters.endDate) return false;

  if (filters.level && listing.levelWanted !== "Any" && listing.levelWanted !== filters.level) {
    return false;
  }

  return true;
}

/** Open, current listings (not past, not closed), soonest first. */
export function currentListings(listings: Listing[], today: IsoDate): Listing[] {
  return listings
    .filter((l) => l.status === "open" && listingEnd(l) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
