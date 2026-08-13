import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("static customizer", () => {
  it("ships a Pages shell with the shared preview entry", () => {
    expect(existsSync("site/index.html")).toBe(true);
    expect(existsSync("site/styles.css")).toBe(true);
    expect(existsSync("site/app.js")).toBe(true);
    expect(readFileSync("site/index.html", "utf8")).toContain("Ube Moonlit Garden");
    expect(readFileSync("site/app.js", "utf8")).toContain("Moonlit Garden customizer");
  });
});
