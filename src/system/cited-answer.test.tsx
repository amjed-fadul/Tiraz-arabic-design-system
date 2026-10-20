import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import {
  CitedAnswer,
  FeedbackBar,
  FollowUps,
  InsightCards,
  StreamingText,
  SystemProvider,
  defaultConfig,
} from "./index";
import type { CitedAnswerProps, SourceReference } from "./index";
afterEach(() => vi.useRealTimers());

const question = "لماذا انخفض التدفق النقدي في أكتوبر؟";
const sources: SourceReference[] = [
  {
    id: "ledger",
    number: 1,
    title: "دفتر الحسابات · أكتوبر",
    href: "https://ledger.example.com/october",
    description: "صافي التدفق النقدي أقل بنسبة ١٨٪ من سبتمبر.",
    metadata: "١٢–١٨ أكتوبر",
  },
  // A destination the page must never follow.
  {
    id: "invoices",
    number: 2,
    title: "فواتير العملاء",
    href: "javascript:alert(1)",
  },
  {
    id: "bank",
    number: 3,
    title: "كشف البنك الأهلي",
    href: "/reports/al-ahli",
  },
];
const content =
  "انخفض صافي التدفق النقدي ١٨٪ [1]. تأخّر ثلاثة عملاء في السداد [2]، ودُفعت ١٢٥٬٠٠٠ ر.س مبكرًا [3].";
const partial = "انخفض صافي التدفق النقدي ١٨٪ [1]. تأخّر ثلاثة";
const thinking = {
  elapsed: 6,
  searched: sources,
  steps: [
    { id: "ledger", label: "قراءة دفتر الحسابات", state: "completed" as const },
    { id: "match", label: "مطابقة الفواتير", state: "running" as const },
  ],
};
function answer(
  status: CitedAnswerProps["status"],
  extra: Partial<CitedAnswerProps> = {},
) {
  return (
    <CitedAnswer
      status={status}
      question={question}
      content={content}
      sources={sources}
      {...extra}
    />
  );
}
const section = () => screen.getByRole("region", { name: question });
const region = () =>
  document.querySelector(".tz-cited-answer > [role='status']") as HTMLElement;

it("announces each status in one sentence and never the answer text", async () => {
  const user = userEvent.setup(),
    onRetry = vi.fn(),
    onRegenerate = vi.fn();
  // Only the pattern's own region speaks: StreamingText and ThinkingPanel are
  // silent in every status.
  const quiet = () =>
    expect(section().querySelectorAll("[role='status']")).toHaveLength(1);
  // A finished answer that mounts is not news.
  const view = render(answer("completed"));
  expect(region()).toBeEmptyDOMElement();
  quiet();
  view.rerender(answer("thinking", { content: "", thinking }));
  expect(region().textContent).toBe("يفكّر");
  quiet();
  view.rerender(answer("writing", { content: partial, thinking }));
  expect(region().textContent).toBe("يكتب الإجابة");
  quiet();
  // Words arriving change nothing in the region.
  view.rerender(answer("writing", { content, thinking }));
  expect(region().textContent).toBe("يكتب الإجابة");
  view.rerender(answer("completed", { thinking }));
  expect(region().textContent).toBe("اكتملت الإجابة");
  quiet();
  view.rerender(
    answer("failed", {
      content: partial,
      thinking,
      error: "انقطع الاتصال بدفتر الحسابات.",
      onRetry,
    }),
  );
  expect(region().textContent).toBe("تعذّر إكمال الإجابة");
  quiet();
  // The partial answer stays, with the error as text beside it.
  expect(section()).toHaveTextContent("تأخّر ثلاثة");
  expect(screen.getByText("انقطع الاتصال بدفتر الحسابات.")).toBeVisible();
  const retry = screen.getByRole("button", { name: "أعد المحاولة" });
  retry.focus();
  await user.keyboard("{Enter}");
  expect(onRetry).toHaveBeenCalledTimes(1);
  // The host starts over; the button that held focus is gone, so the section
  // takes it.
  view.rerender(answer("thinking", { content: "", thinking }));
  expect(region().textContent).toBe("يفكّر");
  expect(section()).toHaveFocus();
  view.rerender(
    answer("stopped", { content: partial, thinking, onRegenerate }),
  );
  expect(region().textContent).toBe("أُوقفت الإجابة");
  quiet();
  expect(section()).toHaveTextContent("تأخّر ثلاثة");
  await user.click(screen.getByRole("button", { name: "إعادة التوليد" }));
  expect(onRegenerate).toHaveBeenCalledTimes(1);
  // No sentence ever carries the answer's words.
  for (const status of ["thinking", "writing", "completed"] as const) {
    view.rerender(answer(status, { thinking }));
    expect(region().textContent).not.toContain("التدفق");
  }
});

