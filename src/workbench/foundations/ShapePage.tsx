import { useLayoutEffect, useRef, useState } from "react";
import { useSystem } from "../../system/useSystem";
import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import "./shape.css";

const radii: readonly (readonly [string, string, string])[] = [
  ["--radius-small", "الشارات والعناصر الدقيقة", "Badges and tiny elements"],
  ["--radius-item", "عناصر القوائم والصفوف", "List and menu items"],
  ["--radius-control", "الأزرار والحقول", "Buttons and fields"],
  ["--radius-paper", "البطاقات والحوارات", "Cards and dialogs"],
  ["--radius-tray", "الحاويات التي تحيط بالبطاقات", "Trays that hold paper"],
  ["--radius-pill", "الأقراص والمنزلقات", "Pills and sliders"],
];

const shadows: readonly (readonly [string, string, string])[] = [
  ["--shadow-control", "الأزرار والحقول في حالتها العادية", "Controls at rest"],
  ["--shadow-raised", "الأزرار البارزة", "Raised buttons"],
  ["--shadow-pressed", "العنصر أثناء الضغط", "A control while pressed"],
  ["--shadow-popover", "القوائم والنوافذ المنبثقة", "Menus and popovers"],
  ["--shadow-overlay", "الحوارات والألواح الجانبية", "Dialogs and sheets"],
  ["--shadow-thumb", "مقابض المفاتيح والمنزلقات", "Switch and slider thumbs"],
  ["--shadow-paper", "البطاقات والألواح", "Cards and panels"],
  ["--shadow-chip", "الرقائق على الحاوية", "Chips on the tray"],
];

export function ShapePage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const { config } = useSystem();
  const root = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    const next: Record<string, string> = {};
    root.current
      ?.querySelectorAll<HTMLElement>("[data-token]")
      .forEach((element) => {
        const radius = getComputedStyle(element).borderStartStartRadius;
        if (radius)
          next[element.dataset.token ?? ""] = radius.endsWith("px")
            ? `${Math.round(parseFloat(radius) * 100) / 100}px`
            : radius;
      });
    setValues(next);
    const raw = root.current
      ? getComputedStyle(root.current).getPropertyValue("--radius").trim()
      : "";
    setBase(raw || `${config.radius}px`);
  }, [config.radius, language]);

  return (
    <FoundationPage
      current="shape"
      language={language}
      navigate={navigate}
      title={t("الأشكال والظلال", "Shape and elevation")}
      lede={t(
        "تدرّج الانحناءات والظلال الذي يعطي الواجهة شكلها وعمقها.",
        "The radius scale and shadows that give an interface its shape and depth.",
      )}
    >
      <div ref={root}>
        <section>
          <h2>{t("الانحناء", "Radius")}</h2>
          <p>
            {t("كل انحناء مشتق من ", "Every radius derives from ")}
            <code dir="ltr">--radius</code>
            {t("، وقيمته الحالية ", ", currently ")}
            <code dir="ltr">{base || "—"}</code>
            {t(
              ". غيّره فتتناسق كل الأشكال معًا.",
              ". Change it and every shape moves together.",
            )}
          </p>
          <ul className="shape-radii">
            {radii.map(([token, ar, en]) => (
              <li key={token} className="shape-radius">
                <span
                  className="shape-sample"
                  data-token={token}
                  aria-hidden="true"
                  style={{ borderRadius: `var(${token})` }}
                />
                <code dir="ltr">{token}</code>
                {/* The pill radius is a huge number by design; say what it does. */}
                {token === "--radius-pill" ? (
                  <span className="shape-value">
                    {t("دائري بالكامل", "Fully rounded")}
                  </span>
                ) : (
                  <span className="shape-value" dir="ltr">
                    {values[token] ?? "—"}
                  </span>
                )}
                <span className="shape-use">{t(ar, en)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{t("الظلال", "Shadows")}</h2>
          <p>
            {t(
              "كل ظل مصمم ليُقرأ على سطح الصفحة؛ العينات أدناه ورقة على خلفية الصفحة.",
              "Each shadow is made to read on the page surface; the samples below are paper on the page background.",
            )}
          </p>
          <ul className="shape-shadows">
            {shadows.map(([token, ar, en]) => (
              <li key={token} className="shape-shadow">
                <span className="shape-stage" aria-hidden="true">
                  <span
                    className="shape-paper"
                    style={{ boxShadow: `var(${token})` }}
                  />
                </span>
                <code dir="ltr">{token}</code>
                <span className="shape-use">{t(ar, en)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </FoundationPage>
  );
}
