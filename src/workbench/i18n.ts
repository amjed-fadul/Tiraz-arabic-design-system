export type Language = "ar" | "en";
export type Localized = readonly [string, string];
export function localize(value: Localized, language: Language) {
  return value[language === "ar" ? 0 : 1];
}
export function words(language: Language) {
  return (ar: string, en: string) => (language === "ar" ? ar : en);
}
export const labels = {
  components: ["المكوّنات", "Components"],
  customize: ["تخصيص", "Customize"],
  customizeTitle: ["تخصيص المعاينة", "Customize the preview"],
  customizeHint: [
    "تتغيّر المعاينة فور تعديلها.",
    "The preview updates as you change it.",
  ],
  closeCustomize: ["إغلاق التخصيص", "Close customize"],
  systemSettings: ["إعدادات النظام", "System settings"],
  reset: ["إعادة الضبط", "Reset"],
  savedHere: [
    "تُحفظ الإعدادات في هذا المتصفح.",
    "Settings are saved in this browser.",
  ],
  advanced: ["خصائص متقدمة", "Advanced properties"],
  resetPlayground: ["إعادة ضبط المعاينة", "Reset playground"],
  resetSystem: ["إعادة ضبط النظام", "Reset system"],
  copyConfig: ["نسخ الإعدادات", "Copy settings"],
  useInApp: ["استخدمه في تطبيقك", "Use it in your app"],
  playground: ["المعاينة التفاعلية", "Interactive playground"],
  guidelines: ["إرشادات الاستخدام", "Usage guidelines"],
  backToDocs: ["العودة إلى التوثيق", "Back to the documentation"],
  copyPrompt: ["نسخ الطلب", "Copy agent prompt"],
  copied: ["تم النسخ", "Copied"],
  failed: [
    "تعذّر النسخ. حدّد النص وانسخه يدويًا.",
    "Copy failed. Select and copy the text manually.",
  ],
  theme: ["مظهر المكوّنات", "Component theme"],
  light: ["فاتح", "Light"],
  dark: ["داكن", "Dark"],
  accent: ["اللون الأساسي", "Accent"],
  density: ["الكثافة", "Density"],
  compact: ["مدمجة", "Compact"],
  standard: ["مريحة", "Comfortable"],
  typography: ["حجم النص", "Text size"],
  normalText: ["عادي", "Standard"],
  largeText: ["كبير", "Large"],
  numerals: ["الأرقام", "Numerals"],
  arabicNumerals: ["مشرقية · ١٢٣", "Arabic-Indic · ١٢٣"],
  westernNumerals: ["غربية · 123", "Western · 123"],
  corners: ["استدارة الزوايا", "Corner radius"],
  pixels: ["بكسل", "px"],
  motion: ["تقليل الحركة", "Reduce motion"],
  inherited: ["إعداد النظام", "System setting"],
  lastEvent: ["آخر حدث", "Latest event"],
  waiting: [
    "تفاعل مع المكوّن لرؤية الحدث هنا.",
    "Interact with the component to see its event here.",
  ],
  api: ["دليل الخصائص", "API reference"],
  close: ["إغلاق", "Close"],
  showPrompt: ["عرض الطلب كاملًا", "Show full prompt"],
  controlMode: ["إدارة الحالة", "State management"],
  controlled: ["يديرها تطبيقك", "Controlled"],
  uncontrolled: ["يديرها المكوّن", "Uncontrolled"],
  apply: ["تطبيق البيانات", "Apply collection"],
  invalid: [
    "بيانات غير صالحة. راجع الأنواع والمعرّفات الفريدة.",
    "Invalid collection. Check types and unique identifiers.",
  ],
  nativeAttrs: ["سمات العنصر", "DOM attributes"],
  previewOverrides: ["تجاوز إعداد النظام", "Playground overrides"],
  show: ["فتح", "Open"],
  docTheme: ["تبديل المظهر", "Toggle theme"],
} satisfies Record<string, Localized>;
export type LabelKey = keyof typeof labels;
export function label(key: LabelKey, language: Language) {
  return localize(labels[key], language);
}
