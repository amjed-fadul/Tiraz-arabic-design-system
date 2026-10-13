import type { ComponentId } from "./catalog";
import type { Localized } from "./i18n";
export interface WorkbenchField {
  key: string;
  kind: "text" | "select" | "boolean" | "number" | "collection" | "attributes";
  title: Localized;
  api: string;
  advanced?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  help?: Localized;
}
const field = (
  key: string,
  kind: WorkbenchField["kind"],
  ar: string,
  en: string,
  api = key,
  extra: Partial<WorkbenchField> = {},
): WorkbenchField => ({ key, kind, title: [ar, en], api, ...extra });
const mode = field(
  "mode",
  "select",
  "إدارة الحالة",
  "State management",
  "value / defaultValue",
  { advanced: true, options: ["controlled", "uncontrolled"] },
);
const native: WorkbenchField[] = [
  field("id", "text", "معرّف العنصر", "Element ID"),
  field("className", "text", "فئة CSS", "CSS class"),
  field("stylePreset", "select", "نمط عنصر جاهز", "Style preset", "style", {
    options: ["none", "wide"],
  }),
  field(
    "attributes",
    "attributes",
    "سمات العنصر",
    "DOM attributes",
    "HTML / ARIA / data-*",
    {
      help: [
        "سمات أصلية فقط. معالجات الأحداث موثّقة، ولا تُكتب كسلاسل.",
        "Native attributes only. Event functions are documented, not edited as strings.",
      ],
    },
  ),
].map((item) => ({ ...item, advanced: true }));
const trigger: WorkbenchField[] = [
  field(
    "triggerLabel",
    "text",
    "تسمية زر الفتح",
    "Trigger label",
    "trigger · Button.children",
  ),
  field(
    "triggerVariant",
    "select",
    "نوع زر الفتح",
    "Trigger variant",
    "trigger · Button.variant",
    {
      advanced: true,
      options: ["primary", "secondary", "ghost", "destructive"],
    },
  ),
  field(
    "triggerSize",
    "select",
    "حجم زر الفتح",
    "Trigger size",
    "trigger · Button.size",
    { advanced: true, options: ["sm", "md"] },
  ),
];
export const fields: Record<ComponentId, WorkbenchField[]> = {
  "data-table": [
    field("caption", "text", "العنوان", "Caption", "caption"),
    field(
      "preset",
      "select",
      "حالة المثال",
      "Example state",
      "application preset",
      { options: ["populated", "loading", "empty", "no-results", "error"] },
    ),
  ],
  table: [
    field("caption", "text", "عنوان الجدول", "Caption", "caption"),
    field("preset", "select", "المحتوى", "Content", "children", {
      options: ["populated", "empty"],
    }),
  ],
  field: [
    field("label", "text", "التسمية", "Label"),
    field("helper", "text", "النص المساعد", "Helper text"),
    field("error", "text", "رسالة الخطأ", "Error message"),
    field("required", "boolean", "مطلوب", "Required"),
  ],
  input: [
    field("label", "text", "التسمية", "Label"),
    field("placeholder", "text", "النص المؤقت", "Placeholder"),
    field("size", "select", "الحجم", "Size", "size", { options: ["sm", "md"] }),
    field("type", "select", "نوع الإدخال", "Input type", "type", {
      options: ["text", "email", "password", "search", "tel", "url"],
    }),
    field("disabled", "boolean", "معطّل", "Disabled"),
    field("readOnly", "boolean", "للقراءة فقط", "Read only"),
    field("helper", "text", "النص المساعد", "Helper text"),
    field("error", "text", "رسالة الخطأ", "Error message"),
    field("required", "boolean", "مطلوب", "Required"),
    mode,
  ],
  select: [
    field("label", "text", "التسمية", "Label"),
    field("placeholder", "text", "النص المؤقت", "Placeholder"),
    field("size", "select", "الحجم", "Size", "size", { options: ["sm", "md"] }),
    field("disabled", "boolean", "معطّل", "Disabled"),
    field("options", "collection", "الخيارات", "Options"),
    field("required", "boolean", "مطلوب", "Required"),
    mode,
  ],
  button: [
    field("children", "text", "التسمية", "Label", "children"),
    field("variant", "select", "النوع", "Variant", "variant", {
      options: ["primary", "secondary", "ghost", "destructive"],
    }),
    field("size", "select", "الحجم", "Size", "size", { options: ["sm", "md"] }),
    field("state", "select", "الحالة", "State", "state", {
      options: ["idle", "loading", "success", "error"],
    }),
    field("disabled", "boolean", "معطّل", "Disabled"),
    field("iconOnly", "boolean", "أيقونة فقط", "Icon only"),
    field(
      "icon",
      "select",
      "أيقونة المحتوى",
      "Content icon",
      "children · preset",
      { advanced: true, options: ["none", "plus", "download", "settings"] },
    ),
    field(
      "ariaLabel",
      "text",
      "الاسم المعلن",
      "Accessible name",
      "aria-label",
      { advanced: true },
    ),
    field("type", "select", "نوع عنصر HTML", "HTML button type", "type", {
      advanced: true,
      options: ["button", "submit", "reset"],
    }),
    field(
      "action",
      "select",
      "سلوك الضغط",
      "Click behavior",
      "onClick · demo",
      { advanced: true, options: ["simulate", "log"] },
    ),
    field(
      "outcome",
      "select",
      "نتيجة المحاكاة",
      "Simulated outcome",
      "onClick · demo",
      { advanced: true, options: ["success", "error"] },
    ),
    ...native,
  ],
  tabs: [
    field("variant", "select", "النمط", "Variant", "variant", {
      options: ["underline", "segment"],
    }),
    field(
      "value",
      "select",
      "التبويب المحدد",
      "Selected tab",
      "value / defaultValue",
    ),
    field("items", "collection", "محتوى التبويبات", "Tab collection", "items", {
      advanced: true,
      help: [
        "value، label، content، disabled. يدعم العرض نصوصًا ممثلة لـ ReactNode.",
        "value, label, content, disabled. Text represents ReactNode content.",
      ],
    }),
    field(
      "label",
      "text",
      "اسم مجموعة التبويبات",
      "Tab-list accessible name",
      "label",
      { advanced: true },
    ),
    mode,
    field("className", "text", "فئة CSS", "CSS class", "className", {
      advanced: true,
    }),
  ],
  switch: [
    field("label", "text", "التسمية", "Label"),
    field("description", "text", "النص المساعد", "Description"),
    field("checked", "boolean", "مفعّل", "Checked", "checked / defaultChecked"),
    field("disabled", "boolean", "معطّل", "Disabled"),
    { ...mode, api: "checked / defaultChecked" },
    field("type", "select", "نوع عنصر HTML", "HTML button type", "type", {
      advanced: true,
      options: ["button", "submit", "reset"],
    }),
    field(
      "required",
      "boolean",
      "مطلوب في النموذج",
      "Required in a form",
      "required",
      { advanced: true },
    ),
    field("name", "text", "اسم حقل النموذج", "Form field name", "name", {
      advanced: true,
    }),
    field("value", "text", "قيمة حقل النموذج", "Form field value", "value", {
      advanced: true,
    }),
    ...native,
  ],
  dropdown: [
    ...trigger,
    field("align", "select", "المحاذاة", "Alignment", "align", {
      options: ["start", "end"],
    }),
    field("open", "boolean", "القائمة مفتوحة", "Menu open"),
    { ...mode, api: "open / onOpenChange" },
    field("items", "collection", "عناصر القائمة", "Menu items", "items", {
      advanced: true,
      help: [
        "id، label، icon، shortcut، disabled، destructive، separatorBefore. كل عنصر يعلن onSelect.",
        "id, label, icon, shortcut, disabled, destructive, separatorBefore. Every item reports onSelect.",
      ],
    }),
  ],
  sheet: [
    ...trigger,
    field("title", "text", "عنوان اللوحة", "Panel title"),
    field("description", "text", "وصف اللوحة", "Panel description"),
    field("side", "select", "جانب الظهور", "Side", "side", {
      options: ["auto", "right", "left"],
    }),
    field("open", "boolean", "اللوحة مفتوحة", "Panel open"),
    field(
      "children",
      "text",
      "محتوى اللوحة",
      "Panel content",
      "children · text preset",
      { advanced: true },
    ),
    field(
      "closeLabel",
      "text",
      "تسمية الإغلاق",
      "Close accessible name",
      "closeLabel",
      { advanced: true },
    ),
    field(
      "footer",
      "boolean",
      "إظهار التذييل",
      "Show footer",
      "footer · preset",
      { advanced: true },
    ),
    field(
      "footerLabel",
      "text",
      "تسمية زر التذييل",
      "Footer action label",
      "footer · Button.children",
      { advanced: true },
    ),
    { ...mode, api: "open / onOpenChange" },
  ],
  toast: [
    field("title", "text", "عنوان التنبيه", "Toast title"),
    field("description", "text", "وصف التنبيه", "Toast description"),
    field("tone", "select", "نوع التنبيه", "Tone", "toast.tone", {
      options: ["success", "error", "info"],
    }),
    field(
      "duration",
      "number",
      "المدة بالمللي ثانية",
      "Duration in milliseconds",
      "toast.duration",
      { min: 1000, max: 60000 },
    ),
    field(
      "triggerLabel",
      "text",
      "تسمية زر العرض",
      "Demo trigger label",
      "ToastProvider.children · demo",
      { advanced: true },
    ),
    field(
      "providerLabel",
      "text",
      "اسم منطقة التنبيهات",
      "Notifications accessible name",
      "ToastProvider.label",
      { advanced: true },
    ),
    field(
      "closeLabel",
      "text",
      "تسمية الإغلاق",
      "Dismiss accessible name",
      "ToastProvider.closeLabel",
      { advanced: true },
    ),
  ],
};
export const optionNames: Record<string, Localized> = {
  primary: ["أساسي", "Primary"],
  secondary: ["ثانوي", "Secondary"],
  ghost: ["خفيف", "Ghost"],
  destructive: ["حذف", "Destructive"],
  sm: ["صغير · sm", "Small · sm"],
  md: ["عادي · md", "Regular · md"],
  idle: ["جاهز", "Idle"],
  disabled: ["معطّل", "Disabled"],
  loading: ["تحميل", "Loading"],
  success: ["نجاح", "Success"],
  error: ["خطأ", "Error"],
  none: ["بدون", "None"],
  wide: ["عريض · 180px", "Wide · 180px"],
  plus: ["إضافة", "Plus"],
  download: ["تنزيل", "Download"],
  settings: ["إعدادات", "Settings"],
  simulate: ["محاكاة 1.2s", "Simulate 1.2s"],
  log: ["تسجيل الحدث", "Log event"],
  controlled: ["متحكّم بها", "Controlled"],
  uncontrolled: ["داخلية", "Uncontrolled"],
  underline: ["خط سفلي", "Underline"],
  segment: ["مقسّم", "Segmented"],
  start: ["البداية", "Start"],
  end: ["النهاية", "End"],
  auto: ["بحسب الاتجاه", "Direction default"],
  right: ["اليمين", "Right"],
  left: ["اليسار", "Left"],
  info: ["معلومة", "Information"],
  "no-results": ["لا توجد نتائج مطابقة", "No matching results"],
  populated: ["صفوف نموذجية", "Populated"],
  empty: ["فارغ", "Empty"],
  inherit: ["إعداد النظام", "System setting"],
  light: ["فاتح", "Light"],
  dark: ["داكن", "Dark"],
  sage: ["أخضر", "Green"],
  blue: ["أزرق", "Blue"],
  plum: ["بنفسجي", "Purple"],
  clay: ["بني", "Brown"],
  button: ["زر", "Button"],
  submit: ["إرسال نموذج", "Submit"],
  reset: ["إعادة ضبط نموذج", "Reset"],
};

