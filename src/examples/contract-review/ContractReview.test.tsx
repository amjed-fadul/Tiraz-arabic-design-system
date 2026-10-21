import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ContractReview } from "./ContractReview";

// The send is recorded after the host's moment, so these tests move a fake
// clock. It also ticks with real time, which Testing Library's waits need.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());
const pass = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
const setup = () => {
  render(<ContractReview />);
  return userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
    delay: null,
  });
};
type User = ReturnType<typeof setup>;

const title = "إرسال العقد المعدّل إلى النخبة للتغليف";
const review = () => screen.getByRole("dialog", { name: /اقتراح المساعد/ });
const approval = () => screen.getByRole("group", { name: title });
const noApproval = () => screen.queryByRole("group", { name: title });
/** The tracked change `id` (c1 the amount, c2 the date, c3 the discount). */
const change = (id: string) =>
  review().querySelector<HTMLElement>(`[data-change-id="${id}"]`)!;
const decide = (user: User, id: string, word: "قبول" | "رفض") =>
  user.click(
    within(change(id)).getByRole("button", { name: new RegExp(`^${word}`) }),
  );
const decided = "تسدّد الشركة ١٢٥٬٠٠٠ ر.س قبل ٣٠ أكتوبر، دون أي خصم.";
/** A node's text without the direction marks Intl adds around a percent sign. */
const words = (node: Element) => node.textContent!.replace(/\p{Cf}/gu, "");
/** Two accepts and a reject: the amount and the date in, the discount out. */
async function decideAll(user: User) {
  await decide(user, "c1", "قبول");
  await decide(user, "c2", "قبول");
  await decide(user, "c3", "رفض");
}

it("uses one initially empty announcement region through review and recording", async () => {
  const user = setup();
  const regions = () =>
    document.querySelectorAll('[aria-live="polite"], [role="status"]');
  expect(regions()).toHaveLength(1);
  expect(regions()[0]).toBeEmptyDOMElement();
  await decideAll(user);
  expect(regions()).toHaveLength(1);
  expect(regions()[0]).toHaveTextContent("طلب إرسال العقد جاهز لقرارك");
  await user.click(
    within(approval()).getByRole("button", { name: "أرسل العقد" }),
  );
  expect(regions()).toHaveLength(1);
  expect(regions()[0]).toHaveTextContent("تُسجَّل الموافقة");
  await pass(1000);
  expect(regions()).toHaveLength(1);
  expect(regions()[0]).toHaveTextContent("تمت الموافقة");
  expect(approval()).toHaveTextContent("تمت الموافقة");
});

it("holds the send until every change has a decision, then shows it irreversible with the clause as decided", async () => {
  const user = setup();
  expect(
    screen.getByRole("heading", { level: 1, name: "مراجعة العقود" }),
  ).toBeInTheDocument();
  // Reviewing from the start, on the payment terms, with the files beside.
  expect(review()).toBeInTheDocument();
  expect(
    screen.getByRole("treeitem", { name: "ملحق شروط الدفع" }),
  ).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("٣ تعديلات بانتظار قرارك")).toBeInTheDocument();
  expect(noApproval()).toBeNull();

  // The count agrees with the noun as changes are decided.
  await decide(user, "c1", "قبول");
  expect(screen.getByText("تعديلان بانتظار قرارك")).toBeInTheDocument();
  await decide(user, "c2", "قبول");
  expect(screen.getByText("تعديل واحد بانتظار قرارك")).toBeInTheDocument();
  expect(noApproval()).toBeNull();
  await decide(user, "c3", "رفض");

  // The last decision brings the approval, without moving focus onto it.
  expect(noApproval()).not.toBeNull();
  expect(approval()).not.toHaveFocus();
  expect(approval().contains(document.activeElement)).toBe(false);
  expect(
    screen.getByRole("heading", { level: 2, name: title }),
  ).toBeInTheDocument();
  expect(approval()).toHaveTextContent(decided);
  expect(approval()).toHaveTextContent("لا يمكن استرجاع العقد بعد إرساله.");
  // The impact table says the same as the clause: the discount stayed out.
  expect(approval()).toHaveTextContent("المبلغ١٢٥٬٠٠٠ ر.س");
  expect(approval()).toHaveTextContent("الخصمبلا خصم");
  expect(approval()).toHaveTextContent("الاستحقاققبل ٣٠ أكتوبر");
  expect(document.body).toHaveTextContent("طلب إرسال العقد جاهز لقرارك");
  // Irreversible, so the chord that approves reversible requests does nothing.
  await user.keyboard("{Control>}{Enter}{/Control}");
  await pass(1000);
  expect(approval()).not.toHaveAttribute("data-state", "approved");

  // A changed decision changes what the card holds, and remounts it.
  const before = approval();
  await decide(user, "c3", "قبول");
  expect(approval()).not.toBe(before);
  expect(words(approval())).toContain(
    "تسدّد الشركة ١٢٥٬٠٠٠ ر.س قبل ٣٠ أكتوبر، مع خصم قدره ٢٪ عند السداد المبكر.",
  );
  expect(words(approval())).toContain("الخصم٢٪ عند السداد المبكر");
});

