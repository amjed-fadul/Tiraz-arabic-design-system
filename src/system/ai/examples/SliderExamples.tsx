import { useState } from "react";
import { Slider } from "../../index";
export interface SliderExampleProps {
  language?: "ar" | "en";
  label?: string;
  helper?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  mode?: "controlled" | "uncontrolled";
}
export function SliderExample({
  language = "ar",
  label,
  helper,
  error,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = true,
  mode = "controlled",
}: SliderExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [value, setValue] = useState(40);
  return (
    <Slider
      key={mode}
      label={label ?? t("الحد الشهري", "Monthly limit")}
      helper={
        helper ??
        t("عدد الفواتير المسموح بها شهريًا.", "Invoices allowed per month.")
      }
      error={error}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      name="monthlyLimit"
      value={mode === "controlled" ? value : undefined}
      defaultValue={40}
      onValueChange={setValue}
      formatValue={
        showValue
          ? (next) => new Intl.NumberFormat(language).format(next)
          : undefined
      }
    />
  );
}
