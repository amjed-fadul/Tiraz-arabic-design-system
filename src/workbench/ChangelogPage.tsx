import { Fragment } from "react";
import { numberLocale } from "../system/config";
import changelog from "../system/ai/changelog.json";
import registry from "../system/ai/registry.json";
import type { Language } from "./i18n";
import { words } from "./i18n";
import { navigationCatalog } from "./catalog";
import type { ComponentId } from "./catalog";
import { SiteLink } from "./SiteLink";
import type { Navigate } from "./SiteLink";
import "./changelog-page.css";

type Text = { en: string; ar: string };
type Change = {
  components: string[];
  area?: string;
  label?: string;
  type: "added" | "changed" | "fixed" | "deprecated" | "removed";
  breaking?: boolean;
  summary: Text;
  steps?: Text[];
};
type Release = {
  version: string;
  date: string;
  published: boolean;
  changes: Change[];
};

const releases = changelog.releases as Release[];
const apiNames = new Map(
  (registry.components as { id: string; api: string }[]).map((item) => [
    item.id,
    item.api,
  ]),
);
const docsIds = new Set<string>(navigationCatalog.map((item) => item.id));
const areaLabels: Record<string, readonly [string, string]> = {
  provider: ["SystemProvider", "SystemProvider"],
  mascot: ["Khayt", "Khayt"],
  cli: ["CLI", "CLI"],
  package: ["الحزمة", "Package"],
  library: ["المكتبة", "Library"],
  tokens: ["Tokens", "Tokens"],
};
const typeLabels: Record<Change["type"], readonly [string, string]> = {
  added: ["أُضيف", "Added"],
  changed: ["تغيّر", "Changed"],
  fixed: ["أُصلح", "Fixed"],
  deprecated: ["أُهمل", "Deprecated"],
  removed: ["أُزيل", "Removed"],
};
const latestStable = releases.find(
  (release) => release.published && !release.version.includes("-"),
)?.version;

/** Renders `code` spans inside authored text. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(`[^`]+`)/)
        .map((part, index) =>
          part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
            <code key={index}>{part.slice(1, -1)}</code>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          ),
        )}
    </>
  );
}

function ChangeLabel({
  change,
  language,
  navigate,
}: {
  change: Change;
  language: Language;
  navigate: Navigate;
}) {
  const t = words(language);
  if (change.label) return <>{change.label}</>;
  if (change.area && areaLabels[change.area])
    return <>{t(...areaLabels[change.area])}</>;
  const separator = t("، ", ", ");
  return (
    <>
      {change.components.map((id, index) => {
        const name = apiNames.get(id) ?? id;
        return (
          <Fragment key={id}>
            {index > 0 && separator}
            {docsIds.has(id) ? (
              <SiteLink
                route={{ kind: "component", id: id as ComponentId }}
                navigate={navigate}
              >
                {name}
              </SiteLink>
            ) : (
              name
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export function ChangelogPage({
  language,
  navigate,
}: {
  language: Language;
  navigate: Navigate;
}) {
  const t = words(language);
  const locale = numberLocale({ numerals: "arab" }, language);
  // Day-first English keeps "28 Oct 2026" unambiguous.
  const date = new Intl.DateTimeFormat(language === "ar" ? locale : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const number = new Intl.NumberFormat(locale);
  const channel = (release: Release) =>
    !release.published
      ? t("غير منشور على npm", "Not on npm")
      : release.version.includes("-")
        ? t("معاينة", "Preview")
        : release.version === latestStable
          ? t("الأحدث", "Latest")
          : t("مستقر", "Stable");
  const updateLine = (steps: number) => {
    if (steps === 0)
      return t(
        "نفّذ `tiraz update`. لا خطوات يدوية.",
        "Run `tiraz update`. No manual steps.",
      );
    if (language === "en")
      return `Run \`tiraz update\`. ${steps === 1 ? "1 manual step" : `${steps} manual steps`}.`;
    const count =
      steps === 1
        ? "خطوة يدوية واحدة"
        : steps === 2
          ? "خطوتان يدويتان"
          : `${number.format(steps)} ${steps <= 10 ? "خطوات يدوية" : "خطوة يدوية"}`;
    return `نفّذ \`tiraz update\`. ${count}.`;
  };
  return (
    <article className="changelog-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="changelog-intro">
        <h1>{t("سجل التغييرات", "Changelog")}</h1>
        <p>
          {t(
            "ما الذي تغيّر في كل إصدار، وكيف تحدّث نسختك.",
            "What changed in each version, and how to update your copy.",
          )}
        </p>
      </header>
      {releases.map((release, index) => {
        const steps = release.changes.reduce(
          (sum, change) => sum + (change.steps?.length ?? 0),
          0,
        );
        return (
          <section
            key={release.version}
            id={release.version}
            className="changelog-release"
            aria-labelledby={`changelog-${release.version}`}
          >
            <h2 id={`changelog-${release.version}`}>
              <span className="changelog-version" dir="ltr">
                {release.version}
              </span>
              <span className="changelog-meta">
                {date.format(new Date(`${release.date}T00:00:00Z`))} ·{" "}
                {channel(release)}
              </span>
            </h2>
            {index < releases.length - 1 && (
              <p className="changelog-update">
                <Rich text={updateLine(steps)} />
              </p>
            )}
            <ul className="changelog-changes">
              {release.changes.map((change, changeIndex) => (
                <li key={changeIndex}>
                  <p className="changelog-change">
                    <strong className="changelog-label">
                      <ChangeLabel
                        change={change}
                        language={language}
                        navigate={navigate}
                      />
                    </strong>{" "}
                    <Rich text={change.summary[language]} />
                  </p>
                  <p className="changelog-types">
                    {change.breaking && (
                      <span className="changelog-type changelog-breaking">
                        {t("تغيير جذري", "Breaking")}
                      </span>
                    )}
                    <span className="changelog-type">
                      {t(...typeLabels[change.type])}
                    </span>
                  </p>
                  {change.steps?.map((step, stepIndex) => (
                    <p key={stepIndex} className="changelog-step">
                      <Rich text={step[language]} />
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </article>
  );
}
