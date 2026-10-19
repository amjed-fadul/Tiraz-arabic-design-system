import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { FileDropzone } from "./FileDropzone";
import { FilterBar } from "./FilterBar";
import { Input } from "./Input";
import { SystemProvider } from "./Provider";
import { TagInput } from "./TagInput";
import { defaultConfig } from "./config";
import { auditFamily, familyRuleCount, unmatchedPrefixes } from "./css-audit";
import { wovenFamilies } from "./css-audit.families";

// RemoveButton is the one remove control of TagInput, FilterBar and
// FileDropzone. It is internal, so it is tested through its three callers: each
// keeps its own label and onClick logic and takes the shared class. It is a
// plain button, never .tz-button, because Button's hover rule out-ranked the
// FilterBar chip's own and hid its hover (Woven spec, defect 4).

type Direction = "ltr" | "rtl";
const mount = (node: ReactNode, direction: Direction = "ltr") =>
  render(
    <SystemProvider config={{ ...defaultConfig, direction }}>
      {node}
    </SystemProvider>,
  );

const file = (name: string) =>
  new File(["abc"], name, { type: "text/plain", lastModified: 1 });

/** A FilterBar with two filters whose removal the host owns, as an application's would be. */
function Filters() {
  const [ids, setIds] = useState(["status", "owner"]);
  return (
    <FilterBar
      label="Filters"
      search={<Input aria-label="Search" />}
      filters={ids.map((id) => ({
        id,
        label: id,
        removeLabel: `Remove ${id}`,
        onRemove: () => setIds((now) => now.filter((other) => other !== id)),
      }))}
    />
  );
}

// Each row mounts a caller with two items. The names are what the caller gives
// its remove buttons: the defaults in each language for a tag and a file, and
// the host's own removeLabel for a filter.
const callers: Array<{
  name: string;
  direction: Direction;
  view: ReactNode;
  first: string;
  second: string;
}> = [
  {
    name: "TagInput",
    direction: "ltr",
    view: <TagInput label="Tags" defaultValue={["One", "Two"]} />,
    first: "Remove One",
    second: "Remove Two",
  },
  {
    name: "TagInput",
    direction: "rtl",
    view: <TagInput label="الوسوم" defaultValue={["أول", "ثان"]} />,
    first: "حذف أول",
    second: "حذف ثان",
  },
  {
    name: "FilterBar",
    direction: "ltr",
    view: <Filters />,
    first: "Remove status",
    second: "Remove owner",
  },
  {
    name: "FileDropzone",
    direction: "ltr",
    view: (
      <FileDropzone
        label="Files"
        multiple
        defaultValue={[file("a.txt"), file("b.txt")]}
      />
    ),
    first: "Remove a.txt",
    second: "Remove b.txt",
  },
  {
    name: "FileDropzone",
    direction: "rtl",
    view: (
      <FileDropzone
        label="الملفات"
        multiple
        defaultValue={[file("a.txt"), file("b.txt")]}
      />
    ),
    first: "إزالة a.txt",
    second: "إزالة b.txt",
  },
];

it.each(callers)(
  "$name ($direction) removes an item with the shared remove button",
  async ({ direction, view, first, second }) => {
    const user = userEvent.setup();
    mount(view, direction);
    const remove = screen.getByRole("button", { name: first });
    expect(remove).toHaveClass("tz-remove-button");
    expect(remove).not.toHaveClass("tz-button");
    expect(remove).toHaveAttribute("type", "button");
    await user.click(remove);
    expect(
      screen.queryByRole("button", { name: first }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: second })).toBeInTheDocument();
  },
);

it("moves focus to the next remove button after a removal", async () => {
  const user = userEvent.setup();
  mount(<Filters />);
  await user.click(screen.getByRole("button", { name: "Remove status" }));
  expect(
    screen.queryByRole("button", { name: "Remove status" }),
  ).not.toBeInTheDocument();
  // Not the search field, which is where focus falls after the last removal.
  expect(screen.getByRole("button", { name: "Remove owner" })).toHaveFocus();
});

it("passes the Woven CSS audit", () => {
  const css = readFileSync(resolve("src/system/components.css"), "utf8");
  const prefixes = [".tz-remove-button"];
  expect(wovenFamilies["remove-button"]).toEqual(prefixes);
  // An audit of a prefix that names no rule passes by auditing nothing.
  expect(unmatchedPrefixes(css, prefixes)).toEqual([]);
  expect(familyRuleCount(css, prefixes)).toBeGreaterThan(0);
  expect(auditFamily(css, prefixes)).toEqual([]);
});
