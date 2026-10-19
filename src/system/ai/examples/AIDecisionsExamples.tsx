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
} from "../../index";
import type {
  ApprovalDecision,
  ApprovalRequest,
  QuestionAnswers,
} from "../../index";
type Language = "ar" | "en";
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
      ? "بأي الفواتير أبدأ المطابقة؟"
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
export function AskUserQuestionsExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  const ar = language === "ar",
    [value, setValue] = useState<QuestionAnswers>({}),
    respond = useHostLatency();
  return (
    <AskUserQuestions
      questions={[
        scopeQuestion(
          ar,
          longContent
            ? ar
              ? "سأطابق كل فاتورة مع أمر الشراء وإيصال الاستلام، ثم أعرض الفروقات قبل أن أعدّل دفتر الحسابات."
              : "I’ll match each invoice against its purchase order and goods receipt, then show any differences before changing the ledger."
            : undefined,
        ),
        {
          id: "notes",
          type: "text",
          label: ar
            ? "ملاحظات إضافية (اختياري)"
            : "Additional notes (optional)",
          required: false,
        },
      ]}
      value={value}
      onValueChange={setValue}
      onSubmit={(_answers, { signal }) => respond(signal)}
    />
  );
}
export function ApprovalCardExample({
  language = "ar",
  longContent = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  longContent?: boolean;
  /**
   * "waiting", "approved" or "rejected", held as given. A decision reports
   * its phase once the host has accepted it.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    respond = useHostLatency();
  const request = markPaidRequest(
    ar,
    longContent
      ? ar
        ? "فواتير الموردين · أكتوبر ٢٠٢٦ / Supplier invoices — شركة مدار للتجارة والمقاولات، فرع الرياض"
        : "Supplier invoices · October 2026 / فواتير الموردين — Madar Trading & Contracting Co., Riyadh branch"
      : undefined,
  );
  return (
    <ApprovalCard
      request={request}
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
  longContent = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  longContent?: boolean;
  /**
   * "first", "second" or "done": opens with the requests before it approved,
   * and reports the next phase once the host has accepted a decision.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    respond = useHostLatency();
  const requests = [
    markPaidRequest(ar),
    sendSummaryRequest(
      ar,
      longContent
        ? "finance@madar.sa, cfo.office@madar.sa / فريق المالية — المكتب الرئيسي"
        : undefined,
    ),
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
      label={ar ? "قرارات مطابقة أكتوبر" : "October reconciliation decisions"}
      requests={requests}
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
