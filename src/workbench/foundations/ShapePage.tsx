import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function ShapePage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
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
    />
  );
}
