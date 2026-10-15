import { createRef } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as System from "./index";

afterEach(() => vi.useRealTimers());
it("gives loading one polite atomic status and decorative visuals in both presentations", () => {
  const ref = createRef<HTMLDivElement>();
  const view = render(
    <System.LoadingState
      ref={ref}
      label="Loading notes"
      description="Local collection"
      id="notes-loading"
    />,
  );
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveAttribute("aria-atomic", "true");
  expect(status).toHaveTextContent("Loading notes");
  expect(status).toHaveTextContent("Local collection");
  expect(ref.current).toHaveAttribute("id", "notes-loading");
  expect(screen.getAllByRole("status")).toHaveLength(1);
  view.rerender(
    <System.LoadingState
      label="Loading notes"
      indicator="skeleton"
      announcement="off"
    />,
  );
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText("Loading notes")).toBeVisible();
});
it("keeps the inline label stable without library timers and updates only supplied text", () => {
  vi.useFakeTimers();
  const view = render(<System.ThinkingIndicator label="Preparing reply" />);
  const status = screen.getByRole("status");
  act(() => vi.advanceTimersByTime(30000));
  expect(status).toHaveTextContent("Preparing reply");
  expect(vi.getTimerCount()).toBe(0);
  view.rerender(<System.ThinkingIndicator label="Reply ready" />);
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent("Reply ready");
  expect(status).toHaveAttribute("aria-atomic", "true");
});
it("keeps disclosure available while active and removes collapsed details from keyboard navigation", async () => {
  const user = userEvent.setup();
  render(
    <>
      <System.ThinkingState label="Preparing summary" active>
        <input aria-label="Detail note" />
      </System.ThinkingState>
      <button>After</button>
    </>,
  );
  const trigger = screen.getByRole("button", { name: "Preparing summary" });
  const panel = document.getElementById(
    trigger.getAttribute("aria-controls")!,
  )!;
  expect(panel).toHaveAttribute("hidden");
  expect(panel).toHaveAttribute("inert");
  await user.tab();
  expect(trigger).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.getByRole("region", { name: "Preparing summary" }),
  ).toBeVisible();
  await user.tab();
  expect(screen.getByRole("textbox")).toHaveFocus();
  await user.tab({ shift: true });
  await user.keyboard(" ");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});
it("recovers focus on controlled collapse, preserves detail values and never reclaims outside focus", async () => {
  const user = userEvent.setup();
  const tree = (
    expanded: boolean,
    label = "Preparing summary",
    active = true,
  ) => (
    <>
      <System.ThinkingState expanded={expanded} label={label} active={active}>
        <input aria-label="Detail note" />
      </System.ThinkingState>
      <button>Outside</button>
    </>
  );
  const view = render(tree(true));
  const trigger = screen.getByRole("button", { name: "Preparing summary" });
  const status = screen.getByRole("status");
  const input = screen.getByRole("textbox");
  await user.type(input, "Saved draft");
  view.rerender(tree(false));
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole("textbox")).toBeNull();
  view.rerender(tree(true, "Summary ready", false));
  expect(screen.getByRole("textbox")).toHaveValue("Saved draft");
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent("Summary ready");
  expect(within(status).queryByRole("textbox")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Outside" }));
  view.rerender(tree(false, "Summary ready", false));
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
});
it("reports controlled toggles without changing host state and leaves execution/content untouched", async () => {
  const user = userEvent.setup();
  const onExpandedChange = vi.fn();
  const view = render(
    <System.ThinkingState
      label="Waiting"
      active
      expanded={false}
      onExpandedChange={onExpandedChange}
    >
      <a href="#local">Local details</a>
    </System.ThinkingState>,
  );
  await user.click(screen.getByRole("button", { name: "Waiting" }));
  expect(onExpandedChange).toHaveBeenCalledWith(true);
  expect(screen.getByRole("button", { name: "Waiting" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  view.rerender(
    <System.ThinkingState
      label="Ready"
      active={false}
      defaultExpanded
      announcement="off"
    >
      <a href="#local">Local details</a>
    </System.ThinkingState>,
  );
  expect(screen.queryByRole("status")).toBeNull();
});

it("recovers panel focus when the host replaces focused details during controlled collapse", async () => {
  const user = userEvent.setup();
  const view = render(
    <System.ThinkingState label="Preparing" active expanded>
      <input aria-label="Draft" />
    </System.ThinkingState>,
  );
  await user.click(screen.getByRole("textbox", { name: "Draft" }));
  view.rerender(
    <System.ThinkingState label="Ready" active={false} expanded={false}>
      <p>Summary supplied by host</p>
    </System.ThinkingState>,
  );
  expect(screen.getByRole("button", { name: "Ready" })).toHaveFocus();
});
