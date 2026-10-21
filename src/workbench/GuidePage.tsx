import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import sourceGuide from "../system/ai/README.md?url";
import { guides } from "./guides";
import type { GuideId } from "./site-routes";
import type { Language } from "./i18n";
import { localize, words } from "./i18n";
import { SiteLink } from "./SiteLink";
import type { Navigate } from "./SiteLink";
import { CopyControl } from "./CopyControl";
function GuideText({ text, language }: { text: string; language: Language }) {
  if (language !== "ar") return text;
  return text
    .split(/([A-Za-z][A-Za-z0-9_./:()-]*(?: [A-Za-z0-9][A-Za-z0-9_./:()-]*)*)/g)
    .map((part, index) =>
      index % 2 ? (
        <bdi dir="ltr" lang="en" key={index}>
          {part}
        </bdi>
      ) : (
        part
      ),
    );
}
export function GuidePage({
  guideId,
  language,
  navigate,
}: {
  guideId: GuideId;
  language: Language;
  navigate: Navigate;
}) {
  const guide = guides.find((item) => item.id === guideId)!;
  const index = guides.indexOf(guide),
    t = words(language);
  return (
    <article className="guide-page">
      <header className="component-heading">
        <p className="site-eyebrow">{t("التوثيق", "Docs")}</p>
        <h1>{localize(guide.title, language)}</h1>
        <p>{localize(guide.description, language)}</p>
      </header>
      <div className="guide-sections">
        {guide.sections.map((section, i) => (
          <section key={i}>
            <h2>{localize(section.title, language)}</h2>
            <p>
              <GuideText
                text={localize(section.text, language)}
                language={language}
              />
            </p>
          </section>
        ))}
      </div>
      {guide.code && (
        <section className="guide-code">
          <div className="site-code-heading">
            <h2>{localize(guide.codeTitle!, language)}</h2>
            <CopyControl
              key={guideId}
              text={guide.code}
              caption={t("نسخ المثال", "Copy example")}
              language={language}
            />
          </div>
          <pre dir="ltr" lang="en" tabIndex={0}>
            <code>{guide.code}</code>
          </pre>
        </section>
      )}
      {guideId === "introduction" && (
        <div className="guide-start">
          <SiteLink
            route={{ kind: "library" }}
            navigate={navigate}
            className="site-action"
          >
            {t("استكشف المكتبة", "Explore the Library")}
            <ArrowRight
              className="tz-mirror-rtl"
              size={16}
              aria-hidden="true"
            />
          </SiteLink>
          <SiteLink
            route={{ kind: "docs", guide: "installation" }}
            navigate={navigate}
          >
            {t("أضف طِراز إلى مشروعك", "Add Tiraz to your project")}
          </SiteLink>
        </div>
      )}
      <a
        className="guide-source"
        href={sourceGuide}
        target="_blank"
        rel="noreferrer"
      >
        <FileText size={16} aria-hidden="true" />
        <span>
          {t("دليل المصدر", "Source guide")} <bdi dir="ltr">ai/README.md</bdi>
          <span className="sr-only">
            {t("، يفتح في تبويب جديد", ", opens in a new tab")}
          </span>
        </span>
      </a>
      <nav
        className="guide-pagination"
        aria-label={t("صفحات الدليل", "Guide pages")}
      >
        {index > 0 ? (
          <SiteLink
            route={{ kind: "docs", guide: guides[index - 1].id }}
            navigate={navigate}
          >
            <ArrowLeft className="tz-mirror-rtl" size={16} aria-hidden="true" />
            <span>
              <small>{t("السابق", "Previous")}</small>
              {localize(guides[index - 1].name, language)}
            </span>
          </SiteLink>
        ) : null}
        {index < guides.length - 1 && (
          <SiteLink
            route={{ kind: "docs", guide: guides[index + 1].id }}
            navigate={navigate}
          >
            <span>
              <small>{t("التالي", "Next")}</small>
              {localize(guides[index + 1].name, language)}
            </span>
            <ArrowRight
              className="tz-mirror-rtl"
              size={16}
              aria-hidden="true"
            />
          </SiteLink>
        )}
      </nav>
    </article>
  );
}
