import { useState } from "react";
import { Button, OTPInput } from "../../index";
export interface OTPInputExampleProps {
  language?: "ar" | "en";
  label?: string;
  helper?: string;
  error?: string;
  length?: number;
  disabled?: boolean;
  readOnly?: boolean;
  mode?: "controlled" | "uncontrolled";
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
}: OTPInputExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);
  const count = Number.isFinite(length)
    ? Math.max(1, Math.min(12, Math.floor(length)))
    : 6;
  const visibleCode = code.slice(0, count);
  const complete = visibleCode.length === count;
  return (
    <form
      noValidate
      style={{
        display: "grid",
        gap: "var(--space-3)",
        inlineSize: "100%",
        minInlineSize: 0,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setChecked(true);
      }}
      onReset={() => {
        setCode("");
        setChecked(false);
      }}
    >
      <OTPInput
        key={mode}
        label={label ?? t("رمز تجريبي", "Sample code")}
        helper={
          helper ??
          t(
            "أدخل أرقامًا عربية أو إنجليزية. هذه معاينة محلية دون تحقق.",
            "Enter Arabic or ASCII digits. This is a local preview without verification.",
          )
        }
        error={
          error ||
          (checked && !complete
            ? t(
                `أدخل ${count} أرقام لإكمال الرمز.`,
                `Enter ${count} digits to complete the code.`,
              )
            : undefined)
        }
        length={count}
        disabled={disabled}
        readOnly={readOnly}
        name="code"
        value={mode === "controlled" ? code : undefined}
        onValueChange={(next) => {
          setCode(next);
          setChecked(false);
        }}
      />
      <output>
        {t("عدد الأرقام: ", "Digits entered: ")}
        <bdi dir="ltr">
          {visibleCode.length}/{count}
        </bdi>
        {complete
          ? t(
              " — مكتمل محليًا؛ لم يُتحقق منه.",
              " — locally complete; unverified.",
            )
          : t(" — يمكنك متابعة التعديل.", " — keep editing.")}
      </output>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Button type="submit" variant="secondary" disabled={disabled}>
          {t("فحص الاكتمال", "Check completeness")}
        </Button>
        <Button type="reset" variant="ghost">
          {t("إعادة الضبط", "Reset")}
        </Button>
      </div>
      {checked && complete && (
        <p role="status">
          {t(
            "الرمز مكتمل فقط. لم يتم إرساله أو التحقق منه.",
            "The code is complete only. It has not been sent or verified.",
          )}
        </p>
      )}
    </form>
  );
}
