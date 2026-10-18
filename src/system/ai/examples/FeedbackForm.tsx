import { useRef, useState } from "react";
import { Button, Checkbox, RadioGroup, Textarea } from "../../index";

/** Application-owned validation; uncontrolled controls keep native form/reset behavior. */
export function FeedbackForm({ language = "ar" }: { language?: "ar" | "en" }) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const notes = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState(""),
    [feedback, setFeedback] = useState("");
  return (
    <form
      className="tz-preferences-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (!String(data.get("notes") ?? "").trim()) {
          setError(
            t("اكتب ملاحظتك قبل الإرسال.", "Write your note before sending."),
          );
          setFeedback("");
          notes.current?.focus();
          return;
        }
        setError("");
        event.currentTarget.reset();
        setFeedback(
          t("شكرًا لك، وصلتنا ملاحظتك.", "Thanks — we received your note."),
        );
      }}
    >
      <Checkbox
        label={t("تلقي التحديثات", "Receive updates")}
        helper={t("اختياري", "Optional")}
        name="updates"
        value="yes"
      />
      <RadioGroup
        label={t("وتيرة التحديثات", "Update frequency")}
        name="frequency"
        defaultValue="weekly"
        options={[
          { value: "weekly", label: t("أسبوعيًا", "Weekly") },
          { value: "monthly", label: t("شهريًا", "Monthly") },
          {
            value: "daily",
            label: t("يوميًا · غير متاح", "Daily · unavailable"),
            disabled: true,
          },
        ]}
      />
      <Textarea
        ref={notes}
        label={t("ملاحظات", "Notes")}
        helper={t(
          "أخبرنا بما يمكننا تحسينه.",
          "Tell us what we could improve.",
        )}
        error={error}
        required
        name="notes"
        rows={3}
      />
      <div className="tz-preferences-actions">
        <Button type="submit">{t("إرسال الملاحظات", "Send feedback")}</Button>
      </div>
      <p role="status">{feedback}</p>
    </form>
  );
}
