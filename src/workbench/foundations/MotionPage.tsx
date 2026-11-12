import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function MotionPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  return (
    <FoundationPage
      current="motion"
      language={language}
      navigate={navigate}
      title={t("الحركة", "Motion")}
      lede={t(
        "حركة قصيرة وهادئة تشرح ما تغيّر، وتختفي عند تقليل الحركة.",
        "Short, calm motion that explains what changed, and steps aside when motion is reduced.",
      )}
    />
  );
}
