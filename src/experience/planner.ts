import type { ResolvedConfig } from "../config/schema.js";
import type { ContributionCalendar } from "../contributions/types.js";
import { createDefaultExperience } from "./defaults.js";
import { calculateActivityMetrics } from "./metrics.js";
import { seasonForDate } from "./season.js";
import type { ScenePlan, Vignette, Weather } from "./types.js";

const ENGINE_VERSION = "moonlit-garden-1";

export function planScene(
  calendar: ContributionCalendar,
  config: ResolvedConfig,
): ScenePlan {
  const experience = config.experience ?? createDefaultExperience();
  const metrics = calculateActivityMetrics(calendar);
  const seed = hashSeed([
    config.github.username,
    calendar.endDate,
    experience.habitat,
    experience.calendar.timezone,
    experience.calendar.hemisphere,
    ENGINE_VERSION,
  ].join("|"));
  const restMode = metrics.recentActivityRatio < 0.15;
  const weather = chooseWeather(seed, metrics.recentActivityRatio, restMode);
  const vignette = chooseVignette(seed, metrics, restMode, weather);

  return Object.freeze({
    season: seasonForDate(calendar.endDate, experience.calendar.hemisphere),
    weather,
    vignette,
    metrics,
    identity: experience.identity,
    seed,
  });
}

function chooseWeather(
  seed: number,
  activityRatio: number,
  restMode: boolean,
): Weather {
  if (restMode) return seed % 2 === 0 ? "clouds" : "mist";
  if (activityRatio > 0.65) return seed % 4 === 0 ? "clear" : "clouds";
  return seed % 3 === 0 ? "rain" : "clouds";
}

function chooseVignette(
  seed: number,
  metrics: { currentStreak: number; recentActivityRatio: number },
  restMode: boolean,
  weather: Weather,
): Vignette {
  if (metrics.currentStreak > 0 && metrics.currentStreak % 7 === 0) {
    return "celebrate";
  }
  if (restMode) return seed % 2 === 0 ? "nap" : "read";
  if (weather === "rain") return seed % 2 === 0 ? "rain-watch" : "water";
  if (metrics.recentActivityRatio > 0.65) {
    return ["fireflies", "puddle-hop", "water"][seed % 3] as Vignette;
  }
  return seed % 2 === 0 ? "read" : "fireflies";
}

function hashSeed(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
