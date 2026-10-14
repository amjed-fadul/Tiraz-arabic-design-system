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
  {
    id: "badge",
    name: ["الشارة", "Badge"],
    description: [
      "حالة واضحة بالنص وألوان دلالية هادئة.",
      "Static status text with subtle semantic tones.",
    ],
    file: "Badge.tsx",
  },
  {
    id: "checkbox",
    name: ["مربع الاختيار", "Checkbox"],
    description: [
      "اختيار أصلي مستقل مع تسمية ومساعدة وأخطاء.",
      "An independent native checkbox with label, help and errors.",
    ],
    file: "Checkbox.tsx",
  },
  {
    id: "radio-group",
    name: ["مجموعة الخيارات", "RadioGroup"],
    description: [
      "اختيار واحد ضمن مجموعة أصلية مسماة.",
      "One native choice within a named group.",
    ],
    file: "RadioGroup.tsx",
  },
  {
    id: "textarea",
    name: ["النص المتعدد", "Textarea"],
    description: [
      "نص متعدد الأسطر مع تغيير الحجم عموديًا.",
      "Native multiline text with vertical resizing.",
    ],
    file: "Textarea.tsx",
  },
  {
    id: "avatar",
    name: ["الصورة الشخصية", "Avatar"],
    description: [
      "صورة أو أحرف بديلة ثابتة باسم واضح.",
      "An image or stable initials with a meaningful name.",
    ],
    file: "Avatar.tsx",
  },
  {
    id: "avatar-group",
    name: ["مجموعة الصور", "AvatarGroup"],
    description: [
      "أعضاء بترتيب واضح مع عدد إضافي غير تفاعلي.",
      "Ordered members with a static overflow count.",
    ],
    file: "AvatarGroup.tsx",
  },
  {
    id: "tooltip",
    name: ["التلميح", "Tooltip"],
    description: [
      "توضيح قصير عند المرور أو التركيز بلوحة المفاتيح.",
      "A short explanation on hover or keyboard focus.",
    ],
    file: "Tooltip.tsx",
  },
  {
    id: "modal",
    name: ["النافذة الحوارية", "Modal"],
    description: [
      "حوار مركزي لمهمة محددة مع إدارة التركيز.",
      "A centered dialog for one focused task with managed focus.",
    ],
    file: "Modal.tsx",
  },
  {
    id: "empty-state",
    name: ["الحالة الفارغة", "EmptyState"],
    description: [
      "عنوان ووصف ورسوم زخرفية اختيارية وإجراء من التطبيق.",
      "Clear text, optional decorative artwork and an application action.",
    ],
    file: "EmptyState.tsx",
  },
  {
    id: "alert",
    name: ["الرسالة الدلالية", "Alert"],
    description: [
      "رسالة ثابتة داخل المحتوى، مع إعلان اختياري.",
      "Persistent inline feedback with optional announcements.",
    ],
    file: "Alert.tsx",
  },
  {
    id: "skeleton",
    name: ["هيكل التحميل", "Skeleton"],
    description: [
      "عناصر مؤقتة زخرفية أثناء تحميل المحتوى.",
      "Decorative placeholders while content is loading.",
    ],
    file: "Skeleton.tsx",
  },
  {
    id: "progress",
    name: ["التقدم", "Progress"],
    description: [
      "تقدم محدد أو انتظار دون قيمة رقمية.",
      "Determinate progress or waiting without a numeric value.",
    ],
    file: "Progress.tsx",
  },
  {
    id: "spinner",
    name: ["مؤشر التحميل", "Spinner"],
    description: [
      "مؤشر صغير مع تسمية أو بجوار نص مكافئ.",
      "A small named indicator or decoration beside equivalent text.",
    ],
    file: "Spinner.tsx",
  },
  {
    id: "card",
    name: ["البطاقة", "Card"],
    description: [
      "سطح هادئ مع عنوان ومحتوى وإجراءات من التطبيق.",
      "A quiet surface with composable heading, content and application actions.",
    ],
    file: "Card.tsx",
  },
  {
    id: "accordion",
    name: ["الأكورديون", "Accordion"],
    description: [
      "إظهار قسم واحد مع بقاء العناوين متاحة.",
      "Reveal one section while keeping headings available.",
    ],
    file: "Accordion.tsx",
  },
  {
    id: "breadcrumbs",
    name: ["مسار التنقل", "Breadcrumbs"],
    description: [
      "روابط أصلية للمسار مع نص للصفحة الحالية.",
      "Native path links with current-page text.",
    ],
    file: "Breadcrumbs.tsx",
  },
  {
    id: "pagination",
    name: ["تقسيم الصفحات", "Pagination"],
    description: [
      "تنقل مضبوط بين الصفحات؛ التطبيق يملك البيانات.",
      "Controlled page navigation; the application owns data.",
    ],
    file: "Pagination.tsx",
  },
  {
    id: "line-chart",
    name: ["الرسم الخطي", "Line chart"],
    description: [
      "اتجاه القيم عبر الزمن، مع فجوات للقيم المفقودة.",
      "Trends over time, with gaps for missing values.",
    ],
    file: "Charts.tsx",
  },
  {
    id: "area-chart",
    name: ["الرسم المساحي", "Area chart"],
    description: [
      "اتجاه القيم مع تعبئة هادئة أسفل الخط.",
      "Trends with a restrained fill beneath each line.",
    ],
    file: "Charts.tsx",
  },
  {
    id: "bar-chart",
    name: ["الرسم العمودي", "Bar chart"],
    description: [
      "مقارنة فئات أو سلاسل بقيم واضحة.",
      "Compare categories or series with clear values.",
    ],
    file: "Charts.tsx",
  },
  {
    id: "donut-chart",
    name: ["الرسم الحلقي", "Donut chart"],
    description: [
      "نسب الأجزاء من الكل دون تحريك الشرائح.",
      "Parts of a whole, without moving slices.",
    ],
    file: "Charts.tsx",
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