it("turns [n] into citation chips that preview on hover or focus and open the source", async () => {
  const user = userEvent.setup();
  render(
    answer("completed", { content: `${content} الرمز \`[1]\` يبقى نصًا.` }),
  );
  const first = screen.getByRole("link", { name: /^المصدر ١/ });
  // The chip is the number in the provider's digits, and links to the source.
  expect(first).toHaveTextContent("١");
  expect(first).toHaveAttribute("href", sources[0].href);
  act(() => first.focus());
  const preview = screen.getByRole("tooltip");
  expect(preview).toHaveTextContent("دفتر الحسابات · أكتوبر");
  expect(preview).toHaveTextContent("صافي التدفق النقدي أقل بنسبة ١٨٪");
  // The link is the chip's own; the preview carries none.
  expect(within(preview).queryByRole("link")).toBeNull();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).toBeNull();
  // A destination that fails the link policy makes a button, which Tab still
  // reaches and which previews on focus.
  const rejected = screen.getByRole("button", { name: /^المصدر ٢/ });
  expect(rejected).toHaveTextContent("٢");
  expect(rejected).not.toHaveAttribute("href");
  act(() => first.focus());
  await user.tab();
  expect(rejected).toHaveFocus();
  expect(screen.getByRole("tooltip")).toHaveTextContent("فواتير العملاء");
  await user.keyboard("{Escape}");
  // The pointer shows the preview, and moving onto it keeps it open.
  vi.useFakeTimers();
  const third = screen.getByRole("link", { name: /^المصدر ٣/ });
  expect(third).toHaveAttribute("href", "/reports/al-ahli");
  fireEvent.pointerEnter(third);
  const hovered = screen.getByRole("tooltip");
  expect(hovered).toHaveTextContent("كشف البنك الأهلي");
  fireEvent.pointerLeave(third);
  fireEvent.pointerEnter(hovered);
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByRole("tooltip")).toBe(hovered);
  fireEvent.pointerLeave(hovered);
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.queryByRole("tooltip")).toBeNull();
  // Code is left alone.
  const code = document.querySelector("code")!;
  expect(code).toHaveTextContent("[1]");
  expect(code.querySelector(".tz-inline-citation")).toBeNull();
  // A marker with no source stays as written.
  expect(document.querySelectorAll(".tz-inline-citation")).toHaveLength(3);
});

it("sets InsightCards' heading level", () => {
  const items = [{ id: "flow", title: "انخفض التدفق النقدي" }];
  const view = render(<InsightCards items={items} headingLevel={4} />);
  expect(
    screen.getByRole("heading", { level: 4, name: "انخفض التدفق النقدي" }),
  ).toBeVisible();
  view.rerender(<InsightCards items={items} />);
  expect(
    screen.getByRole("heading", { level: 3, name: "انخفض التدفق النقدي" }),
  ).toBeVisible();
});

it("keeps answer links to safe destinations", () => {
  const links =
    "راسل [الفريق](mailto:team@example.com) أو افتح [التقرير](https://example.com/report).";
  const view = render(answer("completed", { content: links }));
  // A mailto: link is text; an https one stays a link.
  expect(screen.queryByRole("link", { name: "الفريق" })).toBeNull();
  expect(screen.getByText("الفريق")).toBeVisible();
  expect(screen.getByRole("link", { name: "التقرير" })).toHaveAttribute(
    "href",
    "https://example.com/report",
  );
  // The words as they arrive follow the same policy.
  view.rerender(answer("writing", { content: links }));
  expect(screen.queryByRole("link", { name: "الفريق" })).toBeNull();
  expect(screen.getByRole("link", { name: "التقرير" })).toBeVisible();
});

