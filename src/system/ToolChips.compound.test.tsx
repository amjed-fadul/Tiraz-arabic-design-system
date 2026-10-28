import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef } from "react";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

const directions = ["rtl", "ltr"] as const;
type Direction = (typeof directions)[number];
const provider = (
  direction: Direction,
  children: ReactNode,
  config: Partial<Tiraz.SystemConfig> = {},
) => (
  <Tiraz.SystemProvider
    config={{ ...Tiraz.defaultConfig, direction, ...config }}
  >
    {children}
  </Tiraz.SystemProvider>
);

// DOM of the convenience ToolChips before the ToolChip part existed.
const before: Record<string, string> = JSON.parse(
  readFileSync(resolve("src/tests/tool-chips-convenience-dom.json"), "utf8"),
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
const states: Tiraz.ToolChipItem[] = [
  { id: "read", label: "Read files", state: "completed", count: 3 },
  { id: "check", label: "Proofread", state: "running" },
  { id: "pending", label: "Prepare", state: "pending" },
  { id: "ask", label: "Needs approval", state: "needs-you" },
  { id: "fail", label: "Send", state: "failed" },
];
const actions: Tiraz.ToolChipItem[] = [
  {
    id: "open",
    label: "Open",
    state: "completed",
    count: 2.7,
    onActivate: noop,
    controls: "details-open",
    expanded: true,
  },
  {
    id: "closed",
    label: "Closed",
    state: "running",
    onActivate: noop,
    controls: "details-closed",
    expanded: false,
  },
  // Disclosure wiring needs a real action; without onActivate it is dropped.
  { id: "info", label: "Info", state: "pending", controls: "details-info" },
  {
    id: "bare",
    label: "Bare",
    state: "failed",
    onActivate: noop,
    expanded: true,
  },
  { id: "zero", label: "Zero", state: "completed", count: 0 },
  { id: "negative", label: "Negative", state: "completed", count: -1 },
  { id: "nan", label: "NaN", state: "completed", count: Number.NaN },
  { id: "inf", label: "Inf", state: "completed", count: Infinity },
];
// The convenience items written as parts.
function CompoundChips({
  items = [],
  ...props
}: Tiraz.ToolChipsProps): ReturnType<typeof Tiraz.ToolChips> {
  return (
    <Tiraz.ToolChips {...props}>
      {items.map((item) => (
        <Tiraz.ToolChip key={item.id} {...item} />
      ))}
    </Tiraz.ToolChips>
  );
}

interface Case {
  key: string;
  convenience: ReactNode;
  compound: ReactNode;
}
function cases(direction: Direction): Case[] {
  const both = (
    props: Tiraz.ToolChipsProps,
    config?: Partial<Tiraz.SystemConfig>,
  ): Pick<Case, "convenience" | "compound"> => ({
    convenience: provider(direction, <Tiraz.ToolChips {...props} />, config),
    compound: provider(direction, <CompoundChips {...props} />, config),
  });
  return [
    {
      key: `tool-chips-${direction}-empty`,
      ...both({ label: "Tools", items: [] }),
    },
    {
      key: `tool-chips-${direction}-states`,
      ...both({
        label: "Tool activity",
        items: states,
        className: "extra",
        id: "chips",
        "data-testid": "chips",
      } as Tiraz.ToolChipsProps),
    },
    {
      key: `tool-chips-${direction}-actions`,
      ...both({ label: "Tool activity", items: actions }),
    },
    {
      key: `tool-chips-${direction}-labels`,
      ...both({
        label: "Tool activity",
        items: states,
        labels: { running: "Working", completed: "Finished" },
      }),
    },
    {
      key: `tool-chips-${direction}-latin-digits`,
      ...both({ label: "Tool activity", items: states }, { numerals: "latn" }),
    },
  ];
}

afterEach(() => vi.restoreAllMocks());

describe.each(directions)("convenience markup in %s", (direction) => {
  const entries = cases(direction).map((entry) => [entry.key, entry] as const);
  it.each(entries)("%s is unchanged from the capture", (key, entry) => {
    render(entry.convenience);
    expect(markup()).toBe(before[key]);
  });
  it.each(entries)("%s equals the compound markup", (_, entry) => {
    const wrapped = render(entry.convenience);
    const convenience = markup();
    wrapped.unmount();
    render(entry.compound);
    expect(markup()).toBe(convenience);
  });
});

it("captures exactly the cases compared", () => {
  const keys = directions.flatMap((d) => cases(d).map((entry) => entry.key));
  expect(Object.keys(before).sort()).toEqual(keys.sort());
});

describe("ToolChips with ToolChip parts", () => {
  it("exports the part as a function", () => {
    expect(Tiraz.ToolChip).toBeTypeOf("function");
  });

  it("activates each chip through its own onActivate, once", async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    const retry = vi.fn();
    render(
      provider(
        "ltr",
        <Tiraz.ToolChips label="Tool activity">
          <Tiraz.ToolChip
            id="read"
            label="Read files"
            state="completed"
            count={3}
            onActivate={open}
          />
          <Tiraz.ToolChip
            id="send"
            label="Send"
            state="failed"
            onActivate={retry}
          />
          <Tiraz.ToolChip id="check" label="Proofread" state="running" />
        </Tiraz.ToolChips>,
      ),
    );
    const list = screen.getByRole("list", { name: "Tool activity" });
    expect(list.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getAllByRole("button")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /Read files/ }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(retry).not.toHaveBeenCalled();
    screen.getByRole("button", { name: /Send/ }).focus();
    await user.keyboard("{Enter}");
    expect(retry).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
    // The chip without an action is information: no button semantics.
    expect(screen.queryByRole("button", { name: /Proofread/ })).toBeNull();
    expect(
      list.querySelectorAll("li")[2].querySelector("span.tz-tool-chip"),
    ).not.toBeNull();
  });

  it("wires disclosure as it does for items: aria-controls and aria-expanded on actionable chips only", () => {
    render(
      provider(
        "ltr",
        <Tiraz.ToolChips label="Tool activity">
          <Tiraz.ToolChip
            id="a"
            label="Open"
            state="completed"
            onActivate={noop}
            controls="panel-a"
            expanded
          />
          <Tiraz.ToolChip
            id="b"
            label="Closed"
            state="completed"
            onActivate={noop}
            controls="panel-b"
            expanded={false}
          />
          <Tiraz.ToolChip
            id="c"
            label="No details"
            state="completed"
            onActivate={noop}
            expanded
          />
          <Tiraz.ToolChip
            id="d"
            label="Info"
            state="completed"
            controls="panel-d"
          />
        </Tiraz.ToolChips>,
      ),
    );
    const open = screen.getByRole("button", { name: /Open/ });
    expect(open).toHaveAttribute("aria-controls", "panel-a");
    expect(open).toHaveAttribute("aria-expanded", "true");
    const closed = screen.getByRole("button", { name: /Closed/ });
    expect(closed).toHaveAttribute("aria-controls", "panel-b");
    expect(closed).toHaveAttribute("aria-expanded", "false");
    const bare = screen.getByRole("button", { name: /No details/ });
    expect(bare).not.toHaveAttribute("aria-controls");
    expect(bare).not.toHaveAttribute("aria-expanded");
    expect(document.querySelectorAll("[aria-controls]")).toHaveLength(2);
  });

  it("names the state with the labels the list was given, in the reader's digits", () => {
    render(
      provider(
        "rtl",
        <Tiraz.ToolChips label="نشاط الأدوات" labels={{ running: "جارٍ" }}>
          <Tiraz.ToolChip id="r" label="قراءة" state="running" />
          <Tiraz.ToolChip id="d" label="تدقيق" state="completed" count={3} />
        </Tiraz.ToolChips>,
      ),
    );
    const list = screen.getByRole("list", { name: "نشاط الأدوات" });
    expect(list).toHaveTextContent("جارٍ");
    expect(list).toHaveTextContent("مكتملة");
    expect(list.querySelector(".tz-tool-count")).toHaveTextContent("٣");
  });

  it("keeps items first, then parts", () => {
    render(
      provider(
        "ltr",
        <Tiraz.ToolChips
          label="Tool activity"
          items={[{ id: "one", label: "One", state: "completed" }]}
        >
          <Tiraz.ToolChip id="two" label="Two" state="running" />
        </Tiraz.ToolChips>,
      ),
    );
    expect(
      [...screen.getAllByRole("listitem")].map((node) => node.textContent),
    ).toEqual(["OneDone", "TwoRunning"]);
  });

  it("forwards ref, native attributes and className to the list", () => {
    const ref = createRef<HTMLUListElement>();
    render(
      provider(
        "ltr",
        <Tiraz.ToolChips
          ref={ref}
          label="Tool activity"
          className="extra"
          id="chips"
        >
          <Tiraz.ToolChip id="one" label="One" state="pending" />
        </Tiraz.ToolChips>,
      ),
    );
    const list = screen.getByRole("list", { name: "Tool activity" });
    expect(ref.current).toBe(list);
    expect(list).toHaveClass("tz-tool-chips", "extra");
    expect(list).toHaveAttribute("id", "chips");
  });

  it("says what ToolChip needs outside ToolChips", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        provider("ltr", <Tiraz.ToolChip id="a" label="A" state="running" />),
      ),
    ).toThrow("ToolChip requires ToolChips.");
  });

  it("checks the parts at compile time", () => {
    const bad = [
      // @ts-expect-error a chip needs its state
      <Tiraz.ToolChip id="a" label="A" key="1" />,
      // @ts-expect-error a chip needs its label
      <Tiraz.ToolChip id="a" state="running" key="2" />,
      // @ts-expect-error a chip's state is one of the five
      <Tiraz.ToolChip id="a" label="A" state="stuck" key="3" />,
    ];
    expect(bad).toHaveLength(3);
    const ok: ReactNode[] = [
      <Tiraz.ToolChips label="Tools" key="a" />,
      <Tiraz.ToolChips label="Tools" items={[]} key="b" />,
    ];
    expect(ok).toHaveLength(2);
  });
});
