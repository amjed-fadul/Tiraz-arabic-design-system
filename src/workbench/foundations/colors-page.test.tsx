import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { accentColors } from "../../system/config";
import { ColorsPage, contrastBadge } from "./ColorsPage";

const navigate = () => {};

it.each([
  [
    "en",
    [
      "Accent",
      "Text",
      "Surfaces",
      "Borders",
      "Action",
      "Status",
      "Focus",
      "Charts",
    ],
  ],
  [
    "ar",
    [
      "اللون المميّز",
      "النص",
      "الأسطح",
      "الحدود",
      "الإجراء",
      "الحالة",
      "التركيز",
      "المخطّطات",
    ],
  ],
] as const)("renders the section headings in %s", (language, headings) => {
  render(<ColorsPage language={language} navigate={navigate} />);
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
  ).toEqual([...headings]);
});

it("lists every accent preset and marks the current one", () => {
  render(<ColorsPage language="en" navigate={navigate} />);
  const strip = screen.getByRole("list", { name: "Accent colors" });
  const items = within(strip).getAllByRole("listitem");
  expect(items).toHaveLength(Object.keys(accentColors).length);
  const current = within(strip).getAllByRole("img", { current: true });
  expect(current).toHaveLength(1);
  expect(current[0]).toHaveAccessibleName("Green");
});

it("shows each token name once", () => {
  render(<ColorsPage language="en" navigate={navigate} />);
  for (const name of [
    "--text",
    "--surface-well",
    "--border-field",
    "--action-text",
    "--ai-soft",
    "--focus",
    "--chart-clay",
  ]) {
    expect(screen.getAllByText(name, { selector: "code" })).toHaveLength(1);
  }
});

it("builds contrast badge text", () => {
  expect(contrastBadge("#000000", "#ffffff", "en")).toEqual({
    text: "AAA 21.0:1",
    failed: false,
  });
  expect(contrastBadge("#777777", "#ffffff", "en")?.text).toBe(
    "AA large 4.4:1",
  );
  expect(contrastBadge("#cccccc", "#ffffff", "en")?.failed).toBe(true);
  expect(contrastBadge("#000000", "#ffffff", "ar")?.text).toContain("٢١٫٠:١");
  expect(contrastBadge("", "#ffffff", "en")).toBeUndefined();
});
