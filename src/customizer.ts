import fixtureData from "../tests/fixtures/calendar.json" with { type: "json" };
import characterData from "../characters/ube.json" with { type: "json" };
import { normalizeCalendar } from "./contributions/normalize.js";
import { createDefaultExperience } from "./experience/defaults.js";
import { validateCharacter } from "./character/validate.js";
import type { CharacterPack } from "./character/types.js";
import type { RawContributionDay } from "./contributions/types.js";
import type { ExperienceConfig } from "./experience/types.js";
import { createScene, type IndexedFrame } from "./render/scene.js";
import type { ResolvedConfig } from "./config/schema.js";

const DEFAULT_CUSTOMIZER_URL = "https://aldeniaalexandra.github.io/ube/";
const fixture = fixtureData as unknown as { endDate: string; days: RawContributionDay[] };
const calendar = normalizeCalendar(fixture.days, fixture.endDate);
const defaultCharacter = validateCharacter(characterData);

interface CustomizerState {
  config: ResolvedConfig;
  character: CharacterPack;
  scene: ReturnType<typeof createScene>;
  frameCount: number;
  frameIndex: number;
  lastFrame?: IndexedFrame;
}

let state: CustomizerState;
let animationHandle = 0;

export function bootCustomizer(): void {
  document.title = "Ube Moonlit Garden customizer";
  const canvas = getElement<HTMLCanvasElement>("preview");
  const query = new URLSearchParams(window.location.search);
  const username = query.get("username");
  if (username) getInput("username").value = username;

  bindEvents();
  syncIdentityVisibility();
  rebuildState();
  animationHandle = window.requestAnimationFrame(animate);
  void canvas;
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      const advanced = mode === "advanced";
      document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      getElement("advanced-fields").classList.toggle("is-hidden", !advanced);
    });
  });

  document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea",
  ).forEach((input) => {
    input.addEventListener("input", () => {
      if (input.id === "identity-enabled") syncIdentityVisibility();
      rebuildState();
    });
    input.addEventListener("change", () => {
      if (input.id === "identity-enabled") syncIdentityVisibility();
      rebuildState();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = getElement(button.dataset.copy ?? "");
      copyText(target.textContent ?? "");
    });
  });
  getElement("copy-readme").addEventListener("click", () => {
    copyText(getElement("readme-output").textContent ?? "");
  });
  getElement("download-png").addEventListener("click", downloadPng);
}

function rebuildState(): void {
  try {
    const config = readConfig();
    const character = readCharacter();
    const scene = createScene(config, character);
    state = {
      config,
      character,
      scene,
      frameCount: Math.max(2, Math.round(config.output.fps * config.output.durationSeconds)),
      frameIndex: 0,
    };
    renderFrame();
    renderExports();
    showError("");
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
}

function readConfig(): ResolvedConfig {
  const experience = readExperience();
  const width = readNumber("width", 320, 1600);
  const height = readNumber("height", 160, 800);
  const fps = readNumber("fps", 1, 25);
  const durationSeconds = readNumber("duration", 2, 30);
  const targetBytes = readNumber("target-bytes", 100_000, 5_000_000);
  const hardMaxBytes = readNumber("hard-max-bytes", targetBytes, 5_000_000);
  const accent = getInput("ube-color").value;
  return {
    version: 2,
    github: { username: getInput("username").value.trim() || "your-username" },
    character: "characters/ube.json",
    output: {
      path: "assets/ube.gif",
      width,
      height,
      fps,
      durationSeconds,
    },
    theme: {
      background: "#0d1117",
      gridEmpty: "#21262d",
      gridLevels: ["#0e4429", "#006d32", "#26a641", "#39d353"],
      accent,
    },
    experience: {
      ...experience,
      budget: { targetBytes, hardMaxBytes },
    },
    configPath: "",
    characterPath: "characters/ube.json",
    outputPath: "assets/ube.gif",
  };
}

function readExperience(): ExperienceConfig {
  const defaults = createDefaultExperience();
  const identityEnabled = getElement<HTMLInputElement>("identity-enabled").checked;
  const link = getInput("link").value.trim();
  if (link.length > 0) {
    const parsed = new URL(link);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Optional README link must use http or https");
    }
  }
  return {
    ...defaults,
    calendar: {
      timezone: getInput("timezone").value.trim() || "UTC",
      hemisphere: getInput("hemisphere").value as "north" | "south",
    },
    stats: {
      period: getInput("stats-period").value as "displayed-weeks" | "calendar-year",
      showStreak: getElement<HTMLInputElement>("show-streak").checked,
      showTotal: getElement<HTMLInputElement>("show-total").checked,
    },
    identity: {
      enabled: identityEnabled,
      name: getInput("identity-name").value.trim(),
      role: getInput("identity-role").value.trim(),
      style: getInput("identity-style").value as "quiet-label" | "combined-sign",
    },
    link,
  };
}