// The complete field catalog remains available to API documentation; the inspector is intentionally small.
const commonKeys: Record<ComponentId, string[]> = {
  "data-table": ["caption", "preset"],
  table: ["caption", "preset"],
  field: ["label", "helper", "error", "required"],
  input: [
    "label",
    "placeholder",
    "helper",
    "error",
    "required",
    "size",
    "disabled",
    "readOnly",
  ],
  select: ["placeholder", "size", "disabled", "options"],
  button: ["children", "variant", "size", "state", "icon", "iconOnly"],
  tabs: ["variant", "value"],
  switch: ["label", "checked", "disabled"],
  dropdown: ["triggerLabel", "align", "items"],
  sheet: ["title", "children", "side"],
  toast: ["title", "description", "tone", "duration"],
};
export const commonFields = Object.fromEntries(
  Object.entries(commonKeys).map(([component, keys]) => [
    component,
    keys.map((key) =>
      fields[component as ComponentId].find((field) => field.key === key)!,
    ),
  ]),
) as Record<ComponentId, WorkbenchField[]>;

const shortTitles: Record<string, Localized> = {
  children: ["التسمية", "Label"],
  icon: ["الأيقونة", "Icon"],
  value: ["التحديد", "Selection"],
  triggerLabel: ["زر الفتح", "Trigger label"],
  items: ["العناصر", "Items"],
  title: ["العنوان", "Title"],
  description: ["الوصف", "Description"],
  duration: ["المدة · ms", "Duration · ms"],
  side: ["الجانب", "Side"],
  tone: ["النوع", "Tone"],
};
for (const component of Object.keys(commonFields) as ComponentId[])
  commonFields[component] = commonFields[component].map((f) => ({
    ...f,
    title:
      component === "sheet" && f.key === "children"
        ? ["المحتوى", "Content"]
        : (shortTitles[f.key] ?? f.title),
  }));
