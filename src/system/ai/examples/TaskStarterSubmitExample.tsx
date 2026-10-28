import { useState } from "react";
import { TaskStarter } from "../../index";
import type { ContextItem } from "../../index";
/** onSubmit(value): the application owns `context`, so the handler needs only the draft. */
export function TaskStarterSubmitExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [value, setValue] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [context, setContext] = useState<ContextItem[]>([
    {
      id: "inv-1043",
      label: "INV-1043",
      kind: t("فاتورة", "Invoice"),
    },
  ]);
  return (
    <>
      <TaskStarter
        value={value}
        onValueChange={setValue}
        context={context}
        onRemoveContext={(id) =>
          setContext((items) => items.filter((item) => item.id !== id))
        }
        onSubmit={(draft) => {
          setSent(draft);
          setValue("");
        }}
      />
      {sent && (
        <p role="status">
          {t("أُرسل الطلب: ", "Request sent: ")}
          {sent}
        </p>
      )}
    </>
  );
}
