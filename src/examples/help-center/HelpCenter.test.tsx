import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HelpCenter } from "./HelpCenter";

// The answers run on the host's moments, so these tests move a fake clock. It
// also ticks with real time, which Testing Library's waits need to settle.
beforeEach(() => {
  window.history.replaceState({}, "", "/examples/help-center?demo=off");
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState({}, "", "/");
});
/** Moves the clock in steps, each in its own act: a beat re-arms the next one. */
async function pass(ms: number) {
  for (let left = ms; left > 0; left -= 100)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(Math.min(100, left));
    });
}
/** Runs the host's moments one after another until the answer reaches `status`. */
async function until(answer: HTMLElement, status: string) {
  for (
    let beat = 0;
    beat < 200 && answer.getAttribute("data-status") !== status;
    beat += 1
  )
    await act(async () => {
      await vi.advanceTimersToNextTimerAsync();
    });
  expect(answer).toHaveAttribute("data-status", status);
}
function setup() {
  const view = render(<HelpCenter />);
  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
    delay: null,
  });
  return { view, user };
}
const bank = "كيف أطابق كشف البنك الأهلي؟";
const accrual = "كيف أرحّل قيد استحقاق؟";
const support = () =>
  screen.queryByRole("link", { name: "تواصل مع فريق الدعم" });
/** Picks a suggestion and sends it. */
async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.click(screen.getByRole("button", { name: question }));
  await user.click(screen.getByRole("button", { name: "إرسال" }));
  return screen.getByRole("region", { name: question });
}

it("asks a suggested question, stops it, and regenerates it with sources and follow-ups", async () => {
  const { view, user } = setup();
  expect(
    screen.getByRole("heading", { level: 1, name: "مركز المساعدة" }),
  ).toBeInTheDocument();
  expect(screen.getByText("مرحبًا ليلى")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 2, name: "كيف نساعدك؟" }),
  ).toBeInTheDocument();
  const suggestions = within(
    screen.getByRole("list", { name: "أسئلة شائعة" }),
  ).getAllByRole("button");
  expect(suggestions.map((button) => button.textContent)).toEqual([
    bank,
    "لماذا ارتفعت أيام التحصيل؟",
    accrual,
  ]);

  // A suggestion fills the draft and gives the field focus; sending replaces
  // the form with the answer, which takes focus and starts out thinking.
  await user.click(suggestions[0]);
  expect(screen.getByRole("textbox", { name: "سؤالك" })).toHaveValue(bank);
  expect(screen.getByRole("textbox", { name: "سؤالك" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "إرسال" }));
  const answer = screen.getByRole("region", { name: bank });
  expect(answer).toHaveFocus();
  expect(answer).toHaveAttribute("data-status", "thinking");
  expect(screen.queryByRole("textbox")).toBeNull();
  await pass(700);
  expect(answer).toHaveAttribute("data-status", "thinking");

  // Stop keeps what there is, and nothing moves on afterwards.
  await user.click(within(answer).getByRole("button", { name: "إيقاف" }));
  expect(answer).toHaveAttribute("data-status", "stopped");
  expect(within(answer).getByRole("status")).toHaveTextContent(
    "أُوقفت الإجابة",
  );
  expect(answer.querySelector(".tz-cited-answer-note")).toHaveTextContent(
    "أُوقفت الإجابة",
  );
  await pass(5000);
  expect(answer).toHaveAttribute("data-status", "stopped");
  // The reply box is there once the answer isn't running.
  expect(screen.getByRole("textbox", { name: "سؤال آخر" })).toBeInTheDocument();

  // Regenerate thinks for about a second and a half, writes in parts, then
  // completes with three sources, the follow-ups and Arabic-Indic digits only.
  await user.click(
    within(answer).getByRole("button", { name: "إعادة التوليد" }),
  );
  expect(answer).toHaveAttribute("data-status", "thinking");
  expect(screen.queryByRole("textbox")).toBeNull();
  await pass(1000);
  expect(answer).toHaveAttribute("data-status", "thinking");
  await pass(700);
  expect(answer).toHaveAttribute("data-status", "writing");
  expect(answer).toHaveTextContent("طابق حركات");
  expect(answer).not.toHaveTextContent("ثم أغلق التسوية");
  await until(answer, "completed");
  expect(answer).toHaveTextContent("ثم أغلق التسوية");
  expect(
    within(answer).getByRole("button", { name: /^٣ مصادر/ }),
  ).toBeInTheDocument();
  expect(
    within(within(answer).getByRole("list", { name: "أسئلة تالية" }))
      .getAllByRole("button")
      .map((button) => button.textContent),
  ).toEqual(["لماذا ارتفعت أيام التحصيل؟", accrual]);
  expect(answer).toHaveTextContent("٣ حسابات و٩٤ حركة");
  expect(answer.textContent).not.toMatch(/[0-9]/);
  expect(support()).toBeNull();

  // Leaving the screen clears every timer.
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("fails the accruals question once, offers a person, and completes on Try again", async () => {
  const { user } = setup();
  const answer = await ask(user, accrual);
  await until(answer, "failed");
  expect(answer).toHaveTextContent("تعذّر إكمال الإجابة");
  expect(answer).toHaveTextContent("انقطع الاتصال بمكتبة المقالات");
  expect(support()).toHaveAttribute("href", "mailto:support@tiraz.example");

  await user.click(
    within(answer).getByRole("button", { name: "أعد المحاولة" }),
  );
  expect(answer).toHaveAttribute("data-status", "thinking");
  expect(support()).toBeNull();
  await until(answer, "completed");
  expect(answer).toHaveTextContent("٤ قيود بمجموع ٦٬٨٥٠ ر.س");
  expect(support()).toBeNull();

  // A follow-up starts a new answer, and asked again, the accruals question
  // no longer fails.
  await user.click(within(answer).getByRole("button", { name: bank }));
  const next = screen.getByRole("region", { name: bank });
  await until(next, "completed");
  await user.click(within(next).getByRole("button", { name: accrual }));
  await until(screen.getByRole("region", { name: accrual }), "completed");
});

