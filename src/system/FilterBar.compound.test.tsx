import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef, useState } from "react";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

type User = ReturnType<typeof userEvent.setup>;
const directions = ["rtl", "ltr"] as const;
type Direction = (typeof directions)[number];
const provider = (direction: Direction, children: ReactNode) => (
  <Tiraz.SystemProvider config={{ ...Tiraz.defaultConfig, direction }}>
    {children}
  </Tiraz.SystemProvider>
);

// DOM of the convenience FilterBar before the compound parts existed. React ids
// are renumbered by first appearance so both sides compare structure.
const before: Record<string, string> = JSON.parse(
  readFileSync(resolve("src/tests/filter-bar-convenience-dom.json"), "utf8"),
);
function markup() {
  for (const child of [...document.body.children])
    if (child.localName === "div" && !child.childNodes.length) child.remove();
  const seen = new Map<string, string>();
  return document.body.innerHTML.replace(/_r_[0-9a-z]+_/g, (id) => {
    if (!seen.has(id)) seen.set(id, `r${seen.size + 1}`);
    return seen.get(id)!;
  });
}

const noop = () => {};
const chips = (): Tiraz.FilterBarFilter[] => [
  { id: "query", label: "Ada", removeLabel: "Remove search", onRemove: noop },
  {
    id: "status",
    label: "Active",
    removeLabel: "Remove status",
    onRemove: noop,
  },
  { id: "kind", label: "Guides", removeLabel: "Remove kind", onRemove: noop },
];
const search = () => <Tiraz.Input aria-label="Search" defaultValue="Ada" />;
const controls = () => (
  <>
    <select aria-label="Kind">
      <option>All kinds</option>
    </select>
    <Tiraz.Button variant="ghost">Export</Tiraz.Button>
  </>
);

// The convenience props written as parts.
function CompoundFilterBar({
  search,
  filters = [],
  children,
  ...root
}: Tiraz.FilterBarProps): ReturnType<typeof Tiraz.FilterBar> {
  return (
    <Tiraz.FilterBarRoot {...root}>
      {search && <Tiraz.FilterBarSearch>{search}</Tiraz.FilterBarSearch>}
      {children}
      {filters.map((filter) => (
        <Tiraz.FilterBarChip key={filter.id} {...filter} />
      ))}
    </Tiraz.FilterBarRoot>
  );
}
function Removable({ compound }: { compound: boolean }) {
  const [list, setList] = useState(chips().slice(0, 2));
  const Bar = compound ? CompoundFilterBar : Tiraz.FilterBar;
  return (
    <Bar
      label="Filters"
      search={search()}
      filters={list.map((chip) => ({
        ...chip,
        onRemove: () => setList((l) => l.filter((c) => c.id !== chip.id)),
      }))}
      onClearAll={() => setList([])}
    />
  );
}

interface Case {
  key: string;
  convenience: ReactNode;
  compound: ReactNode;
  act?: (user: User) => Promise<void>;
}
function cases(direction: Direction): Case[] {
  const both = (
    props: Tiraz.FilterBarProps,
  ): Pick<Case, "convenience" | "compound"> => ({
    convenience: provider(direction, <Tiraz.FilterBar {...props} />),
    compound: provider(direction, <CompoundFilterBar {...props} />),
  });
  return [
    {
      key: `filter-bar-${direction}-bare`,
      ...both({ label: "Filters" }),
    },
    {
      key: `filter-bar-${direction}-controls`,
      ...both({
        label: "Filters",
        search: search(),
        onClearAll: noop,
        children: controls(),
      }),
    },
    {
      key: `filter-bar-${direction}-active`,
      ...both({
        label: "Customer filters",
        search: search(),
        filters: chips(),
        onClearAll: noop,
        className: "extra",
        id: "bar",
        "data-testid": "bar",
        children: controls(),
      } as Tiraz.FilterBarProps),
    },
    {
      key: `filter-bar-${direction}-disabled`,
      ...both({
        label: "Filters",
        filters: chips().slice(0, 2),
        onClearAll: noop,
        clearLabel: "Reset",
        disabled: true,
        children: controls(),
      }),
    },
    {
      key: `filter-bar-${direction}-filters-only`,
      ...both({ label: "Filters", filters: chips().slice(0, 1) }),
    },
    {
      key: `filter-bar-${direction}-removed`,
      convenience: provider(direction, <Removable compound={false} />),
      compound: provider(direction, <Removable compound />),
      act: async (user) => {
        await user.click(screen.getByRole("button", { name: "Remove status" }));
      },
    },
  ];
}

