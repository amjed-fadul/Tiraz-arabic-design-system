import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AgentTask, SystemProvider, defaultConfig } from "./index";
import type { AgentStep, ApprovalDetails, ApprovalRequest } from "./index";
afterEach(() => vi.useRealTimers());

const title = "إقفال حسابات أكتوبر";
const titles = [
  "مطابقة فواتير الموردين",
  "تسوية حسابات البنك الأهلي",
  "تسجيل قيود الاستحقاق",
  "إرسال تذكيرات الدفع للعملاء الثلاثة",
  "ملخص الإقفال للمدير المالي",
];
/** The five close steps in the given states, with any step's extra fields. */
function close(
  states: readonly AgentStep["state"][],
  extra: Record<number, Partial<AgentStep>> = {},
): AgentStep[] {
  return titles.map((stepTitle, index) => ({
    id: `s${index + 1}`,
    title: stepTitle,
    state: states[index],
    ...extra[index],
  }));
}
const done = ["completed", "completed", "completed", "completed", "completed"];
const planned = ["planned", "planned", "planned", "planned", "planned"];
const request: ApprovalRequest = {
  id: "payment-reminders",
  action: "إرسال تذكيرات الدفع إلى العملاء الثلاثة",
  target: "العملاء المتأخرون في السداد",
  consequences: ["يصل كل عميل تذكير واحد بفواتيره المتأخرة."],
  approveLabel: "أرسل الرسائل",
  rejectLabel: "رفض",
};
const bankError = {
  title: "تعذّر الوصول إلى البنك الأهلي.",
  body: "انتهت صلاحية الربط قبل يومين، فلم تُجلب حركات أكتوبر.",
};
const tool = (label: string, id: string) => ({
  label,
  tool: id,
  state: "completed" as const,
  duration: "١ث",
});
const section = () => screen.getByRole("region", { name: title });
const region = () =>
  document.querySelector(".tz-agent-run > [role='status']") as HTMLElement;

it("shows every step state with its glyph and hidden words", () => {
  const states = [
    "planned",
    "pending",
    "running",
    "completed",
    "needs-you",
    "failed",
    "skipped",
  ] as const;
  const { container } = render(
    <AgentTask
      title={title}
      status="running"
      steps={states.map((state, index) => ({
        id: state,
        title: `الخطوة ${index + 1}`,
        state,
      }))}
    />,
  );
  const steps = Array.from(container.querySelectorAll(".tz-agent-run-step"));
  const icons = steps.map((step) => step.querySelector(".tz-status-icon")!);
  // Planned and pending both hold their number; the step names which it is.
  expect(icons.map((icon) => icon.getAttribute("data-state"))).toEqual([
    "pending",
    "pending",
    "running",
    "completed",
    "needs-you",
    "failed",
    "skipped",
  ]);
  expect(steps.map((step) => step.getAttribute("data-state"))).toEqual([
    ...states,
  ]);
  expect(
    icons.map((icon) =>
      icon.querySelector("[data-glyph]")?.getAttribute("data-glyph"),
    ),
  ).toEqual(["number", "number", "spinner", "check", "bang", "x", "minus"]);
  expect(icons[0]).toHaveTextContent("١");
  expect(icons[1]).toHaveTextContent("٢");
  expect(
    steps.map(
      (step) => step.querySelector(".tz-agent-run-step-state")?.textContent,
    ),
  ).toEqual([
    "لم تبدأ",
    "لم تبدأ",
    "قيد التنفيذ",
    "مكتملة",
    "بانتظارك",
    "تعثّرت",
    "تُخطّيت",
  ]);
  expect(
    within(steps[6] as HTMLElement).getByText("تُخطّيت بطلبك"),
  ).toBeVisible();
});

