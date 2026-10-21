import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Moon,
  Sun,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SystemProvider, defaultConfig } from "../system";
import { SystemContext } from "../system/useSystem";
import type { ButtonState, SystemConfig } from "../system";
import { aiParts, catalog, navigationGroups } from "./catalog";
import type { ComponentId } from "./catalog";
import { label, localize, words } from "./i18n";
import type { Language } from "./i18n";
import {
  defaultPlaygrounds,
  normalizePlaygrounds,
  previewConfig,
  translateDefaults,
} from "./model";
import type { ButtonModel, TabsModel } from "./model";
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
import { PreviewFrame } from "./PreviewFrame";
import { canReplayPlayground } from "./demo-capabilities";
import { demoStates, propsOf, stateOf, translateStates } from "./demo-states";
import { docsNotes } from "./docs-notes";
import { DemoNotes } from "../system/ai/examples/DemoFrame";
import type { DemoFrameNotes } from "../system/ai/examples/DemoFrame";
import { ApiReference } from "./ApiReference";
import { CopyControl } from "./CopyControl";
import { generateCode, generatePrompt } from "./generate";
import { DocsDrawer } from "./DocsDrawer";
interface EventRecord {
  name: string;
  value?: unknown;
}
// Below 1,024px the settings open as a modal Sheet instead of docking.
const narrowQuery = "(width < 1024px)";
function watchNarrow(change: () => void) {
  const query = window.matchMedia(narrowQuery);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const isNarrow = () => window.matchMedia(narrowQuery).matches;
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
/**
 * The component navigation, which the sidebar and the mobile drawer share.
 * A group with sections shows each under its heading; the collapsible one
 * (the AI parts) is a disclosure, and its pages are not rendered while it
 * is closed.
 */
function ComponentNavigation({
  language,
  active,
  partsOpen,
  onPartsOpenChange,
  onOpen,
}: {
  language: Language;
  active: ComponentId;
  partsOpen: boolean;
  onPartsOpenChange: (open: boolean) => void;
  onOpen: (id: ComponentId) => void;
}) {
  const id = useId();
  const page = (item: (typeof navigationGroups)[number]["items"][number]) => (
    <button
      type="button"
      key={item.id}
      aria-current={active === item.id ? "page" : undefined}
      onClick={() => onOpen(item.id)}
    >
      {localize(item.name, language)}
    </button>
  );
  return (
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
            {group.sections
              ? group.sections.map((section) => {
                  const open = !section.collapsible || partsOpen;
                  return (
                    <div key={section.id} className="component-nav-section">
                      <h3
                        className={`component-nav-subheading${section.collapsible ? " component-nav-toggle" : ""}`}
                      >
                        {section.collapsible ? (
                          <button
                            type="button"
                            className="component-nav-disclosure"
                            aria-expanded={partsOpen}
                            aria-controls={`${id}-${section.id}`}
                            onClick={() => onPartsOpenChange(!partsOpen)}
                          >
                            {localize(section.name, language)}
                            <ChevronDown size={14} aria-hidden="true" />
                          </button>
                        ) : (
                          localize(section.name, language)
                        )}
                      </h3>
                      <div
                        id={`${id}-${section.id}`}
                        className="component-nav-items"
                        hidden={!open}
                      >
                        {open && section.items.map(page)}
                        {open &&
                          section.links?.map((link) => (
                            <a
                              key={link.href}
                              className="component-nav-link"
                              href={link.href}
                            >
                              {localize(link.name, language)}
                              <ArrowUpRight
                                size={14}
                                aria-hidden="true"
                                className="tz-mirror-rtl"
                              />
                            </a>
                          ))}
                      </div>
                    </div>
                  );
                })
              : group.items.map(page)}
          </div>
        ))}
      </nav>
    </>
  );
}
export function Workbench() {
  // The Parts disclosure opens for a part's page.
  const [documentation, setDocumentation] = useState(() => {
    const saved = readDocumentation();
    return aiParts.includes(saved.active)
      ? { ...saved, aiPartsOpen: true }
      : saved;
  });
  const language = documentation.language,
    active = documentation.active,
    direction = language === "ar" ? "rtl" : "ltr",
    t = words(language);
  const [settings, setSettings] = useState(readSystem);
  const [theme, setTheme] = useState(readTheme);
  const [playgrounds, setPlaygrounds] = useState(() =>
    readPlaygrounds(language),
  );
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<
    Partial<Record<ComponentId, EventRecord[]>>
  >({});
  const [navigationOpen, setNavigationOpen] = useState(false);
  const narrow = useSyncExternalStore(watchNarrow, isNarrow, () => false);
  // The narrow Sheet's open state lasts the session: it never opens on load.
  const [sheetOpen, setSheetOpen] = useState(false);
  const settingsOpen = narrow ? sheetOpen : documentation.settingsOpen;
  // The docs' own root, where the settings Sheet portals.
  const [shell, setShell] = useState<HTMLDivElement | null>(null);
  const customizeButton = useRef<HTMLButtonElement>(null);
  const settingsTitle = useRef<HTMLHeadingElement>(null);
  const focusSettings = useRef(false);
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
  // Lifecycle phases live for the session only; opening a page starts it at
  // its resting phase. `null` records a press of a state with no phase.
  const [phases, setPhases] = useState<
    Partial<Record<ComponentId, string | null>>
  >({});
  const [replaying, setReplaying] = useState(false);
  const replayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopReplay = useCallback(() => {
    if (replayTimer.current !== null) clearTimeout(replayTimer.current);
    replayTimer.current = null;
    setReplaying(false);
  }, []);
  // A dialog opened from the Open state hands focus back to it on close.
  const openedFromState = useRef(false);
  const stopFocusReturn = useRef<(() => void) | null>(null);
  const playgroundRegion = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
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
    radius: 8,
    reducedMotion: false,
  };
  const current = catalog.find((item) => item.id === active)!;
  const model = playgrounds[active],
    effectiveConfig = previewConfig(systemConfig, model);
  const pageStates = demoStates[active];
  const pressedPhase = phases[active];
  const phase =
    pressedPhase === undefined
      ? pageStates?.states.find((state) => state.id === pageStates.resting)
          ?.phase
      : (pressedPhase ?? undefined);
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
  useEffect(
    () => () => {
      if (replayTimer.current !== null) clearTimeout(replayTimer.current);
      stopFocusReturn.current?.();
    },
    [],
  );
  function record(component: ComponentId, name: string, value?: unknown) {
    setEvents((prev) => ({
      ...prev,
      [component]: [...(prev[component] ?? []).slice(-2), { name, value }],
    }));
  }
  // A remount must never invent a decision or an event. Editing a request
  // voids its decision, as the component does, and a Shown toast would sound
  // again on every edit, so these examples start over at their resting state;
  // a state press still sets its own phase. A refresh waits on its host for a
  // moment, and a remount would drop that wait and hold Updating.
  function restartOnEdit() {
    if (
      active === "agent-task" ||
      active === "suggested-edits" ||
      active === "change-summary" ||
      active === "ask-user-questions" ||
      active === "approval-card" ||
      active === "approval-flow" ||
      active === "toast"
    )
      setPhases((prev) => ({ ...prev, [active]: undefined }));
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
    // An example's overlay never opens over the settings: they close first,
    // and the patch applies without a remount.
    if (
      patch.open === true &&
      settingsOpen &&
      (active === "sheet" || active === "dropdown")
    ) {
      setSettingsOpen(false);
      patchPage(active, patch);
      return;
    }
    patchPage(active, patch);
    // Keep Input's IDs and native editing state through label/help/error edits.
    // Mode/default-value changes still need a fresh uncontrolled demonstration.
    // Image percentages and sizing update the existing request rather than replaying it.
    // Progress, Button and Terminal hold nothing of their own, so a new value
    // or state reaches the mounted example and its transition plays.
    if (
      [
        "data-table",
        "input-copy",
        "image-result",
        "progress",
        "button",
        "terminal",
      ].includes(active)
    )
      return;
    // ThinkingState settles into Done where it stands, so its fade plays;
    // Working starts its run afresh.
    if (active === "thinking-state" && patch.active === false) return;
    // Controlled tabs follow their value, so the indicator glides to it.
    if (
      active === "tabs" &&
      !("mode" in patch) &&
      (model as TabsModel).mode === "controlled"
    )
      return;
    if (
      (active === "file-dropzone" || active === "color-picker") &&
      !("mode" in patch) &&
      !("filled" in patch)
    )
      return;
    if (active === "tag-input" && !("mode" in patch) && !("filled" in patch))
      return;
    if (active === "input" && !("mode" in patch) && !("value" in patch)) return;
    if (
      ["textarea", "checkbox", "radio-group"].includes(active) &&
      !("mode" in patch)
    )
      return;
    restartOnEdit();
    setRevisions((prev) => ({ ...prev, [active]: (prev[active] ?? 0) + 1 }));
  }
  function resetSystem() {
    cancelButtonAction();
    setSettings({ ...defaultSettings });
    setTheme(defaultConfig.theme);
  }
  // The one way back to a page's start: its props, its phase and the example.
  function resetPlayground() {
    if (active === "button") cancelButtonAction();
    stopReplay();
    setPlaygrounds((prev) => ({
      ...prev,
      [active]: defaultPlaygrounds(language)[active],
    }));
    setEvents((prev) => ({ ...prev, [active]: [] }));
    setPhases((prev) => ({ ...prev, [active]: undefined }));
    setRevisions((prev) => ({ ...prev, [active]: (prev[active] ?? 0) + 1 }));
  }
  function openPage(id: ComponentId) {
    cancelButtonAction();
    stopReplay();
    openedFromState.current = false;
    stopFocusReturn.current?.();
    setPhases({});
    setDocumentation((prev) => ({
      ...prev,
      active: id,
      aiPartsOpen: prev.aiPartsOpen || aiParts.includes(id),
    }));
    // The new page opens at its top, not where the old one was scrolled to.
    window.scrollTo(0, 0);
  }
  // A props state takes the inspector's path, so it persists, cancels the
  // simulated click and remounts where an edit would.
  function applyState(id: string) {
    const state = pageStates?.states.find((item) => item.id === id);
    if (!state) return;
    // A state without a phase clears it, so the switcher can show that state.
    setPhases((prev) => ({ ...prev, [active]: state.phase ?? null }));
    if (state.props) fromInspector(propsOf(state, language));
  }
  const applyLatest = useRef(applyState);
  useEffect(() => {
    applyLatest.current = applyState;
  });
  function pressState(id: string) {
    stopReplay();
    stopFocusReturn.current?.();
    applyState(id);
    // A phase starts its example afresh, dropping what the visitor did and
    // anything still waiting on the host.
    if (pageStates?.states.find((state) => state.id === id)?.phase)
      setRevisions((prev) => ({ ...prev, [active]: (prev[active] ?? 0) + 1 }));
    openedFromState.current = id === "open";
  }
  function playReplay() {
    const steps = pageStates?.replay;
    if (!steps) return;
    if (replayTimer.current !== null) clearTimeout(replayTimer.current);
    openedFromState.current = false;
    // The example starts over, even when it is already in the first phase.
    setRevisions((prev) => ({ ...prev, [active]: (prev[active] ?? 0) + 1 }));
    // Raised with the first step, so the frame stays silent until the end.
    setReplaying(true);
    const play = (index: number) => {
      applyLatest.current(steps[index].state);
      replayTimer.current = setTimeout(() => {
        if (index + 1 < steps.length) play(index + 1);
        else {
          replayTimer.current = null;
          setReplaying(false);
        }
      }, steps[index].ms);
    };
    play(0);
  }
  // Radix gives focus back to the dialog's own trigger once it has closed.
  // When the Open state opened it, focus moves on to that state instead.
  function returnFocusToOpenState() {
    stopFocusReturn.current?.();
    const index = pageStates!.states.findIndex((state) => state.id === "open");
    const region = playgroundRegion.current;
    const stop = () => {
      document.removeEventListener("focusin", onFocus);
      stopFocusReturn.current = null;
    };
    function onFocus(event: FocusEvent) {
      const target = event.target as Element;
      // Focus still inside the closing dialog, or the frame, is not the return.
      if (region?.contains(target) && !target.closest(".playground-canvas"))
        return;
      stop();
      if (target.closest(".playground-canvas"))
        region
          ?.querySelectorAll<HTMLElement>(".tz-demo-states button")
          [index]?.focus();
    }
    document.addEventListener("focusin", onFocus);
    stopFocusReturn.current = stop;
  }
  function changeLanguage(next: Language) {
    if (next === language) return;
    cancelButtonAction();
    setPlaygrounds((prev) =>
      translateStates(translateDefaults(prev, language, next), language, next),
    );
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
  function setSettingsOpen(open: boolean) {
    if (narrow) return setSheetOpen(open);
    setDocumentation((prev) =>
      prev.settingsOpen === open ? prev : { ...prev, settingsOpen: open },
    );
  }
  // «تخصيص» opens the docked panel with focus on its title; closing it from
  // inside hands focus back to «تخصيص».
  function toggleSettings() {
    focusSettings.current = !settingsOpen;
    setSettingsOpen(!settingsOpen);
  }
  function closeSettings() {
    setSettingsOpen(false);
    customizeButton.current?.focus();
  }
  useEffect(() => {
    if (!focusSettings.current) return;
    focusSettings.current = false;
    settingsTitle.current?.focus();
  }, [settingsOpen]);
  const pageNotes = docsNotes[active];
  const notes: DemoFrameNotes | undefined = pageNotes && {
    useWhen: pageNotes.useWhen.map((item) => localize(item, language)),
    instead: pageNotes.instead?.map(({ text, page }) => (
      <>
        {localize(text, language)}
        {page && (
          <>
            {" "}
            <button
              type="button"
              className="note-link"
              onClick={() => {
                openPage(page);
                mainRef.current?.focus();
              }}
            >
              {localize(
                catalog.find((item) => item.id === page)!.name,
                language,
              )}
            </button>
          </>
        )}
      </>
    )),
    replaces: pageNotes.replaces?.map((page) => (
      <button
        key={page}
        type="button"
        className="note-link"
        onClick={() => {
          openPage(page);
          mainRef.current?.focus();
        }}
      >
        {localize(catalog.find((item) => item.id === page)!.name, language)}
      </button>
    )),
    notice: pageNotes.notice?.map((item) => localize(item, language)),
  };
  const inspector = (
    <Inspector
      key={active}
      component={active}
      name={localize(current.name, language)}
      model={model}
      language={language}
      onPatch={fromInspector}
      onReset={resetPlayground}
    />
  );
  const navigation = (
    <ComponentNavigation
      language={language}
      active={active}
      partsOpen={documentation.aiPartsOpen}
      onPartsOpenChange={(open) =>
        setDocumentation((prev) => ({ ...prev, aiPartsOpen: open }))
      }
      onOpen={(id) => {
        openPage(id);
        setNavigationOpen(false);
      }}
    />
  );
  const appearance = (
    <Appearance
      config={systemConfig}
      language={language}
      onChange={setSettings}
      onReset={resetSystem}
    />
  );
  const copySettings = (
    <CopyControl
      text={JSON.stringify(systemConfig, null, 2)}
      caption={label("copyConfig", language)}
      language={language}
      iconOnly
    />
  );
  // «تخصيص» sits in the playground's toolbar. From 1,024px it opens the
  // docked panel; below, it is the trigger of a Sheet with the same content.
  const customizePill = (
    <button
      ref={customizeButton}
      type="button"
      className="customize-pill"
      aria-expanded={settingsOpen}
      {...(narrow
        ? {}
        : { "aria-controls": "settings-panel", onClick: toggleSettings })}
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      <span>{label("customize", language)}</span>
    </button>
  );
  const customize = narrow ? (
    // The docs' settings and root, not the preview's, which the toolbar has.
    <SystemContext.Provider
      value={{ config: documentationConfig, container: shell }}
    >
      <Sheet
        trigger={customizePill}
        title={label("customizeTitle", language)}
        description={label("customizeHint", language)}
        closeLabel={label("closeCustomize", language)}
        side={direction === "rtl" ? "left" : "right"}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        footer={
          <>
            <p className="settings-saved">{label("savedHere", language)}</p>
            {copySettings}
          </>
        }
      >
        <div className="settings-body">
          {inspector}
          {appearance}
        </div>
      </Sheet>
    </SystemContext.Provider>
  ) : (
    customizePill
  );
  return (
    <SystemProvider config={documentationConfig}>
      <div className="docs-shell" ref={setShell}>
        <a className="skip-link" href="#main-content">
          {t("انتقل إلى المحتوى", "Skip to content")}
        </a>
        <header className="docs-header">
          <a
            className="docs-brand"
            href="#main-content"
            onClick={() => openPage("button")}
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
        <div
          className="docs-layout"
          data-settings={!narrow && settingsOpen ? "open" : undefined}
        >
          <aside
            className="docs-sidebar"
            aria-label={t("تنقّل المكوّنات", "Component navigation")}
          >
            {navigation}
          </aside>
          <div className="docs-workspace">
            <main
              ref={mainRef}
              id="main-content"
              className="component-page"
              tabIndex={-1}
            >
              <header className="component-heading">
                <h1>{localize(current.name, language)}</h1>
                <p>{localize(current.description, language)}</p>
              </header>
              <section className="agent-section">
                <h2 id="agent-heading">{label("useInApp", language)}</h2>
                <div className="prompt-row">
                  {/* The prompt is English on every page; its heading and
                      copy control follow the page. */}
                  <p className="prompt-preview" lang="en" dir="ltr">
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
                <div className="playground-region" ref={playgroundRegion}>
                  <SystemProvider config={effectiveConfig}>
                    <PreviewFrame
                      // One frame per page, so a page change is never
                      // announced as a state change.
                      key={active}
                      language={language}
                      code={code}
                      replayable={canReplayPlayground(active)}
                      onReplay={playReplay}
                      states={pageStates?.states.map((state) => ({
                        id: state.id,
                        label: { ar: state.label[0], en: state.label[1] },
                      }))}
                      state={stateOf(active, model, phase, language)}
                      onStateChange={pressState}
                      customize={customize}
                      // The stored props and settings open with it; the
                      // phase, which is not stored, rides along.
                      openHref={`/examples/playground/${active}${phase ? `?phase=${encodeURIComponent(phase)}` : ""}`}
                      onViewChange={(view) => {
                        if (view === "code") stopReplay();
                      }}
                      replaying={replaying}
                    >
                      <div
                        className={`playground-canvas playground-${active}`}
                        role="region"
                        aria-labelledby="playground-heading"
                      >
                        <Playground
                          key={`${active}-${revisions[active] ?? 0}`}
                          component={active}
                          model={model}
                          language={language}
                          onPatch={(patch) => {
                            patchPage(active, patch);
                            if (
                              patch.open === false &&
                              openedFromState.current
                            ) {
                              openedFromState.current = false;
                              returnFocusToOpenState();
                            }
                          }}
                          onEvent={(name, value) => record(active, name, value)}
                          onButtonAction={buttonAction}
                          buttonState={buttonFeedback ?? undefined}
                          phase={phase}
                          onPhaseChange={(next) => {
                            // The visitor moved the example on, which ends
                            // a Replay before its next step overwrites it.
                            stopReplay();
                            setPhases((prev) => ({ ...prev, [active]: next }));
                          }}
                        />
                      </div>
                    </PreviewFrame>
                  </SystemProvider>
                </div>
                {![
                  "skeleton",
                  "progress",
                  "spinner",
                  "badge",
                  "avatar",
                  "avatar-group",
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
              {notes && (
                <section
                  className="guidelines-section"
                  aria-labelledby="guidelines-heading"
                >
                  <div className="section-title-row">
                    <h2 id="guidelines-heading">
                      {label("guidelines", language)}
                    </h2>
                  </div>
                  <DemoNotes notes={notes} language={language} />
                </section>
              )}
              <ApiReference component={active} language={language} />
            </main>
          </div>
          {!narrow && (
            // Docked at the end side, it pushes the page narrower rather than
            // covering it. It stays mounted while closed, so it can slide out.
            <aside
              id="settings-panel"
              className="settings-panel"
              aria-labelledby="settings-title"
              hidden={!settingsOpen}
              onKeyDown={(event) => {
                if (event.key !== "Escape" || event.defaultPrevented) return;
                event.preventDefault();
                closeSettings();
              }}
            >
              <header className="settings-header">
                <div>
                  <h2 id="settings-title" ref={settingsTitle} tabIndex={-1}>
                    {label("customizeTitle", language)}
                  </h2>
                  <p>{label("customizeHint", language)}</p>
                </div>
                <div className="settings-actions">
                  {copySettings}
                  <button
                    type="button"
                    className="tz-icon-button settings-close"
                    aria-label={label("closeCustomize", language)}
                    title={label("closeCustomize", language)}
                    onClick={closeSettings}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              </header>
              <div className="settings-body">
                {inspector}
                {appearance}
              </div>
              <p className="settings-saved">{label("savedHere", language)}</p>
            </aside>
          )}
        </div>
      </div>
    </SystemProvider>
  );
}
