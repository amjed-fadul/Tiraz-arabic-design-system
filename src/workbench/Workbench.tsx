import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun, SlidersHorizontal, Menu } from "lucide-react";
import { SystemProvider, defaultConfig } from "../system";
import type { ButtonState, SystemConfig } from "../system";
import { catalog, navigationGroups } from "./catalog";
import type { ComponentId } from "./catalog";
import { label, localize, words } from "./i18n";
import type { Language } from "./i18n";
import {
  defaultPlaygrounds,
  normalizePlaygrounds,
  previewConfig,
  translateDefaults,
} from "./model";
import type { ButtonModel } from "./model";
import {
  persist,
  readDocumentation,
  readPlaygrounds,
  readSystem,
  readTheme,
  defaultSettings,
  storageKeys,
} from "./storage";
import { Appearance } from "./Appearance";
import { Inspector } from "./Inspector";
import { Playground } from "./Playground";
import { Examples } from "./Examples";
import { PreviewFrame } from "./PreviewFrame";
import {
  canReplayExamples,
  canReplayPlayground,
  hasExamples,
} from "./demo-capabilities";
import { CodeExample } from "./CodeExample";
import { ApiReference } from "./ApiReference";
import { CopyControl } from "./CopyControl";
import { generateCode, generatePrompt } from "./generate";
import { DocsDrawer } from "./DocsDrawer";
interface EventRecord {
  name: string;
  value?: unknown;
}
function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5 6h8v8H5zM19 6h8v8h-8zM5 20h8v8H5zM19 20h8v8h-8z"
        fill="currentColor"
      />
      <path
        d="M13 10h6M9 14v6m14-6v6m-10 4h6"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