it("answers what the library lacks without sources, and a down rating offers the person too", async () => {
  const { user } = setup();
  const answer = await ask(user, bank);
  await until(answer, "completed");
  expect(support()).toBeNull();
  await user.click(
    within(answer).getByRole("button", { name: "إجابة غير مفيدة" }),
  );
  expect(support()).toBeInTheDocument();

  // Another question from the reply box: none of the library's articles fit.
  const other = "هل يمكنني تصدير الدفتر؟";
  await user.type(screen.getByRole("textbox", { name: "سؤال آخر" }), other);
  await user.keyboard("{Enter}");
  const next = screen.getByRole("region", { name: other });
  expect(next).toHaveFocus();
  expect(support()).toBeNull();
  await until(next, "completed");
  expect(next).toHaveTextContent("لم أجد مقالًا يجيب عن هذا السؤال.");
  expect(within(next).queryByRole("button", { name: /مصدر|مصادر/ })).toBeNull();
  expect(support()).toBeInTheDocument();

  // English says the same things, and writes its figures in Western digits.
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByRole("region", { name: other })).toHaveTextContent(
    "I couldn't find an article that answers this question.",
  );
  expect(
    screen.getByRole("link", { name: "Contact the support team" }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", {
      name: "Why did days sales outstanding rise?",
    }),
  );
  const english = screen.getByRole("region", {
    name: "Why did days sales outstanding rise?",
  });
  await until(english, "completed");
  expect(english).toHaveTextContent(
    "rose from 34 days in September to 47 in October",
  );
  expect(english).toHaveTextContent("12 invoices are overdue, SAR 48,300");
  expect(english.textContent).not.toMatch(/[٠-٩]/);
});

