import type { Hemisphere, Season } from "./types.js";

export function seasonForDate(date: string, hemisphere: Hemisphere): Season {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const northern = northernSeason(month, day);
  if (hemisphere === "north") return northern;
  return invertSeason(northern);
}

function northernSeason(month: number, day: number): Season {
  const monthDay = month * 100 + day;
  if (monthDay >= 321 && monthDay < 621) return "spring";
  if (monthDay >= 621 && monthDay < 923) return "summer";
  if (monthDay >= 923 && monthDay < 1221) return "autumn";
  return "winter";
}

function invertSeason(season: Season): Season {
  if (season === "spring") return "autumn";
  if (season === "summer") return "winter";
  if (season === "autumn") return "spring";
  return "summer";
}
