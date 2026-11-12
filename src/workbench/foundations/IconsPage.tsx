import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function IconsPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  return (
    <FoundationPage
      current="icons"
      language={language}
      navigate={navigate}
      title={t("الأيقونات", "Icons")}
      lede={t(
        "أيقونات خطية بسيطة من Lucide بحجم ولون يتبعان النص.",
        "Simple line icons from Lucide, sized and colored with the text.",
      )}
    />
  );
}
