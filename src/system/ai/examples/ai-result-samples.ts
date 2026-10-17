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
      title: ar ? "مراجعة القائمة — عينة محلية" : "Menu review — local sample",
      href: auditUrl,
      description: ar
        ? "طلب خمسة من ثمانية مشاركين في السيناريو أسماء الأصناف بالعربية بجانب الإنجليزية."
        : "Five of eight participants in the scripted scenario requested Arabic item names beside English names.",
      metadata: ar
        ? "سيناريو خيالي · 8 جلسات مكتوبة"
        : "Fictional scenario · 8 scripted sessions",
    },
    {
      id: "menu-brief",
      number: 2,
      title: ar ? "موجز القائمة — عينة محلية" : "Menu brief — local sample",
      href: briefUrl,
      description: ar
        ? "يطلب الموجز أسماء ثنائية اللغة وأسعارًا واضحة."
        : "The brief calls for bilingual names and clear prices.",
      metadata: ar
        ? "محتوى ثابت يزوّده التطبيق"
        : "Fixed application-supplied content",
    },
  ];
}
