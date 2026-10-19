import { Check, Minus, X } from "lucide-react";
import { numberLocale } from "./config";
import { Spinner } from "./Spinner";
import { useChanged } from "./useChanged";
import { useSystem } from "./useSystem";

/** The seven statuses of the Woven vocabulary: tasks, tool calls, steps of agent work. */
export type StatusIconState =
  | "pending"
  | "running"
  | "needs-you"
  | "completed"
  | "failed"
  | "stopped"
  | "skipped";
export interface StatusIconProps {
  state: StatusIconState;
  /** The position of an ordered item, shown by a pending icon only. */
  number?: number;
  /** "ai" when the assistant is the actor; it turns the running arc to the AI color. */
  tone?: "ai" | "neutral";
  /** An accessible name. Without one the icon is decorative and hidden. */
  label?: string;
  className?: string;
}

function Glyph({
  state,
  number,
  locale,
}: {
  state: StatusIconState;
  number?: number;
  locale: string;
}) {
  switch (state) {
    case "pending":
      // The ring holds its position when it has one, and is empty otherwise.
      return number != null && Number.isFinite(number) && number >= 0 ? (
        <span data-glyph="number">
          {new Intl.NumberFormat(locale).format(Math.floor(number))}
        </span>
      ) : null;
    case "running":
      return (
        <span data-glyph="spinner">
          <Spinner decorative />
        </span>
      );
    case "needs-you":
      return <span data-glyph="bang">!</span>;
    case "completed":
      return <Check data-glyph="check" strokeWidth={3} />;
    case "failed":
      return <X data-glyph="x" strokeWidth={3} />;
    case "stopped":
      return <span data-glyph="square" />;
    case "skipped":
      return <Minus data-glyph="minus" strokeWidth={3} />;
  }
}

/**
 * The one status glyph (Woven spec section 13): a filled disc for done, failed
 * and needs-you, a dashed ring for pending and skipped, an outline for stopped
 * and the arc while running. A check or cross draws itself only once the state
 * has changed, never on first render.
 */
export function StatusIcon({
  state,
  number,
  tone,
  label,
  className,
}: StatusIconProps) {
  const { config } = useSystem();
  const changed = useChanged(state);
  return (
    <span
      className={className ? `tz-status-icon ${className}` : "tz-status-icon"}
      data-state={state}
      data-tone={tone ?? "neutral"}
      data-changed={changed || undefined}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <Glyph state={state} number={number} locale={numberLocale(config)} />
    </span>
  );
}
