import {
  parseIsoDate,
  parseTime,
  toIsoDate,
} from "./index";

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
