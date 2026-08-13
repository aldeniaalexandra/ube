import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fetchContributionDays } from "../../src/contributions/github.js";

let githubFixture: unknown;

beforeAll(async () => {
  githubFixture = JSON.parse(
    await readFile(resolve("tests/fixtures/github-response.json"), "utf8"),
  ) as unknown;
});

function validOptions(fetchImpl: typeof fetch) {
  return {
    username: "aldeniaalexandra",
    token: "secret-token",
    from: "2025-08-10T00:00:00Z",
    to: "2026-08-13T23:59:59Z",
    fetchImpl,
  };
}

describe("fetchContributionDays", () => {
  it("maps GitHub levels and sends the requested date window", async () => {
    let requestInit: RequestInit | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      requestInit = init;
      return Response.json(githubFixture);
    }) as typeof fetch;

    const days = await fetchContributionDays(validOptions(fetchImpl));
    const body = JSON.parse(String(requestInit?.body)) as {
      query: string;
      variables: Record<string, string>;
    };

    expect(days).toEqual([
      { date: "2025-08-10", count: 0, level: 0 },
      { date: "2025-08-11", count: 4, level: 2 },
      { date: "2025-08-12", count: 9, level: 4 },
    ]);
    expect(body.variables).toEqual({
      login: "aldeniaalexandra",
      from: "2025-08-10T00:00:00Z",
      to: "2026-08-13T23:59:59Z",
    });
    expect(body.query).toContain("contributionLevel");
  });

  it("classifies rate limiting or missing permission", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 403 })) as typeof fetch;

    await expect(fetchContributionDays(validOptions(fetchImpl))).rejects.toThrow(
      "GitHub rate limit or permission error",
    );
  });

  it("reports a missing GitHub user", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ data: { user: null } }),
    ) as typeof fetch;

    await expect(fetchContributionDays(validOptions(fetchImpl))).rejects.toThrow(
      "GitHub user 'aldeniaalexandra' was not found",
    );
  });
});
