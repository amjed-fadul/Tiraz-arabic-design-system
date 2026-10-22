import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  ChatComposerExample,
  ChatConversation,
  ChatThreadExample,
  PromptBarExample,
} from "./ai/examples/ChatExamples";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const wrap = (node: React.ReactNode, reducedMotion = false) => (
  <SystemProvider
    config={{ ...defaultConfig, direction: "ltr", reducedMotion }}
  >
    {node}
  </SystemProvider>
);
const prose = (node: Element | null | undefined) =>
  node?.querySelector(".tz-stream-prose")?.textContent;
afterEach(() => vi.useRealTimers());
it("plays the opening exchange once, appends one stable assistant per send and stops without losing content", async () => {
  vi.useFakeTimers();
  const view = render(wrap(<ChatConversation language="en" />));
  const messages = () => view.container.querySelectorAll("[data-message-id]");
  expect(messages()).toHaveLength(0);
  await act(async () => vi.advanceTimersByTime(500));
  expect(messages()).toHaveLength(2);
  expect(view.container.querySelector('[data-role="user"]')?.textContent).toBe(
    "How do I prepare a clear Arabic interface?",
  );
  await act(async () => vi.advanceTimersByTime(10000));
  expect(messages()).toHaveLength(2);
  expect(prose(messages()[1])).toMatch(/^Start with short, clear labels/);
  expect(prose(messages()[1])).toMatch(/before launch\.$/);
  expect(screen.getByRole("button", { name: "Send" })).toBeVisible();
  const input = screen.getByRole("textbox");
  input.focus();
  fireEvent.change(input, { target: { value: "  Hello / مرحبا  " } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Enter" });
  });
  expect(input).toHaveValue("");
  expect(input).toHaveFocus();
  expect(messages()).toHaveLength(4);
  expect(
    view.container.querySelectorAll('[data-role="user"]')[1].textContent,
  ).toBe("  Hello / مرحبا  ");
  const assistant = messages()[3];
  await act(async () => vi.advanceTimersByTime(650));
  expect(messages()[3]).toBe(assistant);
  const received = prose(assistant);
  expect(received).toMatch(/^Start/);
  fireEvent.click(screen.getByRole("button", { name: "Stop generating" }));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(prose(assistant)).toBe(received);
  expect(assistant).toHaveTextContent("Response stopped");
  expect(screen.getByRole("button", { name: "Send" })).toBeVisible();
});
it("starts on the final opening state under reduced motion", () => {
  vi.useFakeTimers();
  const view = render(wrap(<ChatConversation language="en" />, true));
  const messages = view.container.querySelectorAll("[data-message-id]");
  expect(messages).toHaveLength(2);
  expect(prose(messages[1])).toMatch(/before launch\.$/);
  expect(vi.getTimerCount()).toBe(0);
});
it("configuration/unmount invalidate callbacks; a new run completes", async () => {
  vi.useFakeTimers();
  const view = render(wrap(<ChatConversation language="en" />));
  const send = async (text: string) => {
    fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
    await act(async () =>
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" }),
    );
  };
  await act(async () => vi.advanceTimersByTime(10000));
  await send("second");
  view.rerender(wrap(<ChatConversation language="ar" />));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(view.container.querySelectorAll("[data-message-id]")).toHaveLength(2);
  expect(screen.queryByText("second")).toBeNull();
  await send("ثالث");
  await act(async () => vi.advanceTimersByTime(10000));
  const last = Array.from(
    view.container.querySelectorAll('[data-role="assistant"]'),
  ).at(-1);
  expect(prose(last)).toMatch(/قبل الإطلاق\.$/);
  expect(last).toHaveTextContent("اكتمل الرد");
  await send("رابع");
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("shows assistant replies without identity or avatar", async () => {
  vi.useFakeTimers();
  const view = render(wrap(<ChatThreadExample language="en" identities />));
  expect(view.container.querySelector(".tz-chat-identity")).toBeNull();
  // The answer arrives after a short thinking beat, with its action.
  expect(
    view.container.querySelector(
      '[data-role="assistant"] .tz-thinking-indicator',
    ),
  ).toHaveTextContent("Preparing reply");
  expect(screen.queryByRole("button", { name: "Good response" })).toBeNull();
  await act(async () => vi.advanceTimersByTime(1400));
  expect(view.container.querySelector(".tz-thinking-indicator")).toBeNull();
  expect(view.container.querySelector(".tz-chat-identity")).toBeNull();
  const helpful = screen.getByRole("button", { name: "Good response" });
  expect(helpful).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(helpful);
  expect(helpful).toHaveAttribute("aria-pressed", "true");
});
it("shows the thread answer at once under reduced motion", () => {
  vi.useFakeTimers();
  const view = render(wrap(<ChatThreadExample language="en" />, true));
  expect(view.container.querySelector(".tz-thinking-indicator")).toBeNull();
  expect(screen.getByRole("button", { name: "Good response" })).toBeVisible();
  expect(vi.getTimerCount()).toBe(0);
});
it.each([
  ["composer", <ChatComposerExample key="c" language="en" failSend />],
  ["prompt bar", <PromptBarExample key="p" language="en" failSend />],
])(
  "keeps the %s draft and explains a failed send after a moment",
  async (_, entry) => {
    vi.useFakeTimers();
    const view = render(wrap(entry, true));
    const messages = () =>
      view.container.querySelectorAll("[data-message-id]").length;
    const before = messages();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Summarize the notes" } });
    await act(async () => fireEvent.keyDown(input, { key: "Enter" }));
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await act(async () => vi.advanceTimersByTime(799));
    expect(
      screen.queryByText("Could not send. Your draft is kept; try again."),
    ).toBeNull();
    await act(async () => vi.advanceTimersByTime(1));
    expect(input).toHaveAccessibleDescription(
      "Could not send. Your draft is kept; try again.",
    );
    expect(input).toHaveValue("Summarize the notes");
    expect(messages()).toBe(before);
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  },
);
it("clears the prompt bar draft only once the send has gone through", async () => {
  vi.useFakeTimers();
  render(wrap(<PromptBarExample language="en" />));
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "Draft a reply" } });
  await act(async () => fireEvent.keyDown(input, { key: "Enter" }));
  expect(input).toHaveValue("Draft a reply");
  expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  await act(async () => vi.advanceTimersByTime(700));
  expect(input).toHaveValue("");
  expect(input).not.toHaveAccessibleDescription();
  expect(vi.getTimerCount()).toBe(0);
});
