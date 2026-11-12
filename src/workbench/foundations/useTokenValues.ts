import { useLayoutEffect, useState } from "react";
import type { CSSProperties } from "react";
import { scopeAttributes, scopeStyle } from "../../system/portal-scope";
import type { SystemConfig } from "../../system/config";
import { useSystem } from "../../system/useSystem";

export interface TokenValue {
  name: string;
  light: string;
  dark: string;
}

/** Opaque rgb() becomes lowercase #rrggbb; anything else is kept as computed. */
export function toHex(color: string): string {
  const match =
    /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/.exec(
      color.trim(),
    );
  if (!match) return color.trim();
  const alpha = match[4];
  if (
    alpha !== undefined &&
    (alpha.endsWith("%") ? parseFloat(alpha) / 100 : parseFloat(alpha)) < 1
  )
    return color.trim();
  return (
    "#" +
    [match[1], match[2], match[3]]
      .map((part) => Math.round(parseFloat(part)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** A hidden scope built the way SystemProvider builds its root. */
function createScope(
  parent: HTMLElement,
  config: SystemConfig,
  theme: "light" | "dark",
  lang: string | undefined,
  customProperties: CSSProperties | undefined,
) {
  const scoped = { ...config, theme };
  const scope = document.createElement("div");
  scope.className = "tiraz-system";
  scope.setAttribute("aria-hidden", "true");
  for (const [name, value] of Object.entries(scopeAttributes(scoped, lang)))
    if (value !== undefined) scope.setAttribute(name, String(value));
  for (const [name, value] of Object.entries(
    scopeStyle(scoped, customProperties),
  )) {
    if (value === undefined) continue;
    if (name.startsWith("--")) scope.style.setProperty(name, String(value));
    else
      (scope.style as unknown as Record<string, string>)[name] = String(value);
  }
  Object.assign(scope.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    insetBlockStart: "0",
    insetInlineStart: "0",
    inlineSize: "0",
    blockSize: "0",
    overflow: "hidden",
  });
  const probe = document.createElement("div");
  scope.appendChild(probe);
  parent.appendChild(scope);
  return { scope, probe };
}

function read(
  { scope, probe }: { scope: HTMLElement; probe: HTMLElement },
  name: string,
) {
  const raw = getComputedStyle(scope).getPropertyValue(name).trim();
  if (!raw) return "";
  // Custom properties return unresolved text; applying one to a probe resolves
  // var() and color-mix() to a real colour.
  probe.style.backgroundColor = "";
  probe.style.backgroundColor = `var(${name})`;
  const computed = getComputedStyle(probe).backgroundColor;
  const transparent = /^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$|^transparent$/.test(
    computed,
  );
  // An invalid colour falls back to transparent: show the raw token instead.
  if (!computed || (transparent && !/^transparent$/i.test(raw))) return raw;
  return toHex(computed);
}

/**
 * Live light and dark values for tokens, read from two hidden scopes that copy
 * the surrounding provider's configuration (accent, radius, density, ...).
 */
export function useTokenValues(names: string[]): TokenValue[] {
  const { config, container, scope: providerScope } = useSystem();
  const key = names.join("|");
  const custom = JSON.stringify(providerScope?.customProperties ?? {});
  const empty = () => names.map((name) => ({ name, light: "", dark: "" }));
  const [values, setValues] = useState<TokenValue[]>(empty);
  const {
    accent,
    radius,
    density,
    typography,
    numerals,
    direction,
    reducedMotion,
  } = config;
  const lang = providerScope?.lang;
  useLayoutEffect(() => {
    const parent = container ?? document.body;
    const settings: SystemConfig = {
      theme: "light",
      accent,
      radius,
      density,
      typography,
      numerals,
      direction,
      reducedMotion,
    };
    const properties = providerScope?.customProperties;
    const scopes = (["light", "dark"] as const).map((theme) =>
      createScope(parent, settings, theme, lang, properties),
    );
    const next = key
      .split("|")
      .filter(Boolean)
      .map((name) => ({
        name,
        light: read(scopes[0], name),
        dark: read(scopes[1], name),
      }));
    scopes.forEach(({ scope }) => scope.remove());
    setValues((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
    );
    // customProperties is tracked through its serialised form, `custom`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    container,
    key,
    custom,
    lang,
    accent,
    radius,
    density,
    typography,
    numerals,
    direction,
    reducedMotion,
  ]);
  return values;
}
