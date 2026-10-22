import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { DecisionInbox, SystemProvider, defaultConfig } from "./index";
import type {
  ApprovalRequest,
  DecisionInboxItem,
  DecisionInboxProps,
} from "./index";
afterEach(() => vi.useRealTimers());

const reminders: ApprovalRequest = {
  id: "payment-reminders-oct",
  action: "إرسال تذكيرات الدفع إلى العملاء الثلاثة",
  target: "العملاء المتأخرون في السداد",
  details: "الإجمالي ٣٤٬٨٠٠ ر.س، أي ٧٢٪ من المتأخرات",
  consequences: ["يصل كل عميل تذكير واحد بفواتيره المتأخرة."],
  approveLabel: "أرسل الرسائل",
  rejectLabel: "رفض",
};
const accruals: ApprovalRequest = {
  id: "accruals-oct",
  action: "ترحيل قيود الاستحقاق الأربعة",
  target: "دفتر الحسابات · أكتوبر",
  details: "الإجمالي ٦٬٨٥٠ ر.س",
  consequences: ["تُرحَّل القيود إلى دفتر أكتوبر، ويمكن عكسها بقيد مقابل."],
  approveLabel: "ترحيل القيود",
  rejectLabel: "رفض",
};
const finance = { id: "finance", name: "وكيل المالية" },
  collections = { id: "collections", name: "وكيل التحصيل" },
  campaigns = { id: "campaigns", name: "مصمّم الحملات" };
const close = "ضمن إقفال حسابات أكتوبر",
  jeddah = "هل أستثني فرع جدة؟",
  draft = "تذكير بالدفع إلى سارة العتيبي",
  cover = "غلاف حملة رمضان";
