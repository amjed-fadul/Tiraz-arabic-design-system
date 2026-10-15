import { RadioGroup } from "../system/RadioGroup";
import type { Accent } from "../system/config";

export function AccentPicker({
  ar,
  value,
  onChange,
}: {
  ar: boolean;
  value: Accent;
  onChange: (accent: Accent) => void;
}) {
  const label = ar ? "اختر اللون" : "Choose accent";
  return (
    <div className="lp-accent-control">
      <div className="lp-accent-pill">
        <span aria-hidden="true">{label}</span>
        <RadioGroup
          className="lp-accent-picker"
          name="landing-accent"
          label={label}
          value={value}
          onValueChange={(v) => onChange(v as Accent)}
          aria-describedby="accent-description"
          options={[
            { value: "sage", label: ar ? "أخضر" : "Green" },
            { value: "blue", label: ar ? "أزرق" : "Blue" },
            { value: "plum", label: ar ? "بنفسجي" : "Purple" },
            { value: "clay", label: ar ? "بني" : "Brown" },
          ]}
        />
      </div>
      <p id="accent-description">
        {ar
          ? "غيّر لون النسيج والمثال التفاعلي أدناه."
          : "Tint the textile and customize the live example below."}
      </p>
    </div>
  );
}
