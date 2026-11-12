import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSystem } from "../../system/useSystem";
import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import "./spacing.css";

const scale = [1, 2, 3, 4, 5, 6, 8, 10].map((n) => `--space-${n}`);

function Rows({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul className="space-rows" aria-label={label}>
      {children}
    </ul>
  );
}

function Row({ token, value }: { token: string; value?: string }) {
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

  return (
    <FoundationPage
      current="spacing"
      language={language}
      navigate={navigate}
      title={t("المسافات والتخطيط", "Spacing and layout")}
      lede={t(
        "مقياس المسافات الذي تُبنى عليه كل الفراغات في طِراز.",
        "The spacing scale every gap in Tiraz is built from.",
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
      </div>
    </FoundationPage>
  );
}
