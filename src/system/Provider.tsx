import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { accentColors, defaultConfig } from "./config";
import type { SystemConfig } from "./config";
import { useInputModality } from "./useInputModality";
import { SystemContext } from "./useSystem";
export interface SystemProviderProps {
  config?: SystemConfig;
  children: ReactNode;
  /** Additional classes on the existing .tiraz-system root. */
  className?: string;
  /** Root layout styles. Config owns --action, --radius and colorScheme. */
  style?: CSSProperties;
  /** Content language; direction remains controlled by config.direction. */
  lang?: string;
}
export function SystemProvider({
  config = defaultConfig,
  children,
  className,
  style,
  lang,
}: SystemProviderProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const modality = useInputModality();
  // Modality re-renders only the root element; consumers of the system
  // context re-render when the config or the container changes.
  const system = useMemo(() => ({ config, container }), [config, container]);
  // A theme switch repaints every surface at once; per-control color
  // transitions would make it ripple, so they sit out that single frame.
  const theme = useRef(config.theme);
  useLayoutEffect(() => {
    if (!container || theme.current === config.theme) return;
    theme.current = config.theme;
    container.setAttribute("data-theme-switching", "");
    void container.offsetHeight;
    const frame = requestAnimationFrame(() =>
      container.removeAttribute("data-theme-switching"),
    );
    return () => {
      cancelAnimationFrame(frame);
      container.removeAttribute("data-theme-switching");
    };
  }, [config.theme, container]);
  return (
    <DirectionProvider dir={config.direction}>
      <SystemContext.Provider value={system}>
        <div
          ref={setContainer}
          className={["tiraz-system", className].filter(Boolean).join(" ")}
          lang={lang}
          dir={config.direction}
          data-theme={config.theme}
          data-density={config.density}
          data-typography={config.typography ?? "standard"}
          data-numerals={config.numerals ?? "arab"}
          data-reduced-motion={config.reducedMotion}
          data-modality={modality}
          style={
            {
              ...style,
              "--action": `var(--tiraz-action, ${accentColors[config.accent][config.theme]})`,
              "--radius": `var(--tiraz-radius, ${config.radius}px)`,
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
