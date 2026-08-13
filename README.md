<div align="center">

<a href="https://aldeniaalexandra.github.io/ube/"><img src="./assets/ube.gif" alt="Ube tending a Moonlit Garden around a GitHub contribution graph" width="100%" /></a>

</div>

# Ube

**A living pixel garden for your GitHub profile.**

Ube turns your contribution graph into a small Moonlit Garden. Ube waters plants, reads, naps through quiet weeks, follows fireflies, watches the rain, and celebrates streaks. The contribution graph stays readable underneath the scene, while an in-world Garden Sign shows your current streak and a configurable total.

The banner is generated in your own GitHub Action. There is no Ube server, sign-in, token collection, weather API, or telemetry.

## Customize your garden

Open the static [Ube customizer](https://aldeniaalexandra.github.io/ube/). It has a Guided mode for the common choices and an Advanced mode for timing, dimensions, byte budgets, links, and custom character packs. The preview uses representative fixture data; your Action renders live contribution data in your repository.

The customizer exports:

- `ube.config.json`
- a ready-to-copy workflow
- a README snippet with one optional link
- a static PNG preview

The banner link is one configurable destination. By default it opens the customizer with the username prefilled; replace it with a portfolio, website, or any other URL, or leave it empty.

## Put Ube on your profile

Copy [`ube.config.json`](./ube.config.json) and [`characters/ube.json`](./characters/ube.json) into your profile repository. Change `github.username`, then add this workflow:

```yaml
name: Refresh Ube

on:
  workflow_dispatch:
  schedule:
    - cron: "17 3 * * *"

permissions:
  contents: write

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Render Ube
        uses: aldeniaalexandra/ube@main
        with:
          token: ${{ github.token }}

      - name: Commit the banner
        shell: bash
        run: |
          if git diff --quiet -- assets/ube.gif assets/ube.png; then
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -- assets/ube.gif assets/ube.png
          git commit -m "chore: refresh Ube banner"
          git push
```

Use the generated GIF in your README. To make it clickable, wrap the image in one link:

```markdown
[![My Moonlit Garden](assets/ube.gif)](https://example.com)
```

`assets/ube.png` is the still fallback for reduced-motion or users who prefer not to load an animation.

## Configuration

Existing version-one configs continue to work and automatically receive the Moonlit Garden defaults. New fields are optional:

```json
{
  "version": 1,
  "github": { "username": "aldeniaalexandra" },
  "character": "characters/ube.json",
  "output": {
    "path": "assets/ube.gif",
    "width": 960,
    "height": 320,
    "fps": 12.5,
    "durationSeconds": 12
  },
  "theme": {
    "background": "#0d1117",
    "gridEmpty": "#21262d",
    "gridLevels": ["#0e4429", "#006d32", "#26a641", "#39d353"],
    "accent": "#8a63e8"
  },
  "experience": {
    "habitat": "moonlit-garden",
    "calendar": { "timezone": "Asia/Jakarta", "hemisphere": "north" },
    "stats": {
      "period": "calendar-year",
      "showStreak": true,
      "showTotal": true
    },
    "identity": {
      "enabled": false,
      "name": "",
      "role": "",
      "style": "quiet-label"
    },
    "link": "",
    "budget": { "targetBytes": 2000000, "hardMaxBytes": 5000000 }
  }
}
```

`stats.period` can be `displayed-weeks` (the 53 weeks shown in the graph) or `calendar-year` (year-to-date). This example uses the annual total; the customizer keeps it as the informative default. Identity is optional; choose `quiet-label` or `combined-sign`. The layout remains automatic at every supported size.

Generated GIFs target 2 MB and have a hard 5 MB ceiling. Ube lowers frame density when needed, then emits the PNG fallback alongside the GIF.

## Draw a different resident

Character packs remain plain JSON. The Guided customizer changes Ube’s color; Advanced mode accepts the full pack format. A pack contains a palette and six 12 by 8 pixel frames: idle, blink, and four walking poses. Spaces are transparent. The loader rejects uneven rows and undeclared symbols before rendering.

## Run locally

Ube needs Node.js 20 or newer.

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Generate a deterministic demo banner without contacting GitHub:

```bash
node dist/cli.js generate \
  --config ube.config.json \
  --fixture tests/fixtures/calendar.json
```

The same command writes `assets/ube.gif` and `assets/ube.png` unless `--output` is supplied.

## How it works

```text
GitHub GraphQL / fixture
          ↓
53 × 7 contribution calendar
          ↓
activity metrics + calendar season
          ↓
deterministic Moonlit Garden vignette plan
          ↓
shared indexed-pixel renderer
       ↙                    ↘
  GIF + PNG Action       Canvas customizer
```

The pure planner and renderer are shared by the Node Action/CLI and the browser customizer. Identical username, calendar, config, and engine version produce the same scene. The only runtime image dependency is `gifenc`; PNG output uses Node’s built-in zlib.

## Privacy and permissions

Ube requests contribution dates, counts, and intensity levels from GitHub GraphQL. It does not collect telemetry or store your token. The Action only writes the GIF and PNG; your workflow decides whether to commit them.

## License

MIT. See [`LICENSE`](./LICENSE).
