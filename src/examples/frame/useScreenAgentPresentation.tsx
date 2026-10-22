import type { AgentPresentation } from "../../system/AgentPresentation";
import type { AgentIdentity } from "../../mascot/useAgentColor";
import { useAgentColor } from "../../mascot/useAgentColor";
import type { KhaytState } from "../../mascot/khayt-motion";
import { AgentColorControl } from "../../mascot/AgentColorControl";
import { useScreen } from "./screen";
import { ScreenAgentAvatar } from "./ScreenAgent";
import { agentNames } from "./screen-agents";

/** The screen supplies identity and task state; the pattern owns its header. */
export function useScreenAgentPresentation(
  agent: AgentIdentity,
  state: KhaytState,
): AgentPresentation {
  const { t, language } = useScreen();
  const [color, setColor] = useAgentColor(agent);
  return {
    name: t(...agentNames[agent]),
    color,
    avatar: <ScreenAgentAvatar agent={agent} state={state} size={48} />,
    actions: (
      <AgentColorControl
        language={language}
        color={color}
        onChange={setColor}
      />
    ),
  };
}
