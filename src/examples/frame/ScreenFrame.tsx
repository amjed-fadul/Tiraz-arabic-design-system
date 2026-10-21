import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, Menu, Moon, Sun } from "lucide-react";
import {
  Avatar,
  Button,
  Sheet,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarIdentity,
  SidebarItem,
  SidebarLabel,
  SidebarToggle,
  SystemProvider,
  ToastProvider,
  defaultConfig,
  numberLocale,
} from "../../system";
import type { SystemConfig } from "../../system";
import { money } from "../../system/ai/examples/finance-story";
import { ScreenContext, screenPath, screens, useScreen } from "./screen";
import type { Screen, ScreenSlug } from "./screen";
import "./screen-frame.css";
import sara from "../../system/ai/assets/sara.jpg";
import {
  ScreenDemoControls,
  ScreenDemoProvider,
  ScreenOpeningActivity,
} from "./ScreenDemo";

/** Asks the docs around the iframe to open a screen's page. */
function openInDocs(slug: ScreenSlug) {
  window.parent.postMessage(
    { type: "tiraz:open-screen", slug },
    window.location.origin,
  );
}

/** The screen a link opens, when its href is one of the screens' routes. */
function screenOf(link: Element): ScreenSlug | undefined {
  const href = link.getAttribute("href");
  // An in-page link, such as the skip link, stays on this screen, and a link
  // that names another target opens there.
  if (!href || href.startsWith("#")) return undefined;
  const target = link.getAttribute("target");
  if (target && target !== "_self") return undefined;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return undefined;
  const path = url.pathname.replace(/\/$/, "");
  return screens.find((item) => screenPath(item.slug) === path)?.slug;
}

/**
 * The shell every example screen renders in: a Sidebar of the screens, a bar
 * with the language and theme buttons, and main, the size container `screen`.
 * It is Arabic, light and standalone unless the URL says ?lang=en, ?theme=dark
 * or ?embed=1. Embedded in the docs, it hides those buttons and the docs link,
 * and hands every plain click on a screen's link to the docs.
 */
