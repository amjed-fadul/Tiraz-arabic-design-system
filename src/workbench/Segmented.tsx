import { useId } from "react";

/** One choice: the word it shows and, where that word alone is not enough to
    name it (a row of digits), its name. */
export interface SegmentedOption {
  value: string;
  text: string;
  name?: string;
}

/**
 * A settings row for a short choice: the label at the start and, at the end,
 * the options as pressed buttons on a tray, the chosen one a paper chip.
 */
export function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="settings-row">
      <span id={id}>{label}</span>
      <div className="settings-segmented" role="group" aria-labelledby={id}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            aria-label={option.name}
            onClick={() => {
              if (option.value !== value) onChange(option.value);
            }}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
