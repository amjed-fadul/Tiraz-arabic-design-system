import { useState } from "react";
import { Avatar, Badge, Button, EmptyState, TaskRows } from "../../index";
import type { TaskRowItem } from "../../index";

export interface TaskRowsExampleProps {
  language?: "ar" | "en";
  interactive?: boolean;
  empty?: boolean;
  longContent?: boolean;
}
export function TaskRowsExample({
  language = "ar",
  interactive = true,
  empty = false,
  longContent = false,
}: TaskRowsExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [completed, setCompleted] = useState(["publish"]);
  const [details, setDetails] = useState(false);
  const items: TaskRowItem[] = empty
    ? []
    : [
        {
          id: "review",
          label: longContent
            ? t(
                "مراجعة جميع تسميات المكوّنات والأمثلة العربية مع فريق التصميم قبل تسليم الحزمة",
                "Review all component names and Arabic examples with the design team before handing over the package",
              )
            : t("مراجعة التسميات", "Review labels"),
          completed: completed.includes("review"),
          description: (
            <>
              {t("المرجع المحلي: ", "Local reference: ")}
              <bdi dir="ltr">DOC-42/2026</bdi>
              {longContent && (
                <>
                  {" "}
                  —{" "}
                  <bdi dir="ltr">
                    TIRAZ-IDENTIFIER-WITHOUT-BREAKS-012345678901234567890123456789
                  </bdi>
                </>
              )}
            </>
          ),
          assignee: (
            <Avatar
              name={t("سارة علي", "Sara Ali")}
              fallback={t("س ع", "SA")}
            />
          ),
          meta: <Badge>{t("للمراجعة", "For review")}</Badge>,
          actions: (
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={details}
              onClick={() => setDetails((value) => !value)}
            >
              {t("تفاصيل المهمة", "Task details")}
            </Button>
          ),
        },
        {
          id: "approve",
          label: t("اعتماد المحتوى — مقفلة", "Approve copy — locked"),
          description: t(
            "بانتظار قرار الفريق في هذا المثال.",
            "Waiting for a team decision in this example.",
          ),
          completed: completed.includes("approve"),
          disabled: true,
        },
        {
          id: "publish",
          label: t("تجهيز المعاينة المحلية", "Prepare local preview"),
          completed: completed.includes("publish"),
        },
      ];
  const count = items.filter((item) => item.completed).length;
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
          "مهام نموذجية في الذاكرة فقط؛ لا تُحفظ التغييرات وتبقى المهام بترتيبها الأصلي.",
          "Sample tasks in memory only; changes are not saved and tasks keep their original order.",
        )}
      </p>
      <p role="status" style={{ margin: 0 }}>
        {t(
          `${count} من ${items.length} مكتملة`,
          `${count} of ${items.length} completed`,
        )}
      </p>
      <TaskRows
        label={t("مهام المشروع", "Project tasks")}
        items={items}
        labels={{
          completed: t("مكتملة", "Completed"),
          incomplete: t("غير مكتملة", "Incomplete"),
        }}
        onCompletedChange={
          interactive
            ? (id, checked) =>
                setCompleted((ids) =>
                  checked
                    ? [...ids.filter((value) => value !== id), id]
                    : ids.filter((value) => value !== id),
                )
            : undefined
        }
        emptyState={
          <EmptyState
            title={t("لا توجد مهام", "No tasks")}
            description={t(
              "لم تُضف مهام لهذا المثال.",
              "No tasks were supplied to this example.",
            )}
          />
        }
      />
      {details && !empty && (
        <div>
          <strong>{t("ملاحظات المراجعة المحلية", "Local review notes")}</strong>
          <p>
            {t(
              "تحقّق من وضوح التسميات العربية قبل اعتماد النسخة. هذا العرض لا يغيّر اكتمال المهمة.",
              "Check Arabic labels for clarity before approving the copy. Opening these notes does not complete the task.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