export function ScreenFrame({
  slug,
  children,
}: {
  slug: ScreenSlug;
  children: ReactNode;
}) {
  const [start] = useState(() => new URLSearchParams(window.location.search));
  const [language, setLanguage] = useState<"ar" | "en">(() =>
    start.get("lang") === "en" ? "en" : "ar",
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    start.get("theme") === "dark" ? "dark" : "light",
  );
  const embedded = start.get("embed") === "1";
  const direction = language === "ar" ? "rtl" : "ltr";
  const config = useMemo<SystemConfig>(
    () => ({ ...defaultConfig, direction, theme }),
    [direction, theme],
  );
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [size, setSize] = useState<Screen["size"]>("wide");
  const host = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const current = screens.find((item) => item.slug === slug)!;
  const name = current.name[language === "ar" ? 0 : 1];
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = direction;
    root.style.colorScheme = theme;
    document.title = `${language === "ar" ? "طِراز" : "Tiraz"} · ${name}`;
  }, [language, direction, theme, name]);
  // `size` follows main's content width, as the container queries do. It
  // starts wide; a test can swap in a ResizeObserver that reports
  // `contentRect.width`.
  useEffect(() => {
    const element = main.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = entry.contentRect.width;
      setSize(width >= 960 ? "wide" : width >= 640 ? "medium" : "narrow");
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // Embedded, a plain click on a link to a screen opens that screen's page in
  // the docs instead. The link keeps its standalone href, so a middle or
  // modified click still opens the screen on its own.
  useEffect(() => {
    const element = host.current;
    if (!embedded || !element) return;
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      const target = link ? screenOf(link) : undefined;
      if (!target) return;
      event.preventDefault();
      openInDocs(target);
    };
    element.addEventListener("click", onClick, true);
    return () => element.removeEventListener("click", onClick, true);
  }, [embedded]);
  const screen = useMemo<Screen>(() => {
    const locale = numberLocale(config, language);
    const href = (target: ScreenSlug) => {
      const query = [
        language === "en" && "lang=en",
        theme === "dark" && "theme=dark",
      ].filter(Boolean);
      return query.length
        ? `${screenPath(target)}?${query.join("&")}`
        : screenPath(target);
    };
    return {
      slug,
      language,
      t: (ar, en) => (language === "ar" ? ar : en),
      locale,
      number: (value) => new Intl.NumberFormat(locale).format(value),
      percent: (value) =>
        new Intl.NumberFormat(locale, {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(value / 100),
      money: (value, options) =>
        money(value, language, config.numerals, options),
      date: (iso) =>
        new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(new Date(iso)),
      href,
      open: (target) =>
        embedded ? openInDocs(target) : window.location.assign(href(target)),
      size,
      endSide: language === "ar" ? "left" : "right",
    };
  }, [slug, language, theme, config, embedded, size]);
  const { t } = screen;
  // The Sidebar on wide screens, and the same list in the phone menu, which
  // has no collapse toggle.
  const navigation = (menu: boolean) => (
    <Sidebar
      className={menu ? "screen-menu-sidebar" : "screen-sidebar"}
      aria-label={t("أمثلة طِراز", "Tiraz examples")}
      collapsed={menu ? false : collapsed}
      onCollapsedChange={setCollapsed}
    >
      <SidebarHeader>
        <SidebarIdentity>
          <span className="screen-mark" aria-hidden="true">
            ✳
          </span>
          <SidebarLabel className="screen-sidebar-copy">
            <span>{t("طِراز", "Tiraz")}</span>
            {!menu && <small>{t("أمثلة الشاشات", "Screen examples")}</small>}
          </SidebarLabel>
        </SidebarIdentity>
        {!menu && (
          <SidebarToggle
            collapseLabel={t("طيّ القائمة الجانبية", "Collapse navigation")}
            expandLabel={t("توسيع القائمة الجانبية", "Expand navigation")}
          />
        )}
      </SidebarHeader>
      <SidebarContent aria-label={t("الشاشات", "Screens")}>
        <SidebarGroup>
          {screens.map((item) => (
            <SidebarItem
              key={item.slug}
              href={screen.href(item.slug)}
              label={t(item.name[0], item.name[1])}
              icon={<item.icon size={18} />}
              active={item.slug === slug}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarIdentity>
          <Avatar src={sara} name={t("سارة علي", "Sara Ali")} size="sm" />
          <SidebarLabel className="screen-sidebar-copy">
            <span>{t("سارة علي", "Sara Ali")}</span>
            <small>{t("فريق المالية", "Finance team")}</small>
          </SidebarLabel>
        </SidebarIdentity>
        {!embedded && (
          <SidebarItem
            href="/"
            label={t("توثيق طِراز", "Tiraz documentation")}
            icon={<BookOpen size={18} />}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
  return (
    <div lang={language} className="screen-host" ref={host}>
      <SystemProvider config={config}>
        <ToastProvider
          label={t("الإشعارات", "Notifications")}
          closeLabel={t("إغلاق الإشعار", "Dismiss notification")}
        >
          <ScreenContext.Provider value={screen}>
            <ScreenDemoProvider>
              <div className="screen" data-embed={embedded || undefined}>
                <a className="screen-skip" href="#screen-main">
                  {t("انتقل إلى المحتوى", "Skip to content")}
                </a>
                {navigation(false)}
                <header className="screen-bar">
                  {/* Phones only: the Sidebar hides, and its list opens here. */}
                  <div className="screen-bar-start">
                    <Sheet
                      open={menuOpen}
                      onOpenChange={setMenuOpen}
                      title={t("الشاشات", "Screens")}
                      description={t(
                        "انتقل إلى شاشة أخرى.",
                        "Go to another screen.",
                      )}
                      closeLabel={t("إغلاق القائمة", "Close navigation")}
                      trigger={
                        <Button
                          variant="ghost"
                          iconOnly
                          aria-label={t("فتح القائمة", "Open navigation")}
                        >
                          <Menu size={18} aria-hidden="true" />
                        </Button>
                      }
                    >
                      {navigation(true)}
                    </Sheet>
                    <span className="screen-brand">
                      <span className="screen-mark" aria-hidden="true">
                        ✳
                      </span>
                      {t("طِراز", "Tiraz")}
                    </span>
                  </div>
                  <ScreenDemoControls />
                  {!embedded && (
                    <div className="screen-bar-end">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setLanguage(language === "ar" ? "en" : "ar")
                        }
                      >
                        <bdi lang={language === "ar" ? "en" : "ar"}>
                          {language === "ar" ? "English" : "العربية"}
                        </bdi>
                      </Button>
                      <Button
                        variant="ghost"
                        iconOnly
                        aria-label={t("الوضع الداكن", "Dark mode")}
                        aria-pressed={theme === "dark"}
                        onClick={() =>
                          setTheme(theme === "light" ? "dark" : "light")
                        }
                      >
                        {theme === "light" ? (
                          <Moon size={17} aria-hidden="true" />
                        ) : (
                          <Sun size={17} aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  )}
                </header>
                <main
                  ref={main}
                  id="screen-main"
                  tabIndex={-1}
                  className="screen-main"
                >
                  {children}
                </main>
              </div>
            </ScreenDemoProvider>
          </ScreenContext.Provider>
        </ToastProvider>
      </SystemProvider>
    </div>
  );
}

/**
 * A screen's heading row: the only h1 (the screen's name unless `title` is
 * given), an optional description, and actions at the inline end, which wrap
 * under the title below 640px.
 */
export function ScreenHeader({
  title,
  description,
  actions,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const { slug, t } = useScreen();
  const name = screens.find((item) => item.slug === slug)!.name;
  return (
    <header className="screen-header">
      <div className="screen-heading">
        <h1>{title ?? t(name[0], name[1])}</h1>
        {description ? (
          <p className="screen-description">{description}</p>
        ) : null}
        <ScreenOpeningActivity />
      </div>
      {actions ? <div className="screen-actions">{actions}</div> : null}
    </header>
  );
}
