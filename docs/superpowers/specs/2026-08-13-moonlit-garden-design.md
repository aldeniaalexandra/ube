# Ube Moonlit Garden Design

## Outcome

Ube becomes a living pixel ecosystem for GitHub profile README banners. The contribution graph remains the visual anchor, while a deterministic Moonlit Garden adds daily vignettes, weather, particles, a grounded Ube companion, and an in-world Garden Sign. A static GitHub Pages customizer previews the same experience and exports ready-to-use configuration, workflow, README markup, and an optional banner link.

## Product decisions

- Moonlit Garden is the only first-release habitat and the default for all existing configurations.
- A daily vignette is selected deterministically from username, displayed end date, normalized configuration, and engine version.
- Vignettes include watering, reading, napping, fireflies, rain observation, puddle hopping, and positive streak celebrations.
- Low activity creates gentle rest states (napping, reading, rain, tending existing plants); the garden never wilts or punishes inactivity.
- Season comes from the configured date, timezone, and hemisphere. Recent contribution activity only influences gentle weather and vignette weighting.
- The Garden Sign displays current streak and a configurable total period: `displayed-weeks` (the default 53-week graph) or `calendar-year` (year-to-date).
- Identity is optional. When enabled, the default style is `quiet-label`; `combined-sign` is an alternative. Empty identity fields disable the layer automatically.
- Layout is always automatic and responsive; advanced controls change parameters, not object placement.
- The banner is optionally wrapped in one README link. The customizer defaults that link to a prefilled customizer URL, but users can replace it with any URL or leave it empty.
- Generated GIFs target 2 MB and have a hard 5 MB ceiling. The renderer reduces duplicate frames and frame rate before exceeding the ceiling. A static PNG fallback is generated alongside the GIF.
- Config version 1 remains valid. Loading it normalizes missing experience settings to Moonlit Garden defaults in memory; users do not need to edit old files.
- The Action and CLI renderer and the browser Canvas customizer consume the same pure scene planner and renderer modules.

## Shared contract

The pure experience core exposes:

```ts
interface ExperienceConfig {
  habitat: "moonlit-garden";
  calendar: { timezone: string; hemisphere: "north" | "south" };
  stats: {
    period: "displayed-weeks" | "calendar-year";
    showStreak: boolean;
    showTotal: boolean;
  };
  identity: {
    enabled: boolean;
    name: string;
    role: string;
    style: "quiet-label" | "combined-sign";
  };
  link: string;
  budget: { targetBytes: number; hardMaxBytes: number };
}

interface ActivityMetrics {
  currentStreak: number;
  displayedTotal: number;
  calendarYearTotal: number;
  recentActivityRatio: number;
}

interface ScenePlan {
  season: "spring" | "summer" | "autumn" | "winter";
  weather: "clear" | "clouds" | "rain" | "mist";
  vignette: "water" | "read" | "nap" | "fireflies" | "rain-watch" | "puddle-hop" | "celebrate";
  metrics: ActivityMetrics;
  identity: ExperienceConfig["identity"];
  seed: number;
}
```

## Rendering behavior

The scene is composed in stable layers: atmospheric background, moon/season accents, optional weather, contribution grid, garden props, Garden Sign, optional identity, Ube, and foreground particles. The existing walk cycle remains, but Ube pauses or performs vignette-specific beats at deterministic timeline windows. The renderer never uses random state or wall-clock reads.

The browser customizer renders indexed frames into Canvas using the same scene function. It supplies representative fixture data and clearly labels the preview as illustrative until a user regenerates the banner in their own repository.

## Customizer

The static Pages app has Guided and Advanced modes. Guided controls are username, palette preset, Ube color, stats period, identity toggle/name/role/style, hemisphere, timezone, and banner link. Advanced controls expose vignette intensity, weather intensity, FPS, duration, canvas size, target byte budget, and the full character-pack JSON import. No sign-in, token, backend, telemetry, or real GitHub fetch is used.

Exports are:

1. `ube.config.json` with v2 experience fields.
2. A workflow snippet using the published Action.
3. A README snippet with one optional linked image.
4. A downloadable preview PNG.

## Compatibility and errors

Validation fails early with field paths for invalid colors, ranges, enum values, URLs, names, roles, and character imports. v1 configs preserve their existing output paths and theme while receiving normalized Moonlit Garden defaults. Browser imports show an inline error and preserve the last valid preview. Node Action errors remain workflow-safe and never echo tokens.

## Verification

- Unit tests cover config normalization, metrics, season selection, deterministic vignette planning, text rendering, and adaptive frame selection.
- Scene tests assert contribution cells remain complete, Garden Sign pixels appear, v1 and v2 configs render, and identical inputs produce identical frame hashes.
- Integration tests cover GIF and PNG generation, the 5 MB ceiling, Action outputs, CLI behavior, and static customizer build output.
- `npm run typecheck`, `npm test`, and `npm run build` are required before completion.