// The example's seven items, most urgent first, as the host orders them.
const items: DecisionInboxItem[] = [
  {
    id: "reminders",
    title: reminders.action,
    agent: collections,
    context: close,
    status: "needs-you",
    time: "قبل ٤ د",
    request: reminders,
    approval: {
      impact: [
        { id: "madar", label: "شركة مدار", value: "١٥٬٦٠٠ ر.س" },
        { id: "al-nada", label: "مؤسسة الندى", value: "١١٬٢٠٠ ر.س" },
        { id: "al-rowad", label: "الرواد للتجارة", value: "٨٬٠٠٠ ر.س" },
      ],
      irreversible: "تُرسل من بريد التحصيل، ولا يمكن استرجاعها بعد الإرسال.",
      expiryLabel: "ينتهي الطلب خلال ٢٣ ساعة",
      secondaryAction: { label: "عرض الرسائل", onSelect: () => {} },
    },
    steps: [
      {
        id: "aging",
        label: "تجميع الفواتير المتأخرة",
        state: "completed",
        time: "قبل ١٠ د",
      },
      {
        id: "write",
        label: "صياغة الرسائل الثلاث",
        state: "completed",
        time: "قبل ٦ د",
      },
      { id: "send", label: "إرسال التذكيرات", state: "needs-you" },
    ],
  },
  {
    id: "accruals",
    title: accruals.action,
    agent: finance,
    context: close,
    status: "needs-you",
    time: "قبل ٩ د",
    request: accruals,
    approval: { reversible: true },
  },
  {
    id: "jeddah",
    title: jeddah,
    agent: finance,
    context: close,
    status: "needs-you",
    time: "قبل ١٢ د",
    questions: [
      {
        id: "jeddah",
        label: jeddah,
        choices: [
          { value: "exclude", label: "نعم، استثنِه" },
          { value: "include", label: "لا، أدرجه" },
        ],
      },
    ],
  },
  {
    id: "draft",
    title: draft,
    agent: collections,
    context: "شركة مدار · ٩٬٤٠٠ ر.س",
    status: "needs-you",
    time: "قبل ٢٠ د",
    draft: true,
  },
  {
    id: "campaign",
    title: cover,
    agent: campaigns,
    status: "failed",
    time: "قبل ٣٥ د",
    error: "تعذّر توليد الصورة",
  },
  {
    id: "close",
    title: "إقفال حسابات أكتوبر",
    agent: finance,
    status: "running",
    time: "منذ ١٤ د",
  },
  {
    id: "suppliers",
    title: "مطابقة فواتير الموردين",
    agent: finance,
    context: close,
    status: "completed",
    time: "قبل ساعة",
  },
];
const agents = [
  { id: "finance", name: "وكيل المالية", state: "needs-you" as const },
  { id: "collections", name: "وكيل التحصيل", state: "needs-you" as const },
  { id: "campaigns", name: "مصمّم الحملات", state: "failed" as const },
];
/** The items with one of them changed. */
const changed = (id: string, patch: Partial<DecisionInboxItem>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
type Decide = NonNullable<DecisionInboxProps["onDecision"]>;
const region = () =>
  document.querySelector(".tz-decision-inbox > [role='status']") as HTMLElement;
const row = (name: string) =>
  screen.getByRole("heading", { level: 4, name }).closest("li") as HTMLElement;
// A row's title: its disclosure button, or the heading itself when the row has
// nothing to open.
const title = (name: string) => {
  const heading = screen.getByRole("heading", { level: 4, name });
  return heading.querySelector("button") ?? heading;
};
const panelOf = (name: string) =>
  document.getElementById(title(name).getAttribute("aria-controls")!)!;
/** A row's own actions, without its title. */
const actions = (name: string) =>
  within(row(name))
    .getAllByRole("button")
    .filter((button) => button !== title(name))
    .map((button) => button.textContent);

it("opens a row without moving focus, and offers no approve-all", async () => {
  const user = userEvent.setup(),
    onDecision = vi.fn<Decide>();
  const view = render(<DecisionInbox items={items} onDecision={onDecision} />);
  const trigger = title(reminders.action);
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  act(() => trigger.focus());
  await user.keyboard("{Enter}");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveFocus();
  // The full request opens under its steps, and nothing in it takes focus.
  const panel = panelOf(reminders.action);
  expect(within(panel).getByText("صياغة الرسائل الثلاث")).toBeVisible();
  const approve = within(panel).getByRole("button", { name: "أرسل الرسائل" });
  expect(approve).toBeVisible();
  expect(approve).not.toHaveFocus();
  await user.keyboard("{Enter}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  // Review opens the same row and keeps focus.
  const review = within(row(reminders.action)).getByRole("button", {
    name: `راجع ${reminders.action}`,
  });
  act(() => review.focus());
  await user.keyboard("{Enter}");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(review).toHaveFocus();
  // A request that arrives never moves focus.
  view.rerender(
    <DecisionInbox
      items={[
        {
          id: "new",
          title: "ترحيل قيد التسوية",
          agent: finance,
          status: "needs-you",
          request: { ...accruals, id: "settlement" },
          approval: { reversible: true },
        },
        ...items,
      ]}
      onDecision={onDecision}
    />,
  );
  expect(review).toHaveFocus();
  // Every decision is about one request: nothing approves them all.
  expect(
    screen.queryAllByRole("button", { name: /الكل|approve all/i }),
  ).toEqual([]);
  expect(onDecision).not.toHaveBeenCalled();
});

it("decides inline only for reversible requests, once, after the host accepts", async () => {
  vi.useFakeTimers();
  const task = deferred(),
    onDecision = vi.fn<Decide>(() => task.promise);
  const view = render(<DecisionInbox items={items} onDecision={onDecision} />);
  const quick = (label: string) =>
    within(row(accruals.action)).getByRole("button", {
      name: `${label} ${accruals.action}`,
    });
  // Two secondary buttons, each named with its request, with no key hint.
  expect(actions(accruals.action)).toEqual(["رفض", "ترحيل القيود"]);
  expect(quick("رفض")).toBeVisible();
  expect(row(accruals.action).querySelector(".tz-kbd")).toBeNull();
  // No chord decides in a list of moving rows, even after the 500 ms wait.
  act(() => vi.advanceTimersByTime(600));
  for (const target of [title(accruals.action), quick("ترحيل القيود")]) {
    act(() => target.focus());
    fireEvent.keyDown(target, { key: "Enter", ctrlKey: true });
  }
  expect(onDecision).not.toHaveBeenCalled();
  // A request that can't be undone, or is marked both ways, only opens.
  expect(actions(reminders.action)).toEqual(["راجع"]);
  view.rerender(
    <DecisionInbox
      items={changed("accruals", {
        approval: { reversible: true, irreversible: true },
      })}
      onDecision={onDecision}
    />,
  );
  expect(actions(accruals.action)).toEqual(["راجع"]);
  view.rerender(<DecisionInbox items={items} onDecision={onDecision} />);
  // Two clicks record one decision, and it counts once the host accepts it.
  fireEvent.click(quick("ترحيل القيود"));
  fireEvent.click(quick("ترحيل القيود"));
  expect(onDecision).toHaveBeenCalledTimes(1);
  expect(onDecision).toHaveBeenCalledWith(accruals, "approved", {
    signal: expect.any(AbortSignal),
  });
  expect(screen.queryByText("تمت الموافقة")).toBeNull();
  await act(async () => task.resolve());
  expect(within(row(accruals.action)).getByText("تمت الموافقة")).toBeVisible();
  // Opened afterwards, the card holds that decision and offers it no more.
  fireEvent.click(title(accruals.action));
  const panel = panelOf(accruals.action);
  expect(within(panel).getByText("تمت الموافقة")).toBeVisible();
  expect(
    within(panel).queryByRole("button", { name: "ترحيل القيود" }),
  ).toBeNull();
  view.unmount();
  // A request that expires while a quick approval is in flight records
  // nothing, even when the host's answer arrives after.
  const late = deferred(),
    host = vi.fn<Decide>(() => late.promise);
  const fresh = render(<DecisionInbox items={items} onDecision={host} />);
  fireEvent.click(quick("ترحيل القيود"));
  const { signal } = host.mock.calls[0][2];
  fresh.rerender(
    <DecisionInbox
      items={changed("accruals", {
        approval: { reversible: true, expired: true },
      })}
      onDecision={host}
    />,
  );
  expect(signal.aborted).toBe(true);
  await act(async () => late.resolve());
  expect(within(row(accruals.action)).queryByText("تمت الموافقة")).toBeNull();
  fireEvent.click(title(accruals.action));
  expect(
    within(panelOf(accruals.action)).getByText("انتهت مهلة الطلب"),
  ).toBeVisible();
  expect(within(row(accruals.action)).queryByText("تمت الموافقة")).toBeNull();
});

it("keeps a resolved row for its receipt, then moves it, keeping focus", async () => {
  // Time also runs while user-event waits; the receipt checks below run
  // synchronously, so only the advances they make move its clock.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime }),
    task = deferred(),
    onDecision = vi.fn<Decide>(() => task.promise);
  const inbox = (
    list: DecisionInboxItem[],
    extra: Partial<DecisionInboxProps> = {},
  ) => <DecisionInbox items={list} onDecision={onDecision} {...extra} />;
  const view = render(inbox(items));
  act(() =>
    within(row(accruals.action))
      .getByRole("button", { name: `ترحيل القيود ${accruals.action}` })
      .focus(),
  );
  await user.keyboard("{Enter}");
  expect(onDecision).toHaveBeenCalledTimes(1);
  // The quick decision goes once the host accepts it, and focus stays on its
  // row rather than dropping to the page.
  await act(async () => task.resolve());
  expect(title(accruals.action)).toHaveFocus();
  // The host moves it out of «بانتظارك»: it stays in place with its receipt.
  const done = changed("accruals", {
    status: "completed",
    receipt: "تمت الموافقة · الآن",
  });
  view.rerender(inbox(done));
  const shown = () =>
    within(screen.getByRole("tabpanel"))
      .getAllByRole("heading", { level: 4 })
      .map((heading) => heading.textContent);
  act(() => vi.advanceTimersByTime(4900));
  expect(shown()).toContain(accruals.action);
  expect(row(accruals.action)).toHaveTextContent("تمت الموافقة · الآن");
  act(() => vi.advanceTimersByTime(100));
  expect(shown()).not.toContain(accruals.action);
  expect(title(jeddah)).toHaveFocus();
  await user.click(screen.getByRole("tab", { name: /^اكتملت/ }));
  expect(shown()).toEqual([accruals.action, "مطابقة فواتير الموردين"]);
  view.unmount();
  // Without a receipt time a row leaves at once, and focus moves on with it.
  const again = render(inbox(items, { receiptFor: 0 }));
  act(() => title(accruals.action).focus());
  again.rerender(inbox(done, { receiptFor: 0 }));
  expect(shown()).not.toContain(accruals.action);
  expect(title(jeddah)).toHaveFocus();
  // A row the host deletes hands focus to the next row's title.
  again.rerender(
    inbox(
      done.filter((item) => item.id !== "jeddah"),
      { receiptFor: 0 },
    ),
  );
  expect(title(draft)).toHaveFocus();
  // When the last row goes, the tab panel takes focus.
  await user.click(screen.getByRole("tab", { name: /^يعمل/ }));
  act(() => title("إقفال حسابات أكتوبر").focus());
  again.rerender(
    inbox(
      done.filter((item) => item.id !== "jeddah" && item.id !== "close"),
      { receiptFor: 0 },
    ),
  );
  expect(screen.getByRole("tabpanel")).toHaveFocus();
});

it("folds an open row on Escape, anywhere in it, and records nothing", async () => {
  const user = userEvent.setup(),
    onDecision = vi.fn<Decide>();
  render(<DecisionInbox items={items} onDecision={onDecision} />);
  const trigger = title(reminders.action);
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
  // Inside the inbox Escape belongs to the row, so Reject shows no key.
  await user.click(trigger);
  const reject = within(panelOf(reminders.action)).getByRole("button", {
    name: "رفض",
  });
  expect(reject.querySelector(".tz-kbd")).toBeNull();
  expect(reject).not.toHaveAttribute("aria-describedby");
  act(() =>
    within(panelOf(reminders.action))
      .getByRole("button", { name: "عرض الرسائل" })
      .focus(),
  );
  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
  // On Reject itself, where an Escape meant to fold would reject.
  await user.click(trigger);
  act(() =>
    within(panelOf(reminders.action))
      .getByRole("button", { name: "رفض" })
      .focus(),
  );
  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
  expect(onDecision).not.toHaveBeenCalled();
});

it("never opens a row while its quick decision is in flight", async () => {
  const task = deferred(),
    onDecision = vi.fn<Decide>(() => task.promise);
  const inbox = (expanded: string[]) => (
    <DecisionInbox
      items={items}
      onDecision={onDecision}
      expanded={expanded}
      onExpandedChange={() => {}}
    />
  );
  const view = render(inbox([]));
  fireEvent.click(
    within(row(accruals.action)).getByRole("button", {
      name: `رفض ${accruals.action}`,
    }),
  );
  // The host opens the row while the Reject is recorded: no card to decide.
  view.rerender(inbox(["accruals"]));
  expect(title(accruals.action)).toHaveAttribute("aria-expanded", "false");
  expect(within(panelOf(accruals.action)).queryAllByRole("button")).toEqual([]);
  // Once recorded, the card opens holding that decision, and offers no other.
  await act(async () => task.resolve());
  expect(title(accruals.action)).toHaveAttribute("aria-expanded", "true");
  expect(
    within(panelOf(accruals.action)).queryByRole("button", {
      name: "ترحيل القيود",
    }),
  ).toBeNull();
  expect(onDecision).toHaveBeenCalledTimes(1);
});

it("moves focus to the title when the host revises a request under its quick Approve", async () => {
  const user = userEvent.setup(),
    onDecision = vi.fn<Decide>();
  const view = render(<DecisionInbox items={items} onDecision={onDecision} />);
  act(() =>
    within(row(accruals.action))
      .getByRole("button", { name: `ترحيل القيود ${accruals.action}` })
      .focus(),
  );
  view.rerender(
    <DecisionInbox
      items={changed("accruals", {
        request: { ...accruals, details: "الإجمالي ٦٨٬٥٠٠ ر.س" },
      })}
      onDecision={onDecision}
    />,
  );
  // The revised request is unread, so Enter only reaches the title.
  expect(title(accruals.action)).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onDecision).not.toHaveBeenCalled();
});

it("describes the focused title with the receipt of a quick decision", async () => {
  const user = userEvent.setup(),
    task = deferred(),
    onDecision = vi.fn<Decide>(() => task.promise);
  render(<DecisionInbox items={items} onDecision={onDecision} />);
  act(() =>
    within(row(accruals.action))
      .getByRole("button", { name: `ترحيل القيود ${accruals.action}` })
      .focus(),
  );
  await user.keyboard("{Enter}");
  await act(async () => task.resolve());
  expect(title(accruals.action)).toHaveFocus();
  expect(title(accruals.action)).toHaveAccessibleDescription("تمت الموافقة");
});

it("keeps an open row open while a decision in it is recorded", async () => {
  const user = userEvent.setup(),
    task = deferred(),
    onDecision = vi.fn<Decide>(() => task.promise);
  render(<DecisionInbox items={items} onDecision={onDecision} />);
  const trigger = title(reminders.action);
  await user.click(trigger);
  await user.click(
    within(panelOf(reminders.action)).getByRole("button", {
      name: "أرسل الرسائل",
    }),
  );
  expect(onDecision).toHaveBeenCalledTimes(1);
  // Neither Escape nor the title folds the row away from its decision.
  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(onDecision.mock.calls[0][2].signal.aborted).toBe(false);
  await act(async () => task.resolve());
  expect(
    within(panelOf(reminders.action)).getByText("تمت الموافقة"),
  ).toBeVisible();
});

it("waits on failed tasks, opens drafts through onOpen and answers questions inline", async () => {
  const user = userEvent.setup(),
    onRetry = vi.fn(),
    onOpen = vi.fn(),
    onAnswer = vi.fn<NonNullable<DecisionInboxProps["onAnswer"]>>();
  render(
    <DecisionInbox
      items={items}
      onRetry={onRetry}
      onOpen={onOpen}
      onAnswer={onAnswer}
    />,
  );
  // A failed task waits on the person, with its error as text.
  const failed = row(cover);
  expect(screen.getByRole("tabpanel")).toContainElement(failed);
  expect(within(failed).getByText("تعثّرت")).toBeVisible();
  expect(within(failed).getByText("تعذّر توليد الصورة")).toBeVisible();
  await user.click(
    within(failed).getByRole("button", { name: `أعد المحاولة ${cover}` }),
  );
  expect(onRetry).toHaveBeenCalledWith("campaign");
  // A draft is reviewed where the host opens it, never inside the row.
  expect(within(row(draft)).getByText("بانتظار مراجعتك")).toBeVisible();
  await user.click(
    within(row(draft)).getByRole("button", { name: `راجع ${draft}` }),
  );
  expect(onOpen).toHaveBeenCalledWith("draft");
  expect(
    within(row(draft)).queryByRole("button", { expanded: true }),
  ).toBeNull();
  // Questions are answered in the row.
  const answer = within(row(jeddah)).getByRole("button", {
    name: `أجب ${jeddah}`,
  });
  await user.click(answer);
  expect(answer).toHaveAttribute("aria-expanded", "true");
  await user.click(
    within(panelOf(jeddah)).getByRole("radio", { name: /نعم، استثنِه/ }),
  );
  await user.click(
    within(panelOf(jeddah)).getByRole("button", { name: "إرسال الإجابات" }),
  );
  expect(onAnswer).toHaveBeenCalledTimes(1);
  expect(onAnswer).toHaveBeenCalledWith(
    "jeddah",
    { jeddah: { choice: "exclude" } },
    { signal: expect.any(AbortSignal) },
  );
});

it("keeps focus on a busy submit, so Escape folds the row and records nothing", async () => {
  const user = userEvent.setup(),
    task = deferred(),
    onAnswer = vi.fn<NonNullable<DecisionInboxProps["onAnswer"]>>(
      () => task.promise,
    );
  render(<DecisionInbox items={items} onAnswer={onAnswer} />);
  const trigger = title(jeddah);
  await user.click(trigger);
  await user.click(
    within(panelOf(jeddah)).getByRole("radio", { name: /نعم، استثنِه/ }),
  );
  const submit = within(panelOf(jeddah)).getByRole("button", {
    name: "إرسال الإجابات",
  });
  await user.tab();
  expect(submit).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onAnswer).toHaveBeenCalledTimes(1);
  // Busy, the button stays focusable and inert, so focus stays in the row.
  expect(submit).toBeEnabled();
  expect(submit).toHaveAttribute("aria-disabled", "true");
  expect(submit).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onAnswer).toHaveBeenCalledTimes(1);
  // Escape mid-submit folds the row and aborts the answers, so a host that
  // honors the signal records nothing.
  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
  expect(onAnswer.mock.calls[0][2].signal.aborted).toBe(true);
  await act(async () => task.resolve());
  expect(row(jeddah)).not.toHaveTextContent("أُرسلت الإجابات.");
});

