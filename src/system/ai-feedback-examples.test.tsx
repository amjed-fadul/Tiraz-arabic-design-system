import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  AIFeedbackDemo,
  ThinkingStateExample,
} from "./ai/examples/AIFeedbackExamples";
import { SystemProvider, defaultConfig } from "./index";
afterEach(() => vi.useRealTimers());
it("autoplays one run through reading, matching and ready, then clears every timer", () => {
  vi.useFakeTimers();
  const view = render(
    <StrictMode>
      <AIFeedbackDemo language="en" />
    </StrictMode>,
  );
  expect(screen.queryAllByRole("button")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent("Reading invoices");
  expect(
    view.container.querySelector(".tz-loading-state-label"),
  ).toHaveTextContent("Reading 217 invoices");
  act(() => vi.advanceTimersByTime(600));
  expect(view.container.querySelector(".tz-loading-elapsed")).not.toBeNull();
  act(() => vi.advanceTimersByTime(700));
  expect(screen.getByRole("status")).toHaveTextContent("Matching totals");
  expect(view.container.querySelector(".tz-loading-state")).toBeNull();
  expect(view.container.querySelector(".tz-thinking-indicator")).not.toBeNull();
  act(() => vi.advanceTimersByTime(1600));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Reconciliation summary ready",
  );
  expect(view.container.querySelector(".tz-thinking-indicator")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(
    screen.getByRole("button", { name: "Reconciliation summary ready" }),
  );
  expect(
    screen.getByRole("region", { name: "Reconciliation summary ready" }),
  ).toHaveTextContent("214 invoices match and 3 need review.");
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("clears pending timers when unmounted mid-run", () => {
  vi.useFakeTimers();
  const view = render(<AIFeedbackDemo language="ar" />);
  act(() => vi.advanceTimersByTime(500));
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("shows the finished summary immediately under reduced motion", () => {
  vi.useFakeTimers();
  render(
    <SystemProvider config={{ ...defaultConfig, reducedMotion: true }}>
      <AIFeedbackDemo language="ar" />
    </SystemProvider>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("ملخص المطابقة جاهز");
  expect(document.querySelector(".tz-loading-state")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps disclosure focus through phase changes without stealing outside focus", () => {
  vi.useFakeTimers();
  const view = render(
    <>
      <AIFeedbackDemo language="en" />
      <button>Outside</button>
    </>,
  );
  const trigger = screen.getByRole("button", { name: "Reading invoices" });
  trigger.focus();
  act(() => vi.advanceTimersByTime(2800));
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAccessibleName("Reconciliation summary ready");
  view.unmount();
  render(
    <>
      <AIFeedbackDemo language="en" />
      <button>Outside</button>
    </>,
  );
  const outside = screen.getByRole("button", { name: "Outside" });
  outside.focus();
  act(() => vi.advanceTimersByTime(2800));
  expect(outside).toHaveFocus();
});

it.each(["ar", "en"] as const)(
  "renders %s feedback examples as product content only",
  (language) => {
    vi.useFakeTimers();
    const view = render(
      <>
        <ThinkingStateExample language={language} defaultExpanded />
        <AIFeedbackDemo language={language} />
      </>,
    );
    act(() => vi.advanceTimersByTime(2800));
    expect(view.container).not.toHaveTextContent(
      /\b(sample|example|local|demo|simulat\w*|fictional|scripted)\b|تجريبي|عينة|محلي|نموذجي|محاكاة/i,
    );
  },
);
