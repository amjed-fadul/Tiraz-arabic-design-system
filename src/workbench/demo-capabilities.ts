import type { ComponentId } from "./catalog";
import { demoStates } from "./demo-states";

/** Replay plays a page's sequence of states, so a page without one has none. */
export function canReplayPlayground(component: ComponentId) {
  return demoStates[component]?.replay !== undefined;
}
