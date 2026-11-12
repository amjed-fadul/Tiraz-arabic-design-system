import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function ArabicRtlPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  return (
    <FoundationPage
      current="arabic-rtl"
      language={language}
      navigate={navigate}
      title={t("العربية والاتجاه", "Arabic and RTL")}
      lede={t(
        "كيف يعمل طِراز مع الكتابة من اليمين إلى اليسار: الاتجاه والأرقام والنص المختلط والخط.",
        "How Tiraz handles right-to-left writing: direction, digits, mixed text and type.",
      )}
    />
  );
}
