import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

type User = ReturnType<typeof userEvent.setup>;
const directions = ["rtl", "ltr"] as const;
type Direction = (typeof directions)[number];
const provider = (direction: Direction, children: ReactNode) => (
  <Tiraz.SystemProvider config={{ ...Tiraz.defaultConfig, direction }}>
    {children}
  </Tiraz.SystemProvider>
);

// DOM of the convenience APIs before the compound parts existed. React ids are
// renumbered by first appearance so both sides compare structure, not counters.
const before: Record<string, string> = JSON.parse(
  readFileSync(
    resolve("src/tests/compound-items-convenience-dom.json"),
    "utf8",
  ),
);
function markup(container: HTMLElement) {
  const seen = new Map<string, string>();
  return settle(
    container.innerHTML.replace(/_r_[0-9a-z]+_/g, (id) => {
      if (!seen.has(id)) seen.set(id, `r${seen.size + 1}`);
      return seen.get(id)!;
    }),
  );
}
// Radix holds a panel's mount animation at zero length until the next frame, so
// whether those inline styles remain depends on timing, not on the markup.
function settle(html: string) {
  return html
    .replace(/ style="(animation-duration: 0s;)?"/g, "")
    .replace(/ transition-duration: 0s; animation-name: none;/g, "");
}

const tabItems = (): Tiraz.TabItem[] => [
  { value: "overview", label: "Overview", content: <p>Overview panel</p> },
  {
    value: "billing",
    label: "Billing",
    content: <p>Billing panel</p>,
    disabled: true,
  },
  { value: "team", label: <b>Team</b>, content: <p>Team panel</p> },
];
const sectionItems = (): Tiraz.AccordionItem[] => [
  { value: "a", label: "Delivery", content: <p>Delivery notes</p> },
  {
    value: "b",
    label: "Returns",
    content: <p>Return notes</p>,
    disabled: true,
  },
  { value: "c", label: <i>Payment</i>, content: <p>Payment notes</p> },
];
const taskItems = (): Tiraz.TaskRowItem[] => [
  {
    id: "a",
    title: "Draft quote follow-up",
    summary: "3 drafts",
    state: "completed",
    content: <p>Drafts are ready</p>,
  },
  {
    id: "b",
    title: "Confirm delivery date",
    state: "needs-you",
    content: <button type="button">Approve</button>,
  },
  {
    id: "c",
    title: "Remind second payment",
    summary: "Due Sunday",
    state: "pending",
    content: <p>Waiting</p>,
  },
  {
    id: "d",
    title: "Sync ledger",
    state: "running",
    content: <p>Running</p>,
  },
  { id: "e", title: "Archive", state: "failed", content: <p>Failed</p> },
];

function CompoundTabs({
  items,
  ...root
}: Tiraz.TabsProps): ReturnType<typeof Tiraz.Tabs> {
  return (
    <Tiraz.TabsRoot {...root}>
      <Tiraz.TabsList>
        {items.map((item) => (
          <Tiraz.TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.label}
          </Tiraz.TabsTrigger>
        ))}
      </Tiraz.TabsList>
      {items.map((item) => (
        <Tiraz.TabsContent key={item.value} value={item.value}>
          {item.content}
        </Tiraz.TabsContent>
      ))}
    </Tiraz.TabsRoot>
  );
}
function CompoundAccordion({
  items,
  ...root
}: Tiraz.AccordionProps): ReturnType<typeof Tiraz.Accordion> {
  return (
    <Tiraz.AccordionRoot {...root}>
      {items.map((item) => (
        <Tiraz.AccordionSection
          key={item.value}
          value={item.value}
          disabled={item.disabled}
        >
          <Tiraz.AccordionTrigger>{item.label}</Tiraz.AccordionTrigger>
          <Tiraz.AccordionContent>{item.content}</Tiraz.AccordionContent>
        </Tiraz.AccordionSection>
      ))}
    </Tiraz.AccordionRoot>
  );
}
function CompoundTaskRows({
  items,
  emptyState,
  ...root
}: Tiraz.TaskRowsProps): ReturnType<typeof Tiraz.TaskRows> {
  return (
    <Tiraz.TaskRowsRoot {...root}>
      {items.length === 0 ? (
        <Tiraz.TaskRowsEmpty>{emptyState}</Tiraz.TaskRowsEmpty>
      ) : (
        items.map(({ content, ...item }) => (
          <Tiraz.TaskRowsRow key={item.id} {...item}>
            {content}
          </Tiraz.TaskRowsRow>
        ))
      )}
    </Tiraz.TaskRowsRoot>
  );
}

