import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSystem } from "../../system/useSystem";
import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import "./spacing.css";

const scale = [1, 2, 3, 4, 5, 6, 8, 10].map((n) => `--space-${n}`);

const controls: readonly (readonly [string, string, string])[] = [
  [
    "--control-height",
    "ارتفاع الأزرار والحقول",
    "Height of buttons and fields",
  ],
  ["--control-small", "ارتفاع العناصر الصغيرة", "Height of small controls"],
  [
    "--control-padding",
    "الحشو الأفقي للعناصر",
    "Horizontal padding of controls",
  ],
  [
    "--control-small-padding",
    "الحشو الأفقي للعناصر الصغيرة",
    "Horizontal padding of small controls",
  ],
  [
    "--control-gap",
    "المسافة بين أجزاء العنصر",
    "Gap between parts of a control",
  ],
  ["--row-gap", "المسافة بين صفوف النماذج", "Gap between form rows"],
  ["--tab-padding", "حشو التبويبات", "Tab padding"],
  ["--cell-padding", "حشو خلايا الجداول", "Table cell padding"],
  ["--menu-item-padding", "حشو عناصر القوائم", "Menu item padding"],
  [
    "--paper-padding-block",
    "الحشو الرأسي للبطاقات والحوارات",
    "Vertical padding of cards and dialogs",
  ],
  [
    "--paper-padding-inline",
    "الحشو الأفقي للبطاقات والحوارات",
    "Horizontal padding of cards and dialogs",
  ],
];

const densityTokens = [
  "--control-height",
  "--control-small",
  "--control-padding",
  "--control-small-padding",
  "--control-gap",
  "--row-gap",
  "--tab-padding",
  "--cell-padding",
  "--menu-item-padding",
  "--paper-padding-block",
  "--paper-padding-inline",
];

function Rows({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul className="space-rows" aria-label={label}>
      {children}
    </ul>
  );
}

function Row({
  token,
  value,
  use,
}: {
  token: string;
  value?: string;
  use?: string;
}) {
  return (
    <li className="space-row">
      <code dir="ltr">{token}</code>
      <span className="space-track" aria-hidden="true">
        <span
          className="space-bar"
          data-token={token}
          style={{ inlineSize: `var(${token})` }}
        />
      </span>
      <span className="space-value" dir="ltr">
        {value ?? "—"}
      </span>
      {use && <span className="space-use">{use}</span>}
    </li>
  );
}

export function SpacingPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const { config } = useSystem();
  const root = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    const next: Record<string, string> = {};
    root.current
      ?.querySelectorAll<HTMLElement>("[data-token]")
      .forEach((element) => {
        const size = parseFloat(getComputedStyle(element).inlineSize);
        if (Number.isFinite(size))
          next[element.dataset.token ?? ""] =
            `${Math.round(size * 100) / 100}px`;
      });
    setValues(next);
  }, [config.density, config.typography, language]);
  const compact = config.density === "compact";

  return (
    <FoundationPage
      current="spacing"
      language={language}
      navigate={navigate}
      title={t("المسافات والتخطيط", "Spacing and layout")}
      lede={t(
        "مقياس المسافات وأحجام عناصر التحكم وما تغيّره الكثافة.",
        "The spacing scale, control sizes and what density changes.",
      )}
    >
      <div ref={root}>
        <section>
          <h2>{t("مقياس المسافات", "Spacing scale")}</h2>
          <p>
            {t(
              "كل فراغ في المكوّنات يؤخذ من هذا المقياس. الأطوال أدناه مقروءة من الرموز مباشرة.",
              "Every gap in the components comes from this scale. The lengths below are read from the tokens live.",
            )}
          </p>
          <Rows label={t("مقياس المسافات", "Spacing scale")}>
            {scale.map((token) => (
              <Row key={token} token={token} value={values[token]} />
            ))}
          </Rows>
        </section>

        <section>
          <h2>{t("أحجام العناصر", "Control sizes")}</h2>
          <p>
            {t(
              "الارتفاعات والحشو والمسافات التي تتبع الكثافة الحالية.",
              "The heights, paddings and gaps that follow the current density.",
            )}
          </p>
          <Rows label={t("أحجام العناصر", "Control sizes")}>
            {controls.map(([token, ar, en]) => (
              <Row
                key={token}
                token={token}
                value={values[token]}
                use={t(ar, en)}
              />
            ))}
          </Rows>
        </section>

        <section>
          <h2>{t("الكثافة", "Density")}</h2>
          <p>
            {t(
              "الكثافة المريحة هي الأصل، والمضغوطة تقلّص العناصر والمسافات ليتّسع محتوى أكثر في الشاشة. الإعداد الحالي: ",
              "Comfortable is the default; compact tightens controls and gaps so more fits on screen. Current setting: ",
            )}
            <strong>
              {compact ? t("مضغوطة", "Compact") : t("مريحة", "Comfortable")}
            </strong>
            .
          </p>
          <p className="space-density-tokens">
            {t("الرموز التي تتغيّر: ", "Tokens that change: ")}
            {densityTokens.map((token, index) => (
              <span key={token}>
                {index > 0 && "، "}
                <code dir="ltr">{token}</code>
              </span>
            ))}
            .
          </p>
        </section>
      </div>
    </FoundationPage>
  );
}
