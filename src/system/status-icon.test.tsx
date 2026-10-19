import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { parse } from "postcss";
import type { ReactNode } from "react";
import { expect, it } from "vitest";
import {
  StatusIcon,
  SystemProvider,
  TaskRows,
  ToolCall,
  ToolChips,
  defaultConfig,
} from "./index";
import type { StatusIconState, SystemConfig, TaskState } from "./index";
import { auditFamily, familyRuleCount, unmatchedPrefixes } from "./css-audit";
import { wovenFamilies } from "./css-audit.families";

// StatusIcon is the one glyph for the status of a task, a tool call or a step of
// agent work (Woven spec section 13). The first half of this file reads its
// markup; the second reads components.css, since jsdom paints nothing and the
// look is the point: the colors of the vocabulary, the forced-colors edge, and
// motion that waits for a change.

const provide = (children: ReactNode, config: Partial<SystemConfig> = {}) => (
  <SystemProvider config={{ ...defaultConfig, ...config }}>
    {children}
  </SystemProvider>
);
const mount = (children: ReactNode, config?: Partial<SystemConfig>) =>
  render(provide(children, config));
const iconOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".tz-status-icon")!;
const iconsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".tz-status-icon"));
const glyphsOf = (element: Element) =>
  Array.from(element.querySelectorAll("[data-glyph]"), (glyph) =>
    glyph.getAttribute("data-glyph"),
  );

// ---------------------------------------------------------------------------
// Markup

const vocabulary: Array<[StatusIconState, string]> = [
  ["pending", "number"],
  ["running", "spinner"],
  ["needs-you", "bang"],
  ["completed", "check"],
  ["failed", "x"],
  ["stopped", "square"],
  ["skipped", "minus"],
];

it.each(vocabulary)("draws %s with the %s glyph", (state, glyph) => {
  // Every state is offered a number; only a pending icon shows it.
  const { container } = mount(<StatusIcon state={state} number={2} />);
  expect(iconOf(container)).toHaveAttribute("data-state", state);
  expect(glyphsOf(iconOf(container))).toEqual([glyph]);
});

it("builds each glyph from the part the vocabulary names", () => {
  const glyph = (state: StatusIconState) =>
    mount(<StatusIcon state={state} />).container.querySelector("[data-glyph]");
  expect(glyph("needs-you")?.textContent).toBe("!");
  expect(glyph("completed")).toHaveClass("lucide-check");
  expect(glyph("failed")).toHaveClass("lucide-x");
  expect(glyph("skipped")).toHaveClass("lucide-minus");
  expect(glyph("stopped")).toBeEmptyDOMElement();
  // The arc is the shared Spinner, decorative: the icon owns the name.
  expect(
    glyph("running")?.querySelector(".tz-loading-spinner"),
  ).toHaveAttribute("aria-hidden", "true");
});

it("leaves a pending ring empty until it has a position", () => {
  const { container } = mount(<StatusIcon state="pending" />);
  expect(iconOf(container)).toBeEmptyDOMElement();
});

it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
  "leaves a pending ring empty for the number %s",
  (number) => {
    const { container } = mount(<StatusIcon state="pending" number={number} />);
    expect(iconOf(container)).toBeEmptyDOMElement();
  },
);

const numbering: Array<[string, Partial<SystemConfig>, number, string]> = [
  ["the default settings", {}, 3, "٣"],
  ["two digits", {}, 12, "١٢"],
  ["western numerals", { numerals: "latn" }, 3, "3"],
  ["an English interface", { direction: "ltr" }, 3, "3"],
];

it.each(numbering)(
  "numbers a pending icon under %s",
  (_setting, config, number, expected) => {
    const { container } = mount(
      <StatusIcon state="pending" number={number} />,
      config,
    );
    expect(iconOf(container).textContent).toBe(expected);
  },
);

it("is hidden from assistive technology without a label", () => {
  const { container } = mount(
    <>
      <StatusIcon state="completed" />
      <StatusIcon state="completed" label="" />
    </>,
  );
  for (const icon of iconsOf(container)) {
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("role");
    expect(icon).not.toHaveAttribute("aria-label");
  }
  expect(screen.queryByRole("img")).toBeNull();
});

it("is an image named by its label", () => {
  mount(<StatusIcon state="completed" label="مكتملة" />);
  const image = screen.getByRole("img", { name: "مكتملة" });
  expect(image).toHaveClass("tz-status-icon");
  expect(image).not.toHaveAttribute("aria-hidden");
});

it("is neutral unless the assistant is the actor", () => {
  const { container } = mount(
    <>
      <StatusIcon state="running" />
      <StatusIcon state="running" tone="neutral" />
      <StatusIcon state="running" tone="ai" />
    </>,
  );
  expect(iconsOf(container).map((icon) => icon.dataset.tone)).toEqual([
    "neutral",
    "neutral",
    "ai",
  ]);
});

