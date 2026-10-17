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
it("keeps drafts per conversation, model state, stable assistant identity and stops on switching/new/reset/unmount", async () => {
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
  const saved = assistant?.textContent;
  await act(() => vi.advanceTimersByTime(10000));
  await user.click(within(nav()).getByRole("button", { name: "Build notes" }));
  expect(
    document.querySelector('[data-message-id="assistant-1"]')?.textContent,
  ).toBe(saved);
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Concise sample",
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
  await user.type(draft(), "reset run");
  await user.click(screen.getByRole("button", { name: "Send" }));
  await user.click(screen.getByRole("button", { name: "Reset example" }));
  await act(() => vi.advanceTimersByTime(10000));
  expect(screen.queryByText("reset run")).toBeNull();
  await user.type(draft(), "unmount run");
  await user.click(screen.getByRole("button", { name: "Send" }));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("connects model selection to real local state", async () => {
  const user = userEvent.setup();
  render(<ChatAppExample language="en" />, { wrapper });
  await user.click(screen.getByRole("combobox", { name: "Model" }));
  await user.click(screen.getByRole("option", { name: /Detailed sample/ }));
  expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
    "Detailed sample",
  );
});