it("folds thinking to «فكّر لمدة ٦ث» while writing and honors the controlled pair", async () => {
  const user = userEvent.setup(),
    onThinkingOpenChange = vi.fn();
  const view = render(answer("thinking", { content: "", thinking }));
  const header = (name: string) => screen.getByRole("button", { name });
  expect(header("يفكّر")).toHaveAttribute("aria-expanded", "true");
  // Writing starts: the panel folds to what it took.
  view.rerender(answer("writing", { content: partial, thinking }));
  expect(header("فكّر لمدة ٦ث")).toHaveAttribute("aria-expanded", "false");
  const panel = document.getElementById(
    header("فكّر لمدة ٦ث").getAttribute("aria-controls")!,
  )!;
  expect(panel).toHaveAttribute("hidden");
  expect(panel).toHaveAttribute("inert");
  // The person can open it, and it stays open when the answer completes.
  await user.click(header("فكّر لمدة ٦ث"));
  expect(header("فكّر لمدة ٦ث")).toHaveAttribute("aria-expanded", "true");
  view.rerender(answer("completed", { thinking }));
  expect(header("فكّر لمدة ٦ث")).toHaveAttribute("aria-expanded", "true");
  // The host that controls the pair decides; the panel only reports.
  view.rerender(
    answer("writing", {
      content: partial,
      thinking,
      thinkingOpen: true,
      onThinkingOpenChange,
    }),
  );
  expect(header("فكّر لمدة ٦ث")).toHaveAttribute("aria-expanded", "true");
  await user.click(header("فكّر لمدة ٦ث"));
  expect(onThinkingOpenChange).toHaveBeenLastCalledWith(false);
  expect(header("فكّر لمدة ٦ث")).toHaveAttribute("aria-expanded", "true");
  view.rerender(
    answer("writing", {
      content: partial,
      thinking,
      thinkingOpen: false,
      onThinkingOpenChange,
    }),
  );
  expect(header("فكّر لمدة ٦ث")).toHaveAttribute("aria-expanded", "false");
  // Starting to write never folds a panel the host holds open.
  view.rerender(
    answer("thinking", {
      content: "",
      thinking,
      thinkingOpen: true,
      onThinkingOpenChange,
    }),
  );
  view.rerender(
    answer("writing", {
      content: partial,
      thinking,
      thinkingOpen: true,
      onThinkingOpenChange,
    }),
  );
  expect(header("فكّر لمدة ٦ث")).toHaveAttribute("aria-expanded", "true");
});

it("toggles helpful and not helpful with reasons, and shows «نُسخت» after copy", async () => {
  vi.useFakeTimers();
  const onFeedbackChange = vi.fn(),
    onRegenerate = vi.fn(),
    onCopy = vi.fn().mockResolvedValue(undefined);
  const bar = (feedback: "up" | "down" | null, reason?: "wrong-source") => (
    <FeedbackBar
      feedback={feedback}
      reason={reason}
      onFeedbackChange={onFeedbackChange}
      onCopy={onCopy}
      onRegenerate={onRegenerate}
    />
  );
  const view = render(bar(null));
  const button = (name: string) => screen.getByRole("button", { name });
  expect(button("إجابة مفيدة")).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(button("إجابة مفيدة"));
  expect(onFeedbackChange).toHaveBeenLastCalledWith("up");
  view.rerender(bar("up"));
  expect(button("إجابة مفيدة")).toHaveAttribute("aria-pressed", "true");
  expect(button("إجابة غير مفيدة")).toHaveAttribute("aria-pressed", "false");
  // Pressing it again takes the rating back; the reasons wait for a "down".
  expect(screen.queryByRole("button", { name: "مصدر خاطئ" })).toBeNull();
  fireEvent.click(button("إجابة مفيدة"));
  expect(onFeedbackChange).toHaveBeenLastCalledWith(null);
  fireEvent.click(button("إجابة غير مفيدة"));
  expect(onFeedbackChange).toHaveBeenLastCalledWith("down");
  view.rerender(bar("down"));
  expect(button("إجابة غير مفيدة")).toHaveAttribute("aria-pressed", "true");
  expect(
    ["غير دقيقة", "مصدر خاطئ", "طويلة", "قديمة"].map((name) =>
      button(name).getAttribute("aria-pressed"),
    ),
  ).toEqual(["false", "false", "false", "false"]);
  fireEvent.click(button("مصدر خاطئ"));
  expect(onFeedbackChange).toHaveBeenLastCalledWith("down", "wrong-source");
  view.rerender(bar("down", "wrong-source"));
  expect(button("مصدر خاطئ")).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(button("إعادة التوليد"));
  expect(onRegenerate).toHaveBeenCalledTimes(1);
  // «نُسخت» shows for two seconds once the host's copy resolves.
  expect(screen.queryByText("نُسخت")).toBeNull();
  await act(async () => {
    fireEvent.click(button("نسخ الإجابة"));
  });
  expect(onCopy).toHaveBeenCalledTimes(1);
  expect(screen.getByText("نُسخت")).toBeVisible();
  expect(button("نُسخت")).toBeVisible();
  act(() => vi.advanceTimersByTime(1999));
  expect(screen.getByText("نُسخت")).toBeVisible();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByText("نُسخت")).toBeNull();
  expect(button("نسخ الإجابة")).toBeVisible();
  // A copy that fails shows nothing.
  onCopy.mockRejectedValueOnce(new Error("blocked"));
  await act(async () => {
    fireEvent.click(button("نسخ الإجابة"));
  });
  expect(screen.queryByText("نُسخت")).toBeNull();
});

