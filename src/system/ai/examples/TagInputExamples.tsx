import { useState } from "react";
import { TagInput } from "../../index";
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
  /** Opens with two sample tags; false opens with none. */
  filled?: boolean;
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
  filled = true,
}: TagInputExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const initial = filled ? [t("تصميم", "Design"), t("عاجل", "Urgent")] : [];
  const [tags, setTags] = useState(initial);
  return (
    <TagInput
      label={label ?? t("وسوم الملاحظات", "Note tags")}
      helper={
        helper ?? t("اضغط Enter لإضافة وسم.", "Press Enter to add a tag.")
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
  );
}
