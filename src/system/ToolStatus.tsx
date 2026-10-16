import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { Spinner } from "./Spinner";
import type { ToolCallState } from "./ToolCall";
export function ToolStatus({ state }: { state: ToolCallState }) {
  return (
    <span className="tz-tool-status" data-state={state} aria-hidden="true">
      {state === "running" ? (
        <Spinner decorative />
      ) : state === "completed" ? (
        <CheckCircle2 />
      ) : state === "failed" ? (
        <CircleAlert />
      ) : (
        <Clock3 />
      )}
    </span>
  );
}