interface Case {
  key: string;
  convenience: ReactNode;
  compound: ReactNode;
  act?: (user: User) => Promise<void>;
}
function cases(direction: Direction): Case[] {
  const tabs = (props: Partial<Tiraz.TabsProps>) => ({
    convenience: provider(
      direction,
      <Tiraz.Tabs label="Customer sections" items={tabItems()} {...props} />,
    ),
    compound: provider(
      direction,
      <CompoundTabs label="Customer sections" items={tabItems()} {...props} />,
    ),
  });
  const sections = (props: Partial<Tiraz.AccordionProps>) => ({
    convenience: provider(
      direction,
      <Tiraz.Accordion items={sectionItems()} {...props} />,
    ),
    compound: provider(
      direction,
      <CompoundAccordion items={sectionItems()} {...props} />,
    ),
  });
  const rows = (props: Partial<Tiraz.TaskRowsProps>) => ({
    convenience: provider(
      direction,
      <Tiraz.TaskRows label="Agent tasks" items={taskItems()} {...props} />,
    ),
    compound: provider(
      direction,
      <CompoundTaskRows label="Agent tasks" items={taskItems()} {...props} />,
    ),
  });
  return [
    { key: `tabs-${direction}-default`, ...tabs({}) },
    {
      key: `tabs-${direction}-segment`,
      ...tabs({
        variant: "segment",
        className: "extra",
        value: "team",
        onValueChange: () => {},
      }),
    },
    {
      key: `tabs-${direction}-switched`,
      ...tabs({ defaultValue: "overview" }),
      act: async (user) => {
        await user.click(screen.getByRole("tab", { name: "Team" }));
      },
    },
    { key: `accordion-${direction}-closed`, ...sections({}) },
    {
      key: `accordion-${direction}-open`,
      ...sections({
        value: "c",
        onValueChange: () => {},
        headingLevel: 4,
        collapsible: true,
        className: "extra",
      }),
    },
    {
      key: `accordion-${direction}-toggled`,
      ...sections({ defaultValue: "a", collapsible: true }),
      act: async (user) => {
        await user.click(screen.getByRole("button", { name: "Payment" }));
      },
    },
    {
      key: `task-rows-${direction}-states`,
      ...rows({
        appearance: "list",
        expandedIds: ["b"],
        stateLabels: { running: "Working" },
        id: "tasks",
        "data-testid": "tasks",
      } as Partial<Tiraz.TaskRowsProps>),
    },
    {
      key: `task-rows-${direction}-toggled`,
      ...rows({ defaultExpandedIds: ["a"] }),
      act: async (user) => {
        await user.click(
          screen.getByRole("button", { name: /Confirm delivery date/ }),
        );
      },
    },
    {
      key: `task-rows-${direction}-empty`,
      ...rows({ items: [], labels: { empty: "Nothing to run" } }),
    },
    {
      key: `task-rows-${direction}-empty-custom`,
      ...rows({
        items: [],
        emptyState: <p className="custom-empty">Add the first task</p>,
      }),
    },
  ];
}

it("exports every compound part as a function", () => {
  for (const name of [
    "TabsRoot",
    "TabsList",
    "TabsTrigger",
    "TabsContent",
    "AccordionRoot",
    "AccordionSection",
    "AccordionTrigger",
    "AccordionContent",
    "TaskRowsRoot",
    "TaskRowsRow",
    "TaskRowsEmpty",
  ] as const)
    expect(Tiraz[name], name).toBeTypeOf("function");
});

