import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TypographyPage } from "./TypographyPage";

const css = readFileSync("src/system/tokens.css", "utf8");
const roles = [
  "display",
  "title",
  "heading",
  "subheading",
  "reading",
  "body",
  "label",
  "meta",
  "micro",
  "figure",
  "figure-small",
];
const tokens = (container: HTMLElement) =>
  [...container.querySelectorAll("code")]
    .map((code) => code.textContent ?? "")
    .filter((text) => text.startsWith("--"));

it.each([
  ["en", "Typography"],
  ["ar", "الخطوط"],
] as const)("renders the %s title", (language, title) => {
  render(<TypographyPage language={language} navigate={() => {}} />);
  expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
});

it("lists one specimen per role with only existing tokens", () => {
  const { container } = render(
    <TypographyPage language="en" navigate={() => {}} />,
  );
  const found = tokens(container);
  for (const role of roles) expect(found).toContain(`--text-${role}`);
  expect(container.querySelectorAll(".type-role")).toHaveLength(roles.length);
  for (const token of new Set(found))
    expect(css, token).toMatch(new RegExp(`${token}:`));
});
