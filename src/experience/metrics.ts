import type { ContributionCalendar, ContributionDay } from "../contributions/types.js";
import type { ActivityMetrics } from "./types.js";

const RECENT_ACTIVITY_DAYS = 14;

export function calculateActivityMetrics(
  calendar: ContributionCalendar,
): ActivityMetrics {
  const days = flattenDays(calendar);
  const currentStreak = countCurrentStreak(days);
  const displayedTotal = days.reduce((total, day) => total + day.count, 0);
  const endYear = Number(calendar.endDate.slice(0, 4));
  const calendarYearTotal = days
    .filter((day) => day.date.startsWith(`${endYear}-`))
    .reduce((total, day) => total + day.count, 0);
  const recentDays = days.slice(-RECENT_ACTIVITY_DAYS);
  const recentActivityRatio = recentDays.length === 0
    ? 0
    : recentDays.filter((day) => day.count > 0).length / recentDays.length;

  return {
    currentStreak,
    displayedTotal,
    calendarYearTotal,
    recentActivityRatio,
  };
}

function flattenDays(calendar: ContributionCalendar): ContributionDay[] {
  return calendar.weeks.flatMap((week) => [...week]);
}

function countCurrentStreak(days: readonly ContributionDay[]): number {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if ((days[index]?.count ?? 0) === 0) break;
    streak += 1;
  }
  return streak;
}
