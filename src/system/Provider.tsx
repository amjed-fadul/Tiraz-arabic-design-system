import { useContext, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { defaultConfig } from "./config";
import type { SystemConfig } from "./config";
import { useInputModality } from "./useInputModality";
import { SystemContext } from "./useSystem";
import {
  scopeAttributes,
  scopeStyle,
  useScopedPortalHost,
  useThemeTransition,
} from "./portal-scope";
export interface SystemProviderProps {
  config?: SystemConfig;
  children: ReactNode;
  /** Additional classes on the existing .tiraz-system root. */
  className?: string;
  /** Root layout styles. Config owns --action, --radius and colorScheme. */
  style?: CSSProperties;
  /** Content language; direction remains controlled by config.direction. */
  lang?: string;
  /** Optional same-document portal host; null withholds overlays until ready. */
  portalContainer?: HTMLElement | null;
}
export function SystemProvider({
  config = defaultConfig,
  children,
  className,
  style,
  lang,
  portalContainer,
}: SystemProviderProps) {
  const { portalBoundary } = useContext(SystemContext);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const modality = useInputModality();
  const scope = useMemo(
    () => ({
      lang,
      customProperties: Object.fromEntries(
        Object.entries(style ?? {}).filter(([name]) => name.startsWith("--")),
      ) as CSSProperties,
    }),
    [lang, style],
  );
  const target =
    portalContainer &&
    portalBoundary !== undefined &&
    !portalBoundary?.contains(portalContainer)
      ? null
      : portalContainer;
  const { container, portal } = useScopedPortalHost(
    target,
    root,
    config,
    scope,
  );
  // Input modality changes only the scope elements, not context consumers.
  const system = useMemo(
    () => ({ config, container, scope, portalBoundary }),
    [config, container, scope, portalBoundary],
  );
  useThemeTransition(root, config.theme);
  return (
    <DirectionProvider dir={config.direction}>
      <SystemContext.Provider value={system}>
        <div
          ref={setRoot}
          className={["tiraz-system", className].filter(Boolean).join(" ")}
          {...scopeAttributes(config, lang)}
          data-modality={modality}
          style={scopeStyle(config, style)}
        >
          {children}
        </div>
        {portal}
      </SystemContext.Provider>
    </DirectionProvider>
  );
}
