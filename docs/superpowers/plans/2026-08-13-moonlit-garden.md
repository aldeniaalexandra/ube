# Moonlit Garden Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Turn Ube into a deterministic Moonlit Garden pixel experience with a shared Node/browser scene engine, richer GIF/PNG output, and a static GitHub Pages customizer.

**Architecture:** Keep filesystem and GitHub adapters in Node-only modules. Extract pure config, character, metrics, planning, font, and scene rendering modules that can be bundled for both Node and the browser. The Action/CLI uses the pure renderer to encode GIF/PNG; the customizer uses the same renderer to paint Canvas and exports config/workflow/README artifacts.

**Tech Stack:** TypeScript, Node.js 20+, esbuild, Vitest, `gifenc`, browser Canvas, GitHub Actions, GitHub Pages.

## Global Constraints

- Config v1 remains valid and receives Moonlit Garden defaults in memory.
- Moonlit Garden is the only habitat in this release.
- The scene must be deterministic for identical username, calendar, config, and engine version.
- The banner target is 2 MB with a hard ceiling of 5 MB; a PNG fallback is generated.
- Layout is automatic; no freeform object placement is introduced.
- No sign-in, backend, telemetry, external weather API, or browser token handling.
- `npm run typecheck`, `npm test`, and `npm run build` must pass.

### Task 1: Add pure experience contracts and v1 normalization

**Files:**
- Create: `src/experience/types.ts`
- Create: `src/experience/defaults.ts`
- Modify: `src/config/schema.ts`
- Modify: `src/config/load.ts`
- Test: `tests/unit/config.test.ts`

**Interfaces:**
- `createDefaultExperience(): ExperienceConfig`
- `normalizeExperience(value: unknown): ExperienceConfig`
- `ResolvedConfig.experience: ExperienceConfig`

- [ ] Write tests for a legacy v1 config receiving Moonlit Garden defaults and a v2 experience object preserving explicit stats, identity, calendar, link, and budget settings.
- [ ] Run `npm test -- tests/unit/config.test.ts` and verify the new assertions fail because `experience` is not present.
- [ ] Implement the pure experience types/defaults and extend validation to accept `version: 1 | 2`, optional `experience`, and exact field errors.
- [ ] Update `loadConfig` to attach `normalizeExperience(config.experience)` while preserving existing path resolution.
- [ ] Run the config test file and then the full test suite; keep existing v1 assertions intact.
- [ ] Commit `feat: add moonlit garden experience config`.

### Task 2: Extract browser-safe character validation

**Files:**
- Create: `src/character/validate.ts`
- Modify: `src/character/load.ts`
- Test: `tests/unit/character.test.ts`

**Interfaces:**
- `validateCharacter(value: unknown): CharacterPack`
- `parseCharacterJson(raw: string, path: string): CharacterPack`

- [ ] Add a test importing `validateCharacter` from the browser-safe module and asserting it rejects an undeclared symbol.
- [ ] Run the focused test and verify the new import fails before the module exists.
- [ ] Move pure validation/parsing into `src/character/validate.ts`; make `load.ts` only read files and re-export the validator for compatibility.
- [ ] Run character tests and typecheck.
- [ ] Commit `refactor: split browser-safe character validation`.

### Task 3: Calculate contribution metrics, calendar season, and daily vignette

**Files:**
- Create: `src/experience/metrics.ts`
- Create: `src/experience/season.ts`
- Create: `src/experience/planner.ts`
- Test: `tests/unit/experience.test.ts`

**Interfaces:**
- `calculateActivityMetrics(calendar: ContributionCalendar): ActivityMetrics`
- `seasonForDate(date: string, hemisphere: Hemisphere): Season`
- `planScene(calendar: ContributionCalendar, config: ResolvedConfig): ScenePlan`

- [ ] Write tests for streak, displayed-week total, calendar-year total, season inversion in the southern hemisphere, and stable vignette selection for identical input.
- [ ] Run `npm test -- tests/unit/experience.test.ts` and verify expected failures.
- [ ] Implement flat, pure calculations: active day means `count > 0`; recent activity is the active ratio over the latest 14 days; season uses month/day boundaries and hemisphere; the planner uses a small seeded hash and activity thresholds to choose a non-punitive vignette/weather pair.
- [ ] Run focused and full unit tests.
- [ ] Commit `feat: add deterministic moonlit garden planner`.

### Task 4: Add pixel font, Garden Sign, atmosphere, and vignette layers

**Files:**
- Create: `src/render/font.ts`
- Modify: `src/render/primitives.ts`
- Modify: `src/render/scene.ts`
- Test: `tests/unit/font.test.ts`
- Modify: `tests/unit/scene.test.ts`

**Interfaces:**
- `drawText(buffer, palette, text, x, y, color, scale): number`
- `createScene(config, character).render(calendar, frameIndex): IndexedFrame`

