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
  const initial = [t("تصميم", "Design"), t("عاجل", "Urgent")];
  const [tags, setTags] = useState(initial);
  return (
    <TagInput
      label={label ?? t("وسوم الملاحظة", "Note tags")}
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
