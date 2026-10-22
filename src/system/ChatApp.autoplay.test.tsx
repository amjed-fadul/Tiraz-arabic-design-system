import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ChatAppExample } from "./ai/examples/ChatAppExample";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {children}
  </SystemProvider>
);
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const draft = () => screen.getByRole("textbox");
const thread = () => screen.getByRole("region", { name: "Messages" });
const task = () => thread().querySelector(".tz-agent-run");
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("types and submits the opening request once, then stops at a real approval", async () => {
  const { unmount } = render(<ChatAppExample language="en" autoPlay />, {
    wrapper,
  });
  expect(draft()).toHaveValue("");
  expect(draft()).not.toHaveFocus();
  expect(task()).toBeNull();
  await advance(1000);
  expect(draft()).not.toHaveValue("");
  expect(draft()).not.toHaveValue("Prepare the October close");
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(0);
  await advance(1400);
  expect(draft()).toHaveValue("Prepare the October close");
  expect(screen.getByRole("button", { name: "Send" })).not.toHaveFocus();
  await advance(400);
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(1);
  expect(task()).toHaveAttribute("data-status", "running");
  expect(draft()).toHaveValue("");
  await advance(6000);
  expect(task()).toHaveAttribute("data-status", "needs-you");
  expect(
    screen.getByRole("button", { name: "Send the reminders" }),
  ).toBeEnabled();
  expect(thread()).not.toHaveTextContent("3 reminders sent");
  await advance(20000);
  expect(task()).toHaveAttribute("data-status", "needs-you");
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("pauses the draft, resumes, and replays the sequence without duplicating messages", async () => {
  render(<ChatAppExample language="en" autoPlay />, { wrapper });
  await advance(1000);
  const pausedDraft = (draft() as HTMLTextAreaElement).value;
  fireEvent.click(screen.getByRole("button", { name: "Pause demo" }));
  await advance(5000);
  expect(draft()).toHaveValue(pausedDraft);
  fireEvent.click(screen.getByRole("button", { name: "Resume demo" }));
  await advance(8000);
  expect(task()).toHaveAttribute("data-status", "needs-you");
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  expect(draft()).toHaveValue("");
  expect(task()).toBeNull();
  await advance(9000);
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(1);
  expect(task()).toHaveAttribute("data-status", "needs-you");
});

it("yields the draft immediately to human input and never submits it automatically", async () => {
  render(<ChatAppExample language="en" autoPlay />, { wrapper });
  await advance(800);
  fireEvent.focus(draft());
  fireEvent.change(draft(), { target: { value: "My own request" } });
  await advance(10000);
  expect(draft()).toHaveValue("My own request");
  expect(thread().querySelectorAll("[data-message-id]")).toHaveLength(0);
  expect(
    screen.getByRole("button", { name: "Replay demo" }),
  ).toBeInTheDocument();
});

it("cancels the opening when another conversation is selected", async () => {
  render(<ChatAppExample language="en" autoPlay />, { wrapper });
  await advance(800);
  const nav = screen.getAllByRole("navigation", { name: "Conversations" })[0];
  fireEvent.click(within(nav).getByRole("button", { name: "Late customers" }));
  await advance(10000);
  expect(thread()).toHaveTextContent("Which customers pay latest?");
  expect(thread()).not.toHaveTextContent("Prepare the October close");
  expect(draft()).toHaveValue("");
});

it.each(["reduced motion", "off query"])(
  "skips the opening with %s",
  async (preference) => {
    if (preference === "off query")
      window.history.replaceState({}, "", "/examples/chat-app?demo=off");
    const { unmount } = render(
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: "ltr",
          reducedMotion: preference === "reduced motion",
        }}
      >
        <ChatAppExample language="en" autoPlay />
      </SystemProvider>,
    );
    expect(task()).toHaveAttribute("data-status", "needs-you");
    expect(screen.queryByRole("button", { name: "Pause demo" })).toBeNull();
    await advance(10000);
    expect(draft()).toHaveValue("");
    expect(task()).toHaveAttribute("data-status", "needs-you");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  },
);