- [ ] Write tests that draw `12 DAYS`, assert non-background pixels, and verify the scene paints Garden Sign text and remains deterministic.
- [ ] Run focused tests and confirm failures before implementation.
- [ ] Implement a compact uppercase/digit pixel font, then add automatic Garden Sign placement, optional quiet identity/combined sign, moon/season palette accents, rain/mist/firefly particles, garden props, and vignette-specific Ube beats while preserving all 371 grid cells.
- [ ] Replace hardcoded timeline-only rendering with `planScene` plus frame phase; keep character anchor and walk cycle behavior stable.
- [ ] Update stable frame hashes after inspecting intentional visual changes.
- [ ] Run scene/font tests and the full suite.
- [ ] Commit `feat: render moonlit garden scenes`.

### Task 5: Add adaptive GIF encoding and PNG fallback

**Files:**
- Create: `src/output/png.ts`
- Create: `src/output/budget.ts`
- Modify: `src/generate.ts`
- Modify: `src/output/gif.ts`
- Modify: `src/config/schema.ts`
- Test: `tests/unit/budget.test.ts`
- Modify: `tests/integration/gif.test.ts`

**Interfaces:**
- `selectFramesWithinBudget(render: (index: number) => IndexedFrame, options: BudgetOptions): BudgetedFrames`
- `encodePng(frame: IndexedFrame): Uint8Array`
- `writePngAtomic(path: string, bytes: Uint8Array): Promise<void>`

- [ ] Write tests for deterministic frame thinning and a valid PNG signature, plus an integration assertion that generated output includes `.png`.
- [ ] Run focused tests and verify failures.
- [ ] Implement target/hard byte budget selection by trying the requested frame count, then evenly dropping duplicate timeline positions and lowering FPS-derived frame count until the hard ceiling is met; fail with a field-specific error only if one frame exceeds the ceiling.
- [ ] Implement indexed-frame PNG encoding with Node `zlib`, CRC32, and atomic writes.
- [ ] Update `generate` to plan once, budget frames, write GIF and PNG, and return both paths/frame count.
- [ ] Run output/integration tests and full suite.
- [ ] Commit `feat: add adaptive banner output budgets`.

### Task 6: Build the static customizer and GitHub Pages workflow

**Files:**
- Create: `site/index.html`
- Create: `site/styles.css`
- Create: `src/customizer.ts`
- Create: `src/customizer-entry.ts`
- Modify: `scripts/build.mjs`
- Modify: `package.json`
- Create: `.github/workflows/pages.yml`
- Test: `tests/integration/customizer.test.ts`

**Interfaces:**
- Browser app state uses `ResolvedConfig`, `CharacterPack`, `ContributionCalendar`, and `ScenePlan` from the shared core.
- Build emits `site/app.js` and copies `site/index.html`/`site/styles.css`.

- [ ] Write a build integration test asserting `site/index.html` and `site/app.js` are produced and contain the customizer entry marker.
- [ ] Run it and verify failure before adding the entry/build wiring.
- [ ] Implement a responsive, no-sign-in UI with Guided/Advanced tabs, username, Moonlit Garden palette, Ube colors, stats period, identity toggle/style/name/role, timezone/hemisphere, banner link, duration/FPS/size/budget, character JSON import, Canvas preview, config/workflow/README export panels, and PNG download.
- [ ] Use the fixture calendar and bundled Ube pack for immediate preview; re-render only pure client state changes.
- [ ] Add Pages workflow that uploads `site/` on pushes to `main` and manual dispatch.
- [ ] Run build and customizer integration tests.
- [ ] Commit `feat: add static moonlit garden customizer`.

### Task 7: Update Action, CLI, workflow, docs, and generated distribution

**Files:**
- Modify: `src/action.ts`
- Modify: `src/cli.ts`
- Modify: `action.yml`
- Modify: `.github/workflows/ube.yml`
- Modify: `README.md`
- Modify: `ube.config.json`
- Modify: `tests/integration/action.test.ts`
- Modify: `tests/integration/cli.test.ts`

**Interfaces:**
- Action output keys: `path`, `staticPath`, `frames`.
- CLI output reports GIF and PNG paths and selected frame count.

- [ ] Add failing assertions for PNG output and the new Action output key.
- [ ] Run focused integration tests and verify failures.
- [ ] Update runtime outputs, commit workflow to include both assets, and document v1 compatibility, Moonlit Garden settings, customizer URL, one-link README syntax, stats period, reduced-motion PNG fallback, and privacy.
- [ ] Update example config with explicit optional fields while keeping it valid as v1.
- [ ] Run `npm run typecheck`, `npm test`, and `npm run build`.
- [ ] Commit `docs: document moonlit garden customization`.

### Task 8: Final verification and visual smoke check

**Files:**
- Modify: `tests/integration/gif.test.ts` only if final output assertions require exact paths.
- Inspect: `assets/ube.gif`, generated `assets/ube.png`, `site/`.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm test` and record the complete test count.
- [ ] Run `npm run build` and verify both `dist/` and `site/` outputs.
- [ ] Generate the fixture banner and inspect GIF/PNG dimensions, file sizes, and signatures.
- [ ] Check `git diff --check` and `git status --short`.
- [ ] Commit any final test-only adjustments with a focused message.
