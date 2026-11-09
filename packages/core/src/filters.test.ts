import { currentListings, datesOverlap, matchesFilters, type Listing } from "./index";

function listing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    posterId: "p1",
    destinationId: "marbella",
    sport: "padel",
    startDate: "2026-02-20",
    endDate: "2026-02-25",
    startTime: null,
    venue: null,
    levelWanted: "Intermediate",
    playersNeeded: 2,
    description: "",
    status: "open",
    ...overrides,
  };
}

describe("datesOverlap", () => {
  it("overlaps when ranges intersect", () => {
    expect(datesOverlap("2026-02-15", "2026-02-22", "2026-02-20", "2026-02-25")).toBe(true);
  });

  it("overlaps when ranges only touch at one day", () => {
    expect(datesOverlap("2026-02-15", "2026-02-20", "2026-02-20", "2026-02-25")).toBe(true);
  });

  it("does not overlap when ranges are apart", () => {
    expect(datesOverlap("2026-02-01", "2026-02-10", "2026-02-11", "2026-02-12")).toBe(false);
  });
});

describe("matchesFilters", () => {
  it("matches everything when there are no filters", () => {
    expect(matchesFilters(listing(), {})).toBe(true);
  });

  it("filters by destination", () => {
    expect(matchesFilters(listing(), { destinationId: "marbella" })).toBe(true);
    expect(matchesFilters(listing(), { destinationId: "tenerife" })).toBe(false);
  });

  it("matches a 20-25 Feb listing against a 15-22 Feb filter", () => {
    expect(matchesFilters(listing(), { startDate: "2026-02-15", endDate: "2026-02-22" })).toBe(true);
  });

  it("does not match a listing that ends before the filter starts", () => {
    expect(matchesFilters(listing(), { startDate: "2026-02-26", endDate: "2026-03-01" })).toBe(
      false,
    );
  });

  it("does not match a listing that starts after the filter ends", () => {
    expect(matchesFilters(listing(), { startDate: "2026-02-01", endDate: "2026-02-19" })).toBe(
      false,
    );
  });

  it("treats a listing with no end date as a single day", () => {
    const single = listing({ startDate: "2026-02-20", endDate: null });
    expect(matchesFilters(single, { startDate: "2026-02-20", endDate: "2026-02-20" })).toBe(true);
    expect(matchesFilters(single, { startDate: "2026-02-21", endDate: "2026-02-28" })).toBe(false);
  });

  it("supports a filter with only a start date or only an end date", () => {
    expect(matchesFilters(listing(), { startDate: "2026-02-25" })).toBe(true);
    expect(matchesFilters(listing(), { startDate: "2026-02-26" })).toBe(false);
    expect(matchesFilters(listing(), { endDate: "2026-02-20" })).toBe(true);
    expect(matchesFilters(listing(), { endDate: "2026-02-19" })).toBe(false);
  });

  it("level filter matches the same level and Any, but not a different level", () => {
    expect(matchesFilters(listing({ levelWanted: "Intermediate" }), { level: "Intermediate" })).toBe(
      true,
    );
    expect(matchesFilters(listing({ levelWanted: "Any" }), { level: "Advanced" })).toBe(true);
    expect(matchesFilters(listing({ levelWanted: "Beginner" }), { level: "Advanced" })).toBe(false);
  });

  it("combines all filters", () => {
    expect(
      matchesFilters(listing(), {
        destinationId: "marbella",
        startDate: "2026-02-15",
        endDate: "2026-02-22",
        level: "Intermediate",
      }),
    ).toBe(true);
    expect(
      matchesFilters(listing(), { destinationId: "marbella", level: "Advanced" }),
    ).toBe(false);
  });
});

describe("currentListings", () => {
  const today = "2026-02-10";

  it("hides closed and past listings", () => {
    const result = currentListings(
      [
        listing({ id: "open" }),
        listing({ id: "closed", status: "closed" }),
        listing({ id: "past", startDate: "2026-02-01", endDate: "2026-02-09" }),
      ],
      today,
    );
    expect(result.map((l) => l.id)).toEqual(["open"]);
  });

  it("keeps a single-day listing that is today and one whose range includes today", () => {
    const result = currentListings(
      [
        listing({ id: "today", startDate: today, endDate: null }),
        listing({ id: "ongoing", startDate: "2026-02-08", endDate: "2026-02-12" }),
      ],
      today,
    );
    expect(result.map((l) => l.id).sort()).toEqual(["ongoing", "today"]);
  });

  it("orders by start date, soonest first", () => {
    const result = currentListings(
      [
        listing({ id: "c", startDate: "2026-03-01", endDate: null }),
        listing({ id: "a", startDate: "2026-02-11", endDate: null }),
        listing({ id: "b", startDate: "2026-02-20", endDate: null }),
      ],
      today,
    );
    expect(result.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });
});
