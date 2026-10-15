import { useState } from "react";
import { Button, DatePicker } from "../../index";
export interface DatePickerExampleProps {
  language?: "ar" | "en";
  label?: string;
  helper?: string;
  error?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  mode?: "controlled" | "uncontrolled";
}
export function DatePickerExample({
  language = "ar",
  label,
  helper,
  error,
  min = "",
  max = "",
  disabled = false,
  mode = "controlled",
}: DatePickerExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [date, setDate] = useState("");
  const [checked, setChecked] = useState(false);
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
        setDate("");
        setChecked(false);
      }}
    >
      <DatePicker
        key={mode}
        label={label ?? t("موعد محلي", "Local date")}
        helper={
          helper ??
          t(
            "الشهر والسنة للتنقّل فقط؛ اختر يومًا لتأكيد التاريخ. Escape للإغلاق.",
            "Month and year navigate only; choose a day to set the date. Escape closes.",
          )
        }
        error={
          error ||
          (checked && !date
            ? t("اختر تاريخًا أولًا.", "Choose a date first.")
            : undefined)
        }
        yearRange={[1900, 2100]}
        min={min}
        max={max}
        disabled={disabled}
        locale={language}
        name="date"
        value={mode === "controlled" ? date : undefined}
        onValueChange={(next) => {
          setDate(next);
          setChecked(false);
        }}
      />
      <output>
        {date ? (
          <>
            {t("التاريخ المحدد: ", "Selected date: ")}
            <bdi dir="ltr">{date}</bdi>
          </>
        ) : (
          t("لم يُحدد تاريخ بعد.", "No date selected yet.")
        )}
      </output>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Button type="submit" variant="secondary" disabled={disabled}>
          {t("فحص الاختيار", "Check selection")}
        </Button>
        <Button type="reset" variant="ghost">
          {t("إعادة الضبط", "Reset")}
        </Button>
      </div>
      {checked && date && (
        <p role="status">
          {t(
            "اختيار محلي فقط؛ لم يُحفظ في خدمة.",
            "Local selection only; nothing saved to a service.",
          )}
        </p>
      )}
    </form>
  );
}