describe.each(directions)("convenience markup in %s", (direction) => {
  it.each(cases(direction).map((entry) => [entry.key, entry] as const))(
    "%s is unchanged and equals the compound markup",
    async (key, entry) => {
      const user = userEvent.setup();
      const wrapped = render(entry.convenience);
      await entry.act?.(user);
      const convenience = markup(wrapped.container);
      wrapped.unmount();
      const compound = render(entry.compound);
      await entry.act?.(user);
      expect(markup(compound.container)).toBe(convenience);
      expect(convenience).toBe(settle(before[key]));
    },
  );
});

it("captures exactly the cases compared", () => {
  const keys = directions.flatMap((d) => cases(d).map((entry) => entry.key));
  expect(Object.keys(before).sort()).toEqual(keys.sort());
});

describe("TabsRoot", () => {
  function tabs(props: Partial<Tiraz.TabsRootProps> = {}, direction = "ltr") {
    return provider(
      direction as Direction,
      <Tiraz.TabsRoot label="Sections" {...props}>
        <Tiraz.TabsList>
          <Tiraz.TabsTrigger value="overview">Overview</Tiraz.TabsTrigger>
          <Tiraz.TabsTrigger value="billing" disabled>
            Billing
          </Tiraz.TabsTrigger>
          <Tiraz.TabsTrigger value="team">Team</Tiraz.TabsTrigger>
        </Tiraz.TabsList>
        <Tiraz.TabsContent value="overview">Overview panel</Tiraz.TabsContent>
        <Tiraz.TabsContent value="billing">Billing panel</Tiraz.TabsContent>
        <Tiraz.TabsContent value="team">Team panel</Tiraz.TabsContent>
      </Tiraz.TabsRoot>,
    );
  }

  it("names the list, selects the first enabled tab without a value and links tab to panel", () => {
    const change = vi.fn();
    const { container } = render(tabs({ onValueChange: change }));
    const list = screen.getByRole("tablist", { name: "Sections" });
    expect(within(list).getAllByRole("tab")).toHaveLength(3);
    const overview = screen.getByRole("tab", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tab", { name: "Billing" })).toBeDisabled();
    expect(
      screen.getByRole("tabpanel", { name: "Overview" }),
    ).toHaveTextContent("Overview panel");
    expect(screen.queryByText("Team panel")).toBeNull();
    // Panels animate only after a switch, so settling on the first tab is not one.
    expect(container.querySelector(".tz-tabs")).not.toHaveAttribute(
      "data-changed",
    );
    expect(change).not.toHaveBeenCalled();
  });

  it("starts on defaultValue and keeps local selection when defaultValue later changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(tabs({ defaultValue: "team" }));
    expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    rerender(tabs({ defaultValue: "team" }));
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("selects on click once and ignores disabled and already selected tabs", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(tabs({ onValueChange: change }));
    await user.click(screen.getByRole("tab", { name: "Billing" }));
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    expect(change).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: "Team" }));
    expect(change.mock.calls).toEqual([["team"]]);
    expect(screen.getByRole("tabpanel", { name: "Team" })).toHaveTextContent(
      "Team panel",
    );
    expect(container.querySelector(".tz-tabs")).toHaveAttribute(
      "data-changed",
      "true",
    );
  });

  it.each([
    ["ltr", "{ArrowRight}", "{ArrowLeft}"],
    ["rtl", "{ArrowLeft}", "{ArrowRight}"],
  ])(
    "moves between enabled tabs with arrows in %s, skipping the disabled tab, one request per move",
    async (direction, forward, backward) => {
      const user = userEvent.setup();
      const change = vi.fn();
      render(tabs({ onValueChange: change }, direction));
      const overview = screen.getByRole("tab", { name: "Overview" });
      const team = screen.getByRole("tab", { name: "Team" });
      await user.click(overview);
      await user.keyboard(forward);
      await waitFor(() => expect(team).toHaveFocus());
      expect(team).toHaveAttribute("aria-selected", "true");
      expect(change.mock.calls).toEqual([["team"]]);
      await user.keyboard(backward);
      await waitFor(() => expect(overview).toHaveFocus());
      expect(change.mock.calls).toEqual([["team"], ["overview"]]);
      await user.keyboard("{End}");
      await waitFor(() => expect(team).toHaveFocus());
      await user.keyboard("{Home}");
      await waitFor(() => expect(overview).toHaveFocus());
      expect(change).toHaveBeenCalledTimes(4);
    },
  );

  it("is controlled by value: it requests a change once and shows it only when the owner accepts", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = render(
      tabs({ value: "overview", onValueChange: change }),
    );
    await user.click(screen.getByRole("tab", { name: "Team" }));
    expect(change.mock.calls).toEqual([["team"]]);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    rerender(tabs({ value: "team", onValueChange: change }));
    expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team panel");
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("works under an owner that accepts every request", async () => {
    const user = userEvent.setup();
    function Owner() {
      const [value, setValue] = useState("overview");
      return tabs({ value, onValueChange: setValue });
    }
    render(<Owner />);
    await user.click(screen.getByRole("tab", { name: "Team" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team panel");
  });

  it("requires a root", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(<Tiraz.TabsTrigger value="a">A</Tiraz.TabsTrigger>),
    ).toThrow(/TabsRoot/);
    error.mockRestore();
  });
});