it("keeps the host's class beside its own", () => {
  const { container } = mount(
    <>
      <StatusIcon state="pending" />
      <StatusIcon state="pending" className="tz-agent-task-indicator" />
    </>,
  );
  expect(iconsOf(container).map((icon) => icon.className)).toEqual([
    "tz-status-icon",
    "tz-status-icon tz-agent-task-indicator",
  ]);
});

it("marks a change of state and never a first render", () => {
  const first = mount(<StatusIcon state="completed" />);
  expect(iconOf(first.container)).not.toHaveAttribute("data-changed");
  first.unmount();

  const view = mount(<StatusIcon state="running" />);
  expect(iconOf(view.container)).not.toHaveAttribute("data-changed");
  // Another prop is not a change of state.
  view.rerender(provide(<StatusIcon state="running" tone="ai" label="يعمل" />));
  expect(iconOf(view.container)).not.toHaveAttribute("data-changed");
  view.rerender(
    provide(<StatusIcon state="completed" tone="ai" label="يعمل" />),
  );
  expect(iconOf(view.container)).toHaveAttribute("data-changed");
});

// ---------------------------------------------------------------------------
// The families that show status

it("draws a ToolCall's status with the shared icon in the assistant's tone", () => {
  const { container } = mount(
    <ToolCall label="Search" tool="web_search" state="running" />,
  );
  const icon = container.querySelector(
    ".tz-tool-call-trigger > .tz-status-icon",
  );
  expect(icon).toHaveAttribute("data-state", "running");
  expect(icon).toHaveAttribute("data-tone", "ai");
  expect(icon).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector(".tz-tool-status")).toBeNull();
});

it("draws every ToolChips item with the shared icon", () => {
  const { container } = mount(
    <ToolChips
      label="Activity"
      items={[
        { id: "a", label: "Read files", state: "completed", count: 3 },
        {
          id: "b",
          label: "Check sample",
          state: "failed",
          onActivate: () => {},
        },
        { id: "c", label: "Write report", state: "pending" },
      ]}
    />,
  );
  const icons = iconsOf(container);
  expect(icons.map((icon) => [icon.dataset.state, glyphsOf(icon)[0]])).toEqual([
    ["completed", "check"],
    ["failed", "x"],
    ["pending", undefined],
  ]);
  expect(icons.map((icon) => icon.dataset.tone)).toEqual(["ai", "ai", "ai"]);
  expect(container.querySelector(".tz-tool-status")).toBeNull();
});

it("draws every TaskRows indicator with the shared icon, keeping the layout class", () => {
  const task = (id: string, state: TaskState) => ({
    id,
    title: id,
    state,
    content: null,
  });
  const { container } = mount(
    <TaskRows
      label="Agent tasks"
      items={[
        task("done", "completed"),
        task("busy", "running"),
        task("next", "pending"),
        task("lost", "failed"),
      ]}
    />,
  );
  const indicators = Array.from(
    container.querySelectorAll<HTMLElement>(".tz-agent-task-indicator"),
  );
  expect(indicators.every((icon) => icon.matches(".tz-status-icon"))).toBe(
    true,
  );
  expect(
    indicators.map((icon) => [icon.dataset.state, glyphsOf(icon)[0]]),
  ).toEqual([
    ["completed", "check"],
    ["running", "spinner"],
    ["pending", "number"],
    // A failure is a cross now, not an alert icon.
    ["failed", "x"],
  ]);
  expect(indicators.map((icon) => icon.dataset.tone)).toEqual([
    "ai",
    "ai",
    "ai",
    "ai",
  ]);
  // The pending task is the third, and Arabic numbers its position.
  expect(indicators[2].textContent).toBe("٣");
  expect(container.querySelector(".lucide-circle-alert")).toBeNull();
});

// ---------------------------------------------------------------------------
// The stylesheet

const css = readFileSync(resolve("src/system/components.css"), "utf8");
const sheet = parse(css);
const squash = (text: string) => text.replace(/\s+/g, " ").trim();

/** Every declaration of every rule that has a selector `matches` accepts. */
function declared(matches: (selector: string) => boolean) {
  const found: Array<{ selector: string; prop: string; value: string }> = [];
  sheet.walkRules((rule) => {
    for (const selector of rule.selectors.map(squash))
      if (matches(selector))
        rule.walkDecls((declaration) => {
          found.push({
            selector,
            prop: declaration.prop,
            value: declaration.value,
          });
        });
  });
  return found;
}

/**
 * What the stylesheet gives a state: the base rule, then the state, then the
 * state with its tone, which is how the three selector shapes cascade.
 */