it("presents the opening question and answer without focus, and pauses the actual answer", async () => {
  window.history.replaceState({}, "", "/examples/help-center");
  const { user } = setup();
  const field = screen.getByRole("textbox", { name: "سؤالك" });
  await pass(1000);
  expect(field).not.toHaveValue("");
  expect(field).not.toHaveValue(bank);
  expect(document.body).toHaveFocus();
  await pass(1900);
  const answer = screen.getByRole("region", { name: bank });
  expect(answer).toHaveAttribute("data-status", "thinking");
  expect(within(answer).getByRole("status")).toBeEmptyDOMElement();
  expect(document.body).toHaveFocus();
  await pass(1800);
  expect(answer).toHaveAttribute("data-status", "writing");
  expect(answer).toHaveTextContent("طابق حركات");
  expect(document.body).toHaveFocus();

  await user.click(screen.getByRole("button", { name: "إيقاف العرض مؤقتًا" }));
  const paused = answer.textContent;
  await pass(1400);
  expect(answer.textContent).toBe(paused);
  await user.click(screen.getByRole("button", { name: "متابعة العرض" }));
  await pass(5000);
  expect(answer).toHaveAttribute("data-status", "completed");
  expect(answer).toHaveTextContent("ثم أغلق التسوية");
  // CitedAnswer owns status changes; its existing copy receipt is separate.
  expect(within(answer).getAllByRole("status")).toHaveLength(1);
  // Inspecting the completed demo does not replace it with the starter.
  await user.click(within(answer).getByRole("button", { name: /^٣ مصادر/ }));
  expect(screen.getByRole("region", { name: bank })).toBe(answer);
});

it("hands the typed draft to the person and keeps a stopped preview stopped", async () => {
  window.history.replaceState({}, "", "/examples/help-center");
  const { user, view } = setup();
  await pass(1000);
  const field = screen.getByRole("textbox", { name: "سؤالك" });
  const typed = (field as HTMLTextAreaElement).value;
  await user.click(field);
  expect(field).toHaveValue(typed);
  await pass(4000);
  expect(field).toHaveValue(typed);
  expect(screen.queryByRole("region", { name: bank })).toBeNull();
  view.unmount();

  window.history.replaceState({}, "", "/examples/help-center");
  const next = setup();
  await pass(3000);
  const answer = screen.getByRole("region", { name: bank });
  await next.user.click(within(answer).getByRole("button", { name: "إيقاف" }));
  expect(answer).toHaveAttribute("data-status", "stopped");
  await pass(6000);
  expect(answer).toHaveAttribute("data-status", "stopped");
  expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
});

it("replays the preview and restores the person's question, answer and reply draft", async () => {
  window.history.replaceState({}, "", "/examples/help-center");
  const { user } = setup();
  const question = "لماذا ارتفعت أيام التحصيل؟";
  await ask(user, question);
  await until(screen.getByRole("region", { name: question }), "completed");
  const original = screen.getByRole("region", { name: question }).textContent;
  const reply = "هل يمكنني تصدير الدفتر؟";
  await user.type(screen.getByRole("textbox", { name: "سؤال آخر" }), reply);

  await user.click(screen.getByRole("button", { name: "إعادة العرض" }));
  await pass(1000);
  const field = screen.getByRole("textbox", { name: "سؤالك" });
  expect(field).not.toHaveValue("");
  expect(field).not.toHaveValue(question);
  await pass(2000);
  expect(screen.getByRole("region", { name: bank })).toHaveAttribute(
    "data-status",
    "thinking",
  );
  await pass(5000);
  expect(screen.getByRole("region", { name: question }).textContent).toBe(
    original,
  );
  expect(screen.getByRole("textbox", { name: "سؤال آخر" })).toHaveValue(reply);

  // Interrupting the next playback restores the same work with usable focus.
  await user.click(screen.getByRole("button", { name: "إعادة العرض" }));
  await pass(1000);
  await user.click(screen.getByRole("textbox", { name: "سؤالك" }));
  expect(screen.getByRole("region", { name: question })).toHaveFocus();
  expect(screen.getByRole("textbox", { name: "سؤال آخر" })).toHaveValue(reply);
});

