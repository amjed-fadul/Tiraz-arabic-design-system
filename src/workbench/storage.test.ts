import { expect, it, vi } from "vitest";
import { defaultConfig } from "../system";
import { readPreferences } from "./preferences";
import { defaultPlaygrounds } from "./model";
import {
  defaultDocumentation,
  persist,
  readDocumentation,
  readPlaygrounds,
  readSystem,
  storageKeys,
  readTheme,
  defaultSettings,
} from "./storage";
it("recovers the three state layers independently from corrupt data", () => {
  localStorage.setItem(storageKeys.documentation, "{");
  persist(storageKeys.system, {
    ...defaultConfig,
    theme: "dark",
    accent: "plum",
  });
  persist(storageKeys.playgrounds, {
    ...defaultPlaygrounds("ar"),
    button: {
      ...defaultPlaygrounds("ar").button,
      children: "حفظ خاص",
      size: "md",
    },
  });
  expect(readDocumentation()).toEqual(defaultDocumentation);
  persist(storageKeys.theme, "dark");
  expect(readTheme()).toBe("dark");
  expect(readSystem()).toMatchObject({ accent: "plum" });
  expect(readPlaygrounds("ar").button).toMatchObject({
    children: "حفظ خاص",
    size: "md",
  });
  localStorage.setItem(storageKeys.playgrounds, "null");
  expect(readPlaygrounds("ar")).toEqual(defaultPlaygrounds("ar"));
  expect(readTheme()).toBe("dark");
});
it("validates persisted enum, numeric and collection values", () => {
  persist(storageKeys.documentation, {
    theme: "invalid",
    language: "unknown",
    active: "unknown",
    inspectorOpen: "no",
  });
  persist(storageKeys.system, {
    radius: -1,
    accent: "invalid",
    theme: "invalid",
    density: "invalid",
  });
  persist(storageKeys.playgrounds, {
    tabs: { items: [{ value: "a", label: "A", content: "T", color: "red" }] },
    button: { size: "xxl", attributes: { tabIndex: "bad" } },
  });
  expect(readDocumentation()).toEqual(defaultDocumentation);
  expect(readSystem()).toEqual(defaultSettings);
  expect(readPlaygrounds("en").tabs.items).toEqual(
    defaultPlaygrounds("en").tabs.items,
  );
  expect(readPlaygrounds("en").button).toMatchObject({
    size: "sm",
    attributes: {},
  });
});
it("remains usable when browser storage denies reads and writes", () => {
  const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Storage unavailable");
  });
  const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage unavailable");
  });
  try {
    expect(readDocumentation()).toEqual(defaultDocumentation);
    expect(readSystem()).toEqual(defaultSettings);
    expect(readPlaygrounds("ar")).toEqual(defaultPlaygrounds("ar"));
    expect(() =>
      persist(storageKeys.documentation, defaultDocumentation),
    ).not.toThrow();
  } finally {
    get.mockRestore();
    set.mockRestore();
  }
});
it("migrates one shared theme with documentation taking precedence over the old system theme", () => {
  persist("tiraz.documentation.v1", {
    theme: "dark",
    language: "en",
    active: "tabs",
  });
  persist("tiraz.system.v2", {
    ...defaultConfig,
    theme: "light",
    accent: "blue",
  });
  expect(readTheme()).toBe("dark");
  expect(readDocumentation()).toMatchObject({ language: "en", active: "tabs" });
  expect(readDocumentation()).not.toHaveProperty("theme");
  expect(readSystem()).not.toHaveProperty("theme");
});
it("discards obsolete per-component appearance fields during migration", () => {
  persist("tiraz.playgrounds.v1", {
    button: {
      ...defaultPlaygrounds("ar").button,
      children: "Special",
      previewTheme: "dark",
      previewAccent: "blue",
    },
  });
  expect(readPlaygrounds("ar").button).not.toHaveProperty("previewAccent");
  expect(readPlaygrounds("ar").button).not.toHaveProperty("previewTheme");
  expect(readPlaygrounds("ar").button.children).toBe("Special");
});

it("applies the documented shared theme precedence and fallback", () => {
  persist("tiraz.preferences.v1", { theme: "dark" });
  expect(readTheme()).toBe("dark");
  persist("tiraz.system.v2", { theme: "light" });
  expect(readTheme()).toBe("light");
  persist("tiraz.documentation.v1", { theme: "dark" });
  expect(readTheme()).toBe("dark");
  persist(storageKeys.theme, "light");
  expect(readTheme()).toBe("light");
  persist(storageKeys.theme, "invalid");
  expect(readTheme()).toBe("dark");
});

it.each(["lime", "amber", "teal", "cyan", "indigo", "rose", "slate"])(
  "retains the %s accent across current and legacy settings reloads",
  (accent) => {
    persist(storageKeys.system, { ...defaultConfig, accent });
    expect(readSystem().accent).toBe(accent);
    localStorage.removeItem(storageKeys.system);
    persist("tiraz.preferences.v1", { ...defaultConfig, accent });
    expect(readSystem().accent).toBe(accent);
    expect(readPreferences().accent).toBe(accent);
  },
);
it("keeps a valid numerals choice and falls back to Arabic-Indic digits", () => {
  expect(defaultSettings.numerals).toBe("arab");
  persist(storageKeys.system, { ...defaultSettings, numerals: "latn" });
  expect(readSystem().numerals).toBe("latn");
  for (const numerals of ["hindi", 1, null, undefined]) {
    persist(storageKeys.system, { ...defaultSettings, numerals });
    expect(readSystem().numerals).toBe("arab");
  }
  localStorage.setItem(
    "tiraz.preferences.v1",
    JSON.stringify({ ...defaultConfig, numerals: "latn" }),
  );
  expect(readPreferences().numerals).toBe("latn");
});
