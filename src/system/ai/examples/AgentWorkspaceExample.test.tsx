import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AgentWorkspaceExample } from "./AgentWorkspaceExample";
import { SystemProvider } from "../../Provider";
import { defaultConfig } from "../../config";
import * as demoHost from "./agent-workspace/demo-host";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function mount() {
  return render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <AgentWorkspaceExample
        language="en"
        agentAvatar={<span data-testid="khayt-avatar" />}
      />
    </SystemProvider>,
  );
}
const click = async (name: string) =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
const advance = async (ms: number) =>
  act(async () => {
    vi.advanceTimersByTime(ms);
  });

it("runs three single-task agents beside the composer without stealing focus and keeps every panel", async () => {
  const { unmount } = mount();
  expect(screen.queryByRole("region", { name: "Reading" })).toBeNull();
  const request = screen.getByRole("textbox", { name: "Review request" });
  request.focus();
  await act(async () => {
    fireEvent.keyDown(request, { key: "Enter" });
  });
  expect(request).toHaveFocus();
  expect(request).toHaveValue("");
  // Khayt plans first; nothing opens until an agent actually starts.
  expect(screen.getByText("Planning the review · 0s")).toBeVisible();
  expect(screen.queryByRole("region", { name: "Explorer" })).toBeNull();
  await advance(2000);
  expect(screen.getByText("Planning the review · 2s")).toBeVisible();
  expect(screen.queryByRole("region", { name: "Explorer" })).toBeNull();
  await advance(2000);
  // The explorer starts, the analyst a beat later; the reviewer waits for both.
  const explorer = screen.getByRole("region", { name: "Explorer" });
  expect(within(explorer).getByTestId("khayt-avatar")).toBeVisible();
  expect(screen.getByRole("region", { name: "Analyst" })).toBeVisible();
  expect(screen.queryByRole("region", { name: "Reviewer" })).toBeNull();
  expect(screen.getByRole("region", { name: "Reading" })).toBeVisible();
  // Panels hang off the composer; none is part of the conversation's flow.
  expect(
    within(screen.getByRole("region", { name: "Conversation" })).queryByRole(
      "region",
      { name: "Explorer" },
    ),
  ).toBeNull();
  // Work time comes from host timestamps and ticks while the run is live.
  expect(screen.getByText("Reviewing the signup flow · 4s")).toBeVisible();
  expect(screen.queryByRole("region", { name: "Reviewer" })).toBeNull();
  await advance(10_000);
  expect(screen.getByRole("region", { name: "Reviewer" })).toBeVisible();
  await advance(30_000);
  const summary = screen.getByText("Worked for 26s · 3 agents");
  expect(summary).toBeVisible();
  for (const [name, time] of [
    ["Explorer", "6.0s"],
    ["Analyst", "9.2s"],
    ["Reviewer", "14s"],
  ]) {
    const agent = screen.getByRole("region", { name });
    expect(agent).toHaveAttribute("data-state", "complete");
    expect(
      within(agent).getByText(time, { selector: ".tz-workspace-state-time" }),
    ).toBeVisible();
  }
  expect(
    within(summary.closest("details")!)
      .getAllByRole("listitem")
      .map((step) => step.textContent),
  ).toEqual([
    "ExplorerTrace the signup steps6.0s",
    "AnalystRead the test notes9.2s",
    "ReviewerCheck recovery and recommend14s",
  ]);
  for (const name of ["Reading", "Research", "Checks"])
    expect(screen.getByRole("region", { name })).toBeVisible();
  const result = screen.getByText("Three recommendations from the Nawa sample");
  expect(
    result.compareDocumentPosition(request) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByRole("switch")).toBeNull();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("opens with the composer in view under a welcome and settles it on the first request", async () => {
  mount();
  const stage = document.querySelector(".tz-workspace-stage")!;
  expect(stage).toHaveAttribute("data-fresh", "true");
  expect(
    screen.getByText("Three agents are ready for your request"),
  ).toBeVisible();
  await click("Start sample review");
  expect(stage).toHaveAttribute("data-fresh", "false");
  expect(
    screen.queryByText("Three agents are ready for your request"),
  ).toBeNull();
});

it("closing leaves a chip that keeps focus, lasts through later events and does not stop work", async () => {
  mount();
  await click("Start sample review");
  await advance(3000);
  await click("Close Explorer");
  expect(screen.getByRole("button", { name: "Explorer" })).toHaveFocus();
  await advance(4000);
  expect(screen.queryByRole("region", { name: "Explorer" })).toBeNull();
  expect(screen.getByRole("button", { name: "Stop review" })).toBeEnabled();
  await click("Explorer");
  await advance(30_000);
  expect(screen.getByRole("region", { name: "Explorer" })).toBeVisible();
  await click("Close Explorer");
  await advance(30_000);
  expect(screen.queryByRole("region", { name: "Explorer" })).toBeNull();
});

it("Escape collapses a panel to its chip, and the chip reopens it in place", async () => {
  mount();
  expect(screen.queryByRole("button", { name: "Research" })).toBeNull();
  await click("Start sample review");
  await advance(4000);
  const close = within(
    screen.getByRole("region", { name: "Research" }),
  ).getByRole("button", { name: "Close Research" });
  close.focus();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(screen.queryByRole("region", { name: "Research" })).toBeNull();
  const chip = screen.getByRole("button", { name: "Research" });
  expect(chip).toHaveFocus();
  expect(chip).toHaveAttribute("aria-expanded", "false");
  await click("Research");
  expect(screen.getByRole("region", { name: "Research" })).toHaveFocus();
});

it("Stop retains panels, stops the running agent, freezes settings and rejects late output", async () => {
  mount();
  await click("Start sample review");
  const slider = screen.getByRole("slider", { name: "Effort" });
  expect(slider).toBeDisabled();
  await advance(9000);
  await click("Stop review");
  expect(slider).toBeEnabled();
  fireEvent.change(slider, { target: { value: "3" } });
  expect(screen.getByText(/This request:/)).toHaveTextContent("Balanced");
  await advance(30_000);
  expect(screen.getByRole("region", { name: "Reading" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Research" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Explorer" })).toHaveAttribute(
    "data-state",
    "complete",
  );
  expect(screen.getByRole("region", { name: "Analyst" })).toHaveAttribute(
    "data-state",
    "stopped",
  );
  expect(screen.queryByRole("region", { name: "Reviewer" })).toBeNull();
  expect(screen.getByText(/Demo stopped. Received activity/)).toBeVisible();
  expect(screen.getByText("Stopped after 9.0s · 2 agents")).toBeVisible();
  expect(
    screen.queryByText("Three recommendations from the Nawa sample"),
  ).toBeNull();
});

it("attaches the latest reply's panels and brings an earlier reply's back with its choices", async () => {
  mount();
  await click("Start sample review");
  await advance(30_000);
  await click("Close Research");
  fireEvent.change(screen.getByRole("textbox", { name: "Review request" }), {
    target: { value: "Now review recovery" },
  });
  await click("Start sample review");
  expect(
    screen.getByText("Three recommendations from the Nawa sample"),
  ).toBeVisible();
  // The new reply is still planning, so nothing of the earlier one stays attached.
  expect(screen.queryByRole("region", { name: "Reading" })).toBeNull();
  await advance(4000);
  expect(screen.getAllByRole("region", { name: "Reading" })).toHaveLength(1);
  expect(screen.queryByRole("region", { name: "Checks" })).toBeNull();
  expect(screen.getByRole("region", { name: "Research" })).toBeVisible();
  await click("Show activity");
  expect(screen.queryByRole("region", { name: "Research" })).toBeNull();
  expect(screen.getByRole("button", { name: "Research" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(screen.getByRole("region", { name: "Checks" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Reviewer" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Reading" })).toHaveFocus();
  expect(screen.getAllByRole("button", { name: "Show activity" })).toHaveLength(
    1,
  );
});

it("keeps an empty Arabic entry right-to-left and lets typed text set its own direction", () => {
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <AgentWorkspaceExample language="ar" />
    </SystemProvider>,
  );
  const entry = screen.getByRole("textbox", { name: "طلب المراجعة" });
  expect(entry).toHaveAttribute("dir", "auto");
  fireEvent.change(entry, { target: { value: "" } });
  expect(entry).toHaveAttribute("dir", "rtl");
  expect(screen.queryByText(/عرض محلي|بلا أدوات/)).toBeNull();
});

it("in a narrow container, chips wait on the composer and open one card at a time", async () => {
  const computed = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const style = computed(element, pseudo);
    if (!element.classList.contains("tz-workspace-stage")) return style;
    return new Proxy(style, {
      get: (target, key) =>
        key === "getPropertyValue"
          ? (name: string) =>
              name === "--workspace-layout"
                ? "dock"
                : target.getPropertyValue(name)
          : Reflect.get(target, key),
    });
  });
  mount();
  await click("Start sample review");
  await advance(4000);
  expect(screen.queryByRole("region", { name: "Reading" })).toBeNull();
  const reading = screen.getByRole("button", { name: "Reading" });
  expect(reading).toHaveAttribute("aria-expanded", "false");
  await click("Reading");
  expect(screen.getByRole("region", { name: "Reading" })).toHaveFocus();
  expect(reading).toHaveAttribute("aria-expanded", "true");
  await click("Explorer");
  expect(screen.queryByRole("region", { name: "Reading" })).toBeNull();
  await click("Close Explorer");
  expect(screen.queryByRole("region", { name: "Explorer" })).toBeNull();
  expect(screen.getByRole("button", { name: "Explorer" })).toHaveFocus();
});

it("preserves drafts, the selected effort and active work across language changes", async () => {
  const { rerender, unmount } = mount();
  fireEvent.change(screen.getByRole("textbox", { name: "Review request" }), {
    target: { value: "My own review request" },
  });
  fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
  rerender(
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <AgentWorkspaceExample language="ar" />
    </SystemProvider>,
  );
  expect(screen.getByRole("textbox", { name: "طلب المراجعة" })).toHaveValue(
    "My own review request",
  );
  expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "عميق");
  await click("بدء المراجعة");
  await advance(2000);
  rerender(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <AgentWorkspaceExample language="en" />
    </SystemProvider>,
  );
  expect(screen.getByRole("button", { name: "Stop review" })).toBeEnabled();
  expect(screen.getByText("My own review request")).toBeVisible();
  await advance(30_000);
  expect(
    screen.getByText("Three recommendations from the Nawa sample"),
  ).toBeVisible();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it.each(["needs-input", "error"] as const)(
  "shows %s without claiming work is complete",
  async (status) => {
    vi.spyOn(demoHost, "startWorkspaceDemo").mockImplementationOnce(
      (run, emit) => {
        emit({ type: "run.started", runId: run.runId, sequence: 1 });
        emit({
          type: "activity.changed",
          runId: run.runId,
          sequence: 2,
          activity: {
            id: "explore",
            panel: "agent-0",
            label: ["تتبّع خطوات التسجيل", "Trace the signup steps"],
            detail: ["يراجع سياق الطلب", "Reviewing the request context"],
            status,
          },
        });
        return () => {};
      },
    );
    mount();
    await click("Start sample review");
    const task = screen.getByRole("region", { name: "Explorer" });
    expect(task).toHaveAttribute("data-state", status);
    expect(task.querySelector(".tz-workspace-agent-bar")).toHaveAttribute(
      "data-state",
      status,
    );
    expect(
      within(task).getByText(
        status === "error" ? "Failed" : "Waiting for you",
        { selector: ".tz-workspace-state > span" },
      ),
    ).toBeVisible();
    await click("Stop review");
    expect(
      screen
        .getAllByRole("status")
        .map((node) => node.textContent)
        .join(" "),
    ).toContain("Sample review stopped");
    if (status === "needs-input")
      expect(task).toHaveAttribute("data-state", "stopped");
  },
);
