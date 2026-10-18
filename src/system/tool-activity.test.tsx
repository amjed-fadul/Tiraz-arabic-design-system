import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ToolActivityDemo } from "./ai/examples/ToolActivityExamples";
import { ToolCall } from "./ToolCall";
import { ToolChips } from "./ToolChips";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const wrap = (children: React.ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {children}
  </SystemProvider>
);
it("discloses supplied structured text with native keyboard and isolates retry", async () => {
  const user = userEvent.setup(),
    retry = vi.fn();
  render(
    wrap(
      <ToolCall
        label="Read sample"
        tool="read_file"
        state="failed"
        input={'{\n  "path": "sample.txt"\n}'}
        error="Sample unavailable"
        onRetry={retry}
      />,
    ),
  );
  const trigger = screen.getByRole("button", { name: /Read sample/ });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("Sample unavailable")).not.toBeVisible();
  await user.tab();
  await user.keyboard(" ");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Sample unavailable")).toBeVisible();
  const retryButton = screen.getByRole("button", { name: "Try again" });
  expect(trigger).not.toContainElement(retryButton);
  await user.click(retryButton);
  expect(retry).toHaveBeenCalledOnce();
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  await user.click(trigger);
  expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
});
it("recovers focus when a controlled host collapse replaces focused output", async () => {
  const props = {
    label: "Read",
    tool: "read_file",
    state: "completed" as const,
  };
  const view = render(
    wrap(<ToolCall {...props} expanded output={<button>Result</button>} />),
  );
  screen.getByRole("button", { name: "Result" }).focus();
  view.rerender(
    wrap(<ToolCall {...props} expanded={false} output="Updated" />),
  );
  expect(screen.getByRole("button", { name: /Read/ })).toHaveFocus();
});
it("announces state changes without duration or output chatter", () => {
  const props = { label: "Read", tool: "read_file" };
  const view = render(
    wrap(<ToolCall {...props} state="running" duration="1s" />),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Read: Running");
  view.rerender(
    wrap(
      <ToolCall
        {...props}
        state="running"
        duration="2s"
        output="Updated output"
      />,
    ),
  );
  expect(screen.getByRole("status")).toHaveTextContent(/^Read: Running$/);
  view.rerender(wrap(<ToolCall {...props} state="completed" />));
  expect(screen.getByRole("status")).toHaveTextContent("Read: Completed");
});
it("keeps informational summaries static and delegates connected chips", async () => {
  const user = userEvent.setup(),
    onActivate = vi.fn();
  render(
    wrap(
      <ToolChips
        label="Activity"
        items={[
          { id: "read", label: "Read files", state: "completed", count: 3 },
          {
            id: "check",
            label: "Check sample",
            state: "failed",
            onActivate,
            controls: "sample-details",
            expanded: false,
          },
        ]}
      />,
    ),
  );
  const group = screen.getByRole("list", { name: "Activity" });
  expect(within(group).getAllByRole("button")).toHaveLength(1);
  const chip = screen.getByRole("button", { name: /Check sample/ });
  expect(chip).toHaveAttribute("aria-controls", "sample-details");
  await user.click(chip);
  expect(onActivate).toHaveBeenCalledOnce();
  expect(screen.getByText("Read files").closest("button")).toBeNull();
});
it("preserves a deliberate focus departure during host collapse", () => {
  const props = {
    label: "Read",
    tool: "read_file",
    state: "completed" as const,
  };
  const view = render(
    wrap(
      <>
        <button>Outside</button>
        <ToolCall {...props} expanded output={<button>Result</button>} />
      </>,
    ),
  );
  screen.getByRole("button", { name: "Result" }).focus();
  screen.getByRole("button", { name: "Outside" }).focus();
  view.rerender(
    wrap(
      <>
        <button>Outside</button>
        <ToolCall {...props} expanded={false} output="Changed" />
      </>,
    ),
  );
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
});
it("plays once on mount, hands retry to ToolCall and cancels timers on unmount", async () => {
  vi.useFakeTimers();
  try {
    const view = render(wrap(<ToolActivityDemo language="en" />));
    expect(
      screen.queryByRole("button", { name: /^(Run|Replay|Reset)\b/ }),
    ).toBeNull();
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Running");
    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Completed");
    expect(screen.getAllByRole("status")[1]).toHaveTextContent("Running");
    act(() => vi.advanceTimersByTime(1200));
    expect(vi.getTimerCount()).toBe(0);
    const retry = screen.getByRole("button", { name: "Try again" });
    act(() => retry.click());
    expect(
      screen.getByRole("button", { name: /Save renewals summary/ }),
    ).toHaveFocus();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getAllByRole("status")[1]).toHaveTextContent("Completed");
    expect(
      screen.getByText("Saved to Legal/2026/renewals-summary.md"),
    ).toBeVisible();
    view.unmount();
    render(wrap(<ToolActivityDemo language="en" />)).unmount();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
it("starts on the final run state under reduced motion", () => {
  vi.useFakeTimers();
  try {
    render(
      <SystemProvider
        config={{ ...defaultConfig, direction: "ltr", reducedMotion: true }}
      >
        <ToolActivityDemo language="en" />
      </SystemProvider>,
    );
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Completed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  } finally {
    vi.useRealTimers();
  }
});

it("lets code direction determine the scroll container inside RTL and scopes error styling", () => {
  const view = render(
    <SystemProvider config={defaultConfig}>
      <ToolCall
        label="عينة"
        tool="read_file"
        state="failed"
        defaultExpanded
        input="sample code"
      />
    </SystemProvider>,
  );
  const input = screen.getByRole("region", { name: "المدخلات" });
  expect(input).toHaveAttribute("dir", "auto");
  expect(input.closest("section")).not.toHaveAttribute("data-error");
  view.rerender(
    <SystemProvider config={defaultConfig}>
      <ToolCall
        label="عينة"
        tool="read_file"
        state="failed"
        defaultExpanded
        input="sample code"
        error="تعذر الإكمال"
      />
    </SystemProvider>,
  );
  expect(
    screen.getByRole("region", { name: "الخطأ" }).closest("section"),
  ).toHaveAttribute("data-error", "true");
});
