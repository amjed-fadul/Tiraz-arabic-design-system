import { useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { numberLocale } from "../system/config";
import { navigationGroups } from "./catalog";
import type { Language } from "./i18n";
import { localize, words } from "./i18n";
import { SiteLink } from "./SiteLink";
import type { Navigate } from "./SiteLink";
import { libraryEntries } from "./library-entries";

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
    [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const filter =
    category === "components" ||
    navigationGroups.some((group) => group.id === category)
      ? category
      : "all";
  const needle = query
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase();
  const matches = libraryEntries.filter(
    (item) =>
      (filter === "all" ||
        (filter === "components"
          ? item.category !== "screens"
          : item.category === filter)) &&
      (!needle ||
        [...item.name, item.key]
          .join(" ")
          .normalize("NFKD")
          .replace(/\p{M}/gu, "")
          .toLocaleLowerCase()
          .includes(needle)),
  );
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "arab" }, language),
  );
  const groups = [
    {
      id: "screens",
      title: t("شاشات", "Screens"),
      entries: matches.filter((item) => item.category === "screens"),
    },
    {
      id: "components",
      title: t("مكوّنات", "Components"),
      entries: matches.filter((item) => item.category !== "screens"),
    },
  ];
  function clear() {
    setQuery("");
    input.current?.focus();
  }
  return (
    <div className="library-page">
      <header className="component-heading">
        <h1>{t("المكتبة", "Library")}</h1>
        <p>
          {t(
            "اختر شاشة أو مكوّنًا لتجربته ونسخ مثاله إلى تطبيقك.",
            "Choose a screen or component to try it and copy its example into your app.",
          )}
        </p>
      </header>
      <div className="library-toolbar">
        <div className="library-search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={input}
            type="search"
            aria-label={t("ابحث في المكتبة", "Search the Library")}
            placeholder={t(
              "ابحث بالعربية أو الإنجليزية…",
              "Search in Arabic or English…",
            )}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              aria-label={t("مسح البحث", "Clear search")}
              onClick={clear}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <label className="library-category">
          <span className="sr-only">{t("التصنيف", "Category")}</span>
          <select
            value={filter}
            onChange={(event) =>
              navigate({
                kind: "library",
                category:
                  event.target.value === "all" ? undefined : event.target.value,
              })
            }
          >
            <option value="all">{t("كل المكتبة", "All items")}</option>
            <option value="components">
              {t("كل المكوّنات", "All components")}
            </option>
            {navigationGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {localize(group.name, language)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="library-results"
        role="region"
        aria-label={t("نتائج المكتبة", "Library results")}
      >
        {groups.map(
          (group) =>
            group.entries.length > 0 && (
              <section key={group.id} aria-labelledby={`library-${group.id}`}>
                <div className="library-section-heading">
                  <h2 id={`library-${group.id}`}>{group.title}</h2>
                  <span>{number.format(group.entries.length)}</span>
                </div>
                <div className="library-grid">
                  {group.entries.map((item) => (
                    <article className="library-card" key={item.key}>
                      <SiteLink navigate={navigate} route={item.route}>
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
        {matches.length === 0 && (
          <div className="library-empty">
            <Search size={28} aria-hidden="true" />
            <h2>{t("لم نجد نتائج", "No results found")}</h2>
            <p>
              {t(
                "جرّب اسمًا آخر أو اختر تصنيفًا مختلفًا.",
                "Try another name or choose a different category.",
              )}
            </p>
            {query ? (
              <button type="button" className="site-action" onClick={clear}>
                {t("مسح البحث", "Clear search")}
              </button>
            ) : (
              <SiteLink
                className="site-action"
                route={{ kind: "library" }}
                navigate={navigate}
              >
                {t("عرض كل المكتبة", "Browse all items")}
              </SiteLink>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
