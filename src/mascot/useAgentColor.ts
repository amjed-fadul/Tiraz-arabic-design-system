import { useEffect, useState } from "react";
export type AgentIdentity = "collections" | "customer";
export const agentColors: Record<AgentIdentity, string> = {
  collections: "#946D91",
  customer: "#738D76",
};
const eventName = "tiraz-agent-color";
const memory = new Map<string, string>();
const key = (agent: AgentIdentity) => `tiraz.agent-color.${agent}.v1`;
function read(agent: AgentIdentity) {
  if (memory.has(agent)) return memory.get(agent)!;
  let value: string | null | undefined;
  try {
    value = localStorage.getItem(key(agent));
  } catch {
    /* In-memory fallback. */
  }
  return value && /^#[\da-f]{6}$/i.test(value)
    ? value
    : (memory.get(agent) ?? agentColors[agent]);
}
/** One identity color shared by the preview and the same named screen agent. */
export function useAgentColor(agent: AgentIdentity) {
  const [color, setColor] = useState(() => read(agent));
  useEffect(() => {
    const update = () => setColor(read(agent));
    const fromStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== key(agent)) return;
      memory.delete(agent);
      update();
    };
    update();
    window.addEventListener("storage", fromStorage);
    window.addEventListener(eventName, update);
    return () => {
      window.removeEventListener("storage", fromStorage);
      window.removeEventListener(eventName, update);
    };
  }, [agent]);
  return [
    color,
    (value: string) => {
      if (!/^#[\da-f]{6}$/i.test(value)) return;
      const next = value.toUpperCase();
      memory.set(agent, next);
      try {
        localStorage.setItem(key(agent), next);
      } catch {
        /* Still editable in memory. */
      }
      setColor(next);
      window.dispatchEvent(new Event(eventName));
    },
  ] as const;
}
