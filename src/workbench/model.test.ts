import { expect, it } from "vitest";
import {
  defaultPlaygrounds,
  translateDefaults,
  previewConfig,
  validateCollection,
  nativeAttributes,
} from "./model";
import { defaultConfig } from "../system";
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