describe("AccordionRoot", () => {
  function accordion(
    props: Partial<Tiraz.AccordionRootProps> = {},
    direction: Direction = "ltr",
  ) {
    return provider(
      direction,
      <Tiraz.AccordionRoot {...props}>
        <Tiraz.AccordionSection value="a">
          <Tiraz.AccordionTrigger>Delivery</Tiraz.AccordionTrigger>
          <Tiraz.AccordionContent>
            <button type="button">Track</button>
          </Tiraz.AccordionContent>
        </Tiraz.AccordionSection>
        <Tiraz.AccordionSection value="b" disabled>
          <Tiraz.AccordionTrigger>Returns</Tiraz.AccordionTrigger>
          <Tiraz.AccordionContent>Return notes</Tiraz.AccordionContent>
        </Tiraz.AccordionSection>
        <Tiraz.AccordionSection value="c">
          <Tiraz.AccordionTrigger>Payment</Tiraz.AccordionTrigger>
          <Tiraz.AccordionContent>Payment notes</Tiraz.AccordionContent>
        </Tiraz.AccordionSection>
      </Tiraz.AccordionRoot>,
    );
  }
  const trigger = (name: string) => screen.getByRole("button", { name });

  it("starts closed with inert hidden panels and wires heading, button and open panel", () => {
    const { container, rerender } = render(accordion());
    for (const name of ["Delivery", "Returns", "Payment"])
      expect(trigger(name)).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Track" })).toBeNull();
    const panels = container.querySelectorAll(".tz-accordion-panel");
    expect(panels).toHaveLength(3);
    for (const panel of panels) {
      expect(panel).toHaveAttribute("aria-hidden", "true");
      expect(panel).toHaveAttribute("inert");
    }
    rerender(accordion({ value: "a" }));
    const open = document.getElementById(
      trigger("Delivery").getAttribute("aria-controls")!,
    )!;
    expect(open).toHaveAttribute("role", "region");
    expect(open).toHaveAttribute("aria-labelledby", trigger("Delivery").id);
    expect(open).not.toHaveAttribute("aria-hidden");
    expect(open).not.toHaveAttribute("inert");
  });

  it("honors headingLevel", () => {
    render(accordion({ headingLevel: 5 }));
    expect(screen.getAllByRole("heading", { level: 5 })).toHaveLength(3);
  });

  it("opens one section at a time, requesting each change once", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(accordion({ onValueChange: change }));
    await user.click(trigger("Delivery"));
    expect(trigger("Delivery")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Track" })).toBeVisible();
    await user.click(trigger("Payment"));
    expect(trigger("Payment")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Delivery")).toHaveAttribute("aria-expanded", "false");
    expect(change.mock.calls).toEqual([["a"], ["c"]]);
  });

  it("keeps the open section open unless collapsible, then requests an empty value once", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = render(
      accordion({ defaultValue: "a", onValueChange: change }),
    );
    await user.click(trigger("Delivery"));
    expect(trigger("Delivery")).toHaveAttribute("aria-expanded", "true");
    expect(change).not.toHaveBeenCalled();
    rerender(
      accordion({
        defaultValue: "a",
        onValueChange: change,
        collapsible: true,
      }),
    );
    await user.click(trigger("Delivery"));
    expect(trigger("Delivery")).toHaveAttribute("aria-expanded", "false");
    expect(change.mock.calls).toEqual([[""]]);
  });

  it("toggles with Enter and Space and moves focus with arrows, Home and End, skipping a disabled section", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(accordion({ collapsible: true, onValueChange: change }));
    await user.tab();
    expect(trigger("Delivery")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger("Delivery")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger("Delivery")).toHaveAttribute("aria-expanded", "false");
    expect(change.mock.calls).toEqual([["a"], [""]]);
    await user.keyboard("{ArrowDown}");
    expect(trigger("Payment")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(trigger("Delivery")).toHaveFocus();
    await user.keyboard("{End}");
    expect(trigger("Payment")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(trigger("Delivery")).toHaveFocus();
    expect(change).toHaveBeenCalledTimes(2);
  });

  it("does not open a disabled section", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(accordion({ onValueChange: change }));
    expect(trigger("Returns")).toBeDisabled();
    await user.click(trigger("Returns"));
    expect(change).not.toHaveBeenCalled();
  });

  it("is controlled by value: it requests a change once and shows it only when the owner accepts", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = render(
      accordion({ value: "a", onValueChange: change }),
    );
    await user.click(trigger("Payment"));
    expect(change.mock.calls).toEqual([["c"]]);
    expect(trigger("Payment")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Delivery")).toHaveAttribute("aria-expanded", "true");
    rerender(accordion({ value: "c", onValueChange: change }));
    expect(trigger("Payment")).toHaveAttribute("aria-expanded", "true");
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("requires a root and a section", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(<Tiraz.AccordionSection value="a">x</Tiraz.AccordionSection>),
    ).toThrow(/AccordionRoot/);
    expect(() =>
      render(
        <Tiraz.AccordionRoot>
          <Tiraz.AccordionTrigger>x</Tiraz.AccordionTrigger>
        </Tiraz.AccordionRoot>,
      ),
    ).toThrow(/AccordionSection/);
    error.mockRestore();
  });
});

