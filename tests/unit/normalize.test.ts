import { describe, expect, it } from "vitest";
import { normalizeCalendar } from "../../src/contributions/normalize.js";
import type { RawContributionDay } from "../../src/contributions/types.js";

describe("normalizeCalendar", () => {
  it("returns 53 Sunday-aligned weeks and fills absent dates", () => {
    const calendar = normalizeCalendar(
      [{ date: "2026-08-13", count: 3, level: 2 }],
      "2026-08-13",
    );

    expect(calendar.startDate).toBe("2025-08-10");
    expect(calendar.endDate).toBe("2026-08-13");
    expect(calendar.weeks).toHaveLength(53);
    expect(calendar.weeks.every((week) => week.length === 7)).toBe(true);
    expect(calendar.weeks.at(-1)?.[4]).toEqual({
      date: "2026-08-13",
      count: 3,
      level: 2,
    });
    expect(calendar.weeks.at(-1)?.[5]).toEqual({
      date: "2026-08-14",
      count: 0,
      level: 0,
    });
  });

  it("rejects duplicate contribution dates", () => {
    const day: RawContributionDay = {
      date: "2026-08-13",
      count: 1,
      level: 1,
    };

    expect(() => normalizeCalendar([day, day], "2026-08-13")).toThrow(
      "duplicate contribution date 2026-08-13",
    );
  });

  it("rejects impossible calendar dates", () => {
    expect(() =>
      normalizeCalendar(
        [{ date: "2026-02-31", count: 1, level: 1 }],
        "2026-08-13",
      ),
    ).toThrow("invalid contribution date 2026-02-31");
  });
});
