import { createContext, useContext } from "react";
import { defaultConfig } from "./config";
import type { SystemConfig } from "./config";
import type { PortalScope } from "./portal-scope";
const defaultSystem = { config: defaultConfig, container: null };
export const SystemContext = createContext<{
  config: SystemConfig;
  container: HTMLDivElement | null;
  scope?: PortalScope;
  /** Nearest modal content; external destinations must remain inside it. */
  portalBoundary?: HTMLDivElement | null;
}>(defaultSystem);
export function useSystem() {
  return useContext(SystemContext);
}

/** Internal: preserve pre-existing bare Radix component body portals while
 * distinguishing a real provider (or source context) whose host is pending. */
export function usePortalDestination() {
  const system = useSystem();
  return system === defaultSystem && typeof document !== "undefined"
    ? document.body
    : system.container;
}