it("embeds the needs-you request as a plain approval", async () => {
  const waiting = (
    approval: ApprovalDetails | undefined,
    onDecision?: (request: ApprovalRequest, decision: string) => void,
  ) => (
    <AgentTask
      title={title}
      status="needs-you"
      steps={close(
        ["completed", "completed", "completed", "needs-you", "pending"],
        { 3: { request, approval } },
      )}
      onDecision={onDecision}
    />
  );
  const step = () => document.querySelectorAll(".tz-agent-run-step")[3];
  const onDecision = vi.fn();
  const view = render(waiting({ reversible: true }, onDecision));
  // Plain: no tray of its own inside the task's, and a heading one deeper.
  expect(step().querySelector(".tz-tray")).toBeNull();
  const card = within(step() as HTMLElement).getByRole("group", {
    name: request.action,
  });
  expect(card).toHaveAttribute("data-appearance", "plain");
  expect(
    within(card).getByRole("heading", { level: 4, name: request.action }),
  ).toBeVisible();
  expect(
    within(card)
      .getByRole("button", { name: "أرسل الرسائل" })
      .querySelector("kbd"),
  ).not.toBeNull();
  // Escape inside the request rejects it.
  act(() => within(card).getByRole("button", { name: "رفض" }).focus());
  await act(async () =>
    fireEvent.keyDown(document.activeElement!, { key: "Escape" }),
  );
  expect(onDecision).toHaveBeenCalledWith(
    request,
    "rejected",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  view.unmount();
  // An irreversible request has no hint, even when also marked reversible.
  const irreversible = render(
    waiting({ reversible: true, irreversible: true }, vi.fn()),
  );
  expect(
    screen.getByRole("button", { name: "أرسل الرسائل" }).querySelector("kbd"),
  ).toBeNull();
  irreversible.unmount();
  // No host to record a decision: the request as text, and no actions.
  render(waiting({ reversible: true }));
  expect(within(step() as HTMLElement).getByText(request.action)).toBeVisible();
  expect(within(step() as HTMLElement).getByText(request.target)).toBeVisible();
  expect(within(step() as HTMLElement).queryByRole("button")).toBeNull();
});

it("steers at the next step with Enter and now with Ctrl or Cmd+Enter, never while composing", () => {
  const onSteer = vi.fn();
  render(
    <AgentTask
      title={title}
      status="running"
      steps={close(["completed", "running", "pending", "pending", "pending"])}
      onSteer={onSteer}
      onStop={() => {}}
    />,
  );
  const field = screen.getByRole("textbox", {
    name: "وجّه الوكيل دون إيقافه، مثلًا: استثنِ فرع جدة",
  });
  const type = (text: string) =>
    fireEvent.change(field, { target: { value: text } });
  type("استثنِ فرع جدة");
  fireEvent.keyDown(field, { key: "Enter" });
  expect(onSteer).toHaveBeenLastCalledWith("استثنِ فرع جدة", "next");
  expect(field).toHaveValue("");
  for (const chord of [{ ctrlKey: true }, { metaKey: true }]) {
    type("استثنِ فرع جدة");
    fireEvent.keyDown(field, { key: "Enter", ...chord });
    expect(onSteer).toHaveBeenLastCalledWith("استثنِ فرع جدة", "now");
    expect(field).toHaveValue("");
  }
  expect(onSteer).toHaveBeenCalledTimes(3);
  // An input method's Enter picks a word; it never steers.
  type("استثنِ");
  fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
  fireEvent.compositionStart(field);
  fireEvent.keyDown(field, { key: "Enter" });
  fireEvent.keyDown(field, { key: "Enter", ctrlKey: true });
  expect(onSteer).toHaveBeenCalledTimes(3);
  expect(field).toHaveValue("استثنِ");
  fireEvent.compositionEnd(field);
  // Nor does empty text.
  type("   ");
  fireEvent.keyDown(field, { key: "Enter" });
  fireEvent.keyDown(field, { key: "Enter", ctrlKey: true });
  expect(onSteer).toHaveBeenCalledTimes(3);
});

it("starts the plan from its countdown, pausing while focus or pointer is inside", () => {
  vi.useFakeTimers();
  const onStart = vi.fn();
  const plan = (first = titles[0]) => (
    <>
      <button type="button">خارج المهمة</button>
      <AgentTask
        title={title}
        status="plan"
        steps={close(planned as AgentStep["state"][], { 0: { title: first } })}
        autoStartAfter={5}
        onStart={onStart}
        onEditPlan={() => {}}
      />
    </>
  );
  const view = render(plan());
  act(() => vi.advanceTimersByTime(2000));
  act(() => screen.getByRole("button", { name: "تعديل الخطة" }).focus());
  act(() => vi.advanceTimersByTime(10000));
  expect(onStart).not.toHaveBeenCalled();
  act(() => screen.getByRole("button", { name: "خارج المهمة" }).focus());
  // The pointer over the task pauses it too.
  fireEvent.pointerEnter(section());
  act(() => vi.advanceTimersByTime(10000));
  expect(onStart).not.toHaveBeenCalled();
  fireEvent.pointerLeave(section());
  act(() => vi.advanceTimersByTime(3000));
  expect(onStart).toHaveBeenCalledTimes(1);
  view.unmount();
  // Ctrl+Enter starts a fresh plan once it has shown for 500 ms...
  onStart.mockClear();
  const fresh = render(plan());
  act(() => vi.advanceTimersByTime(600));
  act(() => section().focus());
  fireEvent.keyDown(section(), { key: "Enter", ctrlKey: true });
  expect(onStart).toHaveBeenCalledTimes(1);
  // ...and a re-planned step makes it wait again.
  fresh.rerender(plan("مطابقة فواتير الموردين الـ٢١٧"));
  act(() => vi.advanceTimersByTime(100));
  fireEvent.keyDown(section(), { key: "Enter", ctrlKey: true });
  expect(onStart).toHaveBeenCalledTimes(1);
});

it("announces each status once and never the time", () => {
  const task = (
    status:
      "plan" | "running" | "needs-you" | "failed" | "stopped" | "completed",
    steps: AgentStep[],
    rest: { elapsed?: number; autoStartAfter?: number } = {},
  ) => (
    <AgentTask
      title={title}
      agent="وكيل المالية"
      status={status}
      steps={steps}
      onStart={() => {}}
      {...rest}
    />
  );
  // A task that mounts finished is not news: its region stays empty.
  const finished = render(
    task("completed", close(done as AgentStep["state"][]), { elapsed: 220 }),
  );
  expect(region()).toBeEmptyDOMElement();
  finished.unmount();
  const view = render(
    task("plan", close(planned as AgentStep["state"][]), { autoStartAfter: 5 }),
  );
  expect(region().textContent).toBe("خطة مقترحة. تبدأ تلقائيًا خلال ٥ث");
  const running = close([
    "completed",
    "completed",
    "running",
    "pending",
    "pending",
  ]);
  view.rerender(task("running", running, { elapsed: 1 }));
  expect(region().textContent).toBe("يعمل");
  view.rerender(task("running", running, { elapsed: 72 }));
  // The time ticks in the pill, never in the region.
  expect(within(section()).getByText("١د ١٢ث")).toBeVisible();
  expect(region().textContent).toBe("يعمل");
  view.rerender(
    task(
      "needs-you",
      close(["completed", "completed", "completed", "needs-you", "pending"]),
    ),
  );
  expect(region().textContent).toBe(`${title}: يحتاج قرارك`);
  view.rerender(
    task(
      "failed",
      close(["completed", "failed", "pending", "pending", "pending"], {
        1: { error: bankError },
      }),
      { elapsed: 64 },
    ),
  );
  expect(region().textContent).toBe(`تعثّرت: ${bankError.title}`);
  // The failure stays as text beside its step.
  const failed = document.querySelectorAll(".tz-agent-run-step")[1];
  expect(
    within(failed as HTMLElement).getByText(bankError.title),
  ).toBeVisible();
  expect(within(failed as HTMLElement).getByText(bankError.body)).toBeVisible();
  view.rerender(
    task(
      "stopped",
      close(["completed", "completed", "pending", "pending", "pending"]),
    ),
  );
  expect(region().textContent).toBe("أُوقفت");
  view.rerender(
    task(
      "completed",
      close(done as AgentStep["state"][], {
        0: { tools: [tool("قراءة دفتر الموردين", "ledger.read")] },
      }),
      { elapsed: 220 },
    ),
  );
  expect(region().textContent).toBe("اكتملت المهمة");
  // The tool calls inside the details announce nothing of their own.
  expect(section().querySelectorAll("[role='status']")).toHaveLength(1);
});

it("returns focus to Details after collapse and keeps closed details inert", async () => {
  const user = userEvent.setup();
  render(
    <AgentTask
      title={title}
      status="completed"
      steps={close(done as AgentStep["state"][], {
        0: {
          tools: [
            tool("قراءة دفتر الموردين", "ledger.read"),
            tool("مطابقة الفواتير بأوامر الشراء", "po.match"),
          ],
        },
      })}
    />,
  );
  const details = screen.getByRole("button", { name: /^التفاصيل/ });
  const panel = document.getElementById(
    details.getAttribute("aria-controls")!,
  )!;
  expect(details).toHaveAttribute("aria-expanded", "false");
  expect(panel).toHaveAttribute("hidden");
  expect(panel).toHaveAttribute("inert");
  expect(
    screen.queryByRole("button", { name: /قراءة دفتر الموردين/ }),
  ).toBeNull();
  await user.click(details);
  expect(details).toHaveAttribute("aria-expanded", "true");
  expect(details).toHaveTextContent("إخفاء التفاصيل");
  expect(panel).not.toHaveAttribute("inert");
  const call = screen.getByRole("button", { name: /قراءة دفتر الموردين/ });
  act(() => call.focus());
  // A click that leaves focus where it was, as Safari's does, closes the
  // details around it; focus returns to the button that closed them.
  act(() => {
    fireEvent.click(details);
  });
  expect(details).toHaveFocus();
  expect(details).toHaveTextContent("التفاصيل");
  expect(panel).toHaveAttribute("hidden");
  expect(panel).toHaveAttribute("inert");
  expect(panel).toHaveAttribute("aria-hidden", "true");
});

it("moves focus to the section when its focused control goes away", async () => {
  const user = userEvent.setup(),
    onSkipStep = vi.fn();
  const view = render(
    <AgentTask
      title={title}
      status="failed"
      steps={close(["completed", "failed", "pending", "pending", "pending"], {
        1: { error: { ...bankError, actions: ["skip", "reconnect"] } },
      })}
      onSkipStep={onSkipStep}
      onReconnect={() => {}}
    />,
  );
  await user.click(screen.getByRole("button", { name: "تخطَّ الخطوة" }));
  expect(onSkipStep).toHaveBeenCalledWith("s2");
  view.rerender(
    <AgentTask
      title={title}
      status="running"
      steps={close(["completed", "skipped", "running", "pending", "pending"])}
      onSkipStep={onSkipStep}
      onReconnect={() => {}}
    />,
  );
  expect(section()).toHaveFocus();
});

it("takes back or applies a queued note, and marks unused notes when the task ends", async () => {
  const user = userEvent.setup(),
    onApplyNoteNow = vi.fn(),
    onRemoveNote = vi.fn();
  const queued = { id: "n1", text: "استثنِ فرع جدة", applied: false };
  const task = (
    status: "running" | "failed" | "stopped" | "completed",
    notes: AgentStep["notes"] = [queued],
    handlers: {
      onApplyNoteNow?: (id: string) => void;
      onRemoveNote?: (id: string) => void;
    } = { onApplyNoteNow, onRemoveNote },
  ) => (
    <AgentTask
      title={title}
      status={status}
      steps={close(
        ["completed", "completed", "running", "pending", "pending"],
        {
          3: { notes },
        },
      )}
      {...handlers}
    />
  );
  const note = () =>
    document.querySelector(".tz-agent-run-notes > li") as HTMLElement;
  const view = render(task("running"));
  expect(note()).toHaveTextContent("استثنِ فرع جدة · بانتظار الخطوة التالية");
  // Each button's name starts with its visible word and names its note.
  await user.click(
    within(note()).getByRole("button", { name: "طبّق الآن: استثنِ فرع جدة" }),
  );
  expect(onApplyNoteNow).toHaveBeenCalledWith("n1");
  await user.click(
    within(note()).getByRole("button", {
      name: "إزالة التوجيه: استثنِ فرع جدة",
    }),
  );
  expect(onRemoveNote).toHaveBeenCalledWith("n1");
  // The host drops the note, and focus that was on Remove moves to the task.
  view.rerender(task("running", []));
  expect(section()).toHaveFocus();
  // No handler, no button.
  view.rerender(task("running", [queued], {}));
  expect(within(note()).queryByRole("button")).toBeNull();
  // Once the task ends, a note never applied says so, with nothing to press.
  for (const status of ["completed", "failed", "stopped"] as const) {
    view.rerender(task(status));
    expect(note()).toHaveTextContent("استثنِ فرع جدة · لم يُؤخذ به");
    expect(note()).not.toHaveTextContent("أُخذ به");
    expect(within(note()).queryByRole("button")).toBeNull();
  }
});

it("announces each note once", () => {
  const task = (status: "running" | "needs-you", applied: boolean) => (
    <AgentTask
      title={title}
      status={status}
      steps={close(
        ["completed", "completed", "running", "pending", "pending"],
        {
          3: { notes: [{ id: "n1", text: "استثنِ فرع جدة", applied }] },
        },
      )}
      onSteer={() => {}}
    />
  );
  const view = render(task("running", false));
  const field = screen.getByRole("textbox", { name: /^وجّه الوكيل/ });
  fireEvent.change(field, { target: { value: "استثنِ فرع جدة" } });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(region().textContent).toBe(
    "سيُطبَّق مع الخطوة التالية: استثنِ فرع جدة",
  );
  fireEvent.change(field, { target: { value: "استثنِ فرع جدة" } });
  fireEvent.keyDown(field, { key: "Enter", ctrlKey: true });
  expect(region().textContent).toBe("يُطبَّق الآن: استثنِ فرع جدة");
  view.rerender(task("running", true));
  expect(region().textContent).toBe("أخذ الوكيل بتوجيهك: استثنِ فرع جدة");
  // Once: the next change says only its own sentence.
  view.rerender(task("needs-you", true));
  expect(region().textContent).toBe(`${title}: يحتاج قرارك`);
  view.unmount();
  // A note applied at mount is not news, nor is the status; a later status is.
  const mounted = render(task("running", true));
  expect(region()).toBeEmptyDOMElement();
  mounted.rerender(task("needs-you", true));
  expect(region().textContent).toBe(`${title}: يحتاج قرارك`);
});

it("names the agent a step was handed to, and who asks in its request", () => {
  const task = (handedTo?: string) => (
    <AgentTask
      title={title}
      agent="وكيل المالية"
      status="needs-you"
      steps={close(
        ["completed", "completed", "completed", "needs-you", "pending"],
        { 3: { agent: handedTo, request } },
      )}
      onDecision={vi.fn()}
    />
  );
  const step = () =>
    document.querySelectorAll(".tz-agent-run-step")[3] as HTMLElement;
  const header = () =>
    within(step())
      .getByRole("group", { name: request.action })
      .querySelector(".tz-approval-header");
  const view = render(task("وكيل التحصيل"));
  expect(
    step().querySelector(".tz-agent-run-step-title")?.nextElementSibling,
  ).toHaveTextContent("فُوّضت إلى وكيل التحصيل");
  expect(header()).toHaveTextContent("وكيل التحصيل");
  // Not handed off: the task's own agent asks.
  view.rerender(task());
  expect(step()).not.toHaveTextContent("فُوّضت إلى");
  expect(header()).toHaveTextContent("وكيل المالية");
});

it("keeps focus off Approve when a step turns needs-you", () => {
  const task = (
    status: "running" | "needs-you",
    states: AgentStep["state"][],
  ) => (
    <AgentTask
      title={title}
      status={status}
      steps={close(states, {
        3: { request, approval: { reversible: true } },
      })}
      onSteer={() => {}}
      onStop={() => {}}
      onDecision={vi.fn()}
    />
  );
  const view = render(
    task("running", [
      "completed",
      "completed",
      "running",
      "pending",
      "pending",
    ]),
  );
  act(() => screen.getByRole("textbox", { name: /^وجّه الوكيل/ }).focus());
  view.rerender(
    task("needs-you", [
      "completed",
      "completed",
      "completed",
      "needs-you",
      "pending",
    ]),
  );
  expect(section()).toHaveFocus();
  expect(
    screen.getByRole("group", { name: request.action }),
  ).not.toContainElement(document.activeElement as HTMLElement);
});

it("counts steps and operations with Arabic agreement", () => {
  const operations = [3, 3, 2, 2, 2];
  const task = (numerals: "arab" | "latn"): ReactNode => (
    <SystemProvider config={{ ...defaultConfig, numerals }}>
      <AgentTask
        title={title}
        agent="وكيل المالية"
        status="completed"
        elapsed={220}
        steps={close(
          done as AgentStep["state"][],
          Object.fromEntries(
            operations.map((count, step) => [
              step,
              {
                tools: Array.from({ length: count }, (_, index) =>
                  tool(`عملية ${index + 1}`, `tool.${step}.${index}`),
                ),
              },
            ]),
          ),
        )}
      />
    </SystemProvider>
  );
  const view = render(task("arab"));
  expect(screen.getByText("وكيل المالية · ٥ خطوات")).toBeVisible();
  expect(screen.getByText("٣د ٤٠ث · ١٢ عملية")).toBeVisible();
  // Western digits keep the same agreement.
  view.rerender(task("latn"));
  expect(screen.getByText("وكيل المالية · 5 خطوات")).toBeVisible();
  expect(screen.getByText("3د 40ث · 12 عملية")).toBeVisible();
});
