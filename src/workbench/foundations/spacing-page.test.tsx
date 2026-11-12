import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SpacingPage } from "./SpacingPage";

const css = readFileSync("src/system/tokens.css", "utf8");
const scale = [1, 2, 3, 4, 5, 6, 8, 10].map((n) => `--space-${n}`);

it.each([
  ["en", "Spacing and layout"],
  ["ar", "المسافات والتخطيط"],
] as const)("renders the %s title", (language, title) => {
  render(<SpacingPage language={language} navigate={() => {}} />);
  expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
});

it("shows one bar per spacing token, all of which exist, and no control or density sections", () => {
  const { container } = render(
    <SpacingPage language="en" navigate={() => {}} />,
  );
  const bars = [...container.querySelectorAll<HTMLElement>("[data-token]")];
  const named = bars.map((bar) => bar.dataset.token ?? "");
  expect(named).toEqual(scale);
  expect(container.querySelectorAll(".space-row")).toHaveLength(bars.length);
  expect(container.querySelectorAll(".space-bar")).toHaveLength(bars.length);
  const claimed = [...container.querySelectorAll("code")]
    .map((code) => code.textContent ?? "")
    .filter((text) => text.startsWith("--"));
  for (const token of new Set(claimed))
    expect(css, token).toMatch(new RegExp(`${token}:`));
  expect(screen.queryByRole("heading", { name: "Control sizes" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Density" })).toBeNull();
});
