import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function TypographyPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  return (
    <FoundationPage
      current="typography"
      language={language}
      navigate={navigate}
      title={t("الخطوط", "Typography")}
      lede={t(
        "الخط والأحجام والأوزان التي يقرأ بها الناس واجهتك، بالعربية والإنجليزية.",
        "The typeface, sizes and weights people read your interface in, in Arabic and English.",
      )}
    />
  );
}
