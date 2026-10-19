import { expect, it } from "vitest";
import {
  normalizePlaygrounds,
  defaultPlaygrounds,
  translateDefaults,
  previewConfig,
  validateCollection,
  nativeAttributes,
} from "./model";
import { defaultConfig } from "../system";
import { navigationCatalog } from "./catalog";
import { fields } from "./fields";
import { generateCode, generatePrompt } from "./generate";
it("rejects duplicate collection identifiers and unusable tab sets", () => {
  expect(
    validateCollection("tabs", [
      { value: "a", label: "أ", content: "أ" },
      { value: "a", label: "ب", content: "ب" },
    ]),
  ).toBe(false);
  expect(
    validateCollection("tabs", [
      { value: "a", label: "أ", content: "أ", disabled: true },
    ]),
  ).toBe(false);
  expect(
    validateCollection("dropdown", [
      { id: "a", label: "تعديل", icon: "unsupported" },
    ]),
  ).toBe(false);
});
it("does not forward unsupported objects or event strings as DOM attributes", () => {
  expect(
    nativeAttributes({
      title: "Invoice",
      name: "save",
      "data-id": "INV-2048",
      onClick: "bad",
      children: "bad",
      style: { position: "fixed" },
      unknown: 1,
    }),
  ).toEqual({ title: "Invoice", name: "save", "data-id": "INV-2048" });
});
it("localizes default strings and preserves user-written labels", () => {
  const state = defaultPlaygrounds("ar");
  state.button.children = "حفظ خاص";
  const translated = translateDefaults(state, "ar", "en");
  expect(translated.button.children).toBe("حفظ خاص");
  expect(translated.switch.label).toBe("Email notifications");
});
it("generates synchronized code and prompts from supported props", () => {
  const p = defaultPlaygrounds("en").button;
  p.size = "md";
  p.children = "Approve invoice";
  p.variant = "secondary";
  const config = { ...defaultConfig, accent: "blue" as const };
  const code = generateCode("button", p, config, "en");
  const prompt = generatePrompt("button", p, config, "en");
  expect(code).toContain('size="md"');
  expect(code).toContain("Approve invoice");
  expect(code).toContain('accent: "blue"');
  expect(prompt).toContain("src/system/Button.tsx");
  expect(prompt).toContain(code);
  expect(prompt).not.toContain("npx");
});
it("validates DOM attribute types and enums before forwarding", () => {
  expect(
    nativeAttributes({
      tabIndex: "bad",
      formNoValidate: "yes",
      dir: "up",
      "aria-label": false,
      "aria-hidden": true,
      "aria-setsize": 5,
      "data-id": "INV-2",
    }),
  ).toEqual({ "aria-hidden": true, "aria-setsize": 5, "data-id": "INV-2" });
});
it("generates the same secondary trigger as the Toast preview", () => {
  expect(
    generateCode("toast", defaultPlaygrounds("ar").toast, defaultConfig, "ar"),
  ).toContain('<Button variant="secondary"');
});

it("rejects unsupported collection properties before generating typed examples", () => {
  expect(
    validateCollection("tabs", [
      { value: "a", label: "A", content: "Text", color: "red" },
    ]),
  ).toBe(false);
  expect(
    validateCollection("dropdown", [
      { id: "a", label: "A", onSelect: "string" },
    ]),
  ).toBe(false);
});
it("uses the latest global accent and theme despite obsolete saved preview overrides", () => {
  const p = {
    ...defaultPlaygrounds("ar").button,
    previewAccent: "blue" as const,
    previewTheme: "dark" as const,
  };
  const config = {
    ...defaultConfig,
    accent: "plum" as const,
    theme: "light" as const,
  };
  expect(previewConfig(config, p)).toMatchObject({
    accent: "plum",
    theme: "light",
  });
});

it("normalizes forms, rejects invalid options and retains valid text while translating defaults", () => {
  const p = defaultPlaygrounds("ar");
  expect(validateCollection("select", [{ value: "", label: "Empty" }])).toBe(
    false,
  );
  expect(
    validateCollection("select", [
      { value: "a", label: "A" },
      { value: "a", label: "B" },
    ]),
  ).toBe(false);
  expect(
    validateCollection("select", [
      { value: "a", label: "A", disabled: "true" },
    ]),
  ).toBe(false);
  const normalized = normalizePlaygrounds(
    {
      input: { ...p.input, type: "date", size: "xx", value: "مدار" },
      select: { ...p.select, value: "archived", options: p.select.options },
    },
    "ar",
  );
  expect(normalized.input.type).toBe("text");
  expect(normalized.input.size).toBe("sm");
  expect(normalized.input.value).toBe("مدار");
  expect(normalized.select.value).toBe("");
  const translated = translateDefaults(normalized, "ar", "en");
  expect(translated.input.value).toBe("مدار");
  expect(translated.select.options[0].label).toBe("Active");
});