it("lists follow-ups as buttons", async () => {
  const user = userEvent.setup(),
    onSelect = vi.fn();
  render(
    <FollowUps
      items={[
        { id: "customers", label: "من العملاء الأكثر تأخرًا في السداد؟" },
        { id: "supplier", label: "هل كانت دفعة النخبة للتغليف مبكرة؟" },
      ]}
      onSelect={onSelect}
    />,
  );
  const list = screen.getByRole("list", { name: "أسئلة تالية" });
  const buttons = within(list).getAllByRole("button");
  expect(buttons.map((item) => item.textContent)).toEqual([
    "من العملاء الأكثر تأخرًا في السداد؟",
    "هل كانت دفعة النخبة للتغليف مبكرة؟",
  ]);
  await user.click(buttons[1]);
  expect(onSelect).toHaveBeenCalledWith("supplier");
});

it("agrees the meta counts", () => {
  const many = (count: number): SourceReference[] =>
    Array.from({ length: count }, (_, index) => ({
      id: `source-${index}`,
      number: index + 1,
      title: `مصدر ${index + 1}`,
    }));
  const meta = (count: number) => (
    <CitedAnswer
      status="completed"
      question={question}
      content=""
      sources={many(count)}
      duration={6.2}
    />
  );
  const view = render(meta(3));
  expect(screen.getByText("٣ مصادر · ٦٫٢ث")).toBeVisible();
  for (const [count, text] of [
    [1, "مصدر واحد · ٦٫٢ث"],
    [2, "مصدران · ٦٫٢ث"],
    [11, "١١ مصدرًا · ٦٫٢ث"],
  ] as const) {
    view.rerender(meta(count));
    expect(screen.getByText(text)).toBeVisible();
  }
  // Western digits keep the agreement.
  view.rerender(
    <SystemProvider config={{ ...defaultConfig, numerals: "latn" }}>
      {meta(3)}
    </SystemProvider>,
  );
  expect(screen.getByText("3 مصادر · 6.2ث")).toBeVisible();
});

it("announces StreamingText's stopped and failed states", () => {
  const stream = (state: "stopped" | "failed") => (
    <StreamingText text="انخفض التدفق" state={state} />
  );
  const view = render(stream("stopped"));
  expect(screen.getByRole("status")).toHaveTextContent("أُوقف الرد");
  view.rerender(stream("failed"));
  expect(screen.getByRole("status")).toHaveTextContent("تعذّر إكمال الرد");
  expect(document.querySelector(".tz-stream-cursor")).toBeNull();
  view.rerender(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      {stream("stopped")}
    </SystemProvider>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("Response stopped");
  view.rerender(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      {stream("failed")}
    </SystemProvider>,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Couldn't finish the response",
  );
});
