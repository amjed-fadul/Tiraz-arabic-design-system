import { X } from "lucide-react";

/**
 * The remove action of a tag, a filter chip and a selected file. Internal: the
 * host owns the label and what removal does. It is a plain button rather than a
 * Button, so no Button rule can out-rank its hover.
 */
export function RemoveButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="tz-remove-button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <X size={12} aria-hidden="true" />
    </button>
  );
}
