import {
  isTripActive,
  parseIsoDate,
  parseTime,
  toIsoDate,
  validateListing,
  validateProfile,
  validateSignUp,
  validateTrip,
  type ListingInput,
} from "./index";

const today = "2026-02-10";

const validListing: ListingInput = {
  destinationId: "d1",
  startDate: "2026-02-15",
  endDate: null,
  levelWanted: "Any",
  playersNeeded: 2,
  description: "Friendly doubles",
};

function errorsOf(result: ReturnType<typeof validateListing>) {
  return result.ok ? {} : result.errors;
}

describe("validateListing", () => {
  it("accepts a fixed match", () => {
    expect(validateListing(validListing, today)).toEqual({ ok: true });
  });

  it("accepts a loose invite with a date range", () => {
    expect(validateListing({ ...validListing, endDate: "2026-02-20" }, today)).toEqual({ ok: true });
  });

  it("accepts a start date of today", () => {
    expect(validateListing({ ...validListing, startDate: today }, today)).toEqual({ ok: true });
  });

  it("requires a destination", () => {
    expect(errorsOf(validateListing({ ...validListing, destinationId: null }, today))).toHaveProperty(
      "destinationId",
    );
  });

  it("requires a start date", () => {
    expect(errorsOf(validateListing({ ...validListing, startDate: null }, today))).toHaveProperty(
      "startDate",
    );
  });

  it("rejects a start date in the past", () => {
    expect(
      errorsOf(validateListing({ ...validListing, startDate: "2026-02-09" }, today)),
    ).toHaveProperty("startDate");
  });

  it("rejects an end date before the start date", () => {
    expect(
      errorsOf(validateListing({ ...validListing, endDate: "2026-02-14" }, today)),
    ).toHaveProperty("endDate");
  });

  it.each([0, 4, 1.5, -1])("rejects players needed of %s", (playersNeeded) => {
    expect(errorsOf(validateListing({ ...validListing, playersNeeded }, today))).toHaveProperty(
      "playersNeeded",
    );
  });

  it.each([1, 3])("accepts players needed of %s", (playersNeeded) => {
    expect(validateListing({ ...validListing, playersNeeded }, today)).toEqual({ ok: true });
  });

  it("requires players needed", () => {
    expect(
      errorsOf(validateListing({ ...validListing, playersNeeded: null }, today)),
    ).toHaveProperty("playersNeeded");
  });

  it("accepts a description of exactly 500 characters and rejects 501", () => {
    expect(validateListing({ ...validListing, description: "a".repeat(500) }, today)).toEqual({
      ok: true,
    });
    expect(
      errorsOf(validateListing({ ...validListing, description: "a".repeat(501) }, today)),
    ).toHaveProperty("description");
  });

  it("requires a level wanted", () => {
    expect(errorsOf(validateListing({ ...validListing, levelWanted: null }, today))).toHaveProperty(
      "levelWanted",
    );
  });

  it("reports several errors at once", () => {
    const errors = errorsOf(
      validateListing({ ...validListing, destinationId: null, playersNeeded: 9 }, today),
    );
    expect(Object.keys(errors).sort()).toEqual(["destinationId", "playersNeeded"]);
  });
});

describe("validateTrip", () => {
  it("accepts a valid trip", () => {
    expect(
      validateTrip({ destinationId: "d1", startDate: "2026-02-15", endDate: "2026-02-22" }),
    ).toEqual({ ok: true });
  });

  it("accepts a one-day trip", () => {
    expect(
      validateTrip({ destinationId: "d1", startDate: "2026-02-15", endDate: "2026-02-15" }),
    ).toEqual({ ok: true });
  });

  it("rejects an end date before the start date", () => {
    const result = validateTrip({
      destinationId: "d1",
      startDate: "2026-02-15",
      endDate: "2026-02-14",
    });
    expect(result.ok ? {} : result.errors).toHaveProperty("endDate");
  });

  it("requires destination and both dates", () => {
    const result = validateTrip({ destinationId: null, startDate: null, endDate: null });
    expect(result.ok ? [] : Object.keys(result.errors).sort()).toEqual([
      "destinationId",
      "endDate",
      "startDate",
    ]);
  });
});

