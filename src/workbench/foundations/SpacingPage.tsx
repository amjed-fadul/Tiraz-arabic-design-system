import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function SpacingPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
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
    />
  );
}
