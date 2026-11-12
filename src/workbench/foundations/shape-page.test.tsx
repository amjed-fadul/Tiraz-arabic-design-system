import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ShapePage } from "./ShapePage";

const css = readFileSync("src/system/tokens.css", "utf8");
const radii = ["small", "item", "control", "paper", "tray", "pill"].map(
  (name) => `--radius-${name}`,
);
const shadows = [
  "control",
  "raised",
  "pressed",
  "popover",
  "overlay",
  "thumb",
  "paper",
  "chip",
].map((name) => `--shadow-${name}`);

it.each([
  ["en", "Shape and elevation"],
  ["ar", "الأشكال والظلال"],
] as const)("renders the %s title", (language, title) => {
  render(<ShapePage language={language} navigate={() => {}} />);
  expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
});

it("lists every radius and shadow, all of which exist", () => {
  const { container } = render(<ShapePage language="en" navigate={() => {}} />);
  const claimed = [...container.querySelectorAll("code")]
    .map((code) => code.textContent ?? "")
    .filter((text) => text.startsWith("--"));
  for (const token of [...radii, ...shadows, "--radius"])
    expect(claimed).toContain(token);
  expect(container.querySelectorAll(".shape-radius")).toHaveLength(
    radii.length,
  );
  expect(container.querySelectorAll(".shape-shadow")).toHaveLength(
    shadows.length,
  );
  // --radius itself is set by the provider, not tokens.css.
  for (const token of new Set(claimed))
    if (token !== "--radius")
      expect(css, token).toMatch(new RegExp(`${token}:`));
});
