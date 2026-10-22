import { stateNames, agentStyle } from "./screen-agents";
import type { ReactNode } from "react";
import { Khayt } from "../../mascot/Khayt";
import type { KhaytState } from "../../mascot/khayt-motion";
import { AgentColorControl } from "../../mascot/AgentColorControl";
import { useAgentColor } from "../../mascot/useAgentColor";
import type { AgentIdentity } from "../../mascot/useAgentColor";
import { useScreen } from "./screen";
import { useScreenDemo } from "./useScreenDemo";

/** State comes from this agent's task, never another agent's demo clock. */
export function ScreenAgentAvatar({
  agent,
  state,
  size = 64,
}: {
  agent: AgentIdentity;
  state: KhaytState;
  size?: number;
}) {
  const [color] = useAgentColor(agent);
  const demo = useScreenDemo();
  return (
    <Khayt color={color} state={state} animated={!demo.paused} size={size} />
  );
}

export function ScreenAgentHeading({
  agent,
  title,
  description,
  children,
  state,
  headingLevel = 2,
}: {
  agent: AgentIdentity;
  title: string;
  description?: string;
  children?: ReactNode;
  state: KhaytState;
  headingLevel?: 2 | 3;
}) {
  const { t, language } = useScreen();
  const [color, setColor] = useAgentColor(agent);
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      className="screen-agent-heading"
      data-agent={agent}
      style={agentStyle(color)}
    >
      <div className="screen-agent-identity">
        <ScreenAgentAvatar agent={agent} state={state} />
        <div className="screen-agent-name">
          <span className="screen-agent-eyebrow">
            {t("مساعد ذكي", "AI agent")} · {t(...stateNames[state])}
          </span>
          <Heading>{title}</Heading>
        </div>
        <AgentColorControl
          language={language}
          color={color}
          onChange={setColor}
        />
      </div>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
