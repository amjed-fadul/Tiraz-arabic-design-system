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
      onReset={() => {
        setError("");
        setFeedback("");
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (!String(data.get("notes") ?? "").trim()) {
          setError(
            t(
              "أدخل ملاحظة لإكمال التحقق من النموذج.",
              "Enter a note to complete the form check.",
            ),
          );
          setFeedback("");
          notes.current?.focus();
          return;
        }
        setError("");
        setFeedback(t("تم التحقق من النموذج بنجاح.", "Form check passed."));
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
        helper={t("أضف ملاحظة قصيرة.", "Add a short note.")}
        error={error}
        required
        name="notes"
        rows={3}
      />
      <div className="tz-preferences-actions">
        <Button type="submit">{t("تحقق من النموذج", "Check form")}</Button>
        <Button type="reset" variant="secondary">
          {t("إعادة الضبط", "Reset")}
        </Button>
      </div>
      <p role="status">{feedback}</p>
    </form>
  );
}
