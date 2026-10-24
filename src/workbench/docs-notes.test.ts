import { createElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { catalog, navigationCatalog } from "./catalog";
import { docsNotes } from "./docs-notes";
import { localize } from "./i18n";

const ids = navigationCatalog.map((page) => page.id);
const arabic = /[؀-ۿ]/;

it("writes a job, an alternative and something to notice for every page, in both languages", () => {
  // Field opens Input, so it has no page of its own to annotate.
  expect(Object.keys(docsNotes).sort()).toEqual([...ids].sort());
  for (const id of ids) {
    const notes = docsNotes[id]!;
    expect(notes.useWhen.length, `${id} useWhen`).toBeGreaterThan(0);
    // A pattern names the parts it replaces where others name alternatives.
    expect(
      (notes.instead?.length ?? 0) + (notes.replaces?.length ?? 0),
      `${id} instead or replaces`,
    ).toBeGreaterThan(0);
    expect(notes.notice?.length, `${id} notice`).toBeGreaterThan(0);
    const items = [
      ...notes.useWhen,
      ...(notes.instead ?? []).map((item) => item.text),
      ...(notes.notice ?? []),
    ];
    for (const [ar, en] of items) {
      // The Arabic comes first and the English second, and neither is empty.
      expect(ar.trim(), `${id} Arabic`).toMatch(arabic);
      expect(en.trim(), `${id} English`).not.toBe("");
      expect(en, `${id} English`).not.toMatch(arabic);
    }
  }
});

it("points every alternative at another page that opens", () => {
  for (const id of ids)
    for (const item of docsNotes[id]?.instead ?? []) {
      expect(ids, `${id} → ${item.page}`).toContain(item.page);
      expect(item.page, `${id} points at itself`).not.toBe(id);
    }
});

it("shows the three labelled columns of a page's notes, and opens the page an alternative names", () => {
  render(createElement(Workbench));
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
      "link",
      { name: "الأزرار" },
    ),
  );
  const row = () => document.querySelector(".tz-demo-notes") as HTMLElement;
  expect(
    within(row())
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["استخدمه عندما", "استخدم غيره عندما", "لاحظ"]);
  // The row holds this page's own notes, and each alternative is a link.
  const notes = docsNotes.button!;
  expect(within(row()).getByText(notes.useWhen[0][0])).toBeInTheDocument();
  const [first] = notes.instead!;
  const name = localize(
    catalog.find((item) => item.id === first.page)!.name,
    "ar",
  );
  fireEvent.click(within(row()).getByRole("button", { name }));
  expect(screen.getByRole("heading", { level: 1, name })).toBeInTheDocument();
});
