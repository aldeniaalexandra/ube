import type {
  ExperienceConfig,
  Hemisphere,
  IdentityStyle,
  StatsPeriod,
} from "./types.js";

const DEFAULT_TARGET_BYTES = 2_000_000;
const DEFAULT_HARD_MAX_BYTES = 5_000_000;

export function createDefaultExperience(): ExperienceConfig {
  return {
    habitat: "moonlit-garden",
    calendar: { timezone: "UTC", hemisphere: "north" },
    stats: { period: "displayed-weeks", showStreak: true, showTotal: true },
    identity: {
      enabled: false,
      name: "",
      role: "",
      style: "quiet-label",
    },
    link: "",
    budget: {
      targetBytes: DEFAULT_TARGET_BYTES,
      hardMaxBytes: DEFAULT_HARD_MAX_BYTES,
    },
  };
}

export interface ExperienceInput {
  habitat?: unknown;
  calendar?: { timezone?: unknown; hemisphere?: unknown };
  stats?: {
    period?: unknown;
    showStreak?: unknown;
    showTotal?: unknown;
  };
  identity?: {
    enabled?: unknown;
    name?: unknown;
    role?: unknown;
    style?: unknown;
  };
  link?: unknown;
  budget?: { targetBytes?: unknown; hardMaxBytes?: unknown };
}

export function normalizeExperience(
  input: ExperienceInput | undefined,
): ExperienceConfig {
  const defaults = createDefaultExperience();
  if (input === undefined) return defaults;

  const calendar = input.calendar;
  const stats = input.stats;
  const identity = input.identity;
  const budget = input.budget;

  return {
    habitat: "moonlit-garden",
    calendar: {
      timezone:
        typeof calendar?.timezone === "string"
          ? calendar.timezone
          : defaults.calendar.timezone,
      hemisphere: isHemisphere(calendar?.hemisphere)
        ? calendar.hemisphere
        : defaults.calendar.hemisphere,
    },
    stats: {
      period: isStatsPeriod(stats?.period)
        ? stats.period
        : defaults.stats.period,
      showStreak:
        typeof stats?.showStreak === "boolean"
          ? stats.showStreak
          : defaults.stats.showStreak,
      showTotal:
        typeof stats?.showTotal === "boolean"
          ? stats.showTotal
          : defaults.stats.showTotal,
    },
    identity: {
      enabled:
        typeof identity?.enabled === "boolean"
          ? identity.enabled
          : defaults.identity.enabled,
      name:
        typeof identity?.name === "string" ? identity.name : defaults.identity.name,
      role:
        typeof identity?.role === "string" ? identity.role : defaults.identity.role,
      style: isIdentityStyle(identity?.style)
        ? identity.style
        : defaults.identity.style,
    },
    link: typeof input.link === "string" ? input.link : defaults.link,
    budget: {
      targetBytes:
        typeof budget?.targetBytes === "number"
          ? budget.targetBytes
          : defaults.budget.targetBytes,
      hardMaxBytes:
        typeof budget?.hardMaxBytes === "number"
          ? budget.hardMaxBytes
          : defaults.budget.hardMaxBytes,
    },
  };
}

export function isHemisphere(value: unknown): value is Hemisphere {
  return value === "north" || value === "south";
}

export function isStatsPeriod(value: unknown): value is StatsPeriod {
  return value === "displayed-weeks" || value === "calendar-year";
}

export function isIdentityStyle(value: unknown): value is IdentityStyle {
  return value === "quiet-label" || value === "combined-sign";
}
