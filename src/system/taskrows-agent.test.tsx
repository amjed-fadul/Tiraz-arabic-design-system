import { createRef, useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as System from "./index";
import { TaskRowsExample } from "./ai/examples/TaskRowsExamples";

const items: System.TaskRowItem[] = [
  {
    id: "review",
    title: "Review sample",
    summary: "3 notes",
    state: "completed",
    content: <button>Open local note</button>,
  },
  {
    id: "draft",
    title: "Build sample",
    state: "pending",
    content: (
      <>
        <p>Application details</p>
        <input aria-label="Local comment" />
      </>
    ),
  },
  {
    id: "run",
    title: "Running sample",
    state: "running",
    content: "Waiting locally",
  },
  {
    id: "failed",
    title: "Failed sample",
    state: "failed",
    content: "Local failure details",
  },
];
afterEach(() => vi.useRealTimers());
it.each(["capsules", "list"] as const)(
  "renders %s task disclosures with four readable states and native attributes/ref",
  async (appearance) => {
    const user = userEvent.setup(),
      ref = createRef<HTMLUListElement>();
    render(
      <System.TaskRows
        ref={ref}
        id="tasks"
        data-test="native"
        label="Agent tasks"
        items={items}
        appearance={appearance}
      />,
    );
    const list = screen.getByRole("list", { name: "Agent tasks" });
    expect(ref.current).toBe(list);
    expect(list).toHaveAttribute("id", "tasks");
    expect(list).toHaveAttribute("data-test", "native");
    expect(list).toHaveAttribute("data-appearance", appearance);
    expect(screen.queryByRole("checkbox")).toBeNull();
    for (const name of ["قيد الانتظار", "جارٍ التنفيذ", "مكتملة", "فشلت"])
      expect(within(list).getByText(name, { exact: true })).toBeVisible();
    const trigger = screen.getByRole("button", { name: /Build sample/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(
      trigger.getAttribute("aria-controls")!,
    )!;
    expect(panel).toHaveAttribute("hidden");
    expect(panel).toHaveAttribute("inert");
    expect(screen.queryByRole("textbox")).toBeNull();
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).toHaveAccessibleName("Build sample");
    await user.keyboard("{Tab}");
    expect(
      screen.getByRole("textbox", { name: "Local comment" }),
    ).toHaveFocus();
    await user.click(trigger);
    expect(trigger).toHaveFocus();
    expect(panel).toHaveAttribute("hidden");
    expect(screen.queryByRole("textbox")).toBeNull();
  },
);
it("keeps state and item identity in supplied order; detail actions cannot toggle disclosure", async () => {
  const user = userEvent.setup();
  const view = render(
    <System.TaskRows
      label="Tasks"
      items={items}
      defaultExpandedIds={["review"]}
    />,
  );
  const triggers = screen
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-expanded"));
  await user.click(screen.getByRole("button", { name: "Open local note" }));
  expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
  await user.click(triggers[1]);
  view.rerender(
    <System.TaskRows
      label="Tasks"
      items={items.map((item) =>
        item.id === "draft" ? { ...item, state: "running" } : item,
      )}
      defaultExpandedIds={["review"]}
    />,
  );
  expect(screen.getByRole("button", { name: /Build sample/ })).toBe(
    triggers[1],
  );
  expect(triggers[1]).toHaveFocus();
  expect(triggers[1]).toHaveAttribute("aria-expanded", "true");
  expect(
    screen
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("aria-expanded")),
  ).toEqual(triggers);
});
it("supports controlled expansion and returns panel focus on external collapse without stealing outside focus", async () => {
  const user = userEvent.setup(),
    change = vi.fn();
  const view = render(
    <>
      <button>Outside</button>
      <System.TaskRows
        label="Tasks"
        items={items}
        expandedIds={["draft"]}
        onExpandedChange={change}
      />
    </>,
  );
  const trigger = screen.getByRole("button", { name: /Build sample/ });
  await user.click(trigger);
  expect(change).toHaveBeenLastCalledWith([]);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  screen.getByRole("textbox").focus();
  view.rerender(
    <>
      <button>Outside</button>
      <System.TaskRows
        label="Tasks"
        items={items}
        expandedIds={[]}
        onExpandedChange={change}
      />
    </>,
  );
  expect(trigger).toHaveFocus();
  view.rerender(
    <>
      <button>Outside</button>
      <System.TaskRows label="Tasks" items={items} expandedIds={["draft"]} />
    </>,
  );
  await user.click(screen.getByRole("button", { name: "Outside" }));
  view.rerender(
    <>
      <button>Outside</button>
      <System.TaskRows label="Tasks" items={items} expandedIds={[]} />
    </>,
  );
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
});
it("uses native Enter/Space for disclosure and preserves detail form values", async () => {
  const user = userEvent.setup();
  render(<System.TaskRows label="Tasks" items={items} />);
  const trigger = screen.getByRole("button", { name: /Build sample/ });
  trigger.focus();
  await user.keyboard("{Enter}");
  await user.type(screen.getByRole("textbox"), "Keep this draft");
  trigger.focus();
  await user.keyboard(" ");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await user.keyboard(" ");
  expect(screen.getByRole("textbox")).toHaveValue("Keep this draft");
});
it("renders an application empty state", () => {
  render(
    <System.TaskRows
      label="Tasks"
      items={[]}
      emptyState={<System.EmptyState title="No agent tasks" />}
    />,
  );
  expect(screen.getByRole("heading", { name: "No agent tasks" })).toBeVisible();
});
// Fake time tests the application simulation only; the library has no timers.
it("runs only after Run, waits for explicit retry and cancels replay/retry timers", async () => {
  vi.useFakeTimers();
  render(<TaskRowsExample language="en" />);
  const build = () =>
    screen.getByRole("button", { name: /Build sample outline/ });
  expect(build()).toHaveTextContent("Pending");
  fireEvent.click(screen.getByRole("button", { name: "Run local simulation" }));
  expect(build()).toHaveTextContent("Running");
  await act(async () => vi.advanceTimersByTime(900));
  expect(build()).toHaveTextContent("Failed");
  await act(async () => vi.advanceTimersByTime(5000));
  expect(build()).toHaveTextContent("Failed");
  fireEvent.click(build());
  fireEvent.click(
    screen.getByRole("button", { name: "Retry local simulation" }),
  );
  expect(build()).toHaveTextContent("Running");
  await act(async () => vi.advanceTimersByTime(400));
  fireEvent.click(
    screen.getByRole("button", { name: "Replay local simulation" }),
  );
  await act(async () => vi.advanceTimersByTime(500));
  expect(build()).toHaveTextContent("Running");
  await act(async () => vi.advanceTimersByTime(400));
  expect(build()).toHaveTextContent("Failed");
  fireEvent.click(
    screen.getByRole("button", { name: "Retry local simulation" }),
  );
  await act(async () => vi.advanceTimersByTime(900));
  expect(build()).toHaveTextContent("Completed");
  expect(screen.getByRole("status")).toHaveTextContent(
    /No files, emails or backend tasks were processed/,
  );
});
it("cancels scheduled simulation work on unmount", async () => {
  vi.useFakeTimers();
  const view = render(<TaskRowsExample language="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Run local simulation" }));
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("supports a controlled example without changing execution state from disclosure", async () => {
  function Example() {
    const [expandedIds, setExpanded] = useState<readonly string[]>([]);
    return (
      <System.TaskRows
        label="Tasks"
        items={items}
        expandedIds={expandedIds}
        onExpandedChange={setExpanded}
      />
    );
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: /Build sample/ }));
  expect(
    screen.getByRole("button", { name: /Build sample/ }),
  ).toHaveTextContent("قيد الانتظار");
});
it("does not reclaim focus after the user deliberately blurs a panel control", () => {
  const view = render(
    <System.TaskRows label="Tasks" items={items} expandedIds={["draft"]} />,
  );
  const input = screen.getByRole("textbox");
  input.focus();
  input.blur();
  expect(document.body).toHaveFocus();
  view.rerender(
    <System.TaskRows label="Tasks" items={items} expandedIds={[]} />,
  );
  expect(document.body).toHaveFocus();
});
it("forgets recovered panel focus before a later expansion cycle", () => {
  const view = render(
    <System.TaskRows label="Tasks" items={items} expandedIds={["draft"]} />,
  );
  const trigger = screen.getByRole("button", { name: /Build sample/ });
  screen.getByRole("textbox").focus();
  view.rerender(
    <System.TaskRows label="Tasks" items={items} expandedIds={[]} />,
  );
  expect(trigger).toHaveFocus();
  view.rerender(
    <System.TaskRows label="Tasks" items={items} expandedIds={["draft"]} />,
  );
  trigger.blur();
  view.rerender(
    <System.TaskRows label="Tasks" items={items} expandedIds={[]} />,
  );
  expect(document.body).toHaveFocus();
});
it("uses existing semantic Badges for each task state", () => {
  render(<System.TaskRows label="Tasks" items={items} />);
  for (const [label, tone] of [
    ["مكتملة", "success"],
    ["قيد الانتظار", "neutral"],
    ["جارٍ التنفيذ", "info"],
    ["فشلت", "error"],
  ]) {
    expect(screen.getByText(label, { exact: true })).toHaveClass("tz-badge");
    expect(screen.getByText(label, { exact: true })).toHaveAttribute(
      "data-tone",
      tone,
    );
  }
});
it("shows sample result rows directly without a local-note button", async () => {
  const user = userEvent.setup();
  render(<TaskRowsExample language="en" />);
  await user.click(screen.getByRole("button", { name: /Sample .* ready/ }));
  expect(screen.queryByRole("button", { name: "Show local note" })).toBeNull();
  expect(
    screen.getByText("Matched contacts and tax IDs").nextElementSibling,
  ).toHaveTextContent("12/12");
  expect(
    screen.getByText("Flagged stale records").nextElementSibling,
  ).toHaveTextContent("0");
});
