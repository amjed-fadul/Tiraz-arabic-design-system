import { Check, Clock3, X } from "lucide-react";
import { Spinner } from "./Spinner";
import type { ToolCallState } from "./ToolCall";
/** Filled discs for settled states, a live ring while running. */
export function ToolStatus({ state }: { state: ToolCallState }) {
  return (
    <span className="tz-tool-status" data-state={state} aria-hidden="true">
      {state === "running" ? (
        <Spinner decorative />
      ) : state === "completed" ? (
        <Check strokeWidth={3} />
      ) : state === "failed" ? (
        <X strokeWidth={3} />
      ) : (
        <Clock3 />
      )}
    </span>
  );
}
