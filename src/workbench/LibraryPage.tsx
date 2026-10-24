import { useRef } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Select } from "../system";
import { numberLocale } from "../system/config";
import { navigationGroups } from "./catalog";
import type { Language } from "./i18n";
import { localize, words } from "./i18n";
import { SiteLink } from "./SiteLink";
import type { Navigate } from "./SiteLink";
import {
  galleryEntries,
  galleryName,
  entrySection,
  sectionNames,
} from "./navigation-model";

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
  const t = words(language);
  const categoryTrigger = useRef<HTMLButtonElement>(null);
  const filter =
    category === "ai" ||
    category === "all" ||
    category === "components" ||
    navigationGroups.some((group) => group.id === category)
      ? category
      : "components";
  const matches = galleryEntries(category, language);
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "arab" }, language),
  );
  const groups = (["screens", "components", "ai"] as const).map((id) => ({
    id,
    title: localize(sectionNames[id], language),
    entries: matches.filter((item) => entrySection(item) === id),
  }));
  return (
    <div className="library-page">
      <header className="component-heading">
        <h1>{localize(galleryName(category), language)}</h1>
        <p>
          {t(
            "اختر شاشة أو مكوّنًا لتجربته ونسخ مثاله إلى تطبيقك.",
            "Choose a screen or component to try it and copy its example into your app.",
          )}
        </p>
      </header>
      <div className="library-toolbar">
        <div className="library-category">
          <Select
            ref={categoryTrigger}
            size="md"
            aria-label={t("التصنيف", "Category")}
            value={filter}
            onValueChange={(value) => {
              categoryTrigger.current?.focus();
              navigate({
                kind: "library",
                category: value,
              });
            }}
            options={[
              { value: "all", label: t("كل المكتبة", "All items") },
              {
                value: "components",
                label: t("المكوّنات", "Components"),
              },
              { value: "ai", label: t("واجهات المساعد", "AI interfaces") },
              ...navigationGroups.map((group) => ({
                value: group.id,
                label: localize(group.name, language),
              })),
            ]}
          />
        </div>
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
            <SiteLink
              className="site-action"
              route={{ kind: "library" }}
              navigate={navigate}
            >
              {t("عرض المكوّنات", "Browse components")}
            </SiteLink>
          </div>
        )}
      </div>
    </div>
  );
}
