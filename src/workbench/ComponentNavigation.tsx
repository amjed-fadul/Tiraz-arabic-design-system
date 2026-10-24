import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { RocketLaunchIcon } from "@phosphor-icons/react/dist/csr/RocketLaunch";
import { PaletteIcon } from "@phosphor-icons/react/dist/csr/Palette";
import { SparkleIcon } from "@phosphor-icons/react/dist/csr/Sparkle";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { StackIcon } from "@phosphor-icons/react/dist/csr/Stack";
import { Button } from "../system/Button";
import { Input } from "../system/Input";
import { numberLocale } from "../system/config";
import { nestedParts } from "./catalog";
import type { Language } from "./i18n";
import { label, localize, words } from "./i18n";
import { SiteLink } from "./SiteLink";
import type { Navigate } from "./SiteLink";
import { routePath } from "./site-routes";
import type { SiteRoute } from "./site-routes";
import {
  sectionNames,
  sectionEntries,
  searchEntries,
} from "./navigation-model";
import type { NavigationSection } from "./navigation-model";

const sections = [
  { id: "screens", Icon: SquaresFourIcon },
  { id: "components", Icon: StackIcon },
  { id: "ai", Icon: SparkleIcon },
  { id: "illustrations", Icon: PaletteIcon },
] as const;

