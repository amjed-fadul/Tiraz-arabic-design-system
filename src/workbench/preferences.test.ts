import { expect, it } from "vitest";
import { readPreferences, savePreferences } from "./preferences";
import { defaultConfig } from "../system/config";
it("recovers from corrupt, old and invalid preference data", () => {
  for (const raw of [
    "broken",
    "null",
    "[]",
    '{"theme":"purple","radius":999,"accent":"unknown"}',
  ]) {
    localStorage.setItem("tiraz.preferences.v1", raw);
    expect(readPreferences()).toEqual(defaultConfig);
  }
});
it("persists valid preferences and discards unknown properties", () => {
  savePreferences({
    ...defaultConfig,
    theme: "dark",
    direction: "ltr",
    density: "compact",
    radius: 12,
    reducedMotion: true,
  });
  expect(readPreferences()).toEqual({
    ...defaultConfig,
    theme: "dark",
    direction: "ltr",
    density: "compact",
    radius: 12,
    reducedMotion: true,
  });
});
