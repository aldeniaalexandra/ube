import type { ContributionLevel, RawContributionDay } from "./types.js";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const DEFAULT_TIMEOUT_MS = 10_000;
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

const CONTRIBUTION_QUERY = `
  query UbeContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

export interface FetchContributionOptions {
  username: string;
  token: string;
  from: string;
  to: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function fetchContributionDays(
  options: FetchContributionOptions,
): Promise<RawContributionDay[]> {
  validateOptions(options);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let response: Response;
  try {
    response = await fetchImpl(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
        "User-Agent": "ube-contribution-companion",
      },
      body: JSON.stringify({
        query: CONTRIBUTION_QUERY,
        variables: {
          login: options.username,
          from: options.from,
          to: options.to,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(`GitHub request timed out after ${timeoutMs} ms`);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`GitHub request failed: ${message}`);
  }

  assertSuccessfulStatus(response);
  const payload = await readJson(response);
  return extractContributionDays(payload, options.username);
}

function validateOptions(options: FetchContributionOptions): void {
  if (!USERNAME_PATTERN.test(options.username)) {
    throw new Error("GitHub username is invalid");
  }
  if (options.token.trim().length === 0) {
    throw new Error("GitHub token is required");
  }
  if (!Number.isInteger(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) || (options.timeoutMs ?? DEFAULT_TIMEOUT_MS) < 1) {
    throw new Error("GitHub timeout must be a positive integer");
  }
}

function assertSuccessfulStatus(response: Response): void {
  if (response.ok) return;
  if (response.status === 401) {
    throw new Error("GitHub authentication failed");
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub rate limit or permission error");
  }
  throw new Error(`GitHub request failed with status ${response.status}`);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new Error("GitHub returned malformed JSON");
  }
}

function extractContributionDays(
  payload: unknown,
  username: string,
): RawContributionDay[] {
  const root = requireObject(payload, "GitHub response");
  if (Array.isArray(root.errors) && root.errors.length > 0) {
    const messages = root.errors.map(readGraphqlError).join("; ");
    throw new Error(`GitHub GraphQL error: ${messages}`);
  }

  const data = requireObject(root.data, "GitHub response.data");
  if (data.user === null) {
    throw new Error(`GitHub user '${username}' was not found`);
  }

  const user = requireObject(data.user, "GitHub response.data.user");
  const collection = requireObject(
    user.contributionsCollection,
    "GitHub contributionsCollection",
  );
  const calendar = requireObject(
    collection.contributionCalendar,
    "GitHub contributionCalendar",
  );
  if (!Array.isArray(calendar.weeks)) {
    throw new Error("GitHub contributionCalendar.weeks must be an array");
  }

  const days: RawContributionDay[] = [];
  for (const [weekIndex, weekValue] of calendar.weeks.entries()) {
    const week = requireObject(weekValue, `GitHub weeks[${weekIndex}]`);
    if (!Array.isArray(week.contributionDays)) {
      throw new Error(`GitHub weeks[${weekIndex}].contributionDays must be an array`);
    }
    for (const [dayIndex, dayValue] of week.contributionDays.entries()) {
      days.push(readContributionDay(dayValue, weekIndex, dayIndex));
    }
  }
  return days;
}

function readContributionDay(
  value: unknown,
  weekIndex: number,
  dayIndex: number,
): RawContributionDay {
  const path = `GitHub weeks[${weekIndex}].contributionDays[${dayIndex}]`;
  const day = requireObject(value, path);
  if (typeof day.date !== "string") {
    throw new Error(`${path}.date must be a string`);
  }
  if (!Number.isInteger(day.contributionCount) || (day.contributionCount as number) < 0) {
    throw new Error(`${path}.contributionCount must be a non-negative integer`);
  }
  if (typeof day.contributionLevel !== "string") {
    throw new Error(`${path}.contributionLevel must be a string`);
  }

  return {
    date: day.date,
    count: day.contributionCount as number,
    level: mapLevel(day.contributionLevel),
  };
}

function mapLevel(value: string): ContributionLevel {
  const levels: Record<string, ContributionLevel> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };
  const level = levels[value];
  if (level === undefined) {
    throw new Error(`GitHub returned unknown contribution level '${value}'`);
  }
  return level;
}

function readGraphqlError(value: unknown): string {
  if (value !== null && typeof value === "object" && "message" in value) {
    const message = (value as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "unknown GraphQL error";
}

function requireObject(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function isTimeoutError(value: unknown): boolean {
  return value instanceof Error && (value.name === "TimeoutError" || value.name === "AbortError");
}