it("counts with Arabic agreement and speaks only when counts change", async () => {
  const user = userEvent.setup();
  const view = render(<DecisionInbox items={items} />);
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "الكل ٧",
    "بانتظارك ٥",
    "يعمل ١",
    "اكتملت ١",
  ]);
  expect(region()).toBeEmptyDOMElement();
  await user.click(screen.getByRole("tab", { name: /^يعمل/ }));
  expect(region()).toBeEmptyDOMElement();
  // Waiting is every needs-you and failed item; running, every running one.
  const made = (waiting: number, running: number): DecisionInboxItem[] => [
    ...Array.from({ length: waiting }, (_, index) => ({
      id: `w${index}`,
      title: `طلب ${index + 1}`,
      agent: finance,
      status: index === 0 ? ("failed" as const) : ("needs-you" as const),
    })),
    ...Array.from({ length: running }, (_, index) => ({
      id: `r${index}`,
      title: `مهمة ${index + 1}`,
      agent: finance,
      status: "running" as const,
    })),
  ];
  for (const [waiting, running, sentence] of [
    [2, 3, "طلبان بانتظارك · ٣ مهام تعمل"],
    [1, 2, "طلب واحد بانتظارك · مهمتان تعملان"],
    [11, 0, "١١ طلبًا بانتظارك"],
    [0, 0, "لا شيء بانتظارك"],
  ] as const) {
    view.rerender(<DecisionInbox items={made(waiting, running)} />);
    expect(region().textContent).toBe(sentence);
  }
  await user.click(screen.getByRole("tab", { name: /^بانتظارك/ }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent(
    "سيظهر هنا كل طلب يحتاج قرارك.",
  );
  view.unmount();
  const provided = (config: Partial<typeof defaultConfig>, list: ReactNode) => (
    <SystemProvider config={{ ...defaultConfig, ...config }}>
      {list}
    </SystemProvider>
  );
  const english = render(
    provided({ direction: "ltr" }, <DecisionInbox items={made(0, 0)} />),
  );
  for (const [waiting, running, sentence] of [
    [2, 3, "2 requests need you · 3 tasks running"],
    [1, 1, "1 request needs you · 1 task running"],
  ] as const) {
    english.rerender(
      provided(
        { direction: "ltr" },
        <DecisionInbox items={made(waiting, running)} />,
      ),
    );
    expect(region().textContent).toBe(sentence);
  }
  english.unmount();
  const western = render(
    provided({ numerals: "latn" }, <DecisionInbox items={made(0, 0)} />),
  );
  western.rerender(
    provided({ numerals: "latn" }, <DecisionInbox items={made(3, 0)} />),
  );
  expect(region().textContent).toBe("3 طلبات بانتظارك");
});

