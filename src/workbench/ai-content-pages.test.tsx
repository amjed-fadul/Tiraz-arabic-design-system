import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { StreamingDemo } from "../system/ai/examples/AIContentExamples";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
it.each([
  ["كتلة الشيفرة", "CodeBlock"],
  ["ماركداون", "Markdown"],
  ["النص المتدفق", "StreamingText"],
] as const)(
  "keeps %s within AI patterns and copies portable examples and dependency guidance",
  async (ar, en) => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Examples" })).toBeVisible();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(document.querySelector(".code-example") as HTMLElement).getByRole(
        "button",
        { name: "Copy code" },
      ),
    );
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    const prompt = String(copy.mock.calls.at(-1)?.[0]);
    expect(prompt).toContain(code);
    expect(prompt).toContain("react-markdown@10.1.0");
    expect(prompt).toContain("remark-gfm@4.0.1");
  },
);
it("explicitly starts fixed chunks, preserves cancellation content and invalidates replay/unmount callbacks", async () => {
  vi.useFakeTimers();
  const wrap = (node: React.ReactNode) => (
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      {node}
    </SystemProvider>
  );
  const view = render(wrap(<StreamingDemo language="en" markdown />));
  const content = () =>
    document.querySelector(".tz-stream-content")?.textContent;
  expect(vi.getTimerCount()).toBe(0);
  expect(content()).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Start local demo" }));
  await act(async () => vi.advanceTimersByTime(960));
  const received = content();
  expect(received).toContain("Tiraz");
  fireEvent.click(screen.getByRole("button", { name: "Cancel demo" }));
  expect(document.querySelector(".tz-stream-cursor")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => vi.advanceTimersByTime(10000));
  expect(content()).toBe(received);
  expect(
    document.querySelector(".tz-streaming-text > [role=status]"),
  ).toHaveTextContent("cancelled");
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  await act(async () => vi.advanceTimersByTime(320));
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  expect(content()).toBe("");
  await act(async () => vi.advanceTimersByTime(320));
  expect(content()).toBe("Local summary");
  await act(async () => vi.advanceTimersByTime(4000));
  expect(
    document.querySelector(".tz-streaming-text > [role=status]"),
  ).toHaveTextContent("Local sample complete");
  expect(screen.getByRole("table")).toBeVisible();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
