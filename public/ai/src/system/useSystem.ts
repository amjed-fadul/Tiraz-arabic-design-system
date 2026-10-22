import { createContext, useContext } from "react";
import { defaultConfig } from "./config";
import type { SystemConfig } from "./config";
export const SystemContext = createContext<{
  config: SystemConfig;
  container: HTMLDivElement | null;
}>({ config: defaultConfig, container: null });
export function useSystem() {
  return useContext(SystemContext);
}
