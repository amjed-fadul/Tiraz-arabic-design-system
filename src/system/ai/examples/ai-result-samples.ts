import type { SourceReference } from "../../index";
import auditUrl from "../assets/results/menu-audit.txt?url&no-inline";
import briefUrl from "../assets/results/menu-brief.txt?url&no-inline";
type Language = "ar" | "en";
export function sampleSources(language: Language): SourceReference[] {
  const ar = language === "ar";
  return [
    {
      id: "menu-audit",
      number: 1,
      title: ar
        ? "مراجعة سهولة استخدام قائمة نخلة"
        : "Nakhla menu usability review",
      href: auditUrl,
      description: ar
        ? "طلب خمسة ضيوف من ثمانية أن تُكتب أسماء الأصناف بالعربية بجانب الإنجليزية."
        : "Five of eight guests asked for Arabic item names beside the English names.",
      metadata: ar ? "٨ جلسات · ١٢ أكتوبر ٢٠٢٦" : "8 sessions · Oct 12, 2026",
    },
    {
      id: "menu-brief",
      number: 2,
      title: ar ? "موجز تصميم قائمة الشتاء" : "Winter menu design brief",
      href: briefUrl,
      description: ar
        ? "يطلب الموجز أسماء بالعربية والإنجليزية وأسعارًا واضحة."
        : "The brief calls for bilingual names and clear prices.",
      metadata: ar ? "فريق الهوية البصرية · الإصدار ٣" : "Brand team · v3",
    },
  ];
}