it("clears its timer when unmounted during typing", async () => {
  const { unmount } = render(<ChatAppExample language="en" autoPlay />, {
    wrapper,
  });
  await advance(800);
  expect(draft()).not.toHaveValue("");
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("replays without losing sent messages, the draft, or a recorded approval", async () => {
  render(<ChatAppExample language="en" autoPlay />, { wrapper });
  await advance(9000);
  fireEvent.change(draft(), {
    target: { value: "Keep this conversation note" },
  });
  fireEvent.keyDown(draft(), { key: "Enter" });
  fireEvent.change(draft(), { target: { value: "Keep this unsent draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Send the reminders" }));
  await advance(700);
  expect(task()).toHaveAttribute("data-status", "completed");

  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  expect(task()).toBeNull();
  await advance(2800);
  expect(task()).toHaveAttribute("data-status", "running");
  expect(thread()).not.toHaveTextContent("3 reminders sent");
  await advance(6200);
  expect(thread()).toHaveTextContent("Keep this conversation note");
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(2);
  expect(draft()).toHaveValue("Keep this unsent draft");
  expect(task()).toHaveAttribute("data-status", "completed");
  expect(thread()).toHaveTextContent("3 reminders sent");
  expect(
    screen.queryByRole("button", { name: "Send the reminders" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  await advance(800);
  fireEvent.focus(draft());
  expect(draft()).toHaveValue("Keep this unsent draft");
  expect(thread()).toHaveTextContent("Keep this conversation note");
  expect(task()).toHaveAttribute("data-status", "completed");
});

it("keeps the selected conversation and restores its draft when replay is interrupted", async () => {
  render(<ChatAppExample language="en" autoPlay />, { wrapper });
  await advance(9000);
  const nav = screen.getAllByRole("navigation", { name: "Conversations" })[0];
  const selected = within(nav).getByRole("button", { name: "Late customers" });
  fireEvent.click(selected);
  fireEvent.change(draft(), { target: { value: "Follow up with Madar" } });
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  await advance(800);
  fireEvent.focus(draft());
  await advance(10000);
  expect(selected).toHaveAttribute("aria-current", "true");
  expect(draft()).toHaveValue("Follow up with Madar");
  expect(thread()).toHaveTextContent("Which customers pay latest?");
  expect(thread()).not.toHaveTextContent("Prepare the October close");
});

it("consumes the pointer activation of replay Send before restoring a private draft", async () => {
  render(<ChatAppExample language="en" autoPlay />, { wrapper });
  await advance(9000);
  fireEvent.change(draft(), {
    target: { value: "Keep this unsent private draft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  await advance(1200);
  expect(draft()).toHaveValue("Prepare the Oct");
  const send = screen.getByRole("button", { name: "Send" });
  fireEvent.pointerDown(send);
  fireEvent.mouseDown(send);
  fireEvent.pointerUp(send);
  fireEvent.mouseUp(send);
  fireEvent.click(send);
  await advance(0);
  expect(draft()).toHaveValue("Keep this unsent private draft");
  expect(thread()).not.toHaveTextContent("Keep this unsent private draft");
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(1);

  // A new activation can send the now-visible saved draft.
  fireEvent.pointerDown(send);
  fireEvent.pointerUp(send);
  fireEvent.click(send);
  await advance(0);
  expect(draft()).toHaveValue("");
  expect(thread()).toHaveTextContent("Keep this unsent private draft");
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(2);
});

it.each(["Enter", " "])(
  "consumes the %j activation of replay Send until the key is released",
  async (key) => {
    render(<ChatAppExample language="en" autoPlay />, { wrapper });
    await advance(9000);
    fireEvent.change(draft(), {
      target: { value: "Keep this unsent private draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
    await advance(1200);
    const send = screen.getByRole("button", { name: "Send" });
    fireEvent.focus(send);
    expect(fireEvent.keyDown(send, { key })).toBe(false);
    expect(fireEvent.keyDown(send, { key, repeat: true })).toBe(false);
    expect(fireEvent.keyUp(send, { key })).toBe(false);
    expect(draft()).toHaveValue("Keep this unsent private draft");
    expect(thread()).not.toHaveTextContent("Keep this unsent private draft");
    expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(1);

    fireEvent.keyDown(send, { key });
    fireEvent.keyUp(send, { key });
    fireEvent.click(send);
    await advance(0);
    expect(thread()).toHaveTextContent("Keep this unsent private draft");
    expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(2);
  },
);

it("consumes Enter in the replay composer before restoring the saved draft", async () => {
  render(<ChatAppExample language="en" autoPlay />, { wrapper });
  await advance(9000);
  fireEvent.change(draft(), {
    target: { value: "Keep this unsent private draft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
  await advance(1200);
  fireEvent.keyDown(draft(), { key: "Enter" });
  fireEvent.keyDown(draft(), { key: "Enter", repeat: true });
  fireEvent.keyUp(draft(), { key: "Enter" });
  await advance(0);
  expect(draft()).toHaveValue("Keep this unsent private draft");
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(1);
  fireEvent.keyDown(draft(), { key: "Enter" });
  await advance(0);
  expect(thread()).toHaveTextContent("Keep this unsent private draft");
  expect(thread().querySelectorAll('[data-role="user"]')).toHaveLength(2);
});
