import type {
  ContributionCalendar,
  ContributionDay,
  ContributionLevel,
  RawContributionDay,
} from "./types.js";

const DAYS_PER_WEEK = 7;
const DISPLAY_WEEKS = 53;
const DISPLAY_DAYS = DAYS_PER_WEEK * DISPLAY_WEEKS;
const MILLISECONDS_PER_DAY = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function normalizeCalendar(
  days: readonly RawContributionDay[],
  endDate: string,
): ContributionCalendar {
  const endTimestamp = parseDate(endDate, "calendar end date");
  const byDate = validateDays(days);
  const endDayOfWeek = new Date(endTimestamp).getUTCDay();
  const startTimestamp =
    endTimestamp -
    (endDayOfWeek + (DISPLAY_WEEKS - 1) * DAYS_PER_WEEK) * MILLISECONDS_PER_DAY;

  const weeks: ContributionDay[][] = [];
  for (let weekIndex = 0; weekIndex < DISPLAY_WEEKS; weekIndex += 1) {
    const week: ContributionDay[] = [];
    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
      const offset = weekIndex * DAYS_PER_WEEK + dayIndex;
      const timestamp = startTimestamp + offset * MILLISECONDS_PER_DAY;
      const date = formatDate(timestamp);
      const source = timestamp <= endTimestamp ? byDate.get(date) : undefined;
      week.push(
        Object.freeze(
          source ?? {
            date,
            count: 0,
            level: 0 as const,
          },
        ),
      );
    }
    weeks.push(Object.freeze(week) as ContributionDay[]);
  }

  if (weeks.length * DAYS_PER_WEEK !== DISPLAY_DAYS) {
    throw new Error("calendar normalization produced an invalid display size");
  }

  return Object.freeze({
    startDate: formatDate(startTimestamp),
    endDate: formatDate(endTimestamp),
    weeks: Object.freeze(weeks),
  });
}

function validateDays(
  days: readonly RawContributionDay[],
): Map<string, ContributionDay> {
  const byDate = new Map<string, ContributionDay>();
  for (const day of days) {
    parseDate(day.date, "contribution date");
    if (byDate.has(day.date)) {
      throw new Error(`duplicate contribution date ${day.date}`);
    }
    if (!Number.isInteger(day.count) || day.count < 0) {
      throw new Error(`invalid contribution count for ${day.date}`);
    }
    if (!isContributionLevel(day.level)) {
      throw new Error(`invalid contribution level for ${day.date}`);
    }
    byDate.set(day.date, Object.freeze({ ...day }));
  }
  return byDate;
}

function isContributionLevel(value: number): value is ContributionLevel {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}

function parseDate(value: string, label: string): number {
  const match = DATE_PATTERN.exec(value);
  if (match === null) {
    throw new Error(`invalid ${label} ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);

  if (year < 1970 || formatDate(timestamp) !== value) {
    throw new Error(`invalid ${label} ${value}`);
  }
  return timestamp;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}
