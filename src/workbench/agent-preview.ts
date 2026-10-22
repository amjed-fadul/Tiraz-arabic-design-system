import type { KhaytState } from "../mascot/khayt-motion";
export const agentPreviewComponents = [
  "agent-task",
  "draft-review",
  "image-generation",
  "change-summary",
  "data-answer",
  "cited-answer",
  "task-starter",
  "ask-user-questions",
  "suggested-edits",
  "assistant-controls",
] as const;
export type AgentPreviewComponent = (typeof agentPreviewComponents)[number];
export interface AgentPreviewOptions {
  agentAppearance: "icon" | "mascot";
  agentColor: string;
}
export const agentPreviewDefaults: AgentPreviewOptions = {
  agentAppearance: "mascot",
  agentColor: "#946D91",
};
export function isAgentPreview(
  component: string,
): component is AgentPreviewComponent {
  return agentPreviewComponents.some((id) => id === component);
}
/** A representation of the host's actual state; it never advances a task. */
export function agentMascotState(
  component: string,
  status: string,
): KhaytState {
  if (status === "ready")
    return component === "draft-review" ? "waiting" : "done";
  if (status === "blocked" || status === "failed") return "blocked";
  if (status === "thinking" || status === "queued") return "thinking";
  if (
    [
      "working",
      "running",
      "writing",
      "sending",
      "weaving",
      "updating",
      "rewriting",
    ].includes(status)
  )
    return "working";
  if (["done", "completed", "sent", "applied", "answered"].includes(status))
    return "done";
  if (
    ["waiting", "needs-you", "reviewing", "asking", "plan", "stale"].includes(
      status,
    )
  )
    return "waiting";
  return "idle";
}

export const agentIdentityHeaders: readonly string[] = [
  "task-starter",
  "cited-answer",
  "assistant-controls",
];
