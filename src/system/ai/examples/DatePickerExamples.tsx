import { useState } from "react";
import { DatePicker } from "../../index";
export interface DatePickerExampleProps {
  language?: "ar" | "en";
  label?: string;
  helper?: string;
  error?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  mode?: "controlled" | "uncontrolled";
  /** The date the example opens with, as YYYY-MM-DD; empty for none. */
  defaultValue?: string;
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
  defaultValue = "",
}: DatePickerExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [date, setDate] = useState(defaultValue);
  return (
    <DatePicker
      key={mode}
      label={label ?? t("تاريخ الاستحقاق", "Due date")}
      helper={
        helper ?? t("نذكّرك قبل يومين.", "We’ll remind you two days before.")
      }
      error={error}
      yearRange={[1900, 2100]}
      min={min}
      max={max}
      disabled={disabled}
      locale={language}
      name="dueDate"
      value={mode === "controlled" ? date : undefined}
      defaultValue={defaultValue}
      onValueChange={setDate}
    />
  );
}
