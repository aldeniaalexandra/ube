export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface RawContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
}

export interface ContributionDay extends RawContributionDay {}

export interface ContributionCalendar {
  startDate: string;
  endDate: string;
  weeks: readonly (readonly ContributionDay[])[];
}
