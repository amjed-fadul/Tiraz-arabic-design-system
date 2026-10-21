import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AgentHandoff } from "./AgentHandoff";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("localizes the team while preserving an English prompt and a quiet gallery", () => {
  const { container } = render(<AgentHandoff language="ar" />);
  expect(screen.getByText("الباحث")).toBeInTheDocument();
  expect(screen.getByText("Review this month's feedback.")).toHaveAttribute(
    "class",
    "agent-handoff-prompt-copy",
  );
  expect(container.querySelector(".agent-handoff")).toHaveAttribute(
    "data-phase",
    "done",
  );
  expect(container.querySelector(".agent-handoff-art")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});

it("finishes a finite preview and cancels its scheduled work on unmount", () => {
  vi.useFakeTimers();
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    getPropertyValue: (property: string) =>
      property === "--motion-panel" ? "280ms" : "34ms",
  } as CSSStyleDeclaration);
  const { container, unmount } = render(<AgentHandoff animated />);
  act(() => vi.advanceTimersByTime(1));
  expect(container.querySelector(".agent-handoff")).toHaveAttribute(
    "data-phase",
    "typing",
  );
  act(() => vi.advanceTimersByTime(5000));
  expect(container.querySelector(".agent-handoff")).toHaveAttribute(
    "data-phase",
    "done",
  );
  unmount();
  const next = render(<AgentHandoff animated />);
  act(() => vi.advanceTimersByTime(1));
  next.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
