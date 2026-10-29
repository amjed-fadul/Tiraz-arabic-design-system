import type { ReactNode } from "react";
import { Check } from "lucide-react";

/** A selectable attached resource. Native input keeps the whole row keyboard operable. */
export function ContextChoice({
  label,
  icon,
  meta,
  checked,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  meta?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="ac-context-choice" data-selected={checked}>
      <span className="ac-context-kind" aria-hidden="true">
        {icon}
      </span>
      <bdi>{label}</bdi>
      <span className="ac-context-meta" aria-hidden="true">
        {meta ?? (checked ? <Check size={10} /> : null)}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
    </label>
  );
}
