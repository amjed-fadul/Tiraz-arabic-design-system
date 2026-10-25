import { useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Button, Chip, Input, Select } from "../system";
import { numberLocale } from "../system/config";
import { navigationGroups } from "./catalog";
import type { Language } from "./i18n";
import { localize, words } from "./i18n";
import { SiteLink } from "./SiteLink";
import { siteLinkProps } from "./site-link-props";
import type { Navigate } from "./SiteLink";
import {
  galleryGroups,
  galleryName,
  livePreviewIds,
  navigationSection,
} from "./navigation-model";
import { CorePreview } from "./CorePreview";
import "./core-discovery.css";

export function LibraryPage({
  language,
  theme,
  category,
  navigate,
}: {
  language: Language;
  theme: "light" | "dark";
  category?: string;
  navigate: Navigate;
}) {
  const t = words(language),
    search = useRef<HTMLInputElement>(null),
    categoryTrigger = useRef<HTMLButtonElement>(null);
  const [searchState, setSearchState] = useState({ category, query: "" });
  // Reset before rendering the next collection without remounting its focused link.
  if (searchState.category !== category)
    setSearchState({ category, query: "" });
  const query = searchState.category === category ? searchState.query : "";
  function setQuery(value: string) {
    setSearchState({ category, query: value });
  }
  const core =
    navigationSection({ kind: "library", category }) === "components" &&
    category !== "all";
  const groups = galleryGroups(category, language, query);
  const count = groups.reduce((sum, group) => sum + group.entries.length, 0);
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "arab" }, language),
  );
  const coreGroups = navigationGroups.filter(
    (group) =>
      !["screens", "ask", "delegate", "create", "understand"].includes(
        group.id,
      ),
  );
  const knownCategory =
    category === "all" ||
    category === "ai" ||
    category === "essentials" ||
    navigationGroups.some((group) => group.id === category);
  const selected = knownCategory ? category : "components";
  function clear() {
    setQuery("");
    search.current?.focus();
  }
  return (
    <div className="library-page">
      <header className="component-heading">
        <h1>{localize(galleryName(category), language)}</h1>
        <p>
          {core
            ? t(
                "ابدأ بالأزرار والحقول والشارات. جرّب المكوّن، خصّصه، وخذ الكود إلى تطبيقك.",
                "Start with buttons, fields and badges. Try a component, make it yours, then take the code into your app.",
              )
            : t(
                "اختر شاشة أو واجهة لتجربتها واستكشاف مكوّناتها.",
                "Choose a screen or interface to try it and explore its components.",
              )}
        </p>
      </header>
      <div className="library-toolbar">
        <div className="library-search">
          <Search size={18} aria-hidden="true" />
          <Input
            ref={search}
            type="search"
            size="md"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={
              core
                ? t("ابحث عن مكوّن", "Search components")
                : t("ابحث في هذه المجموعة", "Search this collection")
            }
            placeholder={
              core
                ? t("أزرار، حقول، وسوم…", "Buttons, text fields, chips…")
                : t(
                    "ابحث بالعربية أو الإنجليزية…",
                    "Search in Arabic or English…",
                  )
            }
            dir={query ? "auto" : language === "ar" ? "rtl" : "ltr"}
            onKeyDown={(event) => {
              if (event.key === "Escape" && query) {
                event.preventDefault();
                event.stopPropagation();
                clear();
              }
            }}
          />
          {query && (
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              className="library-clear"
              aria-label={t("مسح البحث", "Clear search")}
              onClick={clear}
            >
              <X size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
        {!core && (
          <div className="library-category">
            <Select
              ref={categoryTrigger}
              size="md"
              aria-label={t("التصنيف", "Category")}
              value={selected}
              onValueChange={(value) => {
                categoryTrigger.current?.focus();
                navigate({ kind: "library", category: value });
              }}
              options={[
                { value: "all", label: t("كل المكتبة", "All items") },
                { value: "components", label: t("المكوّنات", "Components") },
                { value: "ai", label: t("واجهات المساعد", "AI interfaces") },
                ...navigationGroups.map((group) => ({
                  value: group.id,
                  label: localize(group.name, language),
                })),
              ]}
            />
          </div>
        )}
      </div>
      {core && (
        <nav
          className="library-collections"
          aria-label={t("مجموعات المكوّنات", "Component collections")}
        >
          {[
            {
              id: "components",
              name: ["كل المكوّنات", "All components"] as const,
            },
            { id: "essentials", name: ["الأساسيات", "Essentials"] as const },
            ...coreGroups,
          ].map((group) => (
            <Chip
              key={group.id}
              {...siteLinkProps(
                {
                  kind: "library",
                  category: group.id === "components" ? undefined : group.id,
                },
                navigate,
              )}
              selected={selected === group.id}
            >
              {localize(group.name, language)}
            </Chip>
          ))}
        </nav>
      )}
      <div
        className="library-results"
        role="region"
        aria-label={t("نتائج المكتبة", "Library results")}
      >
        {groups.map(
          (group) =>
            group.entries.length > 0 && (
              <section
                key={group.id}
                role="region"
                aria-labelledby={`library-${group.id}`}
              >
                <div className="library-section-heading">
                  <h2 id={`library-${group.id}`}>
                    {localize(group.title, language)}
                  </h2>
                  <span>{number.format(group.entries.length)}</span>
                </div>
                <div className="library-grid">
                  {group.entries.map((item) => (
                    <article className="library-card" key={item.key}>
                      {livePreviewIds.has(item.key) ? (
                        <div
                          className="library-preview library-preview-live"
                          data-component={item.key}
                          inert
                          aria-hidden="true"
                        >
                          <CorePreview id={item.key} language={language} />
                        </div>
                      ) : (
                        <div className="library-preview">
                          <img
                            src={`/library-previews/${item.key}-${language}-${theme}.jpg`}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            width={720}
                            height={450}
                          />
                        </div>
                      )}
                      <SiteLink
                        className="library-card-link"
                        navigate={navigate}
                        route={item.route}
                      >
                        <div className="library-card-title">
                          <h3>{localize(item.name, language)}</h3>
                          <ArrowUpRight
                            className="tz-mirror-rtl"
                            size={17}
                            aria-hidden="true"
                          />
                        </div>
                      </SiteLink>
                      <p>{localize(item.description, language)}</p>
                    </article>
                  ))}
                </div>
              </section>
            ),
        )}
        {count === 0 && (
          <div className="library-empty">
            <Search size={28} aria-hidden="true" />
            <h2>{t("لم نجد نتائج", "No results found")}</h2>
            <p>
              {t(
                "جرّب اسمًا بالعربية أو الإنجليزية، أو اختر مجموعة أخرى.",
                "Try an Arabic or English name, or choose another collection.",
              )}
            </p>
            <Button variant="secondary" onClick={clear}>
              {t("إظهار المكوّنات مجددًا", "Show components again")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