function readCharacter(): CharacterPack {
  const raw = getInput("character-json").value.trim();
  if (!raw) return recolorCharacter(defaultCharacter, getInput("ube-color").value);
  return validateCharacter(JSON.parse(raw) as unknown);
}

function recolorCharacter(character: CharacterPack, accent: string): CharacterPack {
  const palette = { ...character.palette, P: accent };
  return { ...character, palette };
}

function animate(timestamp: number): void {
  if (state !== undefined) {
    const millisecondsPerFrame = 1_000 / state.config.output.fps;
    const nextFrame = Math.floor(timestamp / millisecondsPerFrame) % state.frameCount;
    if (nextFrame !== state.frameIndex) {
      state.frameIndex = nextFrame;
      renderFrame();
    }
  }
  animationHandle = window.requestAnimationFrame(animate);
  void animationHandle;
}

function renderFrame(): void {
  const canvas = getElement<HTMLCanvasElement>("preview");
  const frame = state.scene.render(calendar, state.frameIndex);
  state.lastFrame = frame;
  canvas.width = frame.width;
  canvas.height = frame.height;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D context is unavailable");
  const image = context.createImageData(frame.width, frame.height);
  for (let index = 0; index < frame.pixels.length; index += 1) {
    const color = frame.palette[frame.pixels[index] as number] ?? [0, 0, 0];
    image.data[index * 4] = color[0] as number;
    image.data[index * 4 + 1] = color[1] as number;
    image.data[index * 4 + 2] = color[2] as number;
    image.data[index * 4 + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function renderExports(): void {
  const json = JSON.stringify(stripResolvedFields(state.config), null, 2);
  getElement("config-output").textContent = json;
  const link = state.config.experience.link || createCustomizerLink(state.config);
  const image = "assets/ube.gif";
  getElement("readme-output").textContent = `[![Moonlit Garden contribution banner](${image})](${link})`;
  getElement("workflow-output").textContent = [
    "name: Refresh Ube",
    "on:",
    "  workflow_dispatch:",
    "  schedule:",
    '    - cron: "17 3 * * *"',
    "permissions:",
    "  contents: write",
    "jobs:",
    "  render:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v6",
    "      - uses: aldeniaalexandra/ube@main",
    "        with:",
    "          token: ${{ github.token }}",
    "      - run: git add assets/ube.gif assets/ube.png && git diff --cached --quiet || (git config user.name github-actions[bot] && git config user.email 41898282+github-actions[bot]@users.noreply.github.com && git commit -m 'chore: refresh Ube banner' && git push)",
  ].join("\n");
}

function stripResolvedFields(config: ResolvedConfig): Record<string, unknown> {
  const { configPath, characterPath, outputPath, ...exported } = config;
  void configPath;
  void characterPath;
  void outputPath;
  return exported;
}

function createCustomizerLink(config: ResolvedConfig): string {
  const params = new URLSearchParams({ username: config.github.username });
  return `${DEFAULT_CUSTOMIZER_URL}?${params.toString()}`;
}

function downloadPng(): void {
  const canvas = getElement<HTMLCanvasElement>("preview");
  canvas.toBlob((blob) => {
    if (blob === null) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ube.png";
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function syncIdentityVisibility(): void {
  const enabled = getElement<HTMLInputElement>("identity-enabled").checked;
  getElement("identity-fields").classList.toggle("is-hidden", !enabled);
}

function readNumber(id: string, minimum: number, maximum: number): number {
  const value = Number(getInput(id).value);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${id} must be between ${minimum} and ${maximum}`);
  }
  return value;
}

function showError(message: string): void {
  getElement("form-error").textContent = message;
}

function copyText(value: string): void {
  const clipboard = navigator.clipboard;
  if (clipboard === undefined) {
    getElement("copy-status").textContent = "Clipboard unavailable; copy the text manually.";
    return;
  }
  void clipboard.writeText(value).then(() => {
    getElement("copy-status").textContent = "Copied to clipboard.";
  }).catch(() => {
    getElement("copy-status").textContent = "Clipboard blocked; copy the text manually.";
  });
}

function getInput(id: string): HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement {
  return getElement(id) as HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement;
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`Customizer element #${id} is missing`);
  return element as T;
}
