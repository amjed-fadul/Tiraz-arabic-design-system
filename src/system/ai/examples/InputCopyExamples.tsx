import { Field, InputCopy } from "../../index";
import type { InputCopyProps } from "../../index";
type Language = "ar" | "en";
export function InputCopyExample({
  language = "ar",
  label,
  helper,
  error,
  value = "src/system/TagInput.tsx",
  disabled = false,
}: {
  language?: Language;
  label?: string;
  helper?: string;
  error?: string;
  value?: string;
  disabled?: boolean;
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  return (
    <InputCopy
      label={label ?? t("مسار المصدر", "Source path")}
      helper={
        helper ??
        t(
          "حدّد النص أو انسخ القيمة كاملة.",
          "Select the text or copy the full value.",
        )
      }
      error={error}
      value={value}
      disabled={disabled}
    />
  );
}
export function EntryCompositionExample({
  language = "ar",
}: {
  language?: Language;
}) {
  const ar = language === "ar";
  const value: InputCopyProps["value"] = "src/system/InputCopy.tsx";
  return (
    <Field
      label={ar ? "مصدر النسخ" : "Copy source"}
      helper={
        ar
          ? "تركيب باستخدام Field مستقل."
          : "Composition with a separate Field."
      }
    >
      {(field) => (
        <InputCopy
          field={field}
          value={value}
          labels={{ copy: ar ? "نسخ مسار المصدر" : "Copy source path" }}
        />
      )}
    </Field>
  );
}
