import { matchesSearchText } from "./index";

describe("matchesSearchText", () => {
  it("matches everything for an empty or blank query", () => {
    expect(matchesSearchText("", "Marbella")).toBe(true);
    expect(matchesSearchText("   ", "Marbella")).toBe(true);
    expect(matchesSearchText("", undefined)).toBe(true);
  });

  it("matches case-insensitively and by substring", () => {
    expect(matchesSearchText("MARB", "Marbella")).toBe(true);
    expect(matchesSearchText("bella", "Marbella")).toBe(true);
    expect(matchesSearchText("xyz", "Marbella")).toBe(false);
  });

  it("ignores accents in either direction", () => {
    expect(matchesSearchText("malaga", "Málaga")).toBe(true);
    expect(matchesSearchText("Málaga", "Malaga")).toBe(true);
  });

  it("looks across all fields and requires every word", () => {
    expect(matchesSearchText("marbella spain", "Marbella", "Spain")).toBe(true);
    expect(matchesSearchText("marbella portugal", "Marbella", "Spain")).toBe(false);
    expect(matchesSearchText("club", "Marbella", null, "Padel Club")).toBe(true);
  });

  it("does not match when there is nothing to search", () => {
    expect(matchesSearchText("padel", null, undefined)).toBe(false);
  });
});
