import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/load.js";
import { calculateActivityMetrics } from "../../src/experience/metrics.js";
import { planScene } from "../../src/experience/planner.js";
import { seasonForDate } from "../../src/experience/season.js";
import type { ContributionCalendar, ContributionDay } from "../../src/contributions/types.js";

function calendarWithDays(
  entries: Record<string, { count: number; level?: 0 | 1 | 2 | 3 | 4 }>,
): ContributionCalendar {
  const weeks: ContributionDay[][] = [];
  for (let weekIndex = 0; weekIndex < 53; weekIndex += 1) {
    const week: ContributionDay[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const dayOffset = weekIndex * 7 + dayIndex;
      const date = new Date(Date.UTC(2025, 11, 31 - (370 - dayOffset)))
        .toISOString()
        .slice(0, 10);
      const entry = entries[date];
      week.push({
        date,
        count: entry?.count ?? 0,
        level: entry?.level ?? (entry?.count ? 1 : 0),
      });
    }
    weeks.push(week);
  }
  return {
    startDate: weeks[0]?.[0]?.date ?? "2025-01-01",
    endDate: weeks.at(-1)?.at(-1)?.date ?? "2025-12-31",
    weeks,
  };
}

describe("calculateActivityMetrics", () => {
  it("calculates streak, displayed total, calendar-year total, and recent activity", () => {
    const calendar = calendarWithDays({
      "2025-12-29": { count: 4 },
      "2025-12-30": { count: 3 },
      "2025-12-31": { count: 2 },
      "2025-01-01": { count: 5 },
    });

    expect(calculateActivityMetrics(calendar)).toEqual({
      currentStreak: 3,
      displayedTotal: 14,
      calendarYearTotal: 14,
      recentActivityRatio: 3 / 14,
    });
  });
});

describe("seasonForDate", () => {
  it("inverts seasons for the southern hemisphere", () => {
    expect(seasonForDate("2025-07-15", "north")).toBe("summer");
    expect(seasonForDate("2025-07-15", "south")).toBe("winter");
  });
});

describe("planScene", () => {
  it("chooses a deterministic non-punitive vignette", async () => {
    const config = await loadConfig("ube.config.json");
    const calendar = calendarWithDays({});
    const first = planScene(calendar, config);
    const second = planScene(calendar, config);

    expect(second).toEqual(first);
    expect(["nap", "read", "rain-watch", "fireflies", "water", "puddle-hop", "celebrate"]).toContain(
      first.vignette,
    );
    expect(first.weather).not.toBe("rain");
  });
});
