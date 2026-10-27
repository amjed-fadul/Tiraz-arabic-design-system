import { useState } from "react";
import {
  TaskRowsEmpty,
  TaskRowsRoot,
  TaskRowsRow,
  type TaskState,
} from "../../index";
/** Controlled composition; rows are numbered by their place among the root's children. */
export function CompoundTaskRowsExample({
  language = "ar",
  empty = false,
}: {
  language?: "ar" | "en";
  empty?: boolean;
}) {
  const [expandedIds, setExpandedIds] = useState<string[]>(["quote"]);
  const arabic = language === "ar";
  const tasks: Array<{
    id: string;
    title: string;
    summary?: string;
    state: TaskState;
    detail: string;
  }> = [
    {
      id: "quote",
      title: arabic ? "متابعة عرض السعر" : "Follow up the quote",
      summary: arabic ? "٣ مسودات" : "3 drafts",
      state: "completed",
      detail: arabic ? "المسودات جاهزة للمراجعة." : "The drafts are ready.",
    },
    {
      id: "delivery",
      title: arabic ? "تأكيد موعد التسليم" : "Confirm the delivery date",
      state: "needs-you",
      detail: arabic ? "ينتظر موافقتك." : "Waiting for your approval.",
    },
    {
      id: "payment",
      title: arabic
        ? "تذكير بالدفعة الثانية"
        : "Remind about the second payment",
      state: "pending",
      detail: arabic ? "لم تبدأ بعد." : "Not started yet.",
    },
  ];
  return (
    <TaskRowsRoot
      label={arabic ? "مهام الوكيل" : "Agent tasks"}
      expandedIds={expandedIds}
      onExpandedChange={setExpandedIds}
    >
      {empty ? (
        <TaskRowsEmpty />
      ) : (
        tasks.map(({ detail, ...task }) => (
          <TaskRowsRow key={task.id} {...task}>
            <p>{detail}</p>
          </TaskRowsRow>
        ))
      )}
    </TaskRowsRoot>
  );
}