it("filters rows and counts by agent from the strip", async () => {
  const user = userEvent.setup(),
    onAgentChange = vi.fn();
  const view = render(
    <DecisionInbox
      items={items}
      agents={agents}
      onAgentChange={onAgentChange}
    />,
  );
  const chip = () =>
    within(screen.getByRole("group", { name: "الوكلاء" })).getByRole("button", {
      name: /^وكيل التحصيل/,
    });
  expect(chip()).toHaveAttribute("aria-pressed", "false");
  // Each chip names its agent and the agent's state in words.
  expect(chip()).toHaveTextContent("بانتظارك");
  await user.click(chip());
  expect(onAgentChange).toHaveBeenLastCalledWith("collections");
  view.rerender(
    <DecisionInbox
      items={items}
      agents={agents}
      agent="collections"
      onAgentChange={onAgentChange}
    />,
  );
  expect(chip()).toHaveAttribute("aria-pressed", "true");
  expect(
    within(screen.getByRole("tabpanel"))
      .getAllByRole("heading", { level: 4 })
      .map((heading) => heading.textContent),
  ).toEqual([reminders.action, draft]);
  expect(screen.getByRole("tab", { name: /^بانتظارك/ })).toHaveTextContent(
    "بانتظارك ٢",
  );
  await user.click(chip());
  expect(onAgentChange).toHaveBeenLastCalledWith(null);
});

