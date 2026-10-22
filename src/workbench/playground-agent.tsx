import { Khayt } from "../mascot/Khayt";
import type { AgentPresentation as PreviewAgentPresentation } from "../system";
import { story as previewStory } from "../system/ai/examples/finance-story";
import {
  agentMascotState,
  isAgentPreview,
  agentIdentityHeaders,
} from "./agent-preview";
import type { AgentPreviewOptions } from "./agent-preview";

/** The example reports its actual state; the shared pattern places the avatar. */
export function getPlaygroundAgentPresentation(
  component: string,
  options: Partial<AgentPreviewOptions>,
  language: "ar" | "en",
): ((status: string) => PreviewAgentPresentation) | undefined {
  if (!isAgentPreview(component)) return undefined;
  if (options.agentAppearance === "icon")
    return agentIdentityHeaders.includes(component)
      ? () => ({ name: previewStory.agents.finance[language] })
      : undefined;
  return (status) => ({
    avatar: (
      <Khayt
        state={agentMascotState(component, status)}
        color={options.agentColor}
        size={48}
        animated
      />
    ),
    color: options.agentColor,
    // Other patterns already carry their task owner's name.
    name: agentIdentityHeaders.includes(component)
      ? previewStory.agents.finance[language]
      : undefined,
  });
}
