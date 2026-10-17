import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChatConversation } from "./ai/examples/ChatExamples";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const wrap = (node: React.ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {node}
  </SystemProvider>
);
afterEach(() => vi.useRealTimers());
it("starts only on explicit send, appends one stable assistant, stops without losing content", async () => {
  vi.useFakeTimers();
  const view = render(wrap(<ChatConversation language="en" />));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(view.container.querySelectorAll("[data-message-id]")).toHaveLength(0);
  const input = screen.getByRole("textbox");
  input.focus();
  fireEvent.change(input, { target: { value: "  Hello / مرحبا  " } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Enter" });
  });
  expect(input).toHaveValue("");
  expect(input).toHaveFocus();
  expect(view.container.querySelectorAll("[data-message-id]")).toHaveLength(2);
  expect(view.container.querySelector('[data-role="user"]')?.textContent).toBe(
    "  Hello / مرحبا  ",
  );
  const assistant = view.container.querySelector('[data-role="assistant"]');
  await act(async () => vi.advanceTimersByTime(650));
  expect(view.container.querySelector('[data-role="assistant"]')).toBe(
    assistant,
  );
  const received = assistant?.querySelector(".tz-stream-prose")?.textContent;
  fireEvent.click(screen.getByRole("button", { name: "Stop generating" }));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(assistant?.querySelector(".tz-stream-prose")?.textContent).toBe(
    received,
  );
  expect(screen.getAllByRole("status")[0]).toHaveTextContent("Stopped");
});
it("reset/configuration/unmount invalidate callbacks; a new run completes", async () => {
  vi.useFakeTimers();
  const view = render(wrap(<ChatConversation language="en" />));
  const send = async (text: string) => {
    fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
    await act(async () =>
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" }),
    );
  };
  await send("first");
  fireEvent.click(screen.getByRole("button", { name: "Reset conversation" }));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(view.container.querySelectorAll("[data-message-id]")).toHaveLength(0);
  await send("second");
  view.rerender(wrap(<ChatConversation language="ar" />));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(view.container.querySelectorAll("[data-message-id]")).toHaveLength(0);
  await send("ثالث");
  await act(async () => vi.advanceTimersByTime(10000));
  expect(screen.getAllByRole("status")[0]).toHaveTextContent("اكتمل الرد");
  await send("رابع");
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