describe("isTripActive", () => {
  it("is active until the end date has passed", () => {
    expect(isTripActive({ endDate: "2026-02-10" }, "2026-02-10")).toBe(true);
    expect(isTripActive({ endDate: "2026-02-09" }, "2026-02-10")).toBe(false);
  });
});

describe("validateProfile", () => {
  const valid = { displayName: "Leon", bio: "", skillTier: "Intermediate" as const };

  it("accepts a minimal profile", () => {
    expect(validateProfile(valid)).toEqual({ ok: true });
  });

  it.each(["", " ", "A"])("rejects a display name of %j", (displayName) => {
    const result = validateProfile({ ...valid, displayName });
    expect(result.ok ? {} : result.errors).toHaveProperty("displayName");
  });

  it("limits display name to 40 characters", () => {
    expect(validateProfile({ ...valid, displayName: "a".repeat(40) })).toEqual({ ok: true });
    const result = validateProfile({ ...valid, displayName: "a".repeat(41) });
    expect(result.ok ? {} : result.errors).toHaveProperty("displayName");
  });

  it("limits bio to 300 characters", () => {
    expect(validateProfile({ ...valid, bio: "a".repeat(300) })).toEqual({ ok: true });
    const result = validateProfile({ ...valid, bio: "a".repeat(301) });
    expect(result.ok ? {} : result.errors).toHaveProperty("bio");
  });

  it("limits home city to 80 characters", () => {
    expect(validateProfile({ ...valid, homeCity: "a".repeat(80) })).toEqual({ ok: true });
    const result = validateProfile({ ...valid, homeCity: "a".repeat(81) });
    expect(result.ok ? {} : result.errors).toHaveProperty("homeCity");
  });

  it("requires a skill tier", () => {
    const result = validateProfile({ ...valid, skillTier: null });
    expect(result.ok ? {} : result.errors).toHaveProperty("skillTier");
  });
});

describe("validateSignUp", () => {
  const valid = {
    email: "a@example.com",
    password: "12345678",
    termsAccepted: true,
    ageConfirmed: true,
  };

  it("accepts valid input, including an 8-character password", () => {
    expect(validateSignUp(valid)).toEqual({ ok: true });
  });

  it.each(["", "nope", "a@b", "a b@c.com", "@c.com"])("rejects the email %j", (email) => {
    const result = validateSignUp({ ...valid, email });
    expect(result.ok ? {} : result.errors).toHaveProperty("email");
  });

  it("rejects a 7-character password", () => {
    const result = validateSignUp({ ...valid, password: "1234567" });
    expect(result.ok ? {} : result.errors).toHaveProperty("password");
  });

  it("requires the terms and the age confirmation separately", () => {
    const terms = validateSignUp({ ...valid, termsAccepted: false });
    const age = validateSignUp({ ...valid, ageConfirmed: false });
    expect(terms.ok ? {} : terms.errors).toHaveProperty("termsAccepted");
    expect(terms.ok ? {} : terms.errors).not.toHaveProperty("ageConfirmed");
    expect(age.ok ? {} : age.errors).toHaveProperty("ageConfirmed");
  });
});

describe("parseIsoDate", () => {
  it.each(["2026-02-15", " 2026-02-15 ", "2028-02-29"])("accepts %j", (text) => {
    expect(parseIsoDate(text)).toBe(text.trim());
  });

  it.each(["", "15/02/2026", "2026-2-5", "2026-13-01", "2026-02-30", "2027-02-29", "abcd-ef-gh"])(
    "rejects %j",
    (text) => {
      expect(parseIsoDate(text)).toBeNull();
    },
  );
});

describe("toIsoDate", () => {
  it("formats local dates with zero padding", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toIsoDate(new Date(2026, 10, 25))).toBe("2026-11-25");
  });
});

describe("parseTime", () => {
  it.each(["00:00", "09:30", "23:59", " 18:00 "])("accepts %j", (text) => {
    expect(parseTime(text)).toBe(text.trim());
  });

  it.each(["", "9:30", "24:00", "12:60", "12-30", "noon"])("rejects %j", (text) => {
    expect(parseTime(text)).toBeNull();
  });
});