it("never announces picking an agent, and still speaks a count change", async () => {
  const user = userEvent.setup();
  const view = render(<DecisionInbox items={items} agents={agents} />);
  const chip = (name: RegExp) =>
    within(screen.getByRole("group", { name: "الوكلاء" })).getByRole("button", {
      name,
    });
  // Each pick changes the counts, and none of them is spoken.
  await user.click(chip(/^وكيل التحصيل/));
  expect(screen.getByRole("tab", { name: /^بانتظارك/ })).toHaveTextContent(
    "بانتظارك ٢",
  );
  expect(region()).toBeEmptyDOMElement();
  await user.click(chip(/^وكيل المالية/));
  expect(chip(/^وكيل المالية/)).toHaveAttribute("aria-pressed", "true");
  expect(region()).toBeEmptyDOMElement();
  // A real change to the picked agent's counts still speaks…
  view.rerender(
    <DecisionInbox
      items={changed("close", { status: "completed" })}
      agents={agents}
    />,
  );
  expect(region().textContent).toBe("طلبان بانتظارك");
  // …and letting go of the agent says nothing new.
  await user.click(chip(/^وكيل المالية/));
  expect(screen.getByRole("tab", { name: /^بانتظارك/ })).toHaveTextContent(
    "بانتظارك ٥",
  );
  expect(region().textContent).toBe("طلبان بانتظارك");
});
