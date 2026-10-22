import type { ReactNode } from "react";
import { AIMark } from "./AIMark";
import type { AIMarkProps } from "./AIMark";

/** Optional identity in a pattern's existing header. The host owns the avatar's
 * state and animation; these slots never submit, decide, or announce anything. */
export interface AgentPresentation {
  /** A decorative avatar, replacing the default AI mark. */
  avatar?: ReactNode;
  /** The agent's name, where the pattern shows assistant attribution. */
  name?: ReactNode;
  /** Identity controls, such as a color picker, inside the same header. */
  actions?: ReactNode;
  /** Identity color, tinting the existing tray without recoloring its paper. */
  color?: string;
}

export function AgentAvatar({
  agent,
  working = false,
  size,
}: {
  agent?: AgentPresentation;
  working?: boolean;
  size?: AIMarkProps["size"];
}) {
  return agent?.avatar != null ? (
    <span className="tz-agent-avatar" aria-hidden="true">
      {agent.avatar}
    </span>
  ) : (
    <AIMark working={working} size={size} />
  );
}
export function AgentHeaderActions({ agent }: { agent?: AgentPresentation }) {
  return agent?.actions != null ? (
    <span className="tz-agent-header-actions">{agent.actions}</span>
  ) : null;
}
export function AgentIdentityRow({ agent }: { agent?: AgentPresentation }) {
  return agent ? (
    <div className="tz-agent-identity-row" data-zone="header">
      <AgentAvatar agent={agent} />
      {agent.name != null && (
        <span className="tz-agent-identity-name">{agent.name}</span>
      )}
      <AgentHeaderActions agent={agent} />
    </div>
  ) : null;
}