export function Workbench() {
  const [documentation, setDocumentation] = useState(readDocumentation);
  const language = documentation.language,
    active = documentation.active,
    direction = language === "ar" ? "rtl" : "ltr",
    t = words(language);
  const [settings, setSettings] = useState(readSystem);
  const [theme, setTheme] = useState(readTheme);
  const [playgrounds, setPlaygrounds] = useState(() =>
    readPlaygrounds(language),
  );
  const [exampleRevisions, setExampleRevisions] = useState<
    Record<string, number>
  >({});
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<
    Partial<Record<ComponentId, EventRecord[]>>
  >({});
  const [navigationOpen, setNavigationOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false);
  const buttonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionId = useRef(0);
  const [buttonFeedback, setButtonFeedback] = useState<ButtonState | null>(
    null,
  );
  const busy = useRef(false);
  const cancelButtonAction = useCallback(() => {
    if (buttonTimer.current !== null) clearTimeout(buttonTimer.current);
    buttonTimer.current = null;
    actionId.current += 1;
    busy.current = false;
    setButtonFeedback(null);
  }, []);
  const pendingOpen = useRef<{
    component: ComponentId;
    patch: Record<string, unknown>;
  } | null>(null);
  const systemConfig = useMemo<SystemConfig>(
    () => ({ ...settings, direction, theme }),
    [settings, direction, theme],
  );
  const documentationConfig: SystemConfig = {
    ...defaultConfig,
    theme,
    direction,
    density: "standard",
    typography: "standard",
    accent: "sage",
    radius: 6,
    reducedMotion: false,
  };
  const current = catalog.find((item) => item.id === active)!;
  const model = playgrounds[active],
    effectiveConfig = previewConfig(systemConfig, model);
  const code = generateCode(active, model, systemConfig, language),
    prompt = generatePrompt(active, model, systemConfig, language);
  useEffect(() => {
    document.title = `${language === "ar" ? "طِراز" : "Tiraz"} · ${localize(current.name, language)}`;
    persist(storageKeys.documentation, documentation);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    document.documentElement.style.colorScheme = theme;
  }, [documentation, direction, language, current.name, theme]);
  useEffect(() => persist(storageKeys.theme, theme), [theme]);
  useEffect(() => persist(storageKeys.system, settings), [settings]);
  useEffect(() => persist(storageKeys.playgrounds, playgrounds), [playgrounds]);
  useEffect(() => {
    return () => {
      if (buttonTimer.current !== null) clearTimeout(buttonTimer.current);
      buttonTimer.current = null;
      actionId.current += 1;
      busy.current = false;
    };
  }, [active, language]);
  function record(component: ComponentId, name: string, value?: unknown) {
    setEvents((prev) => ({
      ...prev,
      [component]: [...(prev[component] ?? []).slice(-2), { name, value }],
    }));
  }
  function patchPage(component: ComponentId, patch: Record<string, unknown>) {
    setPlaygrounds((prev) =>
      normalizePlaygrounds(
        { ...prev, [component]: { ...prev[component], ...patch } },
        language,
      ),
    );
  }
  function fromInspector(patch: Record<string, unknown>) {
    if (active === "button") cancelButtonAction();
    if (
      patch.open === true &&
      settingsOpen &&
      (active === "sheet" || active === "dropdown")
    ) {
      pendingOpen.current = { component: active, patch };
      setSettingsOpen(false);
      return;
    }
    patchPage(active, patch);
    // Keep Input's IDs and native editing state through label/help/error edits.
    // Mode/default-value changes still need a fresh uncontrolled demonstration.
    // Image percentages and sizing update the existing request rather than replaying it.
    if (["data-table", "input-copy", "image-result"].includes(active)) return;
    if (
      (active === "file-dropzone" || active === "color-picker") &&
      !("mode" in patch)
    )
      return;
    if (active === "tag-input" && !("mode" in patch)) return;
    if (active === "input" && !("mode" in patch) && !("value" in patch)) return;
    if (
      ["textarea", "checkbox", "radio-group"].includes(active) &&
      !("mode" in patch)
    )
      return;
    setRevisions((prev) => ({ ...prev, [active]: (prev[active] ?? 0) + 1 }));
  }
  function resetSystem() {
    cancelButtonAction();
    setSettings({ ...defaultSettings });
    setTheme(defaultConfig.theme);
  }
  function resetPlayground() {
    if (active === "button") cancelButtonAction();
    setPlaygrounds((prev) => ({
      ...prev,
      [active]: defaultPlaygrounds(language)[active],
    }));
    setEvents((prev) => ({ ...prev, [active]: [] }));
    setRevisions((prev) => ({ ...prev, [active]: (prev[active] ?? 0) + 1 }));
  }
  function replayPlayground() {
    if (
      [
        "loading-state",
        "thinking-indicator",
        "thinking-state",
        "tool-call",
        "tool-chips",
        "skeleton",
        "spinner",
        "progress",
      ].includes(active)
    ) {
      setRevisions((prev) => ({ ...prev, [active]: (prev[active] ?? 0) + 1 }));
    } else resetPlayground();
  }
  function changeLanguage(next: Language) {
    if (next === language) return;
    cancelButtonAction();
    setPlaygrounds((prev) => translateDefaults(prev, language, next));
    setDocumentation((prev) => ({ ...prev, language: next }));
  }
  function buttonAction() {
    const p = playgrounds.button as ButtonModel;
    if (busy.current || p.disabled || p.state === "loading") return;
    record("button", "onClick");
    if (p.action === "simulate") {
      cancelButtonAction();
      const id = actionId.current;
      busy.current = true;
      setButtonFeedback("loading");
      record("button", "state", "loading");
      buttonTimer.current = setTimeout(() => {
        if (id !== actionId.current) return;
        busy.current = false;
        setButtonFeedback(p.outcome);
        record("button", "state", p.outcome);
        buttonTimer.current = setTimeout(() => {
          if (id !== actionId.current) return;
          buttonTimer.current = null;
          setButtonFeedback(null);
          record("button", "state", p.state);
        }, 1000);
      }, 1200);
    }
  }
  function navigationClosed() {
    const pending = pendingOpen.current;
    if (!pending) return false;
    pendingOpen.current = null;
    patchPage(pending.component, pending.patch);
    return true;
  }
  const inspector = (
    <Inspector
      key={active}
      component={active}
      model={model}
      language={language}
      open={documentation.inspectorOpen}
      onOpenChange={(open) =>
        setDocumentation((prev) =>
          prev.inspectorOpen === open ? prev : { ...prev, inspectorOpen: open },
        )
      }
      onPatch={fromInspector}
      onReset={resetPlayground}
    />
  );
  const navigation = (
    <>
      <div className="navigation-label">{label("components", language)}</div>
      <nav className="component-nav" aria-label={label("components", language)}>
        {navigationGroups.map((group) => (
          <div
            key={group.id}
            className="component-nav-group"
            role="group"
            aria-label={localize(group.name, language)}
          >
            <h2 className="component-nav-heading">
              {localize(group.name, language)}
            </h2>
            {group.items.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-current={active === item.id ? "page" : undefined}
                onClick={() => {
                  cancelButtonAction();
                  setDocumentation((prev) => ({ ...prev, active: item.id }));
                  setNavigationOpen(false);
                }}
              >
                {localize(item.name, language)}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
  const appearance = (
    <Appearance
      config={systemConfig}
      language={language}
      onChange={setSettings}
      onReset={resetSystem}
    />
  );
  return (
    <SystemProvider config={documentationConfig}>
      <div className="docs-shell" data-doc-theme={theme}>
        <a className="skip-link" href="#main-content">
          {t("انتقل إلى المحتوى", "Skip to content")}
        </a>
        <header className="docs-header">
          <a
            className="docs-brand"
            href="#main-content"
            onClick={() => {
              cancelButtonAction();
              setDocumentation((prev) => ({ ...prev, active: "button" }));
            }}
          >
            <BrandMark />
            <span>{t("طِراز", "Tiraz")}</span>
          </a>
          <span className="header-description">
            {t("توثيق المكوّنات", "Component documentation")}
          </span>
          <div className="header-actions">
            <a className="doc-button" href="/examples/dashboard">
              {t("مثال لوحة العملاء", "Dashboard example")}
            </a>
            <div className="mobile-navigation">
              <DocsDrawer
                title={label("components", language)}
                language={language}
                open={navigationOpen}
                onOpenChange={setNavigationOpen}
                trigger={
                  <button type="button" className="doc-button">
                    <Menu size={14} />
                    {label("components", language)}
                  </button>
                }
              >
                {navigation}
              </DocsDrawer>
            </div>
            <div className="mobile-settings">
              <DocsDrawer
                title={t("التخصيص", "Customization")}
                language={language}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                onClosed={navigationClosed}
                trigger={
                  <button type="button" className="doc-button">
                    <SlidersHorizontal size={14} />
                    {label("customize", language)}
                  </button>
                }
              >
                {appearance}
                {inspector}
              </DocsDrawer>
            </div>
            <select
              className="language-control"
              aria-label={t("لغة التوثيق", "Documentation language")}
              value={language}
              onChange={(e) => changeLanguage(e.target.value as Language)}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <button
              type="button"
              className="doc-icon-button"
              aria-label={label("docTheme", language)}
              title={label("docTheme", language)}
              aria-pressed={theme === "dark"}
              onClick={() =>
                setTheme((prev) => (prev === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </header>
        <div className="docs-layout">
          <aside
            className="docs-sidebar"
            aria-label={t("تنقّل المكوّنات", "Component navigation")}
          >
            {navigation}
          </aside>
          <div className="docs-workspace">
            <main id="main-content" className="component-page" tabIndex={-1}>
              <header className="component-heading">
                <p className="component-kicker">
                  {label("components", language)}
                </p>
                <h1>{localize(current.name, language)}</h1>
                <p>{localize(current.description, language)}</p>
              </header>
              <section className="agent-section">
                <h2 id="agent-heading">{label("useInApp", language)}</h2>
                <div className="prompt-row">
                  <p className="prompt-preview" dir="auto">
                    {prompt
                      .replace(/\s+/g, " ")
                      .split(
                        /(ai\/[\w/.-]+|src\/[\w/.-]+|\.\/system(?:\/[\w.-]+)*|[\w.-]+\.(?:tsx?|css|md|json))/,
                      )
                      .map((part, index) =>
                        index % 2 === 1 ? (
                          <bdi dir="ltr" key={index}>
                            {part}
                          </bdi>
                        ) : (
                          part
                        ),
                      )}
                  </p>
                  <CopyControl
                    text={prompt}
                    caption={label("copyPrompt", language)}
                    language={language}
                    iconOnly
                  />
                </div>
              </section>
              <section className="playground-section">
                <div className="section-title-row">
                  <h2 id="playground-heading">
                    {label("playground", language)}
                  </h2>
                </div>
                <div className="playground-region">
                  <SystemProvider config={effectiveConfig}>
                    <PreviewFrame
                      component={active}
                      language={language}
                      title={t("الافتراضي", "Default")}
                      prompt={prompt}
                      copyLabel={t(
                        "نسخ الموجّه للمعاينة",
                        "Copy playground prompt",
                      )}
                      replayable={canReplayPlayground(active, model)}
                      onReplay={replayPlayground}
                    >
                      <div
                        className={`playground-canvas playground-${active}`}
                        role="region"
                        aria-label={label("playground", language)}
                      >
                        <Playground
                          key={`${active}-${revisions[active] ?? 0}`}
                          component={active}
                          model={model}
                          language={language}
                          prompt={prompt}
                          copyLabel={t(
                            "نسخ الموجّه للمعاينة",
                            "Copy playground prompt",
                          )}
                          onPatch={(patch) => patchPage(active, patch)}
                          onEvent={(name, value) => record(active, name, value)}
                          onButtonAction={buttonAction}
                          buttonState={buttonFeedback ?? undefined}
                        />
                      </div>
                    </PreviewFrame>
                  </SystemProvider>
                </div>
                {![
                  "alert",
                  "skeleton",
                  "progress",
                  "spinner",
                  "badge",
                  "avatar",
                  "avatar-group",
                  "empty-state",
                  "tooltip",
                  "modal",
                ].includes(active) && (
                  <div
                    // Announced for assistive tech; the stage stays visually clean.
                    className="tz-visually-hidden"
                    role="status"
                    aria-label={
                      (events[active]?.length ?? 0) > 0
                        ? label("lastEvent", language)
                        : undefined
                    }
                  >
                    {(events[active]?.length ?? 0) > 0 && (
                      <>
                        <span>{label("lastEvent", language)}</span>
                        <code dir="ltr">
                          {events[active]!.map(
                            (event) =>
                              `${event.name}${event.value !== undefined ? `(${JSON.stringify(event.value)})` : ""}`,
                          ).join(" → ")}
                        </code>
                      </>
                    )}
                  </div>
                )}
              </section>
              {hasExamples(active) && (
                <section className="examples-section">
                  <h2 id="examples-heading">{label("examples", language)}</h2>
                  <SystemProvider config={systemConfig}>
                    <div className="examples-canvas">
                      <PreviewFrame
                        component={active}
                        language={language}
                        title={
                          active === "streaming-text"
                            ? t("ماركداون", "Markdown")
                            : t("أمثلة", "Examples")
                        }
                        prompt={prompt}
                        copyLabel={t(
                          "نسخ الموجّه للمثال",
                          "Copy example prompt",
                        )}
                        replayable={canReplayExamples(active)}
                        onReplay={() =>
                          setExampleRevisions((prev) => ({
                            ...prev,
                            [active]: (prev[active] ?? 0) + 1,
                          }))
                        }
                      >
                        <Examples
                          key={`${active}-${language}-${exampleRevisions[active] ?? 0}`}
                          component={active}
                          language={language}
                          prompt={prompt}
                          copyLabel={t(
                            "نسخ الموجّه للمثال",
                            "Copy example prompt",
                          )}
                        />
                      </PreviewFrame>
                    </div>
                  </SystemProvider>
                </section>
              )}
              <section className="usage-section">
                <h2 id="usage-heading">{label("usage", language)}</h2>
                <p className="usage-guidance">
                  {t(
                    "الكود يطابق خصائص المعاينة. الخط المحلي محمّل في",
                    "Code follows the playground properties. Local font imports are in",
                  )}{" "}
                  <bdi dir="ltr">src/main.tsx</bdi>.
                </p>
                <CodeExample code={code} language={language} />
                <ApiReference component={active} language={language} />
              </section>
            </main>
          </div>
          <aside
            className="customization-rail"
            aria-label={t("التخصيص", "Customization")}
          >
            <div
              className="customization-scroll"
              tabIndex={0}
              role="region"
              aria-label={t(
                "إعدادات وخصائص المكوّن",
                "System settings and component properties",
              )}
            >
              {documentation.systemPanelOpen ? (
                <Appearance
                  config={systemConfig}
                  language={language}
                  onChange={setSettings}
                  onReset={resetSystem}
                  onCollapse={() =>
                    setDocumentation((prev) => ({
                      ...prev,
                      systemPanelOpen: false,
                    }))
                  }
                />
              ) : (
                <button
                  type="button"
                  className="system-collapse"
                  aria-expanded={false}
                  onClick={() =>
                    setDocumentation((prev) => ({
                      ...prev,
                      systemPanelOpen: true,
                    }))
                  }
                >
                  <SlidersHorizontal size={14} />
                  {label("customize", language)}
                </button>
              )}
              {inspector}
            </div>
          </aside>
        </div>
      </div>
    </SystemProvider>
  );
}
