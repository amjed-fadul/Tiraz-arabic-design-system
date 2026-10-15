import { useState } from "react";
import { Button, Slider } from "../../index";
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
  const [report, setReport] = useState<string | null>(null);
  return (
    <form
      style={{
        display: "grid",
        gap: "var(--space-3)",
        inlineSize: "100%",
        minInlineSize: 0,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setReport(
          String(new FormData(event.currentTarget).get("amount") ?? "—"),
        );
      }}
      onReset={() => {
        setValue(40);
        setReport(null);
      }}
    >
      <Slider
        key={mode}
        label={label ?? t("قيمة محلية", "Local amount")}
        helper={
          helper ??
          t(
            "اسحب المؤشر أو استخدم الأسهم وHome وEnd.",
            "Drag the thumb or use arrow keys, Home and End.",
          )
        }
        error={error}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        name="amount"
        value={mode === "controlled" ? value : undefined}
        defaultValue={40}
        onValueChange={setValue}
        formatValue={
          showValue
            ? (next) => new Intl.NumberFormat(language).format(next)
            : undefined
        }
      />
      <p style={{ margin: 0 }}>
        {t(
          "عدّل قيمة النموذج محليًا ثم اقرأها.",
          "Adjust the local form value, then read it.",
        )}
      </p>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Button type="submit" variant="secondary">
          {t("قراءة القيمة", "Read value")}
        </Button>
        <Button type="reset" variant="ghost">
          {t("إعادة الضبط", "Reset")}
        </Button>
      </div>
      {report !== null && (
        <output role="status">
          {t("قيمة النموذج: ", "Form value: ")}
          <bdi>{report}</bdi>
        </output>
      )}
    </form>
  );
}
