import { useEffect, useRef, useState } from "react";
import { SystemProvider } from "../system";
import type { ButtonState, SystemConfig } from "../system";
import { catalog } from "./catalog";
import type { ComponentId } from "./catalog";
import { demoStates } from "./demo-states";
import { label, localize } from "./i18n";
import { normalizePlaygrounds, previewConfig } from "./model";
import type { ButtonModel } from "./model";
import { Playground } from "./Playground";
import {
  readDocumentation,
  readBrandColors,
  readPlaygrounds,
  readSystem,
  readTheme,
} from "./storage";

import { generateThemeCss } from "./theme-customization";

/**
 * One page's example on its own, at full width (/examples/playground/<page>).
 * It opens as the workbench left it: the stored props and system settings,
 * and the phase the link carries. Storage is read once, so the two tabs go
 * their own ways afterwards, and nothing here is written back.
 */
export function StandalonePlayground({
  component,
}: {
  component: ComponentId;
}) {
  const [brandColors] = useState(readBrandColors);
  const [language] = useState(() => readDocumentation().language);
  const [config] = useState<SystemConfig>(() => ({
    ...readSystem(),
    theme: readTheme(),
    direction: language === "ar" ? "rtl" : "ltr",
  }));
  const [playgrounds, setPlaygrounds] = useState(() =>
    readPlaygrounds(language),
  );
  const model = playgrounds[component];
  const [phase, setPhase] = useState(() => {
    const page = demoStates[component];
    const asked = new URLSearchParams(window.location.search).get("phase");
    return page?.states.some((state) => asked && state.phase === asked)
      ? (asked ?? undefined)
      : page?.states.find((state) => state.id === page.resting)?.phase;
  });
  // The Button's simulated action, as the workbench plays it.
  const [buttonState, setButtonState] = useState<ButtonState>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function buttonAction() {
    const p = model as ButtonModel;
    if (buttonState || p.disabled || p.state === "loading") return;
    if (p.action !== "simulate") return;
    setButtonState("loading");
    timers.current = [
      setTimeout(() => setButtonState(p.outcome), 1200),
      setTimeout(() => setButtonState(undefined), 2200),
    ];
  }
  const name = localize(
    catalog.find((item) => item.id === component)!.name,
    language,
  );
  useEffect(() => {
    document.title = `${name} · ${language === "ar" ? "طِراز" : "Tiraz"}`;
    document.documentElement.dir = config.direction;
    document.documentElement.lang = language;
    document.documentElement.style.colorScheme = config.theme;
  }, [name, language, config]);
  return (
    <>
      {Object.keys(brandColors).length > 0 && (
        <style>
          {generateThemeCss(previewConfig(config, model), brandColors)}
        </style>
      )}
      <SystemProvider config={previewConfig(config, model)}>
        <main className="standalone-playground">
          <h1 className="tz-visually-hidden">{name}</h1>
          <a className="doc-button" href="/">
            {label("backToDocs", language)}
          </a>
          <div className={`playground-canvas playground-${component}`}>
            <Playground
              component={component}
              model={model}
              language={language}
              onPatch={(patch) =>
                setPlaygrounds((prev) =>
                  normalizePlaygrounds(
                    { ...prev, [component]: { ...prev[component], ...patch } },
                    language,
                  ),
                )
              }
              onEvent={() => {}}
              onButtonAction={buttonAction}
              buttonState={buttonState}
              phase={phase}
              onPhaseChange={setPhase}
            />
          </div>
        </main>
      </SystemProvider>
    </>
  );
}
