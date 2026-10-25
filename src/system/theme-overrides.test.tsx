import { expect, it } from "vitest";
import { render } from "@testing-library/react";
import { SystemProvider } from "./Provider";
import { defaultConfig, accentColors } from "./config";

it("allows user CSS to override provider accent and radius while keeping configured defaults", () => {
  const { container, rerender } = render(
    <SystemProvider>
      <span>مرحبا</span>
    </SystemProvider>,
  );
  const system = container.querySelector<HTMLElement>(".tiraz-system")!;
  expect(system.style.getPropertyValue("--action")).toBe(
    `var(--tiraz-action, ${accentColors.sage.light})`,
  );
  expect(system.style.getPropertyValue("--radius")).toBe(
    "var(--tiraz-radius, 8px)",
  );
  rerender(
    <SystemProvider
      config={{ ...defaultConfig, theme: "dark", accent: "blue", radius: 12 }}
    >
      <span>Hello</span>
    </SystemProvider>,
  );
  expect(system.style.getPropertyValue("--action")).toBe(
    `var(--tiraz-action, ${accentColors.blue.dark})`,
  );
  expect(system.style.getPropertyValue("--radius")).toBe(
    "var(--tiraz-radius, 12px)",
  );
});
