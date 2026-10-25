import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { defaultConfig } from "../system";
import { generateCode, generatePrompt } from "./generate";
import { defaultPlaygrounds } from "./model";
import {
  normalizeBrandColors,
  generateThemeCss,
  themeStyle,
} from "./theme-customization";
import { persist, storageKeys } from "./storage";
import { Workbench } from "./Workbench";
import { StandalonePlayground } from "./StandalonePlayground";

it("accepts only opaque hex colors from stored preferences", () => {
  expect(normalizeBrandColors({ light: "#abc", dark: "#123456" })).toEqual({
    light: "#AABBCC",
    dark: "#123456",
  });
  for (const value of [
    null,
    [],
    "red",
    { light: "url(secret)", dark: "#abcd" },
    { light: "red; color: red", dark: 123 },
  ])
    expect(normalizeBrandColors(value)).toEqual({});
});

it("exports both modes and radius with readable action text without altering semantic colors", () => {
  const config = { ...defaultConfig, radius: 12 };
  const colors = { light: "#FFFFFF", dark: "#000000" };
  const css = generateThemeCss(config, colors);
  expect(css).toContain("--tiraz-radius: 12px");
  expect(css).toContain('[data-theme="light"]');
  expect(css).toContain("--tiraz-action: #FFFFFF");
  expect(css).toContain("--action-text: #000000");
  expect(css).toContain('[data-theme="dark"]');
  expect(css).toContain("--tiraz-action: #000000");
  expect(css).toContain("--action-text: #FFFFFF");
  expect(css).not.toMatch(/--(success|error|warning|destructive)/);
  expect(themeStyle(config, colors)).toEqual({
    "--tiraz-action": "#FFFFFF",
    "--preview-action-text": "#000000",
    "--preview-action-hover": "#FFFFFF",
  });
  expect(themeStyle(config, {})).toEqual({});
});

it("carries the same custom theme into generated code and the English agent prompt", () => {
  const model = defaultPlaygrounds("ar").button;
  const colors = { light: "#123456", dark: "#ABCDEF" };
  const css = generateThemeCss(defaultConfig, colors);
  const code = generateCode("button", model, defaultConfig, "ar", colors);
  expect(code).toContain(JSON.stringify(css));
  expect(code).toContain("<style>");
  const prompt = generatePrompt("button", model, defaultConfig, "ar", colors);
  expect(prompt).toContain("tiraz.theme.css");
  expect(prompt).toContain(css);
  expect(prompt).toContain("tiraz.project.json");
  expect(prompt).toContain("selective");
  expect(prompt).not.toContain("copy the whole source root");
  expect(prompt).not.toContain("Read ai/README.md and ai/composition.md.");
});

it("keeps brand changes in the preview, persists them and resets them explicitly", async () => {
  persist(storageKeys.documentation, { language: "en" });
  window.history.replaceState({}, "", "/library/components/button");
  const user = userEvent.setup();
  const view = render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "Customize" }));
  const panel = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  );
  const color = panel.getByRole("textbox", {
    name: "Brand color · light mode",
  });
  await user.clear(color);
  await user.type(color, "#123456{Enter}");
  expect(color).toHaveFocus();
  expect(panel.getByRole("radio", { name: "Green" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expect(panel.getByText("Custom")).toBeVisible();
  expect(
    view.container
      .querySelector<HTMLElement>(".playground-region")
      ?.style.getPropertyValue("--tiraz-action"),
  ).toBe("#123456");
  expect(
    view.container
      .querySelector<HTMLElement>(".docs-shell")
      ?.style.getPropertyValue("--tiraz-action"),
  ).toBe("");
  view.unmount();
  const next = render(<Workbench />);
  expect(
    screen.getByRole("textbox", { name: "Brand color · light mode" }),
  ).toHaveValue("#123456");
  await user.click(screen.getByRole("radio", { name: "Blue" }));
  expect(
    next.container
      .querySelector<HTMLElement>(".playground-region")
      ?.style.getPropertyValue("--tiraz-action"),
  ).toBe("");
  await user.clear(
    screen.getByRole("textbox", { name: "Brand color · light mode" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Brand color · light mode" }),
    "#abcdef{Enter}",
  );
  await user.click(screen.getByRole("button", { name: "Reset system" }));
  expect(
    next.container
      .querySelector<HTMLElement>(".playground-region")
      ?.style.getPropertyValue("--tiraz-action"),
  ).toBe("");
});

it.each(["ar", "en"] as const)(
  "copies the theme and exposes a selectable fallback without losing focus in %s",
  async (language) => {
    persist(storageKeys.documentation, { language });
    window.history.replaceState({}, "", "/library/components/button");
    const user = userEvent.setup();
    const clipboard = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValueOnce(new Error("denied"));
    render(<Workbench />);
    await user.click(
      screen.getByRole("button", {
        name: language === "ar" ? "تخصيص" : "Customize",
      }),
    );
    const panel = within(
      screen.getByRole("complementary", {
        name: language === "ar" ? "تخصيص المعاينة" : "Customize the preview",
      }),
    );
    const copy = panel.getByRole("button", {
      name: language === "ar" ? "نسخ ملف المظهر" : "Copy theme CSS",
    });
    await user.click(copy);
    const fallback = await panel.findByRole("textbox", {
      name: language === "ar" ? "ملف المظهر CSS" : "Theme CSS",
    });
    expect(copy).toHaveFocus();
    expect(fallback).toHaveAttribute("readonly");
    expect(fallback).toHaveAttribute("dir", "ltr");
    expect(fallback).toHaveValue(clipboard.mock.calls[0][0]);
    expect(fallback).toHaveAccessibleDescription(
      language === "ar"
        ? "تعذّر النسخ. حدّد النص وانسخه يدويًا."
        : "Copy failed. Select and copy the text manually.",
    );
    expect(panel.getAllByRole("status")).toHaveLength(1);
    clipboard.mockRestore();
  },
);

it("opens the standalone example with its saved custom colors", () => {
  persist(storageKeys.brandColors, { light: "#123456", dark: "#ABCDEF" });
  persist(storageKeys.theme, "dark");
  const view = render(<StandalonePlayground component="button" />);
  expect(view.container.querySelector("style")?.textContent).toContain(
    "--tiraz-action: #ABCDEF",
  );
  expect(view.container.querySelector("style")?.textContent).toContain(
    "--action-text: #000000",
  );
});

it("keeps custom action text readable on hover in either theme", () => {
  const css = generateThemeCss(defaultConfig, {
    light: "#777777",
    dark: "#737373",
  });
  expect(css).toContain("--action-hover: #858585");
  expect(css).toContain("--action-hover: #656565");
  expect(themeStyle(defaultConfig, { light: "#777777" })).toHaveProperty(
    "--preview-action-hover",
    "#858585",
  );
});
it.each(["selection-actions", "context-meter", "model-selector"] as const)(
  "does not ask %s consumers to replace their selective source",
  (id) => {
    const prompt = generatePrompt(
      id,
      defaultPlaygrounds("en")[id],
      defaultConfig,
      "en",
    );
    expect(prompt).not.toMatch(/copy the (whole|complete) source/i);
  },
);
