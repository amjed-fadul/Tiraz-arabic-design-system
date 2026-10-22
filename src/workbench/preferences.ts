import { accentColors, defaultConfig } from "../system/config";
import type { SystemConfig } from "../system/config";
const KEY = "tiraz.preferences.v1";
export function readPreferences(): SystemConfig {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value))
      return { ...defaultConfig };
    const p = value as Record<string, unknown>;
    if (
      !["light", "dark"].includes(p.theme as string) ||
      !["rtl", "ltr"].includes(p.direction as string) ||
      !["standard", "compact"].includes(p.density as string) ||
      !Object.keys(accentColors).includes(p.accent as string) ||
      typeof p.radius !== "number" ||
      !Number.isFinite(p.radius) ||
      p.radius < 0 ||
      p.radius > 16 ||
      typeof p.reducedMotion !== "boolean"
    )
      return { ...defaultConfig };
    return {
      theme: p.theme as SystemConfig["theme"],
      direction: p.direction as SystemConfig["direction"],
      density: p.density as SystemConfig["density"],
      accent: p.accent as SystemConfig["accent"],
      radius: p.radius,
      reducedMotion: p.reducedMotion,
      typography: p.typography === "large" ? "large" : "standard",
      numerals: p.numerals === "latn" ? "latn" : "arab",
    };
  } catch {
    return { ...defaultConfig };
  }
}
export function savePreferences(config: SystemConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    /* Preferences remain usable when storage is unavailable. */
  }
}
