import { useEffect, useState } from "react";
import { EmptyState, TaskRows, useSystem } from "../../index";
import type { TaskRowItem, TaskState } from "../../index";

export interface TaskRowsExampleProps {
  language?: "ar" | "en";
  appearance?: "capsules" | "list";
  mode?: "controlled" | "uncontrolled";
  empty?: boolean;
  longContent?: boolean;
}
/** Config or OS preference; the scripted run starts on its final state. */
function useReducedMotion() {
  const { config } = useSystem();
  return (
    config.reducedMotion ||
    (typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}
// The drafting task times out once, retries and completes; the handoff waits for approval.
const draftRun: Array<[delay: number, state: TaskState]> = [
  [1400, "failed"],
  [1000, "running"],
  [1400, "completed"],
];
export function TaskRowsExample({
  language = "ar",
  appearance = "capsules",
  mode = "uncontrolled",
  empty = false,
  longContent = false,
}: TaskRowsExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const reduced = useReducedMotion(),
    run = reduced ? "final" : empty ? "idle" : "live";
  const [state, setState] = useState<TaskState>(
    reduced ? "completed" : "running",
  );
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  // A new run (motion preference or empty toggled) restarts from its first state.
  const [runFor, setRunFor] = useState(run);
  if (runFor !== run) {
    setRunFor(run);
    setState(reduced ? "completed" : "running");
  }
  useEffect(() => {
    if (run !== "live") return;
    let step = 0,
      timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const [delay, value] = draftRun[step++];
      timer = setTimeout(() => {
        setState(value);
        if (step < draftRun.length) next();
      }, delay);
    };
    next();
    return () => clearTimeout(timer);
  }, [run]);
  const labels = {
    pending: t("قيد الانتظار", "Pending"),
    running: t("جارٍ التنفيذ", "Running"),
    completed: t("مكتملة", "Completed"),
    failed: t("فشلت", "Failed"),
  };
  const drafts = [
    t("شركة الندى — متابعة عرض السعر", "Al Nada Trading — quote follow-up"),
    t("مؤسسة رواسي — تأكيد موعد التسليم", "Rawasi Est. — delivery date"),
    t("مجموعة سَنا — تذكير بالدفعة الثانية", "Sana Group — second payment"),
  ];
  const items: TaskRowItem[] = empty
    ? []
    : [
        {
          id: "records",
          title: t("مطابقة فواتير أكتوبر", "Reconcile October invoices"),
          summary: t("١٢ فاتورة", "12 invoices"),
          state: "completed",
          content: (
            <dl
              className="tz-agent-task-data"
              aria-label={t("نتائج المطابقة", "Reconciliation results")}
            >
              <div>
                <dt>
                  {t(
                    "مطابقة جهات الاتصال والمعرّفات الضريبية",
                    "Matched contacts and tax IDs",
                  )}
                </dt>
                <dd>
                  <bdi dir="ltr">{t("١٢/١٢", "12/12")}</bdi>
                </dd>
              </div>
              <div>
                <dt>
                  {t("السجلات القديمة المعلّمة", "Flagged stale records")}
                </dt>
                <dd>
                  <bdi dir="ltr">{t("٠", "0")}</bdi>
                </dd>
              </div>
            </dl>
          ),
        },
        {
          id: "outline",
          title: longContent
            ? t(
                "صياغة رسائل المتابعة لعملاء الربع الرابع مع مراجعة الأسماء العربية والمبالغ وتواريخ التسليم قبل الإرسال",
                "Draft follow-up emails for fourth-quarter customers and check Arabic names, amounts and delivery dates before sending",
              )
            : t("صياغة رسائل العملاء", "Draft customer emails"),
          summary: t("٣ رسائل", "3 emails"),
          state,
          content: (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <p style={{ margin: 0 }}>
                {t("من صفقات هذا الأسبوع في ", "From this week's deals in ")}
                <bdi dir="ltr">crm.list_deals</bdi>
                {longContent && (
                  <>
                    <br />
                    <bdi dir="ltr">
                      DEALS-2026-Q4-FOLLOW-UP-BATCH-7F3A9C1E5B2D8A6F4C0E9B7D3A1F5C8E
                    </bdi>
                  </>
                )}
              </p>
              {state === "completed" ? (
                <ul style={{ margin: 0, paddingInlineStart: "var(--space-5)" }}>
                  {drafts.map((draft) => (
                    <li key={draft}>{draft}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                  {state === "failed"
                    ? t(
                        "انتهت مهلة الاتصال بـ CRM بعد ٣٠ ثانية. إعادة المحاولة…",
                        "The CRM timed out after 30 seconds. Retrying…",
                      )
                    : t(
                        "جارٍ صياغة الرسائل من آخر ملاحظات الاجتماعات.",
                        "Writing drafts from the latest meeting notes.",
                      )}
                </p>
              )}
            </div>
          ),
        },
        {
          id: "handoff",
          title: t("إرسال الملخص إلى الفريق المالي", "Send summary to finance"),
          summary: t("بانتظار موافقتك", "Awaiting your approval"),
          state: "pending",
          content: (
            <p style={{ margin: 0 }}>
              {t(
                "يُرسل الملخص إلى الفريق المالي بعد مراجعتك للمسودات.",
                "The summary goes to the finance team once you review the drafts.",
              )}
            </p>
          ),
        },
      ];
  return (
    <div style={{ display: "grid", inlineSize: "100%", minInlineSize: 0 }}>
      <TaskRows
        label={t("مهام الوكيل", "Agent tasks")}
        items={items}
        appearance={appearance}
        stateLabels={labels}
        {...(mode === "controlled"
          ? { expandedIds, onExpandedChange: setExpandedIds }
          : {})}
        emptyState={
          <EmptyState
            title={t("لا توجد مهام وكيل", "No agent tasks")}
            description={t(
              "ستظهر المهام هنا عندما يبدأ الوكيل العمل.",
              "Tasks appear here once the agent starts working.",
            )}
          />
        }
      />
    </div>
  );
}
export function TaskRowsStatesExample({
  language = "ar",
  appearance = "list",
}: Pick<TaskRowsExampleProps, "language" | "appearance">) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const tasks: Record<
    TaskState,
    { title: string; summary: string; detail: string }
  > = {
    pending: {
      title: t("إرسال الملخص إلى الفريق المالي", "Send summary to finance"),
      summary: t("بانتظار الموافقة", "Awaiting approval"),
      detail: t(
        "يبدأ بعد موافقتك على مسودات الرسائل.",
        "Starts once you approve the email drafts.",
      ),
    },
    running: {
      title: t("قراءة عقود الموردين", "Read supplier contracts"),
      summary: t("٧ من ١٢ ملفًا", "7 of 12 files"),
      detail: t(
        "جارٍ قراءة contracts/2026/al-nada-supply.pdf",
        "Reading contracts/2026/al-nada-supply.pdf",
      ),
    },
    completed: {
      title: t("مطابقة فواتير أكتوبر", "Reconcile October invoices"),
      summary: t("١٢ فاتورة", "12 invoices"),
      detail: t(
        "تطابقت جميع الفواتير مع كشف الحساب البنكي.",
        "Every invoice matched the bank statement.",
      ),
    },
    failed: {
      title: t("مزامنة جهات الاتصال", "Sync contacts"),
      summary: t("خطأ ٤٠٣", "Error 403"),
      detail: t(
        "رفض CRM الطلب: صلاحية contacts.write غير ممنوحة.",
        "The CRM rejected the request: contacts.write is not granted.",
      ),
    },
  };
  const states: TaskState[] = ["pending", "running", "completed", "failed"];
  return (
    <TaskRows
      label={t("حالات مهام الوكيل", "Agent task states")}
      appearance={appearance}
      stateLabels={{
        pending: t("قيد الانتظار", "Pending"),
        running: t("جارٍ التنفيذ", "Running"),
        completed: t("مكتملة", "Completed"),
        failed: t("فشلت", "Failed"),
      }}
      items={states.map((state) => ({
        id: state,
        title: tasks[state].title,
        summary: tasks[state].summary,
        state,
        content: <p style={{ margin: 0 }}>{tasks[state].detail}</p>,
      }))}
    />
  );
}