it("keeps the decisions and the card when another file is opened and left", async () => {
  const user = setup();
  // With changes waiting, the panel's button brings the review back from any
  // file, and hands the card focus.
  await user.click(screen.getByRole("treeitem", { name: "اتفاقية التوريد" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "راجع التعديلات" }));
  expect(
    screen.getByRole("heading", { level: 2, name: "ملحق شروط الدفع" }),
  ).toBeInTheDocument();
  expect(within(review()).getByRole("heading", { level: 3 })).toHaveFocus();

  await decideAll(user);
  const card = approval();

  await user.click(screen.getByRole("treeitem", { name: "المراسلات" }));
  expect(
    screen.getByRole("heading", { level: 2, name: "المراسلات" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/حوّلنا ١٢٥٬٠٠٠ ر\.س قبل موعد استحقاقها في ٣٠ أكتوبر/),
  ).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(approval()).toBe(card);

  await user.click(screen.getByRole("treeitem", { name: "ملحق شروط الدفع" }));
  expect(approval()).toBe(card);
  expect(card).toHaveTextContent(decided);
  for (const [id, word] of [
    ["c1", "قبول"],
    ["c2", "قبول"],
    ["c3", "رفض"],
  ] as const)
    expect(
      within(change(id)).getByRole("button", { name: new RegExp(`^${word}`) }),
    ).toHaveAttribute("aria-pressed", "true");
});

it("records the approval once, keeps the card as its receipt and takes the edits away from change", async () => {
  const user = setup();
  await decideAll(user);
  await user.click(
    within(approval()).getByRole("button", { name: "أرسل العقد" }),
  );
  expect(approval()).toHaveAttribute("data-state", "submitting");
  // Nothing is recorded before the host's moment.
  await pass(300);
  expect(approval()).toHaveAttribute("data-state", "submitting");
  expect(review()).toBeInTheDocument();
  await pass(500);

  // The card closes on its receipt, and the clause takes the decided text,
  // with no way back.
  expect(approval()).toHaveAttribute("data-state", "approved");
  expect(approval()).toHaveTextContent("تمت الموافقة");
  expect(screen.queryByRole("dialog")).toBeNull();
  const clause = screen.getByRole("region", { name: "بند شروط الدفع" });
  expect(clause).toHaveTextContent(decided);
  expect(clause.parentElement).toHaveTextContent("طُبّق تعديلان من ٣");
  expect(screen.queryByRole("button", { name: "تراجع" })).toBeNull();

  // The receipt survives a visit to another file...
  const card = approval();
  await user.click(screen.getByRole("treeitem", { name: "اتفاقية التوريد" }));
  await user.click(screen.getByRole("treeitem", { name: "ملحق شروط الدفع" }));
  expect(approval()).toBe(card);
  expect(card).toHaveAttribute("data-state", "approved");
  expect(card).toHaveTextContent("إرسال العقد المعدّل إلى النخبة للتغليف");

  // ...and a change of language: the same send, still a receipt, never a new
  // request that could be approved again.
  await user.click(screen.getByRole("button", { name: "English" }));
  const english = screen.getByRole("group", {
    name: "Send the revised contract to Al Nukhba Packaging",
  });
  expect(english).toHaveAttribute("data-state", "approved");
  expect(english).toHaveTextContent("Approved");
  expect(
    within(english).queryByRole("button", { name: "Send the contract" }),
  ).toBeNull();
  expect(
    screen.getByRole("region", { name: "Payment terms clause" }),
  ).toHaveTextContent(
    "The Company pays SAR 125,000 before Oct 30, with no discount.",
  );
});

it("records nothing when a decision changes while the approval is being recorded", async () => {
  const user = setup();
  await decideAll(user);
  await decide(user, "c3", "قبول");
  await user.click(
    within(approval()).getByRole("button", { name: "أرسل العقد" }),
  );
  expect(approval()).toHaveAttribute("data-state", "submitting");

  // The clause moves on during the host's moment: the card remounts with the
  // new clause, the old decision is aborted, and the late answer records
  // nothing.
  await decide(user, "c3", "رفض");
  expect(approval()).not.toHaveAttribute("data-state", "submitting");
  await pass(1500);
  expect(approval()).toHaveAttribute("data-state", "idle");
  expect(approval()).toHaveTextContent(decided);
  expect(review()).toBeInTheDocument();
  expect(
    within(approval()).getByRole("button", { name: "أرسل العقد" }),
  ).toBeEnabled();
});

it("drops a send that waits on the host when the person goes back to review", async () => {
  const user = setup();
  await decideAll(user);
  await user.click(within(review()).getByRole("button", { name: "تطبيق" }));
  await user.click(
    within(approval()).getByRole("button", { name: "أرسل العقد" }),
  );
  expect(approval()).toHaveAttribute("data-state", "submitting");
  await user.click(screen.getByRole("button", { name: "تراجع" }));
  await pass(1500);
  // Back in review, with the question open again and nothing recorded.
  expect(review()).toBeInTheDocument();
  expect(approval()).toHaveAttribute("data-state", "idle");
  expect(screen.queryByRole("button", { name: "تراجع" })).toBeNull();
});

it("lets a rejected send stand only for the decisions it was made on", async () => {
  const user = setup();
  await decideAll(user);
  await user.click(within(approval()).getByRole("button", { name: "لا ترسل" }));
  await pass(1000);
  expect(approval()).toHaveAttribute("data-state", "rejected");
  expect(approval()).toHaveTextContent("رُفض الطلب");
  // Nothing was applied, and the review stays open.
  expect(review()).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "بند شروط الدفع" }),
  ).toHaveTextContent("خلال ستين يومًا من تاريخ إصدارها");
  // Changing a decision asks again, on the new clause.
  await decide(user, "c3", "قبول");
  expect(approval()).toHaveAttribute("data-state", "idle");
  expect(
    within(approval()).getByRole("button", { name: "أرسل العقد" }),
  ).toBeEnabled();
});

