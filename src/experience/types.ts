export type Hemisphere = "north" | "south";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type StatsPeriod = "displayed-weeks" | "calendar-year";
export type IdentityStyle = "quiet-label" | "combined-sign";
export type Vignette =
  | "water"
  | "read"
  | "nap"
  | "fireflies"
  | "rain-watch"
  | "puddle-hop"
  | "celebrate";
export type Weather = "clear" | "clouds" | "rain" | "mist";

export interface ExperienceConfig {
  habitat: "moonlit-garden";
  calendar: {
    timezone: string;
    hemisphere: Hemisphere;
  };
  stats: {
    period: StatsPeriod;
    showStreak: boolean;
    showTotal: boolean;
  };
  identity: {
    enabled: boolean;
    name: string;
    role: string;
    style: IdentityStyle;
  };
  link: string;
  budget: {
    targetBytes: number;
    hardMaxBytes: number;
  };
}

export interface ActivityMetrics {
  currentStreak: number;
  displayedTotal: number;
  calendarYearTotal: number;
  recentActivityRatio: number;
}

export interface ScenePlan {
  season: Season;
  weather: Weather;
  vignette: Vignette;
  metrics: ActivityMetrics;
  identity: ExperienceConfig["identity"];
  seed: number;
}
