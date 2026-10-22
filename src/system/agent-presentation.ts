import type { CSSProperties } from "react";
import type { AgentPresentation } from "./AgentPresentation";

export function agentPresentationStyle(agent?: AgentPresentation) {
  return agent?.color
    ? ({ "--agent-color": agent.color } as CSSProperties)
    : undefined;
}
