import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { MotionPage } from "./MotionPage";

const css = readFileSync("src/system/tokens.css", "utf8");
const defined = [
  ...new Set(
    [...css.matchAll(/^\s*(--(?:motion|ease)-[a-z-]+):/gm)].map(
      (match) => match[1],
    ),
  ),
];

it.each([
  ["en", "Motion"],
  ["ar", "الحركة"],
] as const)("renders the %s title", (language, title) => {
  render(<MotionPage language={language} navigate={() => {}} />);
  expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
});

it("lists every motion and easing token in tokens.css, and only those", () => {
  const { container } = render(
    <MotionPage language="en" navigate={() => {}} />,
  );
  const claimed = [...container.querySelectorAll("code")]
    .map((code) => code.textContent ?? "")
    .filter((text) => /^--(motion|ease)-/.test(text));
  expect(defined.length).toBeGreaterThan(20);
  expect([...new Set(claimed)].sort()).toEqual([...defined].sort());
  // Each token is the head of exactly one table row.
  const rows = [...container.querySelectorAll(".motion-row > code")].map(
    (code) => code.textContent,
  );
  expect([...rows].sort()).toEqual([...defined].sort());
});

it("offers Play buttons with accessible names", () => {
  render(<MotionPage language="en" navigate={() => {}} />);
  const buttons = screen.getAllByRole("button", { name: /^Play: / });
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) expect(button.textContent).toBe("Play");
});

it("shows the current reduced-motion state", () => {
  render(<MotionPage language="en" navigate={() => {}} />);
  expect(screen.getByText("Full motion")).toBeTruthy();
});
