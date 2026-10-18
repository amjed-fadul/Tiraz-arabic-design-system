import { useState } from "react";
import { ColorPicker } from "../../index";
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
  return (
    <ColorPicker
      key={mode}
      label={label ?? t("لون العلامة التجارية", "Brand color")}
      helper={
        helper ??
        t(
          "اكتب اللون بصيغة #RGB أو #RRGGBB دون شفافية، ثم اضغط Enter أو غادر الحقل لتأكيده.",
          "Use #RGB or #RRGGBB, without transparency. Enter or leave the field to commit.",
        )
      }
      error={error}
      disabled={disabled}
      swatches={showSwatches ? undefined : []}
      name="brandColor"
      value={mode === "controlled" ? color : undefined}
      defaultValue="#805475"
      onValueChange={setColor}
    />
  );
}
