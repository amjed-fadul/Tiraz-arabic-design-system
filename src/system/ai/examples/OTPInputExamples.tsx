import { useState } from "react";
import { OTPInput } from "../../index";
export interface OTPInputExampleProps {
  language?: "ar" | "en";
  label?: string;
  helper?: string;
  error?: string;
  length?: number;
  disabled?: boolean;
  readOnly?: boolean;
  mode?: "controlled" | "uncontrolled";
  /** The code the example opens with; the visitor can still change it. */
  defaultValue?: string;
}
export function OTPInputExample({
  language = "ar",
  label,
  helper,
  error,
  length = 6,
  disabled = false,
  readOnly = false,
  mode = "controlled",
  defaultValue = "",
}: OTPInputExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [code, setCode] = useState(defaultValue);
  return (
    <OTPInput
      key={mode}
      label={label ?? t("رمز التحقق", "Verification code")}
      helper={
        helper ??
        t("أرسلناه إلى بريدك الإلكتروني.", "We sent it to your email.")
      }
      error={error}
      length={length}
      disabled={disabled}
      readOnly={readOnly}
      name="code"
      value={mode === "controlled" ? code : undefined}
      defaultValue={defaultValue}
      onValueChange={setCode}
    />
  );
}
