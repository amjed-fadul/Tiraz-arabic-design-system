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
it("keeps a draft per conversation, answers a sent request in its own conversation and leaves no timer behind", async () => {
  vi.useFakeTimers();
  // Fake timers rule out userEvent, so each step is one act-wrapped event.
  const step = async (change: () => void) => {
    await act(async () => change());
  };
  const { unmount } = render(<ChatAppExample language="en" />, { wrapper });
  const draft = () => screen.getByRole("textbox"),
    nav = () => screen.getAllByRole("navigation", { name: "Conversations" })[0],
    open = (name: string) =>
      step(() => fireEvent.click(within(nav()).getByRole("button", { name })));
  await step(() =>
    fireEvent.change(draft(), { target: { value: "kept draft" } }),
  );
  await open("Late customers");
  expect(draft()).toHaveValue("");
  await step(() =>
    fireEvent.change(draft(), { target: { value: "other draft" } }),
  );
  await open("October close");
  expect(draft()).toHaveValue("kept draft");
  // Enter sends it once: Laila's request, and the example's answer to it.
  await step(() => {
    fireEvent.keyDown(draft(), { key: "Enter" });
    fireEvent.keyDown(draft(), { key: "Enter" });
  });
  expect(screen.getAllByText("kept draft")).toHaveLength(1);
  expect(draft()).toHaveValue("");
  expect(screen.getAllByText(/come back with the result/)).toHaveLength(1);
  // The other conversation kept its own draft, and none of this.
  await open("Late customers");
  expect(draft()).toHaveValue("other draft");
  expect(screen.queryByText("kept draft")).toBeNull();
  // A new conversation starts empty, in Today.
  await step(() =>
    fireEvent.click(
      within(nav()).getByRole("button", { name: "New conversation" }),
    ),
  );
  expect(document.querySelectorAll("[data-message-id]")).toHaveLength(0);
  expect(draft()).toHaveValue("");
  expect(
    within(within(nav()).getByRole("group", { name: "Today" })).getByRole(
      "button",
      { name: "Chat 5" },
    ),
  ).toHaveAttribute("aria-current", "true");
  await act(() => vi.advanceTimersByTimeAsync(10000));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("renders the thread without an identity or avatar and drops example-only controls", () => {
  render(<ChatAppExample language="en" />, { wrapper });
  const thread = screen.getByRole("region", { name: "Messages" });
  expect(thread.querySelector(".tz-chat-identity")).toBeNull();
  expect(
    thread.querySelector('[data-role="assistant"]')?.textContent,
  ).toContain("Net cash flow fell");
  expect(screen.queryByRole("button", { name: /Reset/ })).toBeNull();
  expect(screen.queryByText(/sample|local/i)).toBeNull();
});

it("groups conversations and offers rename and delete as intents", async () => {
  const user = userEvent.setup(),
    rename = vi.fn(),
    remove = vi.fn(),
    select = vi.fn();
  const conversations = [
    { id: "a", title: "Alpha", group: "Today" },
    { id: "b", title: "Beta", group: "Last week" },
    { id: "c", title: "Gamma", group: "Today" },
    { id: "d", title: "Delta" },
  ];
  const app = (props: Partial<React.ComponentProps<typeof ChatApp>> = {}) => (
    <ChatApp
      conversations={conversations}
      activeConversationId="a"
      onConversationSelect={select}
      onNewConversation={() => {}}
      composer={<textarea aria-label="Draft" />}
      {...props}
    >
      <p>Thread slot</p>
    </ChatApp>
  );
  const view = render(
    app({ onConversationRename: rename, onConversationDelete: remove }),
    { wrapper },
  );
  const desktop = () =>
    screen.getAllByRole("navigation", { name: "Conversations" })[0];
  // Groups follow their first conversation; the ungrouped one sits under the
  // existing heading.
  expect(
    within(desktop())
      .getAllByRole("group")
      .map((group) => [
        group.querySelector(".tz-sidebar-heading")?.textContent,
        within(group)
          .getAllByRole("button", { name: /^(?!Options for)/ })
          .map((row) => row.getAttribute("aria-label")),
      ]),
  ).toEqual([
    ["Today", ["Alpha", "Gamma"]],
    ["Last week", ["Beta"]],
    ["Conversations", ["Delta"]],
  ]);
  await user.click(within(desktop()).getByRole("button", { name: "Beta" }));
  expect(select).toHaveBeenCalledExactlyOnceWith("b");
  // Each row has a menu named for it. Its items report intents: the host owns
  // the rename field and the confirmation.
  await user.click(
    within(desktop()).getByRole("button", { name: "Options for Gamma" }),
  );
  expect(
    screen.getAllByRole("menuitem").map((item) => item.textContent),
  ).toEqual(["Rename", "Delete"]);
  await user.click(screen.getByRole("menuitem", { name: "Rename" }));
  expect(rename).toHaveBeenCalledExactlyOnceWith("c");
  await user.click(
    within(desktop()).getByRole("button", { name: "Options for Delta" }),
  );
  await user.click(screen.getByRole("menuitem", { name: "Delete" }));
  expect(remove).toHaveBeenCalledExactlyOnceWith("d");
  expect(select).toHaveBeenCalledOnce();
  // One callback offers one item, and labels rename the words.
  view.rerender(
    app({
      onConversationDelete: remove,
      labels: {
        delete: "Remove",
        conversationActions: (title) => `${title} menu`,
      },
    }),
  );
  await user.click(
    within(desktop()).getByRole("button", { name: "Alpha menu" }),
  );
  expect(
    screen.getAllByRole("menuitem").map((item) => item.textContent),
  ).toEqual(["Remove"]);
  await user.keyboard("{Escape}");
  // Without either callback there is no menu.
  view.rerender(app());
  expect(screen.queryByRole("button", { name: /menu|Options for/ })).toBeNull();
});
it("deletes a conversation from the example only once «حذف» is confirmed", async () => {
  const user = userEvent.setup();
  const rtl = ({ children }: { children: React.ReactNode }) => (
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      {children}
    </SystemProvider>
  );
  render(<ChatAppExample language="ar" />, { wrapper: rtl });
  const nav = () => screen.getAllByRole("navigation", { name: "المحادثات" })[0];
  // By its id: an open dialog hides the page from assistive technology.
  const row = () => document.querySelector('[data-conversation-id="late"]');
  const ask = async () => {
    await user.click(
      within(nav()).getByRole("button", { name: "خيارات العملاء المتأخرون" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "حذف" }));
  };
  // The row only asks; the row stays until «حذف» is confirmed.
  await ask();
  const dialog = screen.getByRole("dialog", {
    name: "حذف «العملاء المتأخرون»؟",
  });
  expect(row()).not.toBeNull();
  await user.click(within(dialog).getByRole("button", { name: "إلغاء" }));
  expect(row()).not.toBeNull();
  await ask();
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "حذف" }),
  );
  expect(row()).toBeNull();
});
it("shows a side panel and header actions, and no brand unless given", () => {
  const app = (props: Partial<React.ComponentProps<typeof ChatApp>> = {}) => (
    <ChatApp
      conversations={[{ id: "a", title: "Alpha" }]}
      activeConversationId="a"
      onConversationSelect={() => {}}
      onNewConversation={() => {}}
      composer={<textarea aria-label="Draft" />}
      {...props}
    >
      <p>Thread slot</p>
    </ChatApp>
  );
  const view = render(
    app({ sidePanel: <p>Task details</p>, actions: <button>Share</button> }),
    { wrapper },
  );
  const main = screen.getByRole("region", { name: "Alpha" });
  // The panel is an aside beside the conversation, after it so it sits at the
  // inline end, and it has its own name.
  const panel = screen.getByRole("complementary", { name: "Details" });
  expect(panel).toHaveTextContent("Task details");
  expect(main.compareDocumentPosition(panel)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  // The header ends with the actions, after the title.
  const header = main.querySelector("header")!;
  const share = within(header).getByRole("button", { name: "Share" });
  expect(
    header.querySelector(".tz-chat-app-title")!.compareDocumentPosition(share),
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  // With no brand the navigation draws no name, and no header for it.
  expect(screen.queryByText("Tiraz")).toBeNull();
  expect(view.container.querySelector(".tz-sidebar-header")).toBeNull();
  view.rerender(app({ brand: "Finance team" }));
  expect(
    screen.getByText("Finance team").closest(".tz-sidebar-header"),
  ).not.toBeNull();
  expect(screen.queryByRole("complementary", { name: "Details" })).toBeNull();
});
it("tells the October close with patterns in plain appearance", async () => {
  vi.useFakeTimers();
  const rtl = ({ children }: { children: React.ReactNode }) => (
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      {children}
    </SystemProvider>
  );
  const view = render(<ChatAppExample language="ar" />, { wrapper: rtl });
  const thread = screen.getByRole("region", { name: "الرسائل" });
  // Laila asks twice, and a pattern answers each time.
  expect(
    [...thread.querySelectorAll('[data-role="user"]')].map(
      (message) => message.textContent,
    ),
  ).toEqual(["لماذا انخفض التدفق النقدي في أكتوبر؟", "جهّز إقفال أكتوبر"]);
  expect(
    thread.querySelector('section.tz-cited-answer[data-appearance="plain"]'),
  ).toHaveAttribute("data-status", "completed");
  const questions = thread.querySelector(
    'form.tz-ask-questions[data-appearance="plain"]',
  )!;
  expect(questions).not.toBeNull();
  // They are answered already: they mount as their receipt.
  expect(within(questions as HTMLElement).getByText("إجاباتك")).toBeVisible();
  const task = thread.querySelector(
    '.tz-agent-run[data-appearance="plain"]',
  ) as HTMLElement;
  expect(task).toHaveAttribute("data-status", "needs-you");
  // The task waits on the reminders' approval, drawn plain inside it.
  const approval = within(task).getByRole("group", {
    name: "إرسال تذكيرات الدفع إلى العملاء الثلاثة",
  });
  expect(approval).toHaveAttribute("data-appearance", "plain");
  // Start a task is the composer, and the side panel holds the task's details.
  expect(
    view.container.querySelector(
      '.tz-chat-app-composer section.tz-task-starter[data-appearance="plain"]',
    ),
  ).not.toBeNull();
  expect(
    screen.getByRole("complementary", { name: "تفاصيل المهمة" }),
  ).toBeVisible();
  // Approving finishes the task, once the host has recorded it.
  fireEvent.click(
    within(approval).getByRole("button", { name: "أرسل الرسائل" }),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(700);
  });
  expect(task).toHaveAttribute("data-status", "completed");
  // Nothing is left running when the example goes.
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
