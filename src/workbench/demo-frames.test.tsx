import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { canReplayExamples, canReplayPlayground } from "./demo-capabilities";
import { defaultPlaygrounds } from "./model";
import { DemoFrame } from "../system/ai/examples/DemoFrame";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
it("gives static previews matching frames with only a copy-prompt header action", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "حقل النسخ" }));
  const frames = document.querySelectorAll(".tz-demo-frame");
  expect(frames).toHaveLength(2);
  const write = vi.spyOn(navigator.clipboard, "writeText");
  for (const frame of frames) {
    const header = frame.querySelector(".tz-demo-header") as HTMLElement;
    expect(within(header).getAllByRole("button")).toHaveLength(1);
    const copy = within(header).getByRole("button", { name: /نسخ طلب/ });
    await user.click(copy);
    expect(copy).toHaveAttribute("data-copy-state", "copied");
    expect(write.mock.calls.at(-1)?.[0]).toContain("InputCopyExample");
    expect(write.mock.calls.at(-1)?.[0]).toContain("ai/README.md");
  }
});
it("keeps streaming autoplay, replaces stop with copy, and replays without losing header focus", async () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.click(screen.getByRole("button", { name: "النص المتتابع" }));
  await act(async () => vi.advanceTimersByTime(640));
  expect(screen.queryByRole("heading", { name: "أمثلة", level: 2 })).toBeNull();
  // Streaming now lives only in the playground frame.
  const frames = document.querySelectorAll(".tz-demo-frame");
  expect(frames).toHaveLength(1);
  for (const frame of frames) {
    const header = frame.querySelector(".tz-demo-header") as HTMLElement;
    expect(within(header).getAllByRole("button")).toHaveLength(2);
    expect(within(header).queryByRole("button", { name: /إلغاء/ })).toBeNull();
    expect(
      within(header).getByRole("button", { name: /نسخ طلب/ }),
    ).toBeVisible();
    const replay = within(header).getByRole("button", {
      name: "إعادة تشغيل المثال",
    });
    replay.focus();
    fireEvent.click(replay);
    expect(replay).toHaveFocus();
    expect(frame.querySelector(".tz-stream-content")?.textContent).toBe("");
  }
  await act(async () => vi.advanceTimersByTime(4000));
  for (const frame of frames)
    expect(frame.querySelector(".tz-streaming-text")).toHaveAttribute(
      "data-state",
      "completed",
    );
});
it("provides replay for an interactive example and clears its local state without remounting the header", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "مربع النص" }));
  const frame = document.querySelector(
    ".examples-canvas .tz-demo-frame",
  ) as HTMLElement;
  const updates = within(frame).getByRole("checkbox", {
    name: /تلقّي التحديثات/,
  });
  expect(updates).not.toBeChecked();
  await user.click(updates);
  expect(updates).toBeChecked();
  const replay = within(frame.querySelector("header")!).getByRole("button", {
    name: "إعادة تشغيل المثال",
  });
  await user.click(replay);
  expect(replay).toHaveFocus();
  expect(
    within(frame).getByRole("checkbox", { name: /تلقّي التحديثات/ }),
  ).not.toBeChecked();
});

it("offers replay only when the actual section has state or motion to restart", () => {
  for (const component of [
    "context-meter",
    "model-selector",
    "chat-composer",
    "prompt-bar",
    "input-copy",
  ] as const)
    expect(canReplayExamples(component)).toBe(false);
  expect(canReplayExamples("alert")).toBe(true);
  expect(canReplayExamples("textarea")).toBe(true);
  const progress = defaultPlaygrounds("en").progress;
  expect(
    canReplayPlayground("progress", { ...progress, indeterminate: false }),
  ).toBe(false);
  expect(
    canReplayPlayground("progress", { ...progress, indeterminate: true }),
  ).toBe(true);
});
it("announces copy failure honestly, supports retry, and ignores stale clipboard completions", async () => {
  const user = userEvent.setup();
  const write = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockRejectedValueOnce(new Error("Denied"));
  const wrap = (prompt: string) => (
    <SystemProvider config={defaultConfig}>
      <DemoFrame title="Default" language="en" prompt={prompt}>
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>
  );
  const view = render(wrap("source\n  with whitespace\n"));
  const copy = screen.getByRole("button", { name: "Copy demo prompt" });
  await user.click(copy);
  expect(copy).toHaveAttribute("data-copy-state", "failed");
  expect(screen.getByRole("status")).toHaveTextContent("Could not copy prompt");
  write.mockResolvedValueOnce();
  await user.click(copy);
  expect(write).toHaveBeenLastCalledWith("source\n  with whitespace\n");
  expect(copy).toHaveAttribute("data-copy-state", "copied");
  expect(copy).toHaveTextContent("");
  let finish!: () => void;
  write.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await user.click(copy);
  view.rerender(wrap("new prompt"));
  await act(async () => finish());
  expect(copy).toHaveAttribute("data-copy-state", "idle");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("replays the interactive getting-started EmptyState example after its action is used", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "الحالة الفارغة" }));
  const frame = document.querySelector(
    ".examples-canvas .tz-demo-frame",
  ) as HTMLElement;
  expect(within(frame).getByText("ابدأ بخطوة بسيطة")).toBeVisible();
  await user.click(
    within(frame).getByRole("button", { name: "عرض دليل البداية" }),
  );
  expect(within(frame).queryByText("ابدأ بخطوة بسيطة")).toBeNull();
  const replay = within(frame.querySelector("header")!).getByRole("button", {
    name: "إعادة تشغيل المثال",
  });
  await user.click(replay);
  expect(replay).toHaveFocus();
  expect(within(frame).getByText("ابدأ بخطوة بسيطة")).toBeVisible();
});