afterEach(() => vi.restoreAllMocks());

it("exports every compound part as a function", () => {
  for (const name of [
    "FilterBarRoot",
    "FilterBarSearch",
    "FilterBarChip",
  ] as const)
    expect(Tiraz[name], name).toBeTypeOf("function");
});

describe.each(directions)("convenience markup in %s", (direction) => {
  const entries = cases(direction).map((entry) => [entry.key, entry] as const);
  it.each(entries)("%s is unchanged from the capture", async (key, entry) => {
    const user = userEvent.setup();
    render(entry.convenience);
    await entry.act?.(user);
    expect(markup()).toBe(before[key]);
  });
  it.each(entries)("%s equals the compound markup", async (_, entry) => {
    const user = userEvent.setup();
    const wrapped = render(entry.convenience);
    await entry.act?.(user);
    const convenience = markup();
    wrapped.unmount();
    render(entry.compound);
    await entry.act?.(user);
    expect(markup()).toBe(convenience);
  });
});

it("captures exactly the cases compared", () => {
  const keys = directions.flatMap((d) => cases(d).map((entry) => entry.key));
  expect(Object.keys(before).sort()).toEqual(keys.sort());
});

describe("FilterBarRoot with parts", () => {
  function Example({
    onRemove = noop,
    onClearAll = noop,
    ids = ["query", "status"],
    direction = "ltr",
    ...root
  }: {
    onRemove?: (id: string) => void;
    onClearAll?: () => void;
    ids?: string[];
    direction?: Direction;
  } & Partial<Tiraz.FilterBarRootProps>) {
    const [query, setQuery] = useState("Ada");
    const [active, setActive] = useState(ids);
    return provider(
      direction,
      <>
        <Tiraz.FilterBarRoot
          label="Customer filters"
          onClearAll={() => {
            onClearAll();
            setActive([]);
          }}
          {...root}
        >
          <Tiraz.FilterBarSearch>
            <Tiraz.Input
              aria-label="Search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
          </Tiraz.FilterBarSearch>
          <Tiraz.Button variant="ghost">Export</Tiraz.Button>
          {active.map((id) => (
            <Tiraz.FilterBarChip
              key={id}
              id={id}
              label={id}
              removeLabel={`Remove ${id}`}
              onRemove={() => {
                onRemove(id);
                setActive((list) => list.filter((item) => item !== id));
              }}
            />
          ))}
        </Tiraz.FilterBarRoot>
        <output aria-label="Query">{query}</output>
      </>,
    );
  }

  it("names the group and lays search, controls and chips out in their regions", () => {
    const { container } = render(<Example />);
    const group = screen.getByRole("group", { name: "Customer filters" });
    const controls = group.querySelector(".tz-filter-controls")!;
    expect([...controls.children].map((node) => node.className)).toEqual([
      "tz-filter-search",
      expect.stringContaining("tz-button"),
    ]);
    expect(controls.querySelector(".tz-filter-search input")).toBe(
      screen.getByRole("textbox", { name: "Search" }),
    );
    const active = group.querySelector(".tz-filter-active")!;
    expect(
      [...active.querySelectorAll(".tz-tag bdi")].map((n) => n.textContent),
    ).toEqual(["query", "status"]);
    expect(container.querySelectorAll('[role="group"]')).toHaveLength(1);
  });

  it("composes a controlled search control", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.type(screen.getByRole("textbox", { name: "Search" }), "m");
    expect(screen.getByLabelText("Query")).toHaveTextContent("Adam");
  });

  it("removes a chip once and moves focus to the next chip, then to a control", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Example onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "Remove query" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith("query");
    expect(screen.getByRole("button", { name: "Remove status" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRemove).toHaveBeenCalledTimes(2);
    expect(onRemove).toHaveBeenLastCalledWith("status");
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
    expect(document.querySelector(".tz-filter-active")).toBeNull();
  });

  it("removes a chip once from the keyboard", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Example onRemove={onRemove} />);
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Remove query" })).toHaveFocus();
    await user.keyboard(" ");
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("clears all once, labels the action by direction and returns focus to a control", async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    render(<Example onClearAll={onClearAll} direction="rtl" />);
    await user.click(screen.getByRole("button", { name: "مسح الكل" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "مسح الكل" })).toBeNull();
  });

  it("uses the supplied clearLabel and shows Clear all only while chips exist", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Example clearLabel="Reset" />);
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    unmount();
    render(<Example ids={[]} clearLabel="Reset" />);
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
    await user.tab();
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
  });

  it("omits Clear all without onClearAll", () => {
    render(
      provider(
        "ltr",
        <Tiraz.FilterBarRoot label="Filters">
          <Tiraz.FilterBarChip
            id="one"
            label="One"
            removeLabel="Remove one"
            onRemove={noop}
          />
        </Tiraz.FilterBarRoot>,
      ),
    );
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("disables removal and Clear all without calling either", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClearAll = vi.fn();
    render(
      <Example onRemove={onRemove} onClearAll={onClearAll} disabled={true} />,
    );
    const remove = screen.getByRole("button", { name: "Remove query" });
    expect(remove).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeDisabled();
    await user.click(remove);
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(onClearAll).not.toHaveBeenCalled();
  });

  it("returns focus to the group when no control remains", async () => {
    const user = userEvent.setup();
    render(
      provider(
        "ltr",
        <Tiraz.FilterBarRoot label="Filters">
          <Tiraz.FilterBarChip
            id="one"
            label="One"
            removeLabel="Remove one"
            onRemove={noop}
          />
        </Tiraz.FilterBarRoot>,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Remove one" }));
    expect(screen.getByRole("group", { name: "Filters" })).toHaveFocus();
  });

  it("places chips in the active region wherever they are authored, keeping other children in order", () => {
    render(
      provider(
        "ltr",
        <Tiraz.FilterBarRoot label="Filters">
          <Tiraz.FilterBarChip
            id="one"
            label="One"
            removeLabel="Remove one"
            onRemove={noop}
          />
          {false}
          {null}
          <Tiraz.Button variant="ghost">First</Tiraz.Button>
          <Tiraz.FilterBarSearch>
            <Tiraz.Input aria-label="Search" />
          </Tiraz.FilterBarSearch>
          <Tiraz.Button variant="ghost">Last</Tiraz.Button>
          <Tiraz.FilterBarChip
            id="two"
            label="Two"
            removeLabel="Remove two"
            onRemove={noop}
          />
        </Tiraz.FilterBarRoot>,
      ),
    );
    const group = screen.getByRole("group", { name: "Filters" });
    expect(
      [...group.querySelector(".tz-filter-controls")!.children].map(
        (node) => node.textContent || node.className,
      ),
    ).toEqual(["First", "tz-filter-search", "Last"]);
    expect(
      [...group.querySelectorAll(".tz-filter-active .tz-tag bdi")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["One", "Two"]);
  });

  it("lets a chip omit onRemove", async () => {
    const user = userEvent.setup();
    render(
      provider(
        "ltr",
        <Tiraz.FilterBarRoot label="Filters">
          <Tiraz.FilterBarChip id="one" label="One" removeLabel="Remove one" />
        </Tiraz.FilterBarRoot>,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Remove one" }));
    expect(screen.getByRole("group", { name: "Filters" })).toHaveFocus();
  });

  it("forwards ref, native attributes and className to the group", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      provider(
        "ltr",
        <Tiraz.FilterBarRoot
          ref={ref}
          label="Filters"
          id="bar"
          className="extra"
          data-testid="bar"
        >
          <Tiraz.FilterBarSearch>
            <Tiraz.Input aria-label="Search" />
          </Tiraz.FilterBarSearch>
        </Tiraz.FilterBarRoot>,
      ),
    );
    const group = screen.getByRole("group", { name: "Filters" });
    expect(ref.current).toBe(group);
    expect(group).toHaveAttribute("id", "bar");
    expect(group).toHaveAttribute("data-testid", "bar");
    expect(group).toHaveClass("tz-filter-bar", "extra");
    expect(group).toHaveAttribute("tabindex", "-1");
  });

  it("keeps forwarding ref from the convenience FilterBar", () => {
    const ref = createRef<HTMLDivElement>();
    render(provider("ltr", <Tiraz.FilterBar ref={ref} label="Filters" />));
    expect(ref.current).toBe(screen.getByRole("group", { name: "Filters" }));
  });

  it.each([
    [
      "FilterBarChip",
      <Tiraz.FilterBarChip id="a" label="A" removeLabel="Remove a" key="a" />,
    ],
    [
      "FilterBarSearch",
      <Tiraz.FilterBarSearch key="b">
        <input aria-label="Search" />
      </Tiraz.FilterBarSearch>,
    ],
  ])("%s outside FilterBarRoot says what it needs", (name, part) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(provider("ltr", part))).toThrow(
      `${name} requires FilterBarRoot.`,
    );
  });
});