export function ComponentNavigation({
  language,
  route,
  navigate,
  section,
  expanded,
  onToggleSection,
  query,
  onQueryChange,
  focusSearchRequest,
}: {
  language: Language;
  route: SiteRoute;
  navigate: Navigate;
  section: NavigationSection | undefined;
  expanded: boolean;
  onToggleSection: (section: NavigationSection) => void;
  query: string;
  onQueryChange: (query: string) => void;
  focusSearchRequest: number;
}) {
  const t = words(language),
    id = useId(),
    search = useRef<HTMLInputElement>(null),
    scroll = useRef<HTMLDivElement>(null);
  const toggledTitle = useRef<{
    key: NavigationSection;
    offset: number;
  } | null>(null);
  const scrollPositions = useRef<Partial<Record<NavigationSection, number>>>(
    {},
  );
  const path = routePath(route),
    searching = query.trim().length > 0;
  const entries = searching
    ? searchEntries(query, language)
    : section
      ? sectionEntries(section, language)
      : [];
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "latn" }, language),
  );
  const parent =
    route.kind === "component"
      ? nestedParts[route.id as keyof typeof nestedParts]
      : undefined;
  useEffect(() => {
    if (focusSearchRequest) search.current?.focus();
  }, [focusSearchRequest]);
  useLayoutEffect(() => {
    const panel = scroll.current;
    if (!panel) return;
    if (searching) {
      panel.scrollTop = 0;
      return;
    }
    const toggled = toggledTitle.current;
    if (toggled) {
      toggledTitle.current = null;
      const title = document.getElementById(`${id}-title-${toggled.key}`);
      if (title)
        panel.scrollTop +=
          title.getBoundingClientRect().top -
          panel.getBoundingClientRect().top -
          toggled.offset;
      return;
    }
    if (!section || !expanded) return;
    panel.scrollTop = scrollPositions.current[section] ?? 0;
    const current = panel.querySelector<HTMLElement>(
      '.component-nav-items [aria-current="page"]',
    );
    if (!current) return;
    const bounds = panel.getBoundingClientRect(),
      row = current.getBoundingClientRect();
    if (row.bottom > bounds.bottom)
      panel.scrollTop += row.bottom - bounds.bottom;
    else if (row.top < bounds.top) panel.scrollTop -= bounds.top - row.top;
  }, [path, language, section, expanded, searching, query, id]);
  function clear() {
    onQueryChange("");
    search.current?.focus();
  }
  function panel(key: NavigationSection | "search") {
    const isSearch = key === "search";
    const visible = isSearch
      ? searching
      : !searching && expanded && section === key;
    const title = isSearch
      ? t("نتائج البحث", "Search results")
      : localize(sectionNames[key], language);
    return (
      <div
        id={`${id}-${key}`}
        className="docs-navigation-list"
        role="region"
        aria-label={isSearch ? title : t(`قائمة ${title}`, `${title} list`)}
        hidden={!visible}
      >
        {visible && (
          <>
            {isSearch && (
              <div className="docs-navigation-list-heading">
                <span>{title}</span>
                <span>{number.format(entries.length)}</span>
              </div>
            )}
            <div className="component-nav-items">
              {entries.map((item) => (
                <SiteLink
                  key={item.key}
                  route={item.route}
                  navigate={navigate}
                  aria-label={localize(item.name, language)}
                  aria-current={
                    routePath(item.route) === path || parent === item.key
                      ? "page"
                      : undefined
                  }
                  aria-describedby={
                    isSearch ? `${id}-result-${item.key}` : undefined
                  }
                >
                  <span>{localize(item.name, language)}</span>
                  {isSearch && (
                    <small id={`${id}-result-${item.key}`}>
                      {localize(item.description, language)}
                    </small>
                  )}
                </SiteLink>
              ))}
            </div>
            {isSearch && entries.length === 0 && (
              <div className="docs-navigation-empty">
                <p>{t("لم نجد نتائج", "No results found")}</p>
                <span>
                  {t(
                    "جرّب اسمًا بالعربية أو الإنجليزية.",
                    "Try an Arabic or English name.",
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  return (
    <nav
      className="component-nav site-secondary docs-navigation-sections"
      aria-label={label("components", language)}
    >
      <div className="docs-navigation-search">
        <MagnifyingGlassIcon size={18} weight="regular" aria-hidden="true" />
        <Input
          ref={search}
          type="search"
          size="md"
          value={query}
          aria-label={t("ابحث في طِراز", "Search Tiraz")}
          placeholder={t("ابحث في طِراز…", "Search Tiraz…")}
          dir={query ? "auto" : language === "ar" ? "rtl" : "ltr"}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) {
              e.preventDefault();
              e.stopPropagation();
              clear();
            }
          }}
        />
        {query ? (
          <Button
            className="docs-search-clear"
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t("مسح البحث", "Clear search")}
            onClick={clear}
          >
            <XIcon size={16} aria-hidden="true" />
          </Button>
        ) : (
          <kbd aria-hidden="true" dir="ltr">
            ⌘ K
          </kbd>
        )}
      </div>
      <div
        ref={scroll}
        className="docs-navigation-scroll"
        onScroll={(event) => {
          if (section && !searching)
            scrollPositions.current[section] = event.currentTarget.scrollTop;
        }}
      >
        {panel("search")}
        <div className="docs-navigation-map">
          <nav aria-label={t("البداية", "Getting started")}>
            <h2 className="component-nav-heading">
              <SiteLink
                className="component-nav-section"
                route={{ kind: "start" }}
                navigate={navigate}
                aria-current={route.kind === "start" ? "page" : undefined}
              >
                <RocketLaunchIcon
                  className="component-nav-section-icon"
                  size={20}
                  weight="duotone"
                  aria-hidden="true"
                />
                <span>{t("ابدأ هنا", "Start here")}</span>
              </SiteLink>
            </h2>
          </nav>
          {sections.map(({ id: key, Icon }) => (
            <div
              key={key}
              className="docs-navigation-section"
              data-section={key}
            >
              <h2 className="component-nav-heading">
                <Button
                  id={`${id}-title-${key}`}
                  variant="ghost"
                  size="sm"
                  className="component-nav-section component-nav-toggle"
                  data-active={section === key || undefined}
                  aria-current={
                    (route.kind === "library" && section === key) ||
                    (route.kind === "illustrations" &&
                      !route.id &&
                      key === "illustrations")
                      ? "page"
                      : undefined
                  }
                  aria-expanded={!searching && section === key && expanded}
                  aria-controls={`${id}-${key}`}
                  onClick={(event) => {
                    const container = scroll.current;
                    if (container)
                      toggledTitle.current = {
                        key,
                        offset:
                          event.currentTarget.getBoundingClientRect().top -
                          container.getBoundingClientRect().top,
                      };
                    onToggleSection(key);
                  }}
                >
                  <Icon
                    className="component-nav-section-icon"
                    size={20}
                    weight="duotone"
                    aria-hidden="true"
                  />
                  <span className="component-nav-title">
                    {localize(sectionNames[key], language)}
                  </span>
                  {key !== "illustrations" && (
                    <span className="component-nav-count" aria-hidden="true">
                      {number.format(sectionEntries(key, language).length)}
                    </span>
                  )}
                  <CaretDownIcon
                    className="component-nav-caret"
                    size={16}
                    weight="regular"
                    aria-hidden="true"
                  />
                </Button>
              </h2>
              {panel(key)}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