it.each([
  "PDF, text or images · up to 5 MB each · maximum 3 files.",
  "PDF أو نص أو صور · حتى ٥ ميغابايت لكل ملف · ٣ ملفات كحد أقصى.",
])(
  "migrates the old file helper without replacing custom application guidance: %s",
  (helper) => {
    const state = defaultPlaygrounds("en");
    state["file-dropzone"] = {
      ...state["file-dropzone"],
      helper,
      maxFiles: 1,
      accept: ".csv",
    };
    const result = normalizePlaygrounds(state, "en");
    expect(result["file-dropzone"].helper).not.toMatch(/PDF|3 files|٣ ملفات/);
    state["file-dropzone"].helper = "Custom application guidance";
    expect(normalizePlaygrounds(state, "en")["file-dropzone"].helper).toBe(
      "Custom application guidance",
    );
  },
);

it("replaces retired demo wording in saved playgrounds but keeps custom text", () => {
  const state = defaultPlaygrounds("ar");
  state.slider = { ...state.slider, label: "قيمة محلية" };
  state.tooltip = { ...state.tooltip, content: "نص كتبه الفريق" };
  const result = normalizePlaygrounds(state, "ar");
  expect(result.slider.label).toBe(defaultPlaygrounds("ar").slider.label);
  expect(result.tooltip.content).toBe("نص كتبه الفريق");
});

// Each patch has the same shape Workbench.tsx's patchPage builds.
it("keeps every select option of every page through normalization", () => {
  const defaults = defaultPlaygrounds("ar") as unknown as Record<
    string,
    Record<string, unknown>
  >;
  for (const item of navigationCatalog)
    for (const f of fields[item.id] ?? []) {
      if (f.kind !== "select" || !f.options) continue;
      for (const option of f.options) {
        const out = normalizePlaygrounds(
          { ...defaults, [item.id]: { ...defaults[item.id], [f.key]: option } },
          "ar",
        ) as unknown as Record<string, Record<string, unknown>>;
        expect(out[item.id][f.key], `${item.id}.${f.key}=${option}`).toBe(
          option,
        );
      }
    }
});
it("resets an unknown select value to that page's own default", () => {
  const defaults = defaultPlaygrounds("ar");
  const out = normalizePlaygrounds(
    { terminal: { ...defaults.terminal, state: "bogus" } },
    "ar",
  );
  expect(out.terminal.state).toBe(defaults.terminal.state);
});
it("keeps shared validation for keys without a page-specific select", () => {
  const defaults = defaultPlaygrounds("ar");
  const keep = normalizePlaygrounds(
    { checkbox: { ...defaults.checkbox, mode: "uncontrolled" } },
    "ar",
  );
  expect(keep.checkbox.mode).toBe("uncontrolled");
  const reset = normalizePlaygrounds(
    { checkbox: { ...defaults.checkbox, mode: "bogus" } },
    "ar",
  );
  expect(reset.checkbox.mode).toBe("controlled");
});
it("restores a legacy saved object without losing valid per-page values", () => {
  const saved = {
    terminal: { state: "running" },
    "image-result": { state: "loaded" },
    "context-meter": { preset: "near" },
    unknownPage: { x: 1 },
  };
  const out = normalizePlaygrounds(saved, "ar");
  expect(out.terminal.state).toBe("running");
  expect(out["image-result"].state).toBe("loaded");
  expect(out["context-meter"].preset).toBe("near");
});
// The shared table has no entry for these page selects, so each must be
// validated from the page's own options.
it.each([
  ["image-result", "aspectRatio"],
  ["code-block", "codeLanguage"],
  ["filter-bar", "initialKind"],
] as const)(
  "resets an unknown %s.%s to that page's own default",
  (page, key) => {
    const defaults = defaultPlaygrounds("ar") as unknown as Record<
      string,
      Record<string, unknown>
    >;
    const out = normalizePlaygrounds(
      { [page]: { ...defaults[page], [key]: "bogus" } },
      "ar",
    ) as unknown as Record<string, Record<string, unknown>>;
    expect(out[page][key]).toBe(defaults[page][key]);
  },
);
