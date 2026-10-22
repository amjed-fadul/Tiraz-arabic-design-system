import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { accentColors, defaultConfig } from "./config";
import type { SystemConfig } from "./config";
import { SystemContext } from "./useSystem";
export function SystemProvider({
  config = defaultConfig,
  children,
}: {
  config?: SystemConfig;
  children: ReactNode;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <DirectionProvider dir={config.direction}>
      <SystemContext.Provider value={{ config, container }}>
        <div
          ref={setContainer}
          className="tiraz-system"
          dir={config.direction}
          data-theme={config.theme}
          data-density={config.density}
          data-typography={config.typography ?? "standard"}
          data-reduced-motion={config.reducedMotion}
          style={
            {
              "--action": accentColors[config.accent][config.theme],
              "--radius": `${config.radius}px`,
              colorScheme: config.theme,
            } as CSSProperties
          }
        >
          {children}
        </div>
      </SystemContext.Provider>
    </DirectionProvider>
  );
}
