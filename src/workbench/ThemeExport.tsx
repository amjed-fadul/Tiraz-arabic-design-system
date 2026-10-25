import { useId, useState } from "react";
import { Accordion, Textarea } from "../system";
import type { SystemConfig } from "../system";
import { CopyControl } from "./CopyControl";
import type { CopyFeedback } from "./CopyControl";
import { generateThemeCss } from "./theme-customization";
import type { BrandColors } from "./theme-customization";
import { label, words } from "./i18n";
import type { Language } from "./i18n";

export function ThemeExport({
  config,
  colors,
  language,
  onFeedback,
}: {
  config: SystemConfig;
  colors: BrandColors;
  language: Language;
  onFeedback: (result: CopyFeedback) => void;
}) {
  const uid = useId(),
    t = words(language);
  const css = generateThemeCss(config, colors);
  const [expanded, setExpanded] = useState("");
  const [failed, setFailed] = useState(false);
  return (
    <section className="settings-section theme-export" aria-labelledby={uid}>
      <div className="settings-section-head">
        <h3 id={uid}>{t("ملف المظهر الخاص بك", "Your theme file")}</h3>
        <CopyControl
          text={css}
          caption={t("نسخ ملف المظهر", "Copy theme CSS")}
          language={language}
          iconOnly
          inlineFeedback={false}
          announcement="off"
          onFeedbackChange={(result) => {
            setFailed(result === "failure");
            if (result === "failure") setExpanded("css");
            onFeedback(result);
          }}
        />
      </div>
      <p className="theme-export-help">
        {t(
          "ألوان وزوايا للوضعين. احفظه باسم tiraz.theme.css وحمّله بعد أنماط طِراز. بقية الإعدادات مضمّنة في مثال الكود.",
          "Colors and corners for both modes. Save as tiraz.theme.css and load after Tiraz styles. Other settings are included in the code example.",
        )}
      </p>
      <Accordion
        collapsible
        headingLevel={4}
        value={expanded}
        onValueChange={setExpanded}
        items={[
          {
            value: "css",
            label: t("عرض ملف CSS", "View theme CSS"),
            content: (
              <Textarea
                label={t("ملف المظهر CSS", "Theme CSS")}
                helper={failed ? label("failed", language) : undefined}
                value={css}
                readOnly
                rows={10}
                dir="ltr"
                lang="en"
                spellCheck={false}
              />
            ),
          },
        ]}
      />
    </section>
  );
}
