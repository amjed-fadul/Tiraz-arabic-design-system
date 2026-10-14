import { useState } from "react";
import { Button, TagInput } from "../../index";
type Language = "ar" | "en";
export interface TagInputExampleProps {
  language?: Language;
  label?: string;
  helper?: string;
  error?: string;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  readOnly?: boolean;
  mode?: "controlled" | "uncontrolled";
}
export function TagInputExample({
  language = "ar",
  label,
  helper,
  error,
  placeholder,
  maxTags = 5,
  disabled = false,
  readOnly = false,
  mode = "controlled",
}: TagInputExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const initial = [t("تصميم", "Design"), t("قراءة", "Reading")];
  const [tags, setTags] = useState(initial),
    [submitted, setSubmitted] = useState<string[] | null>(null);
  return (
    <form
      style={{ display: "grid", gap: 12, inlineSize: "100%", minInlineSize: 0 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(
          new FormData(event.currentTarget).getAll("tags").map(String),
        );
      }}
      onReset={() => {
        if (mode === "controlled") setTags(initial);
        setSubmitted(null);
      }}
    >
      <TagInput
        label={label ?? t("وسوم الملاحظات", "Note tags")}
        helper={
          helper ??
          t(
            "Enter يضيف وسمًا. النص غير المؤكد لا يُرسل.",
            "Enter adds a tag. Uncommitted text is not submitted.",
          )
        }
        error={error}
        placeholder={placeholder ?? t("أضف وسمًا…", "Add a tag…")}
        name="tags"
        maxTags={maxTags}
        disabled={disabled}
        readOnly={readOnly}
        value={mode === "controlled" ? tags : undefined}
        defaultValue={initial}
        onValueChange={setTags}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Button type="submit" variant="secondary">
          {t("عرض قيم النموذج", "Read form values")}
        </Button>
        <Button type="reset" variant="ghost">
          {t("إعادة الضبط", "Reset tags")}
        </Button>
      </div>
      {submitted !== null && (
        <output role="status" style={{ overflowWrap: "anywhere" }}>
          {t("قيم محلية فقط: ", "Local form values: ")}
          {JSON.stringify(submitted)}
        </output>
      )}
    </form>
  );
}
