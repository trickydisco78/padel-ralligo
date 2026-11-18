import { formatDateRange, inclusiveDays } from "./date-range";

describe("inclusiveDays", () => {
  it.each([
    ["2026-06-14", "2026-06-21", 8],
    ["2026-06-14", "2026-06-14", 1],
    ["2026-06-30", "2026-07-02", 3],
    ["2026-12-30", "2027-01-02", 4],
    ["2028-02-28", "2028-03-01", 3], // leap year
    ["2027-02-28", "2027-03-01", 2],
  ])("counts %s to %s as %i days", (start, end, days) => {
    expect(inclusiveDays(start, end)).toBe(days);
  });
});

describe("formatDateRange", () => {
  it.each([
    ["2026-06-14", "2026-06-14", "Jun 14"],
    ["2026-06-14", "2026-06-21", "Jun 14–21"],
    ["2026-06-28", "2026-07-03", "Jun 28 – Jul 3"],
    ["2026-12-30", "2027-01-02", "Dec 30, 2026 – Jan 2, 2027"],
  ])("writes %s to %s as %s", (start, end, text) => {
    expect(formatDateRange(start, end)).toBe(text);
  });
});
