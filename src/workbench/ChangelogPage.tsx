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
/** Releases grouped by day, keeping the authored newest-first order. */
const days: { date: string; releases: Release[] }[] = [];
for (const release of releases) {
  const last = days.at(-1);
  if (last?.date === release.date) last.releases.push(release);
  else days.push({ date: release.date, releases: [release] });
}

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
  const date = new Intl.DateTimeFormat(language === "ar" ? locale : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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
      {days.map((day) => (
        <section
          key={day.date}
          id={day.date}
          className="changelog-day"
          aria-labelledby={`changelog-${day.date}`}
        >
          <h2 id={`changelog-${day.date}`}>
            {date.format(new Date(`${day.date}T00:00:00Z`))}
          </h2>
          {day.releases.map((release) => (
            <div
              key={release.version}
              id={release.version}
              className="changelog-release"
            >
              <h3 className="changelog-version" dir="ltr">
                {release.version}
              </h3>
              <ul className="changelog-changes">
                {release.changes.map((change, changeIndex) => (
                  <li key={changeIndex}>
                    <div className="changelog-item">
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
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}
