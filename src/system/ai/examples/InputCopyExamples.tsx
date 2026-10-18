import { InputCopy } from "../../index";
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
          "شارك الرابط مع زملائك لينضموا إلى مساحة العمل.",
          "Share this link so teammates can join the workspace.",
        )
      }
      error={error}
      value={value}
      disabled={disabled}
    />
  );
}
