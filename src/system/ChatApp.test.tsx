import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ChatApp } from "./ChatApp";
import { ChatAppExample } from "./ai/examples/ChatAppExample";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {children}
  </SystemProvider>
);
afterEach(() => vi.useRealTimers());
it("delegates conversation identity and creation and restores Sheet trigger focus after selection and Escape", async () => {
  const user = userEvent.setup(),
    select = vi.fn(),
    create = vi.fn();
  render(
    <ChatApp
      conversations={[
        { id: "a", title: "Alpha" },
        { id: "b", title: "Beta" },
      ]}
      activeConversationId="a"
      onConversationSelect={select}
      onNewConversation={create}
      composer={<textarea aria-label="Draft" />}
    >
      <p>Thread slot</p>
    </ChatApp>,
    { wrapper },
  );
  const desktop = screen.getAllByRole("navigation", {
    name: "Conversations",
  })[0];
  expect(
    within(desktop).getByRole("button", { name: "Alpha" }),
  ).toHaveAttribute("aria-current", "true");
  await user.click(
    within(desktop).getByRole("button", { name: "New conversation" }),
  );
  expect(create).toHaveBeenCalledOnce();
  const trigger = screen.getByRole("button", { name: "Open conversations" });
  await user.click(trigger);
  const sheet = screen.getByRole("dialog");
  await user.click(within(sheet).getByRole("button", { name: "Beta" }));
  expect(select).toHaveBeenCalledWith("b");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(trigger).toHaveFocus();
  await user.click(trigger);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(trigger).toHaveFocus();
});
it("keeps drafts per conversation, model state, stable assistant identity and stops on switching/new/unmount", async () => {
  vi.useFakeTimers();
  const user = {
    type: async (node: HTMLElement, text: string) => {
      await act(async () => {
        fireEvent.change(node, { target: { value: text } });
      });
    },
    click: async (node: HTMLElement) => {
      await act(async () => {
        fireEvent.click(node);
      });
    },
    keyboard: async (_keys: string) => {
      await act(async () => {
        fireEvent.keyDown(draft(), { key: "Enter" });
        fireEvent.keyDown(draft(), { key: "Enter" });
      });
    },
  };
  const { unmount } = render(<ChatAppExample language="en" />, { wrapper });
  const draft = () => screen.getByRole("textbox"),
    nav = () => screen.getAllByRole("navigation", { name: "Conversations" })[0];
  await user.type(draft(), "kept draft");
  await user.click(
    within(nav()).getByRole("button", { name: "Arabic interface" }),
  );
  expect(draft()).toHaveValue("");
  await user.type(draft(), "other draft");
  await user.click(within(nav()).getByRole("button", { name: "Build notes" }));
  expect(draft()).toHaveValue("kept draft");
  await user.click(screen.getByRole("button", { name: "Send" }));
  await user.keyboard("{Enter}{Enter}");
  expect(screen.getAllByText("kept draft")).toHaveLength(1);
  const assistant = document.querySelector('[data-message-id="assistant-1"]');
  expect(assistant).not.toBeNull();
  await act(() => vi.advanceTimersByTime(600));
  expect(document.querySelector('[data-message-id="assistant-1"]')).toBe(
    assistant,
  );
  expect(assistant?.textContent).toContain("Start");
  await user.click(
    within(nav()).getByRole("button", { name: "Arabic interface" }),
  );
  expect(draft()).toHaveValue("other draft");
  const prose = () =>
    document.querySelector('[data-message-id="assistant-1"] .tz-stream-prose')
      ?.textContent;
  const saved = assistant?.querySelector(".tz-stream-prose")?.textContent;
  await act(() => vi.advanceTimersByTime(10000));
  await user.click(within(nav()).getByRole("button", { name: "Build notes" }));
  expect(prose()).toBe(saved);
  expect(
    document.querySelector('[data-message-id="assistant-1"]'),
  ).toHaveTextContent("Response stopped");
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Concise",
  );
  await user.type(draft(), "again");
  await user.click(screen.getByRole("button", { name: "Send" }));
  await act(() => vi.advanceTimersByTime(300));
  await user.click(screen.getByRole("button", { name: "Stop generating" }));
  const stopped = document.querySelector(
    '[data-message-id="assistant-2"]',
  )?.textContent;
  await act(() => vi.advanceTimersByTime(10000));
  expect(
    document.querySelector('[data-message-id="assistant-2"]')?.textContent,
  ).toBe(stopped);
  await user.type(draft(), "new run");
  await user.click(screen.getByRole("button", { name: "Send" }));
  await user.click(
    within(nav()).getByRole("button", { name: "New conversation" }),
  );
  await act(() => vi.advanceTimersByTime(10000));
  expect(screen.queryByText("new run")).toBeNull();
  expect(draft()).toHaveValue("");
  await user.type(draft(), "unmount run");
  await user.click(screen.getByRole("button", { name: "Send" }));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("connects model selection to real local state", async () => {
  const user = userEvent.setup();
  render(<ChatAppExample language="en" />, { wrapper });
  await user.click(screen.getByRole("combobox", { name: "Model" }));
  await user.click(screen.getByRole("option", { name: /Detailed/ }));
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Detailed",
  );
});
it("renders assistant replies without an identity or avatar and drops example-only controls", () => {
  render(<ChatAppExample language="en" />, { wrapper });
  const thread = screen.getByRole("region", { name: "Messages" });
  expect(thread.querySelector(".tz-chat-identity")).toBeNull();
  expect(
    thread.querySelector('[data-role="assistant"]')?.textContent,
  ).toContain("The build finished cleanly");
  expect(screen.queryByRole("button", { name: /Reset/ })).toBeNull();
  expect(screen.queryByText(/sample|local/i)).toBeNull();
});
