import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { ArabicRtlPage } from "./ArabicRtlPage";

const navigate = () => {};

it.each([
  [
    "en",
    [
      "Direction and layout",
      "Icons",
      "Numbers and digits",
      "Mixed text",
      "Arabic typography",
    ],
  ],
  [
    "ar",
    ["الاتجاه والتخطيط", "الأيقونات", "الأرقام", "النص المختلط", "الخط العربي"],
  ],
] as const)("renders the five sections in %s", (language, headings) => {
  render(<ArabicRtlPage language={language} navigate={navigate} />);
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
  ).toEqual(headings);
});

it("formats digits per column", () => {
  render(<ArabicRtlPage language="en" navigate={navigate} />);
  const cells = (column: string) =>
    Array.from(document.querySelectorAll(`td[data-column="${column}"]`)).map(
      (cell) => cell.textContent ?? "",
    );
  expect(cells("arab").join("")).toMatch(/٣/);
  expect(cells("arab").join("")).not.toMatch(/[0-9]/);
  for (const column of ["latn", "en"]) {
    expect(cells(column).join("")).toMatch(/3/);
    expect(cells(column).join("")).not.toMatch(/[٠-٩]/);
  }
});

it("shows the same row in an RTL and an LTR box", () => {
  render(<ArabicRtlPage language="en" navigate={navigate} />);
  expect(screen.getByTestId("box-rtl")).toHaveAttribute("dir", "rtl");
  expect(screen.getByTestId("box-ltr")).toHaveAttribute("dir", "ltr");
  expect(
    within(screen.getByTestId("box-rtl")).getByRole("button"),
  ).toBeInTheDocument();
});

it("isolates names and identifiers with bdi", () => {
  render(<ArabicRtlPage language="ar" navigate={navigate} />);
  const bdis = screen.getByTestId("mixed").querySelectorAll("bdi");
  expect(bdis.length).toBeGreaterThanOrEqual(2);
  expect(Array.from(bdis).map((b) => b.textContent)).toContain("Sara Ahmed");
});
