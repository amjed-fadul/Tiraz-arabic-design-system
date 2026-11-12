import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function ColorsPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  return (
    <FoundationPage
      current="colors"
      language={language}
      navigate={navigate}
      title={t("الألوان", "Colors")}
      lede={t(
        "رموز الألوان التي تبني عليها كل الواجهات، بقيمها الحية في الوضعين الفاتح والداكن.",
        "The color tokens every interface is built on, with live values in light and dark.",
      )}
    />
  );
}
