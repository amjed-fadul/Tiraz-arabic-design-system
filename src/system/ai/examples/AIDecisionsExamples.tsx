import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AskUserQuestions,
  ApprovalCard,
  ApprovalFlow,
  approvalRequestKey,
  numberLocale,
  useSystem,
} from "../../index";
import type {
  ApprovalDecision,
  ApprovalDetails,
  ApprovalRequest,
  Numerals,
  QuestionAnswers,
  UserQuestion,
} from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Appearance = "card" | "plain";
/**
 * Stands in for your server: each answer or decision waits a moment so the
 * pending state shows, then succeeds. Unmounting cancels whatever is waiting.
 */
function useHostLatency(ms = 700) {
  const pending = useRef(new Set<() => void>());
  useEffect(() => {
    const callbacks = pending.current;
    return () => {
      for (const cancel of callbacks) cancel();
      callbacks.clear();
    };
  }, []);
  return useCallback(
    (signal: AbortSignal) =>
      new Promise<void>((resolve, reject) => {
        const cancel = () => {
          clearTimeout(timer);
          signal.removeEventListener("abort", cancel);
          pending.current.delete(cancel);
          reject(new DOMException("Cancelled", "AbortError"));
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", cancel);
          pending.current.delete(cancel);
          resolve();
        }, ms);
        pending.current.add(cancel);
        signal.addEventListener("abort", cancel, { once: true });
        if (signal.aborted) cancel();
      }),
    [ms],
  );
}
function markPaidRequest(ar: boolean, target?: string): ApprovalRequest {
  return {
    id: "mark-paid-oct",
    action: ar ? "تعليم ٣ فواتير كمدفوعة" : "Mark 3 invoices as paid",
    target:
      target ??
      (ar
        ? "فواتير الموردين · أكتوبر ٢٠٢٦"
        : "Supplier invoices · October 2026"),
    details: ar
      ? "INV-1041، INV-1042، INV-1044 · الإجمالي ٤٨٬٣٠٠ ر.س"
      : "INV-1041, INV-1042, INV-1044 · 48,300 SAR total",
    consequences: ar
      ? [
          "تُقفل الفواتير الثلاث في دفتر الحسابات لشهر أكتوبر.",
          "لن يصل أي إشعار إلى شركة مدار.",
        ]
      : [
          "The three invoices are closed in the October ledger.",
          "Madar is not notified.",
        ],
    approveLabel: ar ? "تعليم كمدفوعة" : "Mark as paid",
    rejectLabel: ar ? "إبقاء الحالة" : "Keep status",
  };
}
function sendSummaryRequest(ar: boolean, target?: string): ApprovalRequest {
  return {
    id: "send-summary-oct",
    action: ar
      ? "إرسال ملخص المطابقة إلى المالية"
      : "Send the reconciliation summary to finance",
    target: target ?? "finance@madar.sa",
    details: ar
      ? "ملف PDF · صفحتان · ٣ فواتير تحتاج مراجعة"
      : "PDF · 2 pages · 3 invoices need review",
    consequences: ar
      ? ["يصل الملخص إلى ٤ أعضاء في فريق المالية."]
      : ["The summary reaches 4 members of the finance team."],
    approveLabel: ar ? "إرسال الملخص" : "Send summary",
    rejectLabel: ar ? "لا ترسل" : "Don’t send",
  };
}
function scopeQuestion(ar: boolean, description?: string) {
  return {
    id: "scope",
    label: ar
      ? "أي الفواتير أبدأ مطابقتها؟"
      : "Which invoices should I reconcile first?",
    description,
    choices: [
      {
        value: "suppliers",
        label: ar ? "فواتير الموردين" : "Supplier invoices",
      },
      {
        value: "customers",
        label: ar ? "فواتير العملاء" : "Customer invoices",
      },
    ],
    allowOther: true,
  };
}
/** The two things the finance agent asks before the October close. */
function closeQuestions(ar: boolean, longContent: boolean): UserQuestion[] {
  return [
    scopeQuestion(
      ar,
      longContent
        ? ar
          ? "سأطابق كل فاتورة مع أمر الشراء وإيصال الاستلام، ثم أعرض الفروقات قبل أن أعدّل دفتر الحسابات."
          : "I’ll match each invoice against its purchase order and goods receipt, then show any differences before changing the ledger."
        : undefined,
    ),
    {
      id: "jeddah",
      label: ar
        ? "هل أستثني فرع جدة؟"
        : "Should I leave out the Jeddah branch?",
      choices: [
        { value: "exclude", label: ar ? "نعم، استثنِه" : "Yes, leave it out" },
        { value: "include", label: ar ? "لا، أدرجه" : "No, include it" },
      ],
    },
  ];
}
/** The reminders to the three customers with overdue invoices. */
function remindersRequest(
  language: Language,
  numerals: Numerals | undefined,
  longContent = false,
): ApprovalRequest {
  const ar = language === "ar",
    percent = new Intl.NumberFormat(numberLocale({ numerals }, language), {
      style: "percent",
    }).format(story.overdue.largest.share / 100),
    total = money(story.overdue.largest.amount, language, numerals);
  return {
    id: "payment-reminders-oct",
    action: ar
      ? "إرسال تذكيرات الدفع إلى العملاء الثلاثة"
      : "Send payment reminders to the three customers",
    target: longContent
      ? ar
        ? "العملاء المتأخرون في السداد / Customers with overdue invoices — شركة مدار، مؤسسة الندى، الرواد للتجارة"
        : "Customers with overdue invoices / العملاء المتأخرون في السداد — Madar Company, Al Nada Establishment, Al Rowad Trading"
      : ar
        ? "العملاء المتأخرون في السداد"
        : "Customers with overdue invoices",
    details: ar
      ? `الإجمالي ${total}، أي ${percent} من المتأخرات`
      : `${total} in total, ${percent} of the overdue amount`,
    consequences: [
      ar
        ? "يصل كل عميل تذكير واحد بفواتيره المتأخرة."
        : "Each customer receives one reminder listing their overdue invoices.",
    ],
    approveLabel: ar ? "أرسل الرسائل" : "Send the reminders",
    rejectLabel: ar ? "رفض" : "Reject",
  };
}
function remindersDetails(
  language: Language,
  numerals: Numerals | undefined,
): ApprovalDetails {
  const ar = language === "ar",
    hours = new Intl.NumberFormat(numberLocale({ numerals }, language)).format(
      23,
    );
  return {
    impact: story.customers.map((customer) => ({
      id: customer.id,
      label: customer.name[language],
      note: (
        <bdi dir="ltr">
          {customer.invoices.map((invoice) => invoice.id).join(" · ")}
        </bdi>
      ),
      value: money(customer.amount, language, numerals),
    })),
    irreversible: ar
      ? "تُرسل من بريد التحصيل، ولا يمكن استرجاعها بعد الإرسال."
      : "Sent from the collections mailbox. They can't be recalled once sent.",
    expiryLabel: ar
      ? `ينتهي الطلب خلال ${hours} ساعة`
      : `This request expires in ${hours} hours`,
    secondaryAction: {
      label: ar ? "عرض الرسائل" : "View the messages",
      // Open the three drafts in your own view.
      onSelect: () => {},
    },
  };
}
/** The four accrual entries, which an offsetting entry can reverse. */
function accrualsRequest(
  language: Language,
  numerals: Numerals | undefined,
  longContent = false,
): ApprovalRequest {
  const ar = language === "ar",
    total = money(story.closeSteps[2].amount, language, numerals);
  return {
    id: "accruals-oct",
    action: ar
      ? "ترحيل قيود الاستحقاق الأربعة"
      : "Post the four accrual entries",
    target: longContent
      ? ar
        ? "دفتر الحسابات · أكتوبر / General ledger — قيود الاستحقاق والمصروفات المستحقة لفريق المالية"
        : "General ledger · October / دفتر الحسابات — accrued expenses for the finance team"
      : story.sources[0].title[language],
    details: ar ? `الإجمالي ${total}` : `${total} in total`,
    consequences: [
      ar
        ? "تُرحَّل القيود إلى دفتر أكتوبر، ويمكن عكسها بقيد مقابل."
        : "The entries post to the October ledger and can be reversed with an offsetting entry.",
    ],
    approveLabel: ar ? "ترحيل القيود" : "Post the entries",
    rejectLabel: ar ? "رفض" : "Reject",
  };
}
export function AskUserQuestionsExample({
  language = "ar",
  appearance = "card",
  longContent = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: Appearance;
  longContent?: boolean;
  /**
   * "asking", "answered" or "failed". Answered and Failed open with the
   * answers given and send them once: the host takes them, or turns them
   * down and the draft stays.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    respond = useHostLatency();
  const sent = phase === "answered" || phase === "failed" ? phase : undefined;
  const [value, setValue] = useState<QuestionAnswers>(
    sent
      ? { scope: { choice: "suppliers" }, jeddah: { choice: "exclude" } }
      : {},
  );
  // Editing the answers opens the questions again, with the draft kept.
  const [round, setRound] = useState(0);
  const replay = useRef(sent),
    root = useRef<HTMLDivElement>(null),
    editing = useRef(false);
  // Editing remounts the questions, so focus goes to the reopened question
  // rather than dropping to the page.
  useLayoutEffect(() => {
    if (!editing.current) return;
    editing.current = false;
    root.current?.querySelector<HTMLElement>(".tz-question-heading")?.focus();
  }, [round]);
  // Sent from a timer, so only the mount that stays sends them.
  useEffect(() => {
    if (!replay.current) return;
    const timer = setTimeout(() =>
      root.current?.querySelector("form")?.requestSubmit(),
    );
    return () => clearTimeout(timer);
  }, []);
  return (
    <div ref={root} style={{ display: "contents" }}>
      <AskUserQuestions
        appearance={appearance}
        agent={story.agents.finance[language]}
        questions={closeQuestions(ar, longContent)}
        value={value}
        onValueChange={setValue}
        resetKey={round}
        receipt
        onEditAnswers={() => {
          editing.current = true;
          setRound((count) => count + 1);
          onPhaseChange?.("asking");
        }}
        onSubmit={async (_answers, { signal }) => {
          const held = replay.current;
          replay.current = undefined;
          if (!held) await respond(signal);
          if (held === "failed") throw new Error("The answers were refused.");
          onPhaseChange?.("answered");
        }}
      />
    </div>
  );
}
export function ApprovalCardExample({
  language = "ar",
  appearance = "card",
  longContent = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: Appearance;
  longContent?: boolean;
  /**
   * "waiting", "approved", "rejected" or "expired", held as given. A decision
   * reports its phase once the host has accepted it.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const { config } = useSystem(),
    respond = useHostLatency();
  const request = remindersRequest(language, config.numerals, longContent);
  return (
    <ApprovalCard
      request={request}
      {...remindersDetails(language, config.numerals)}
      appearance={appearance}
      expired={phase === "expired"}
      receiptTime={language === "ar" ? "الآن" : "just now"}
      value={
        phase === undefined
          ? undefined
          : phase === "approved" || phase === "rejected"
            ? {
                requestId: request.id,
                requestKey: approvalRequestKey(request),
                decision: phase,
              }
            : null
      }
      onDecision={async (_request, decision, { signal }) => {
        await respond(signal);
        onPhaseChange?.(decision);
      }}
    />
  );
}
export function ApprovalFlowExample({
  language = "ar",
  appearance = "card",
  longContent = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: Appearance;
  longContent?: boolean;
  /**
   * "first", "second" or "done": opens with the requests before it approved,
   * and reports the next phase once the host has accepted a decision.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem(),
    respond = useHostLatency();
  const requests = [
    remindersRequest(language, config.numerals),
    accrualsRequest(language, config.numerals, longContent),
  ];
  // With a phase, the decisions so far, kept as the visitor makes them.
  const [decisions, setDecisions] = useState<ApprovalDecision[]>(
    phase === "done"
      ? ["approved", "approved"]
      : phase === "second"
        ? ["approved"]
        : [],
  );
  return (
    <ApprovalFlow
      label={ar ? "قرارات إقفال أكتوبر" : "October close decisions"}
      appearance={appearance}
      requests={requests}
      approval={(request) =>
        request.id === requests[0].id
          ? remindersDetails(language, config.numerals)
          : { reversible: true }
      }
      value={
        phase === undefined
          ? undefined
          : decisions.map((decision, index) => ({
              requestId: requests[index].id,
              requestKey: approvalRequestKey(requests[index]),
              decision,
            }))
      }
      onValueChange={
        phase === undefined
          ? undefined
          : (records) => {
              setDecisions(records.map((record) => record.decision));
              onPhaseChange?.(["first", "second", "done"][records.length]);
            }
      }
      onDecision={(_request, _decision, { signal }) => respond(signal)}
    />
  );
}
/** Connected question → decisions; unmount aborts every pending host callback. */
export function AIDecisionsExample({
  language = "ar",
}: {
  language?: Language;
}) {
  const ar = language === "ar",
    [answers, setAnswers] = useState<QuestionAnswers>({}),
    [scope, setScope] = useState<string | null>(null);
  const accept = useHostLatency(600);
  const root = useRef<HTMLDivElement>(null),
    hadFocus = useRef(false);
  useLayoutEffect(() => {
    if (
      scope !== null &&
      hadFocus.current &&
      root.current?.ownerDocument.activeElement ===
        root.current?.ownerDocument.body
    )
      root.current?.querySelector<HTMLElement>(".tz-approval-card")?.focus();
  }, [scope]);
  const question = scopeQuestion(ar);
  return (
    <div
      ref={root}
      className="tz-decisions-example"
      onFocusCapture={() => {
        hadFocus.current = true;
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          hadFocus.current = false;
      }}
    >
      {scope === null ? (
        <AskUserQuestions
          questions={[question]}
          value={answers}
          onValueChange={setAnswers}
          onSubmit={async (accepted, { signal }) => {
            await accept(signal);
            if (signal.aborted) return;
            const answer = accepted.scope;
            setScope(
              answer?.choice === "other"
                ? (answer.text ?? "").trim()
                : (question.choices.find((c) => c.value === answer?.choice)
                    ?.label ?? ""),
            );
          }}
        />
      ) : (
        <ApprovalFlow
          label={
            ar ? "قرارات مطابقة أكتوبر" : "October reconciliation decisions"
          }
          requests={[
            markPaidRequest(
              ar,
              `${scope} · ${ar ? "أكتوبر ٢٠٢٦" : "October 2026"}`,
            ),
            sendSummaryRequest(ar),
          ]}
          onDecision={(_request, _decision, { signal }) => accept(signal)}
        />
      )}
    </div>
  );
}
