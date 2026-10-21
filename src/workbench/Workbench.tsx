import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties } from "react";
import { ArrowUpRight, SlidersHorizontal, X } from "lucide-react";
import { SidebarSimpleIcon } from "@phosphor-icons/react/dist/csr/SidebarSimple";
import { MoonIcon } from "@phosphor-icons/react/dist/csr/Moon";
import { SunIcon } from "@phosphor-icons/react/dist/csr/Sun";
import { NavigationIcon } from "./NavigationIcon";
import { Sheet, SystemProvider, defaultConfig } from "../system";
import { SystemContext } from "../system/useSystem";
import type { ButtonState, SystemConfig } from "../system";
import { screenPath, screens } from "../examples/frame/screen";
import type { ScreenSlug } from "../examples/frame/screen";
import {
  catalog,
  navigationGroups,
  screenUses,
  nestedParts,
  relatedPages,
} from "./catalog";
import type { ComponentId } from "./catalog";
import { label, localize, words } from "./i18n";
import type { Language, Localized } from "./i18n";
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
import { destination, readSiteRoute, routePath } from "./site-routes";
import type { SiteRoute } from "./site-routes";
import { SiteLink } from "./SiteLink";
import { LibraryPage } from "./LibraryPage";
import { GuidePage } from "./GuidePage";
import { guides } from "./guides";
import { IllustrationsPage } from "./IllustrationsPage";
import { illustrations } from "./illustrations";
import "./site.css";
import "./site-sidebar.css";
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
/** Curated library navigation shared by the sidebar and mobile drawer. */
function ComponentNavigation({
  language,
  active,
  screen,
  onOpen,
  onOpenScreen,
}: {
  language: Language;
  active: ComponentId;
  screen: ScreenSlug | null;
  onOpen: (id: ComponentId) => void;
  onOpenScreen: (slug: ScreenSlug) => void;
}) {
  const parent = nestedParts[active as keyof typeof nestedParts];
  return (
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
          <div className="component-nav-items">
            {group.items.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-current={
                  !screen && (active === item.id || parent === item.id)
                    ? "page"
                    : undefined
                }
                onClick={() => onOpen(item.id)}
              >
                {localize(item.name, language)}
              </button>
            ))}
            {group.id === "screens" &&
              screens.map((item) => (
                <button
                  type="button"
                  key={item.slug}
                  aria-current={screen === item.slug ? "page" : undefined}
                  onClick={() => onOpenScreen(item.slug)}
                >
                  <item.icon size={22} weight="duotone" aria-hidden="true" />
                  <span>{localize(item.name, language)}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
type ScreenWidth = "desktop" | "tablet" | "phone";
const screenWidths: readonly { id: ScreenWidth; name: Localized }[] = [
  { id: "desktop", name: ["سطح المكتب", "Desktop"] },
  { id: "tablet", name: ["جهاز لوحي", "Tablet"] },
  { id: "phone", name: ["هاتف", "Phone"] },
];
/** The window a screen gets on Desktop, scaled down to the stage's width. */
const desktopWidth = 1280;
/** A stage narrower than this can't hold a tablet, so a page starts on Phone. */
const tabletWidth = 768;
/**
 * An example screen's page in the docs: its name and description, the width
 * chips and the new-tab link, the screen itself in an iframe that follows the
 * docs' language and theme, then the docs pages it is built from.
 */
function ScreenPage({
  slug,
  language,
  theme,
  width,
  onWidthChange,
  onOpenPage,
}: {
  slug: ScreenSlug;
  language: Language;
  theme: SystemConfig["theme"];
  width: ScreenWidth | null;
  onWidthChange: (width: ScreenWidth) => void;
  onOpenPage: (id: ComponentId) => void;
}) {
  const t = words(language);
  const item = screens.find((entry) => entry.slug === slug)!;
  const name = localize(item.name, language);
  const query = [
    language === "en" && "lang=en",
    theme === "dark" && "theme=dark",
  ].filter(Boolean);
  const standalone = query.length
    ? `${screenPath(slug)}?${query.join("&")}`
    : screenPath(slug);
  const src = `${screenPath(slug)}?${["embed=1", ...query].join("&")}`;
  const openName = t("افتح في نافذة جديدة", "Open in a new tab");
  // Until a chip is picked the page shows Desktop, and the stage's first
  // measure below decides whether it starts there.
  const shown = width ?? "desktop";
  // On Desktop the screen gets a 1,280px window, which the stage is narrower
  // than, so it is scaled to the stage's width. The stage keeps its height, so
  // the window is that height divided by the scale: scaled, it fills the stage
  // exactly, and the screen gets a taller viewport instead of a shorter stage.
  // Both follow the stage as it resizes; Tablet and Phone are never scaled.
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [windowHeight, setWindowHeight] = useState<number>();
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element || shown !== "desktop") return;
    const measure = (size: { width: number; height: number }) => {
      if (size.width <= 0 || size.height <= 0) return;
      // The first measure of a page with no chip picked decides where it
      // starts: Desktop in a stage narrower than a tablet would be a
      // thumbnail, so it starts on Phone. After that only a click changes it.
      if (width === null)
        onWidthChange(size.width < tabletWidth ? "phone" : "desktop");
      const fit = Math.min(1, size.width / desktopWidth);
      setScale(fit);
      setWindowHeight(size.height / fit);
    };
    measure({ width: element.clientWidth, height: element.clientHeight });
    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [shown, width, onWidthChange]);
  return (
    <>
      <header className="component-heading">
        <h1>{name}</h1>
        <p>{localize(item.description, language)}</p>
      </header>
      <div className="docs-screen-preview">
        <div className="tz-demo-bar">
          <div
            className="tz-demo-states"
            role="group"
            aria-label={t("عرض المعاينة", "Preview width")}
          >
            {screenWidths.map((option) => (
              <button
                key={option.id}
                type="button"
                className="tz-demo-state"
                aria-pressed={shown === option.id}
                onClick={() => onWidthChange(option.id)}
              >
                {localize(option.name, language)}
              </button>
            ))}
          </div>
          <a
            className="tz-demo-icon"
            href={standalone}
            target="_blank"
            rel="noopener"
            aria-label={openName}
            title={openName}
          >
            {/* Out and forward: the arrow follows the reading direction. */}
            <ArrowUpRight
              className="tz-mirror-rtl"
              size={18}
              aria-hidden="true"
            />
          </a>
        </div>
        <div
          ref={stage}
          className="docs-screen-stage"
          data-width={shown}
          style={
            shown === "desktop"
              ? ({
                  "--screen-scale": scale,
                  "--screen-window-height":
                    windowHeight === undefined
                      ? undefined
                      : `${windowHeight}px`,
                } as CSSProperties)
              : undefined
          }
        >
          {/* A new src mounts a new iframe, so changing the screen, language
              or theme adds nothing to the browser's history. */}
          <iframe key={src} title={name} src={src} />
        </div>
      </div>
      <section
        className="docs-screen-uses"
        aria-labelledby="screen-uses-heading"
      >
        <div className="section-title-row">
          <h2 id="screen-uses-heading">
            {t("على هذه الشاشة", "On this screen")}
          </h2>
        </div>
        <ul className="docs-screen-pages">
          {screenUses[slug].map((id) => (
            <li key={id}>
              <button type="button" onClick={() => onOpenPage(id)}>
                {localize(
                  catalog.find((entry) => entry.id === id)!.name,
                  language,
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
export function Workbench() {
  const [documentation, setDocumentation] = useState(() => {
    const saved = readDocumentation(),
      initial = readSiteRoute(new URL(window.location.href), saved);
    return initial.kind === "component"
      ? { ...saved, active: initial.id, screen: null }
      : initial.kind === "screen"
        ? { ...saved, screen: initial.slug }
        : saved;
  });
  const [route, setRoute] = useState(() =>
    readSiteRoute(new URL(window.location.href), readDocumentation()),
  );
  const initialRoute = useRef(route);
  const language = documentation.language,
    active = route.kind === "component" ? route.id : documentation.active,
    screenSlug = route.kind === "screen" ? route.slug : null,
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
  const navigationSelection = useRef(false);
  const [navigationHidden, setNavigationHidden] = useState(false);
  const [mobileNavigation, setMobileNavigation] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  const navigationId = useId();
  const navigationToggle = useRef<HTMLButtonElement>(null);
  const navigationPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const change = () => {
      setMobileNavigation(query.matches);
      if (!query.matches) setNavigationOpen(false);
      else if (navigationPanel.current?.contains(document.activeElement))
        navigationToggle.current?.focus();
    };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  // The screen pages' width chip lasts the session. It is unset until the
  // first screen page measures its stage (or the person picks a chip).
  const [screenWidth, setScreenWidth] = useState<ScreenWidth | null>(null);
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
  const focusRoute = useRef(false);
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
  const pageName =
    route.kind === "library"
      ? (["المكتبة", "Library"] as const)
      : route.kind === "docs"
        ? guides.find((item) => item.id === route.guide)!.name
        : route.kind === "illustrations"
          ? (illustrations.find((item) => item.id === route.id)?.name ??
            (["الرسوم التوضيحية", "Illustrations"] as const))
          : route.kind === "not-found"
            ? (["الصفحة غير موجودة", "Page not found"] as const)
            : screenSlug
              ? screens.find((item) => item.slug === screenSlug)!.name
              : current.name;
  const pageTitle = localize(pageName, language);
  useEffect(() => {
    document.title = `${language === "ar" ? "طِراز" : "Tiraz"} · ${pageTitle}`;
    persist(storageKeys.documentation, documentation);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    document.documentElement.style.colorScheme = theme;
  }, [
    documentation,
    direction,
    language,
    pageTitle,
    theme,
    active,
    screenSlug,
  ]);
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
      active === "decision-inbox" ||
      active === "draft-review" ||
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
  const navigate = useCallback(
    (next: SiteRoute, history = true) => {
      const samePath =
        window.location.pathname + window.location.search === routePath(next);
      const keepFilterFocus =
        history &&
        next.kind === "library" &&
        Boolean(document.activeElement?.closest(".library-category"));
      cancelButtonAction();
      stopReplay();
      openedFromState.current = false;
      stopFocusReturn.current?.();
      setPhases({});
      setSheetOpen(false);
      navigationSelection.current = true;
      setNavigationOpen(false);
      setDocumentation((prev) =>
        next.kind === "component"
          ? { ...prev, active: next.id, screen: null }
          : next.kind === "screen"
            ? { ...prev, screen: next.slug }
            : prev,
      );
      if (history && !samePath)
        window.history.pushState({}, "", routePath(next));
      focusRoute.current = !keepFilterFocus;
      setRoute(next);
      if (!keepFilterFocus) window.scrollTo(0, 0);
    },
    [cancelButtonAction, stopReplay],
  );
  function openPage(id: ComponentId) {
    navigate({ kind: "component", id });
  }
  const openScreen = useCallback(
    (slug: ScreenSlug) => navigate({ kind: "screen", slug }),
    [navigate],
  );
  useEffect(() => {
    // A fresh / visit uses preferences; returning to that history entry must
    // restore the page it originally showed, even after preferences change.
    if (window.location.pathname === "/")
      window.history.replaceState(
        { ...window.history.state, tirazPath: routePath(initialRoute.current) },
        "",
      );
    const onPop = () => {
      const savedPath =
        window.location.pathname === "/" && window.history.state?.tirazPath;
      const url = new URL(
        typeof savedPath === "string" ? savedPath : window.location.href,
        window.location.origin,
      );
      navigate(readSiteRoute(url, readDocumentation()), false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate]);
  useLayoutEffect(() => {
    if (focusRoute.current) {
      focusRoute.current = false;
      mainRef.current?.focus();
    }
  }, [route]);
  // A screen in the iframe asks for another screen's page; anything else, or
  // from anywhere else, is ignored. The iframe holds focus and the new page
  // replaces it, so focus moves to main first, as «على هذه الشاشة» does, and
  // doesn't drop to the page.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data: unknown = event.data;
      if (event.origin !== window.location.origin) return;
      if (typeof data !== "object" || data === null) return;
      const { type, slug } = data as { type?: unknown; slug?: unknown };
      const target = screens.find((item) => item.slug === slug);
      if (
        type === "tiraz:open-screen" &&
        target &&
        screenSlug &&
        target.slug !== screenSlug
      ) {
        openScreen(target.slug);
        mainRef.current?.focus();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [openScreen, screenSlug]);
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
  const siteDestination = destination(route);
  const navigationName =
    siteDestination === "docs"
      ? t("التوثيق", "Docs")
      : siteDestination === "illustrations"
        ? t("الرسوم التوضيحية", "Illustrations")
        : label("components", language);
  const navigation =
    route.kind === "library" ? (
      <nav
        className="component-nav site-secondary"
        aria-label={t("تصنيفات المكتبة", "Library categories")}
      >
        <h2 className="component-nav-heading">{t("المكتبة", "Library")}</h2>
        <div className="component-nav-items">
          <SiteLink
            route={{ kind: "library" }}
            navigate={navigate}
            aria-current={!route.category ? "page" : undefined}
          >
            <NavigationIcon id="all" />
            <span>{t("كل المكتبة", "All items")}</span>
          </SiteLink>
          {navigationGroups.map((group) => (
            <SiteLink
              key={group.id}
              route={{ kind: "library", category: group.id }}
              navigate={navigate}
              aria-current={route.category === group.id ? "page" : undefined}
            >
              <NavigationIcon id={group.id} />
              <span>{localize(group.name, language)}</span>
            </SiteLink>
          ))}
        </div>
      </nav>
    ) : route.kind === "docs" ? (
      <nav className="component-nav site-secondary" aria-label={navigationName}>
        <h2 className="component-nav-heading">{t("ابدأ هنا", "Start here")}</h2>
        <div className="component-nav-items">
          {guides.map((item) => (
            <SiteLink
              key={item.id}
              route={{ kind: "docs", guide: item.id }}
              navigate={navigate}
              aria-current={route.guide === item.id ? "page" : undefined}
            >
              <NavigationIcon id={item.id} />
              <span>{localize(item.name, language)}</span>
            </SiteLink>
          ))}
        </div>
      </nav>
    ) : route.kind === "illustrations" ? (
      <nav className="component-nav site-secondary" aria-label={navigationName}>
        <h2 className="component-nav-heading">
          {t("الرسوم التوضيحية", "Illustrations")}
        </h2>
        <div className="component-nav-items">
          <SiteLink
            route={{ kind: "illustrations" }}
            navigate={navigate}
            aria-current={!route.id ? "page" : undefined}
          >
            <NavigationIcon id="all" />
            <span>{t("كل الرسوم", "All illustrations")}</span>
          </SiteLink>
          {illustrations.map((item) => (
            <SiteLink
              key={item.id}
              route={{ kind: "illustrations", id: item.id }}
              navigate={navigate}
              aria-current={route.id === item.id ? "page" : undefined}
            >
              <NavigationIcon id={item.id} />
              <span>{localize(item.name, language)}</span>
            </SiteLink>
          ))}
        </div>
      </nav>
    ) : (
      <ComponentNavigation
        language={language}
        active={active}
        screen={screenSlug}
        onOpen={openPage}
        onOpenScreen={openScreen}
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
      <div
        className="docs-shell"
        ref={setShell}
        data-navigation-hidden={navigationHidden}
        data-mobile-navigation={mobileNavigation}
      >
        <a className="skip-link" href="#main-content">
          {t("انتقل إلى المحتوى", "Skip to content")}
        </a>
        <header className="docs-header">
          <div className="docs-header-start">
            <DocsDrawer
              title={navigationName}
              language={language}
              portalContainer={shell}
              open={navigationOpen}
              onOpenChange={(open) => {
                if (mobileNavigation) {
                  if (open) navigationSelection.current = false;
                  setNavigationOpen(open);
                } else setNavigationHidden((hidden) => !hidden);
              }}
              onClosed={() => {
                if (!navigationSelection.current) return false;
                navigationSelection.current = false;
                mainRef.current?.focus();
                return true;
              }}
              trigger={
                <button
                  ref={navigationToggle}
                  type="button"
                  className="doc-icon-button docs-navigation-toggle"
                  aria-label={
                    mobileNavigation
                      ? t("فتح القائمة", "Open navigation")
                      : navigationHidden
                        ? t("إظهار القائمة الجانبية", "Show navigation")
                        : t("إخفاء القائمة الجانبية", "Hide navigation")
                  }
                  aria-haspopup={mobileNavigation ? "dialog" : undefined}
                  {...(!mobileNavigation
                    ? {
                        "aria-expanded": !navigationHidden,
                        "aria-controls": navigationId,
                      }
                    : {})}
                >
                  <SidebarSimpleIcon
                    size={22}
                    weight="regular"
                    className="tz-mirror-rtl"
                    aria-hidden="true"
                  />
                </button>
              }
            >
              {navigation}
            </DocsDrawer>
            <SiteLink
              className="docs-brand"
              route={{ kind: "library" }}
              navigate={navigate}
            >
              <BrandMark />
              <span>{t("طِراز", "Tiraz")}</span>
            </SiteLink>
          </div>
          <nav
            className="site-primary"
            aria-label={t("التنقّل الرئيسي", "Primary navigation")}
          >
            <SiteLink
              route={{ kind: "library" }}
              navigate={navigate}
              aria-current={siteDestination === "library" ? "page" : undefined}
            >
              {t("المكتبة", "Library")}
            </SiteLink>
            <SiteLink
              route={{ kind: "docs", guide: "introduction" }}
              navigate={navigate}
              aria-current={siteDestination === "docs" ? "page" : undefined}
            >
              {t("التوثيق", "Docs")}
            </SiteLink>
            <SiteLink
              route={{ kind: "illustrations" }}
              navigate={navigate}
              aria-current={
                siteDestination === "illustrations" ? "page" : undefined
              }
            >
              {t("الرسوم التوضيحية", "Illustrations")}
            </SiteLink>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="doc-button language-control"
              title={t("التبديل إلى الإنجليزية", "Switch to Arabic")}
              onClick={() => changeLanguage(language === "ar" ? "en" : "ar")}
            >
              <span lang={language === "ar" ? "en" : "ar"}>
                {language === "ar" ? "English" : "العربية"}
              </span>
            </button>
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
              {theme === "light" ? (
                <MoonIcon size={20} weight="regular" aria-hidden="true" />
              ) : (
                <SunIcon size={20} weight="regular" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>
        <div
          className="docs-layout"
          data-settings={
            !narrow && settingsOpen && route.kind === "component"
              ? "open"
              : undefined
          }
        >
          <aside
            id={navigationId}
            ref={navigationPanel}
            inert={navigationHidden}
            aria-hidden={navigationHidden || undefined}
            onKeyDown={(event) => {
              if (event.key !== "Escape" || event.defaultPrevented) return;
              event.preventDefault();
              navigationToggle.current?.focus();
              setNavigationHidden(true);
            }}
            className="docs-sidebar"
            aria-label={
              siteDestination === "library"
                ? t("تنقّل المكوّنات", "Component navigation")
                : navigationName
            }
          >
            <div className="docs-navigation-inner">{navigation}</div>
          </aside>
          <div className="docs-workspace">
            <main
              ref={mainRef}
              id="main-content"
              className={`component-page site-${route.kind}`}
              tabIndex={-1}
            >
              {route.kind === "library" ? (
                <LibraryPage
                  language={language}
                  theme={theme}
                  category={route.category}
                  navigate={navigate}
                />
              ) : route.kind === "docs" ? (
                <GuidePage
                  guideId={route.guide}
                  language={language}
                  navigate={navigate}
                />
              ) : route.kind === "illustrations" ? (
                <IllustrationsPage
                  key={route.id ?? "gallery"}
                  id={route.id}
                  language={language}
                  navigate={navigate}
                />
              ) : route.kind === "not-found" ? (
                <div className="site-not-found">
                  <h1>{t("الصفحة غير موجودة", "Page not found")}</h1>
                  <p>
                    {t(
                      "قد يكون الرابط قديمًا. يمكنك العثور على الشاشات والمكوّنات في المكتبة.",
                      "This link may be out of date. Find screens and components in the Library.",
                    )}
                  </p>
                  <SiteLink
                    className="site-action"
                    route={{ kind: "library" }}
                    navigate={navigate}
                  >
                    {t("العودة إلى المكتبة", "Back to the Library")}
                  </SiteLink>
                </div>
              ) : screenSlug ? (
                <ScreenPage
                  slug={screenSlug}
                  language={language}
                  theme={theme}
                  width={screenWidth}
                  onWidthChange={setScreenWidth}
                  onOpenPage={(id) => {
                    openPage(id);
                    mainRef.current?.focus();
                  }}
                />
              ) : (
                <>
                  <header className="component-heading">
                    {nestedParts[active as keyof typeof nestedParts] && (
                      <SiteLink
                        className="site-back"
                        navigate={navigate}
                        route={{
                          kind: "component",
                          id: nestedParts[active as keyof typeof nestedParts],
                        }}
                      >
                        {localize(
                          catalog.find(
                            (item) =>
                              item.id ===
                              nestedParts[active as keyof typeof nestedParts],
                          )!.name,
                          language,
                        )}
                      </SiteLink>
                    )}
                    <h1>{localize(current.name, language)}</h1>
                    <p>{localize(current.description, language)}</p>
                  </header>
                  <section className="playground-section">
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
                            aria-label={label("playground", language)}
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
                              onEvent={(name, value) =>
                                record(active, name, value)
                              }
                              onButtonAction={buttonAction}
                              buttonState={buttonFeedback ?? undefined}
                              phase={phase}
                              onPhaseChange={(next) => {
                                // The visitor moved the example on, which ends
                                // a Replay before its next step overwrites it.
                                stopReplay();
                                setPhases((prev) => ({
                                  ...prev,
                                  [active]: next,
                                }));
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
                  {relatedPages[active] && (
                    <section
                      className="related-components"
                      role="region"
                      aria-labelledby="related-heading"
                    >
                      <h2 id="related-heading">
                        {t("مكوّنات ذات صلة", "Related components")}
                      </h2>
                      <div>
                        {relatedPages[active]!.map((id) => (
                          <SiteLink
                            key={id}
                            route={{ kind: "component", id }}
                            navigate={navigate}
                          >
                            {localize(
                              catalog.find((item) => item.id === id)!.name,
                              language,
                            )}
                            <ArrowUpRight
                              className="tz-mirror-rtl"
                              size={16}
                              aria-hidden="true"
                            />
                          </SiteLink>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </main>
          </div>
          {!narrow && route.kind === "component" && (
            // Docked at the end side, it pushes the page narrower rather than
            // covering it. It stays mounted while closed, so it can slide out.
            // A screen page has no settings.
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
