import { useReducedMotion } from "./useReducedMotion";

export interface AIMarkProps {
  /** Glyph 10, 13 or 16 px in an 18, 24 or 30 px tile. */
  size?: "xs" | "sm" | "md";
  /** Turns a quarter step on a loop while the assistant works. */
  working?: boolean;
  /** An accessible name; without one the mark is decorative and hidden. */
  label?: string;
  className?: string;
}

/**
 * The eight-point star that marks AI presence (Woven spec section 14), in the
 * AI color on its soft tile. The star is symmetric, so it never rests tilted;
 * under reduced motion it holds still.
 */
export function AIMark({
  size = "sm",
  working = false,
  label,
  className = "",
}: AIMarkProps) {
  const reduced = useReducedMotion();
  return (
    <span
      className={`tz-ai-mark ${className}`}
      data-size={size}
      data-working={(working && !reduced) || undefined}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2 14.93 4.93H19.07V9.07L22 12 19.07 14.93V19.07H14.93L12 22 9.07 19.07H4.93V14.93L2 12 4.93 9.07V4.93H9.07Z" />
      </svg>
    </span>
  );
}
