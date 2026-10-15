import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AIFeedbackDemo } from "./ai/examples/AIFeedbackExamples";
afterEach(() => vi.useRealTimers());
it("starts only explicitly, cancels stale runs on replay/cancel and clears timers on unmount", () => {
  vi.useFakeTimers();
  const view = render(<AIFeedbackDemo language="en" />);
  expect(vi.getTimerCount()).toBe(0);
  expect(screen.getByRole("status")).toHaveTextContent("Demo ready");
  fireEvent.click(screen.getByRole("button", { name: "Run demo" }));
  act(() => vi.advanceTimersByTime(700));
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Demo: arranging sample",
  );
  act(() => vi.advanceTimersByTime(400));
  expect(screen.getByRole("status")).not.toHaveTextContent(
    "Demo summary ready",
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel demo" }));
  expect(vi.getTimerCount()).toBe(0);
  expect(screen.getByRole("status")).toHaveTextContent("Demo cancelled");
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  act(() => vi.advanceTimersByTime(1800));
  expect(screen.getByRole("status")).toHaveTextContent("Demo summary ready");
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("preserves keyboard focus on cancellation and on completion without stealing outside focus", () => {
  vi.useFakeTimers();
  render(
    <>
      <AIFeedbackDemo language="en" />
      <button>Outside</button>
    </>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Run demo" }));
  const cancel = screen.getByRole("button", { name: "Cancel demo" });
  cancel.focus();
  fireEvent.click(cancel);
  expect(cancel).toHaveFocus();
  expect(cancel).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  cancel.focus();
  act(() => vi.advanceTimersByTime(1800));
  expect(cancel).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  const outside = screen.getByRole("button", { name: "Outside" });
  outside.focus();
  act(() => vi.advanceTimersByTime(1800));
  expect(outside).toHaveFocus();
});
