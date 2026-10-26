import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, Ref } from "react";
import { createPortal } from "react-dom";
import { accentColors } from "./config";
import type { SystemConfig } from "./config";
import { useInputModality } from "./useInputModality";

/** Explicit portable scope, independent of the provider's layout and ancestry. */
export interface PortalScope {
  lang?: string;
  customProperties: CSSProperties;
}

export function scopeAttributes(config: SystemConfig, lang?: string) {
  return {
    lang,
    dir: config.direction,
    "data-theme": config.theme,
    "data-density": config.density,
    "data-typography": config.typography ?? "standard",
    "data-numerals": config.numerals ?? "arab",
    "data-reduced-motion": config.reducedMotion,
  };
}

export function scopeStyle(config: SystemConfig, style?: CSSProperties) {
  return {
    ...style,
    "--action": `var(--tiraz-action, ${accentColors[config.accent][config.theme]})`,
    "--radius": `var(--tiraz-radius, ${config.radius}px)`,
    colorScheme: config.theme,
  } as CSSProperties;
}

export function useThemeTransition(
  container: HTMLDivElement | null,
  theme: SystemConfig["theme"],
) {
  const previous = useRef(theme);
  useLayoutEffect(() => {
    if (!container || previous.current === theme) return;
    previous.current = theme;
    container.setAttribute("data-theme-switching", "");
    void container.offsetHeight;
    const frame = requestAnimationFrame(() =>
      container.removeAttribute("data-theme-switching"),
    );
    return () => {
      cancelAnimationFrame(frame);
      container.removeAttribute("data-theme-switching");
    };
  }, [theme, container]);
}

function ScopedHost({
  config,
  scope,
  hostRef,
}: {
  config: SystemConfig;
  scope?: PortalScope;
  hostRef: Ref<HTMLDivElement>;
}) {
  const modality = useInputModality();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      setNode(element);
      if (typeof hostRef === "function") return hostRef(element);
      if (hostRef) hostRef.current = element;
    },
    [hostRef],
  );
  useThemeTransition(node, config.theme);
  return (
    <div
      ref={ref}
      className="tiraz-system"
      {...scopeAttributes(config, scope?.lang)}
      data-modality={modality}
      style={{
        ...scopeStyle(config, scope?.customProperties),
        display: "contents",
      }}
    />
  );
}

/** Omitted preserves the nearest existing host; null means explicitly pending. */
export function useScopedPortalHost(
  target: HTMLElement | null | undefined,
  fallback: HTMLDivElement | null,
  config: SystemConfig,
  scope?: PortalScope,
) {
  const [resolved, setResolved] = useState<{
    target: HTMLElement | null | undefined;
    node: HTMLDivElement | null;
  } | null>(null);
  const ref = useCallback(
    (node: HTMLDivElement | null) => setResolved({ target, node }),
    [target],
  );
  return {
    container:
      target === undefined
        ? fallback
        : target && resolved?.target === target
          ? resolved.node
          : null,
    portal: target
      ? createPortal(
          <ScopedHost config={config} scope={scope} hostRef={ref} />,
          target,
        )
      : null,
  };
}
