import { useEffect, useRef, useState } from "react";
import { Button, EmptyState, TaskRows } from "../../index";
import type { TaskRowItem, TaskState } from "../../index";

export interface TaskRowsExampleProps {
  language?: "ar" | "en";
  appearance?: "capsules" | "list";
  mode?: "controlled" | "uncontrolled";
  empty?: boolean;
  longContent?: boolean;
}
export function TaskRowsExample({
  language = "ar",
  appearance = "capsules",
  mode = "uncontrolled",
  empty = false,
  longContent = false,
}: TaskRowsExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [state, setState] = useState<TaskState>("pending");
  const [hasRun, setHasRun] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [note, setNote] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current += 1;
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  function run(retry = false) {
    if (timer.current !== null) clearTimeout(timer.current);
    const current = ++generation.current;
    setHasRun(true);
    setState("running");
    timer.current = setTimeout(() => {
      if (generation.current !== current) return;
      timer.current = null;
      setState(retry ? "completed" : "failed");
    }, 900);
  }
  const labels = {
    pending: t("قيد الانتظار", "Pending"),
    running: t("جارٍ التنفيذ", "Running"),
    completed: t("مكتملة", "Completed"),
    failed: t("فشلت", "Failed"),
  };
  const items: TaskRowItem[] = empty
    ? []
    : [
        {
          id: "notes",
          title: t("ملاحظات نموذجية جاهزة", "Sample notes ready"),
          summary: t("٣ ملاحظات", "3 notes"),
          state: "completed",
          content: (
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              <p style={{ margin: 0 }}>
                {t(
                  "محتوى تجريبي موجود مسبقًا لشرح بنية الصف، دون معالجة ملفات.",
                  "Prewritten sample content explains the row structure; no files were processed.",
                )}
              </p>
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-expanded={note}
                  onClick={() => setNote((value) => !value)}
                >
                  {t("عرض ملاحظة محلية", "Show local note")}
                </Button>
              </div>
              {note && (
                <p>
                  {t(
                    "استخدم عنوانًا واضحًا وملخصًا قصيرًا ومحتوى مفيدًا داخل التفاصيل.",
                    "Use a clear title, a short summary and useful content inside the details.",
                  )}
                </p>
              )}
            </div>
          ),
        },
        {
          id: "outline",
          title: longContent
            ? t(
                "بناء مخطط نموذجي لمراجعة التسميات العربية والمحتوى المختلط مع جميع أعضاء فريق التصميم",
                "Build sample outline for reviewing Arabic labels and mixed content with every member of the design team",
              )
            : t("بناء مخطط نموذجي", "Build sample outline"),
          summary: t("قسمان", "2 sections"),
          state,
          content: (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <p style={{ margin: 0 }}>
                {t("المرجع التوضيحي: ", "Sample reference: ")}
                <bdi dir="ltr">DEMO-42/2026</bdi>
                {longContent && (
                  <>
                    <br />
                    <bdi dir="ltr">
                      TIRAZ-SAMPLE-IDENTIFIER-WITHOUT-BREAKS-012345678901234567890123456789
                    </bdi>
                  </>
                )}
              </p>
              <p style={{ margin: 0 }}>
                {state === "failed"
                  ? t(
                      "توقفت المحاكاة عمدًا عند خطأ توضيحي. أعد المحاولة محليًا لإكمال العرض.",
                      "The simulation intentionally stopped at a sample error. Retry locally to complete the demonstration.",
                    )
                  : state === "completed"
                    ? t(
                        "اكتملت المحاكاة المحلية فقط؛ لم يُنفّذ عمل حقيقي.",
                        "Only the local simulation completed; no real work was performed.",
                      )
                    : t(
                        "تشغيل العرض يغيّر حالة المثال فقط؛ يمكنك فتح التفاصيل أثناء التشغيل.",
                        "Running the demonstration changes only example state; details remain available during the run.",
                      )}
              </p>
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-disabled={state !== "failed" || undefined}
                  onClick={() => {
                    if (state === "failed") run(true);
                  }}
                >
                  {t("إعادة المحاولة محليًا", "Retry local simulation")}
                </Button>
              </div>
            </div>
          ),
        },
        {
          id: "handoff",
          title: t("تسليم المثال", "Hand over sample"),
          summary: t("بانتظار التطبيق", "Application decides"),
          state: "pending",
          content: (
            <p style={{ margin: 0 }}>
              {t(
                "يبقى هذا الصف في الانتظار. التطبيق وحده يحدد الحالة؛ المكتبة لا تتقدم تلقائيًا.",
                "This row stays pending. The application alone supplies state; the library never advances automatically.",
              )}
            </p>
          ),
        },
      ];
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-4)",
        inlineSize: "100%",
        minInlineSize: 0,
      }}
    >
      <p style={{ margin: 0, color: "var(--text-secondary)" }}>
        {t(
          "محاكاة محلية فقط في الذاكرة. لا تُعالج ملفات أو رسائل بريد أو مهام خادم.",
          "Local simulation in memory only. No files, emails or backend tasks are processed.",
        )}
      </p>
      {!empty && (
        <div>
          <Button size="sm" variant="secondary" onClick={() => run()}>
            {hasRun
              ? t("إعادة تشغيل المحاكاة المحلية", "Replay local simulation")
              : t("تشغيل المحاكاة المحلية", "Run local simulation")}
          </Button>
        </div>
      )}
      <TaskRows
        label={t("مهام الوكيل التجريبية", "Sample agent tasks")}
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
              "لم يزوّد التطبيق أي مهام في هذا المثال.",
              "The application supplied no tasks in this example.",
            )}
          />
        }
      />
      <p role="status" style={{ margin: 0, color: "var(--text-secondary)" }}>
        {t(
          `حالة المحاكاة: ${labels[state]}. لم تُعالج ملفات أو رسائل بريد أو مهام خادم.`,
          `Simulation: ${labels[state]}. No files, emails or backend tasks were processed.`,
        )}
      </p>
    </div>
  );
}
export function TaskRowsStatesExample({
  language = "ar",
  appearance = "list",
}: Pick<TaskRowsExampleProps, "language" | "appearance">) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
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
      items={states.map((state, index) => ({
        id: state,
        title: t(`مهمة نموذجية ${index + 1}`, `Sample task ${index + 1}`),
        summary: t("تفاصيل محلية", "Local details"),
        state,
        content: (
          <p style={{ margin: 0 }}>
            {t(
              "حالة يزوّدها التطبيق لتوضيح العرض؛ لا تنفيذ فعلي.",
              "Application-supplied state illustrates the display; no actual execution.",
            )}
          </p>
        ),
      }))}
    />
  );
}