it("settles the clause on Apply and Dismiss, and gives the edits back on Undo", async () => {
  const user = setup();
  await decide(user, "c1", "قبول");
  // Apply decides what is undecided as rejected.
  await user.click(within(review()).getByRole("button", { name: "تطبيق" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  const clause = screen.getByRole("region", { name: "بند شروط الدفع" });
  expect(clause).toHaveTextContent(
    "تسدّد الشركة ١٢٥٬٠٠٠ ر.س خلال ستين يومًا من تاريخ إصدارها، دون أي خصم.",
  );
  expect(clause).toHaveFocus();
  expect(clause.parentElement).toHaveTextContent("طُبّق تعديل واحد من ٣");
  expect(approval()).toHaveTextContent("الخصمبلا خصم");

  // Undo goes back to reviewing, with the decisions kept.
  await user.click(screen.getByRole("button", { name: "تراجع" }));
  expect(review()).toBeInTheDocument();
  expect(clause).toHaveTextContent("خلال ستين يومًا من تاريخ إصدارها");
  expect(
    within(change("c2")).getByRole("button", { name: /^رفض/ }),
  ).toHaveAttribute("aria-pressed", "true");

  // Dismiss rejects every change.
  await user.click(within(review()).getByRole("button", { name: "تجاهل" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(clause.parentElement).toHaveTextContent("لم يُطبَّق أي تعديل");
  expect(approval()).toHaveTextContent(
    "تسدّد الشركة قيمة الفاتورة خلال ستين يومًا من تاريخ إصدارها، دون أي خصم.",
  );
});

it.each([700, 390])(
  "moves files into a Sheet at %i px and keeps the review and send in order",
  async (width) => {
    const wide = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      report: ResizeObserverCallback;
      constructor(report: ResizeObserverCallback) {
        this.report = report;
      }
      observe() {
        this.report(
          [{ contentRect: { width, height: 0 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    };
    try {
      const user = setup();
      expect(review()).toHaveAttribute(
        "data-placement",
        width < 640 ? "inline" : "floating",
      );
      if (width < 640) {
        const document = screen
          .getByRole("heading", { level: 2, name: "ملحق شروط الدفع" })
          .closest(".contract-review-document")!;
        expect(document).toContainElement(review());
        expect(document.querySelector(".tz-card-content")).not.toHaveAttribute(
          "style",
        );
      }
      // One variant renders: no panel, and the files wait behind their button.
      expect(screen.queryByRole("tree")).toBeNull();
      const trigger = screen.getByRole("button", { name: "الملفات" });
      await user.click(trigger);
      const sheet = screen.getByRole("dialog", { name: "الملفات" });
      expect(sheet).toHaveAttribute("data-edge", "end");
      // Escape closes it, returns focus to its button, and changes nothing.
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog", { name: "الملفات" })).toBeNull();
      expect(trigger).toHaveFocus();
      expect(
        screen.getByRole("heading", { level: 2, name: "ملحق شروط الدفع" }),
      ).toBeInTheDocument();

      // Choosing a file opens it and closes the Sheet. The send follows the page.
      await user.click(trigger);
      await user.click(screen.getByRole("treeitem", { name: "المراسلات" }));
      expect(screen.queryByRole("dialog", { name: "الملفات" })).toBeNull();
      const page = screen.getByRole("heading", { level: 2, name: "المراسلات" });
      const send = screen.getByRole("heading", {
        level: 2,
        name: "إرسال العقد",
      });
      expect(
        page.compareDocumentPosition(send) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    } finally {
      globalThis.ResizeObserver = wide;
    }
  },
);