describe("TaskRowsRoot", () => {
  function taskRows(
    props: Partial<Tiraz.TaskRowsRootProps> = {},
    direction: Direction = "ltr",
  ) {
    return provider(
      direction,
      <Tiraz.TaskRowsRoot label="Agent tasks" {...props}>
        <Tiraz.TaskRowsRow
          id="a"
          title="Draft quote"
          summary="3 drafts"
          state="completed"
        >
          <p>Drafts are ready</p>
        </Tiraz.TaskRowsRow>
        <Tiraz.TaskRowsRow id="b" title="Confirm date" state="pending">
          <button type="button">Approve</button>
        </Tiraz.TaskRowsRow>
        <Tiraz.TaskRowsRow id="c" title="Remind payment" state="pending">
          <p>Waiting</p>
        </Tiraz.TaskRowsRow>
      </Tiraz.TaskRowsRoot>,
    );
  }
  const trigger = (name: RegExp) => screen.getByRole("button", { name });

  it("renders a named list of rows with states, collapsed panels and position numbers", () => {
    const { container } = render(taskRows());
    const list = screen.getByRole("list", { name: "Agent tasks" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(trigger(/Draft quote/)).toHaveAccessibleName(
      /Draft quote.*3 drafts.*Done/,
    );
    for (const name of [/Draft quote/, /Confirm date/, /Remind payment/])
      expect(trigger(name)).toHaveAttribute("aria-expanded", "false");
    // Pending rows show their place in the list, counting every row.
    expect(
      [...container.querySelectorAll('[data-glyph="number"]')].map(
        (node) => node.textContent,
      ),
    ).toEqual(["2", "3"]);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("formats position numbers with the Arabic digits in RTL", () => {
    const { container } = render(taskRows({}, "rtl"));
    expect(
      [...container.querySelectorAll('[data-glyph="number"]')].map(
        (node) => node.textContent,
      ),
    ).toEqual(["٢", "٣"]);
  });

  it("expands on click, Enter and Space, requesting each change once with the full list", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(taskRows({ onExpandedChange: change }));
    await user.click(trigger(/Draft quote/));
    expect(trigger(/Draft quote/)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Drafts are ready")).toBeVisible();
    trigger(/Confirm date/).focus();
    await user.keyboard("{Enter}");
    expect(trigger(/Confirm date/)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Approve" })).toBeVisible();
    await user.keyboard(" ");
    expect(trigger(/Confirm date/)).toHaveAttribute("aria-expanded", "false");
    expect(change.mock.calls).toEqual([[["a"]], [["a", "b"]], [["a"]]]);
  });

  it("starts from defaultExpandedIds", () => {
    render(taskRows({ defaultExpandedIds: ["c"] }));
    expect(trigger(/Remind payment/)).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", { name: "Remind payment" }),
    ).toHaveTextContent("Waiting");
  });

  it("is controlled by expandedIds: it requests a change once and shows it only when the owner accepts", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = render(
      taskRows({ expandedIds: [], onExpandedChange: change }),
    );
    await user.click(trigger(/Confirm date/));
    expect(change.mock.calls).toEqual([[["b"]]]);
    expect(trigger(/Confirm date/)).toHaveAttribute("aria-expanded", "false");
    rerender(taskRows({ expandedIds: ["b"], onExpandedChange: change }));
    expect(trigger(/Confirm date/)).toHaveAttribute("aria-expanded", "true");
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the row button when the panel holding it collapses", () => {
    const { rerender } = render(taskRows({ expandedIds: ["b"] }));
    const approve = screen.getByRole("button", { name: "Approve" });
    approve.focus();
    expect(approve).toHaveFocus();
    rerender(taskRows({ expandedIds: [] }));
    expect(trigger(/Confirm date/)).toHaveFocus();
  });

  it("replaces state words from the root", () => {
    render(taskRows({ stateLabels: { pending: "Queued" } }));
    expect(trigger(/Confirm date/)).toHaveAccessibleName(/Queued/);
  });

  it.each([
    ["ltr", undefined, "No agent tasks"],
    ["rtl", undefined, "لا توجد مهام بعد"],
    ["ltr", { empty: "Nothing to run" }, "Nothing to run"],
  ] as const)(
    "TaskRowsEmpty shows the default empty title in %s (%j)",
    (direction, labels, title) => {
      render(
        provider(
          direction,
          <Tiraz.TaskRowsRoot label="Agent tasks" labels={labels}>
            <Tiraz.TaskRowsEmpty />
          </Tiraz.TaskRowsRoot>,
        ),
      );
      const list = screen.getByRole("list", { name: "Agent tasks" });
      expect(within(list).getAllByRole("listitem")).toHaveLength(1);
      expect(list).toHaveTextContent(title);
    },
  );

  it("TaskRowsEmpty replaces the default with its children", () => {
    render(
      provider(
        "ltr",
        <Tiraz.TaskRowsRoot label="Agent tasks">
          <Tiraz.TaskRowsEmpty>
            <p>Add the first task</p>
          </Tiraz.TaskRowsEmpty>
        </Tiraz.TaskRowsRoot>,
      ),
    );
    expect(screen.getByText("Add the first task")).toBeInTheDocument();
    expect(screen.queryByText("No agent tasks")).toBeNull();
  });

  it("forwards list attributes and requires a root", () => {
    const ref = { current: null as HTMLUListElement | null };
    render(
      provider(
        "ltr",
        <Tiraz.TaskRowsRoot
          label="Agent tasks"
          appearance="plain"
          id="tasks"
          ref={ref}
        >
          <Tiraz.TaskRowsEmpty />
        </Tiraz.TaskRowsRoot>,
      ),
    );
    expect(ref.current).toBe(screen.getByRole("list"));
    expect(ref.current).toHaveAttribute("id", "tasks");
    expect(ref.current).toHaveAttribute("data-appearance", "plain");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <Tiraz.TaskRowsRow id="a" title="A" state="pending">
          x
        </Tiraz.TaskRowsRow>,
      ),
    ).toThrow(/TaskRowsRoot/);
    error.mockRestore();
  });
});
