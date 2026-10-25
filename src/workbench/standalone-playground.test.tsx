import { cleanup, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { StandalonePlayground } from "./StandalonePlayground";
import { defaultPlaygrounds } from "./model";
import { defaultSettings, persist, storageKeys } from "./storage";

it("opens the playground in a new tab as it was on screen", () => {
  persist(storageKeys.documentation, { language: "en", active: "button" });
  persist(storageKeys.theme, "dark");
  persist(storageKeys.system, {
    ...defaultSettings,
    density: "standard",
    numerals: "latn",
    radius: 12,
  });
  persist(storageKeys.playgrounds, {
    ...defaultPlaygrounds("en"),
    button: {
      ...defaultPlaygrounds("en").button,
      children: "Send invoice",
      variant: "secondary",
    },
  });
  render(<Workbench />);
  const link = screen.getByRole("link", {
    name: "Open the playground in a new tab",
  });
  expect(link).toHaveAttribute("href", "/examples/playground/button");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener");
  expect(link).toHaveAttribute("title", "Open the playground in a new tab");
  cleanup();
  render(<StandalonePlayground component="button" />);
  expect(document.title).toBe("Button · Tiraz");
  expect(screen.getByRole("heading", { level: 1, name: "Button" })).toHaveClass(
    "tz-visually-hidden",
  );
  // No workbench chrome: the example, and a way back to its page.
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(screen.queryByRole("complementary")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Back to the documentation" }),
  ).toHaveAttribute("href", "/");
  // The stored props and system settings.
  const example = screen.getByRole("button", { name: "Send invoice" });
  expect(example).toHaveAttribute("data-variant", "secondary");
  const system = example.closest(".tiraz-system") as HTMLElement;
  expect(system).toHaveAttribute("dir", "ltr");
  expect(system).toHaveAttribute("data-theme", "dark");
  expect(system).toHaveAttribute("data-density", "standard");
  expect(system).toHaveAttribute("data-numerals", "latn");
  expect(system.style.getPropertyValue("--radius")).toBe(
    "var(--tiraz-radius, 12px)",
  );
});
