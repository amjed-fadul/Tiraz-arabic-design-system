import { accentColors, defaultConfig } from "../system/config";
import type { SystemConfig } from "../system/config";
import { screens } from "../examples/frame/screen";
import type { ScreenSlug } from "../examples/frame/screen";
import type { ComponentId } from "./catalog";
import { navigationCatalog } from "./catalog";
import type { Language } from "./i18n";
import { normalizePlaygrounds } from "./model";
import type { Playgrounds } from "./model";
export const storageKeys = {
  theme: "tiraz.theme.v1",
  documentation: "tiraz.documentation.v2",
  system: "tiraz.system.v3",
  playgrounds: "tiraz.playgrounds.v2",
};
export type AppearanceSettings = Omit<SystemConfig, "theme" | "direction">;
export const defaultSettings: AppearanceSettings = {
  accent: defaultConfig.accent,
  density: defaultConfig.density,
  typography: defaultConfig.typography,
  numerals: defaultConfig.numerals,
  radius: defaultConfig.radius,
  reducedMotion: defaultConfig.reducedMotion,
};
export interface DocumentationPreferences {
  language: Language;
  active: ComponentId;
  /** The settings panel: closed until «تخصيص» opens it, then remembered. */
  settingsOpen: boolean;
  /** The Parts disclosure; stored optionally, closed when absent. */
  aiPartsOpen: boolean;
  /** The screen page open in place of the docs page `active`, if any. */
  screen: ScreenSlug | null;
}
export const defaultDocumentation: DocumentationPreferences = {
  language: "ar",
  active: "button",
  settingsOpen: false,
  aiPartsOpen: false,
  screen: null,
};
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
export function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Usable in memory when storage is unavailable. */
  }
}
// Theme precedence: valid shared value > old documentation > old system > milestone > light.
// Old per-page theme/accent overrides are excluded by normalizePlaygrounds.
export function readTheme(): SystemConfig["theme"] {
  const candidates = [
    read(storageKeys.theme),
    object(read("tiraz.documentation.v1"))?.theme,
    object(read("tiraz.system.v2"))?.theme,
    object(read("tiraz.preferences.v1"))?.theme,
  ];
  return (
    (candidates.find(
      (value) => value === "light" || value === "dark",
    ) as SystemConfig["theme"]) ?? "light"
  );
}
export function readDocumentation(): DocumentationPreferences {
  const p =
    object(read(storageKeys.documentation)) ??
    object(read("tiraz.documentation.v1"));
  if (!p) return { ...defaultDocumentation };
  return {
    language: p.language === "en" ? "en" : "ar",
    active:
      p.active === "field"
        ? "input"
        : navigationCatalog.some((item) => item.id === p.active)
          ? (p.active as ComponentId)
          : "button",
    settingsOpen: p.settingsOpen === true,
    aiPartsOpen: p.aiPartsOpen === true,
    screen: screens.some((item) => item.slug === p.screen)
      ? (p.screen as ScreenSlug)
      : null,
  };
}
export function readSystem(): AppearanceSettings {
  const p =
    object(read(storageKeys.system)) ??
    object(read("tiraz.system.v2")) ??
    object(read("tiraz.preferences.v1"));
  if (!p) return { ...defaultSettings };
  return {
    density: p.density === "standard" ? "standard" : "compact",
    accent: Object.keys(accentColors).includes(p.accent as string)
      ? (p.accent as SystemConfig["accent"])
      : "sage",
    radius:
      typeof p.radius === "number" &&
      Number.isFinite(p.radius) &&
      p.radius >= 0 &&
      p.radius <= 16
        ? p.radius
        : defaultSettings.radius,
    reducedMotion: p.reducedMotion === true,
    typography: p.typography === "large" ? "large" : "standard",
    numerals: p.numerals === "latn" ? "latn" : "arab",
  };
}
export function readPlaygrounds(language: Language): Playgrounds {
  return normalizePlaygrounds(
    read(storageKeys.playgrounds) ?? read("tiraz.playgrounds.v1"),
    language,
  );
}
