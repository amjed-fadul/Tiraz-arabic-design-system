import { Field, InputCopy } from "../../index";
import type { InputCopyProps } from "../../index";
type Language = "ar" | "en";
export function InputCopyExample({
  language = "ar",
  label,
  helper,
  error,
  value = "https://madar.sa/invite/7KQ2-RX9",
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
      label={label ?? t("رابط الدعوة", "Invite link")}
      helper={
        helper ??
        t(
          "شارك الرابط مع زملائك للانضمام إلى المساحة.",
          "Share this link so teammates can join the workspace.",
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
  const value: InputCopyProps["value"] = "ws_madar_7KQ2RX9";
  return (
    <Field
      label={ar ? "معرّف المساحة" : "Workspace ID"}
      helper={
        ar
          ? "اذكره عند التواصل مع الدعم."
          : "Include it when you contact support."
      }
    >
      {(field) => (
        <InputCopy
          field={field}
          value={value}
          labels={{ copy: ar ? "نسخ معرّف المساحة" : "Copy workspace ID" }}
        />
      )}
    </Field>
  );
}