function paint(state: StatusIconState, tone: "ai" | "neutral") {
  const painted: Record<string, string> = {};
  for (const shape of [
    ".tz-status-icon",
    `.tz-status-icon[data-state="${state}"]`,
    `.tz-status-icon[data-state="${state}"][data-tone="${tone}"]`,
  ])
    for (const { prop, value } of declared((selector) => selector === shape))
      painted[prop] = value;
  return painted;
}

const filled = {
  color: "var(--surface)",
  border: "1px solid transparent",
};
const looks: Array<[StatusIconState, "ai" | "neutral", object]> = [
  [
    "pending",
    "neutral",
    {
      border: expect.stringMatching(/ dashed var\(--border-strong\)$/),
      color: "var(--text-secondary)",
    },
  ],
  ["running", "neutral", { color: "var(--text-secondary)" }],
  ["running", "ai", { color: "var(--ai)" }],
  ["needs-you", "ai", { ...filled, background: "var(--attention)" }],
  ["completed", "ai", { ...filled, background: "var(--success)" }],
  ["failed", "ai", { ...filled, background: "var(--danger)" }],
  [
    "stopped",
    "ai",
    {
      border: expect.stringMatching(/ solid var\(--border-strong\)$/),
      color: "var(--text-secondary)",
    },
  ],
  [
    "skipped",
    "ai",
    {
      border: expect.stringMatching(/ dashed var\(--border-strong\)$/),
      color: "var(--text-muted)",
    },
  ],
];

it.each(looks)(
  "paints %s (%s tone) in the Woven vocabulary",
  (state, tone, look) => {
    // Filled discs keep a transparent border, which forced colors turn into the
    // outline that stops a dropped fill from erasing them.
    expect(paint(state, tone)).toMatchObject(look);
  },
);

it("lets the tone change only the running arc", () => {
  for (const [state] of vocabulary)
    if (state !== "running")
      expect(paint(state, "ai"), state).toEqual(paint(state, "neutral"));
  expect(paint("running", "ai")).not.toEqual(paint("running", "neutral"));
});

it("sizes the disc by --status-size, the glyphs at 12px and the stopped square at 8px", () => {
  expect(paint("completed", "ai")).toMatchObject({
    "inline-size": "var(--status-size)",
    "block-size": "var(--status-size)",
    "border-radius": "50%",
  });
  expect(
    declared((selector) => selector === ".tz-status-icon > svg").map(
      ({ prop, value }) => [prop, value],
    ),
  ).toEqual([
    ["inline-size", "12px"],
    ["block-size", "12px"],
  ]);
  const square = declared(
    (selector) => selector === '.tz-status-icon > [data-glyph="square"]',
  );
  expect(square.map(({ prop, value }) => [prop, value])).toEqual(
    expect.arrayContaining([
      ["inline-size", "8px"],
      ["block-size", "8px"],
      ["border-radius", "0"],
    ]),
  );
});

it("sets the chips' status size so a chip keeps its height", () => {
  const chip = declared((selector) => selector === ".tz-tool-chip");
  expect(chip.filter(({ prop }) => prop === "--status-size")).toEqual([
    expect.objectContaining({ value: "18px" }),
  ]);
});

it("draws the check and cross only after a change, and never pops", () => {
  const animated = declared((selector) =>
    /\.tz-status-icon(?![\w-])/.test(selector),
  ).filter(({ prop }) => /^animation(?:-name)?$/.test(prop));
  expect(animated.length).toBeGreaterThan(0);
  expect(
    animated.filter(({ selector }) => !selector.includes("[data-changed]")),
  ).toEqual([]);
  for (const { value } of animated) {
    expect(value).toMatch(/^tz-draw /);
    expect(value).toContain("var(--motion-state)");
    expect(value).toContain("var(--ease-out)");
  }
});

it("no longer draws or pops the old status classes when they mount", () => {
  // The part was renamed, so no rule may name it; a bare `expect(css)` would
  // print the whole stylesheet when it fails.
  expect(
    css.includes(".tz-tool-status"),
    "components.css still names .tz-tool-status",
  ).toBe(false);
  expect(
    declared((selector) =>
      selector.includes(".tz-agent-task-indicator"),
    ).filter(({ prop }) => /^(?:animation|stroke-dasharray|--draw)/.test(prop)),
  ).toEqual([]);
});

it("passes the Woven CSS audit", () => {
  const prefixes = [".tz-status-icon"];
  expect(wovenFamilies["status-icon"]).toEqual(prefixes);
  expect(unmatchedPrefixes(css, prefixes)).toEqual([]);
  expect(familyRuleCount(css, prefixes)).toBeGreaterThan(0);
  expect(auditFamily(css, prefixes)).toEqual([]);
});
