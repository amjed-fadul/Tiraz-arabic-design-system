import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { sidebarIconNames } from "../../system";
import { IconsPage } from "./IconsPage";

const navigate = () => {};

it.each([
  ["en", "Icons"],
  ["ar", "الأيقونات"],
] as const)("renders the %s title", (language, title) => {
  render(<IconsPage language={language} navigate={navigate} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(title);
});

it("renders every sidebar icon name once, with a hidden icon", () => {
  render(<IconsPage language="en" navigate={navigate} />);
  const grid = screen.getByTestId("icons-grid");
  const cells = within(grid).getAllByRole("listitem");
  expect(cells).toHaveLength(sidebarIconNames.length);
  expect(cells.map((cell) => cell.querySelector("code")?.textContent)).toEqual([
    ...sidebarIconNames,
  ]);
  for (const cell of cells) {
    expect(cell.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  }
});

it("names the icon-only buttons", () => {
  render(<IconsPage language="en" navigate={navigate} />);
  expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
});

it("hides decorative sample icons", () => {
  render(<IconsPage language="en" navigate={navigate} />);
  for (const id of ["icons-sizes", "icons-colors"]) {
    const svgs = screen.getByTestId(id).querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs)
      expect(svg.getAttribute("aria-hidden")).toBe("true");
  }
});

it("links to the Arabic and RTL page", () => {
  render(<IconsPage language="en" navigate={navigate} />);
  expect(
    screen
      .getByRole("link", { name: "See Arabic and RTL" })
      .getAttribute("href"),
  ).toBe("/foundations/arabic-rtl");
});
