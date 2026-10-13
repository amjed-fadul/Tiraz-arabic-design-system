import type { Localized } from "./i18n";
export const catalog = [
  {
    id: "button",
    name: ["الأزرار", "Button"],
    description: [
      "إجراءات واضحة، مع حالات للتحميل والنجاح والخطأ.",
      "Clear actions, with loading, success and error states.",
    ],
    file: "Button.tsx",
  },
  {
    id: "tabs",
    name: ["التبويبات", "Tabs"],
    description: [
      "تنقّل بين المحتوى باستخدام مؤشر سلس ولوحة المفاتيح.",
      "Navigate related content with a smooth indicator and keyboard support.",
    ],
    file: "Tabs.tsx",
  },
  {
    id: "switch",
    name: ["مفتاح التبديل", "Switch"],
    description: [
      "تحكّم واضح في إعداد بحالتين، مع تسمية مرتبطة.",
      "A labeled two-state control for settings and preferences.",
    ],
    file: "Switch.tsx",
  },
  {
    id: "dropdown",
    name: ["القائمة المنسدلة", "Dropdown menu"],
    description: [
      "إجراءات سياقية مع تنقّل بلوحة المفاتيح واستعادة التركيز.",
      "Contextual actions with keyboard navigation and focus restoration.",
    ],
    file: "DropdownMenu.tsx",
  },
  {
    id: "sheet",
    name: ["اللوحة الجانبية", "Sheet"],
    description: [
      "عرض التفاصيل دون مغادرة الصفحة، مع إدارة كاملة للتركيز.",
      "Show details without leaving the page, with managed modal focus.",
    ],
    file: "Sheet.tsx",
  },
  {
    id: "toast",
    name: ["التنبيهات", "Toast"],
    description: [
      "رسائل نجاح وخطأ ومعلومات، معلنة لقارئات الشاشة.",
      "Success, error and informational feedback with accessible announcements.",
    ],
    file: "Toast.tsx",
  },
  {
    id: "field",
    name: ["الحقل", "Field"],
    description: [
      "تسمية ومساعدة وأخطاء مرتبطة بعنصر واحد. التطبيق يملك التحقق.",
      "Label, help and errors associated with one control. The application owns validation.",
    ],
    file: "Field.tsx",
  },
  {
    id: "input",
    name: ["الإدخال", "Input"],
    description: [
      "إدخال نص أصلي مع تسمية ومساعدة ورسالة خطأ اختيارية.",
      "Native text entry with optional label, helper and error text.",
    ],
    file: "Input.tsx",
  },
  {
    id: "select",
    name: ["الاختيار", "Select"],
    description: [
      "اختيار قيمة واحدة بلوحة المفاتيح ودعم النماذج.",
      "Choose one value with keyboard and form support.",
    ],
    file: "Select.tsx",
  },
  {
    id: "table",
    name: ["الجدول", "Table"],
    description: [
      "جدول HTML للعناوين والصفوف، مع تمرير أفقي داخل الحاوية.",
      "A native HTML table with headers, rows and internal horizontal scrolling.",
    ],
    file: "Table.tsx",
  },
  {
    id: "data-table",
    name: ["جدول البيانات", "DataTable"],
    description: [
      "إدارة العملاء مع البحث والتصفية والفرز وتقسيم الصفحات. استخدم Table للجداول البسيطة.",
      "Manage customers with search, filtering, sorting and pagination. Use Table for simple tables.",
    ],
    file: "DataTable.tsx",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: Localized;
  description: Localized;
  file: string;
}>;
export type ComponentId = (typeof catalog)[number]["id"];

// Field remains a public family; its composition reference lives under Input.
export const navigationCatalog = catalog.filter((item) => item.id !== "field");
