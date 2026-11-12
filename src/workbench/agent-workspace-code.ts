export function agentWorkspaceCode(language: "ar" | "en") {
  return `// This composition and its helpers ship with Tiraz's editable source.
// The example host uses local events. Replace demo-host.ts with your runtime.
import { SystemProvider, defaultConfig } from "./system";
import { AgentWorkspaceExample } from "./system/ai/examples/AgentWorkspaceExample";
import "./system/tokens.css";
import "./system/components.css";

export default function AgentWorkspace() {
  return (
    <SystemProvider
      lang="${language}"
      config={{ ...defaultConfig, direction: "${language === "ar" ? "rtl" : "ltr"}" }}
    >
      <AgentWorkspaceExample language="${language}" />
    </SystemProvider>
  );
}`;
}