it("keeps an unfinished manual answer advancing while presentation is paused", async () => {
  window.history.replaceState({}, "", "/examples/help-center");
  const { user } = setup();
  const question = "لماذا ارتفعت أيام التحصيل؟";
  await ask(user, question);
  await user.click(screen.getByRole("button", { name: "إعادة العرض" }));
  await pass(1000);
  await user.click(screen.getByRole("button", { name: "إيقاف العرض مؤقتًا" }));
  await pass(8000);
  await user.click(screen.getByRole("textbox", { name: "سؤالك" }));
  const restored = screen.getByRole("region", { name: question });
  expect(restored).toHaveAttribute("data-status", "completed");
  expect(restored).toHaveTextContent("١٢ فاتورة متأخرة بمجموع ٤٨٬٣٠٠ ر.س");
  expect(restored).toHaveFocus();
});

it("restores an unsent draft after replay finishes", async () => {
  window.history.replaceState({}, "", "/examples/help-center");
  const { user } = setup();
  const draft = "هل يمكنني تصدير الدفتر؟";
  await user.type(screen.getByRole("textbox", { name: "سؤالك" }), draft);
  await user.click(screen.getByRole("button", { name: "إعادة العرض" }));
  await pass(8000);
  expect(screen.getByRole("textbox", { name: "سؤالك" })).toHaveValue(draft);
  expect(screen.queryByRole("region", { name: bank })).toBeNull();
});

it.each(["click", "keyboard"])(
  "consumes synthetic Send by %s and shows the saved draft before a fresh submit",
  async (activation) => {
    window.history.replaceState({}, "", "/examples/help-center");
    const { user } = setup();
    const draft = "هل يمكنني تصدير الدفتر؟";
    await user.type(screen.getByRole("textbox", { name: "سؤالك" }), draft);
    await user.click(screen.getByRole("button", { name: "إعادة العرض" }));
    await pass(1000);
    expect(screen.getByRole("textbox", { name: "سؤالك" })).not.toHaveValue(
      draft,
    );
    const send = screen.getByRole("button", { name: "إرسال" });
    if (activation === "keyboard") {
      act(() => send.focus());
      await user.keyboard("{Enter}");
    } else await user.click(send);
    expect(screen.getByRole("textbox", { name: "سؤالك" })).toHaveValue(draft);
    expect(screen.queryByRole("region", { name: draft })).toBeNull();
    expect(screen.queryByRole("region", { name: bank })).toBeNull();
    await pass(4000);
    expect(screen.getByRole("textbox", { name: "سؤالك" })).toHaveValue(draft);

    await user.click(screen.getByRole("button", { name: "إرسال" }));
    expect(screen.getByRole("region", { name: draft })).toHaveAttribute(
      "data-status",
      "thinking",
    );
  },
);

it.each(["click", "keyboard"])(
  "restores the real answer and reply draft when synthetic Send is activated by %s",
  async (activation) => {
    window.history.replaceState({}, "", "/examples/help-center");
    const { user } = setup();
    const question = "لماذا ارتفعت أيام التحصيل؟";
    await ask(user, question);
    await until(screen.getByRole("region", { name: question }), "completed");
    const reply = "هل يمكنني تصدير الدفتر؟";
    await user.type(screen.getByRole("textbox", { name: "سؤال آخر" }), reply);
    await user.click(screen.getByRole("button", { name: "إعادة العرض" }));
    await pass(1000);
    const send = screen.getByRole("button", { name: "إرسال" });
    if (activation === "keyboard") {
      act(() => send.focus());
      await user.keyboard("{Enter}");
    } else await user.click(send);

    const restored = screen.getByRole("region", { name: question });
    expect(restored).toHaveAttribute("data-status", "completed");
    expect(restored).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "سؤال آخر" })).toHaveValue(
      reply,
    );
    expect(screen.queryByRole("region", { name: reply })).toBeNull();
    expect(screen.queryByRole("region", { name: bank })).toBeNull();
    await pass(4000);
    expect(restored).toHaveAttribute("data-status", "completed");
  },
);
