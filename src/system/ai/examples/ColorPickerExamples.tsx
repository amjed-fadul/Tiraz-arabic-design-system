import { useState } from "react";
import { Button, ColorPicker } from "../../index";
export interface ColorPickerExampleProps {
  language?: "ar" | "en";
  label?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  showSwatches?: boolean;
  mode?: "controlled" | "uncontrolled";
}
export function ColorPickerExample({
  language = "ar",
  label,
  helper,
  error,
  disabled = false,
  showSwatches = true,
  mode = "controlled",
}: ColorPickerExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [color, setColor] = useState("#805475");
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
          String(new FormData(event.currentTarget).get("sampleColor") ?? ""),
        );
      }}
      onReset={() => {
        setColor("#805475");
        setReport(null);
      }}
    >
      <ColorPicker
        key={mode}
        label={label ?? t("لون العيّنة", "Sample color")}
        helper={
          helper ??
          t(
            "صيغة #RGB أو #RRGGBB، دون شفافية. Enter أو مغادرة الحقل لتأكيد اللون.",
            "Use #RGB or #RRGGBB, without transparency. Enter or leave the field to commit.",
          )
        }
        error={error}
        disabled={disabled}
        swatches={showSwatches ? undefined : []}
        name="sampleColor"
        value={mode === "controlled" ? color : undefined}
        defaultValue="#805475"
        onValueChange={setColor}
      />
      <figure
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            backgroundColor: color,
            inlineSize: "var(--space-10)",
            blockSize: "var(--space-10)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border-strong)",
          }}
        />
        <figcaption>
          {t("عيّنة محلية: ", "Local sample: ")}
          <bdi dir="ltr">{color}</bdi>
        </figcaption>
      </figure>
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: "var(--text-meta)",
        }}
      >
        {t(
          "يغيّر هذا المثال العيّنة فقط. إعداد لون النظام مستقل.",
          "This example changes only the sample. The system accent setting is separate.",
        )}
      </p>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Button type="submit" variant="secondary">
          {t("عرض قيمة النموذج", "Read form value")}
        </Button>
        <Button type="reset" variant="ghost">
          {t("إعادة ضبط اللون", "Reset color")}
        </Button>
      </div>
      {report !== null && (
        <output role="status">
          {t("قيمة محلية: ", "Local value: ")}
          <bdi dir="ltr">{report || t("الحقل معطّل", "Control disabled")}</bdi>
        </output>
      )}
    </form>
  );
}
