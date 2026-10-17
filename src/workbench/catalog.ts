import type { Localized } from "./i18n";
export const catalog = [
  {
    id: "image-result",
    name: ["نتيجة الصورة", "ImageResult"],
    description: [
      "صور يزوّدها التطبيق ضمن إطار ثابت مع حالات تحميل وخطأ.",
      "Application-supplied images in a stable frame with loading and failure states.",
    ],
    file: "ImageResult.tsx",
  },
  {
    id: "sources",
    name: ["المصادر والاستشهادات", "Sources / InlineCitation"],
    description: [
      "مصادر ثابتة واستشهادات متصلة بها مع روابط آمنة وتفاصيل موجزة.",
      "Stable references and connected citations with safe links and compact details.",
    ],
    file: "Sources.tsx",
  },
  {
    id: "insight-cards",
    name: ["بطاقات النتائج", "InsightCards"],
    description: [
      "نتائج موجزة يزوّدها التطبيق مع تفاصيل وإجراءات متصلة.",
      "Concise application-supplied findings with details and connected actions.",
    ],
    file: "InsightCards.tsx",
  },

  {
    id: "chat-thread",
    name: ["المحادثة", "ChatThread"],
    description: [
      "رسائل التطبيق بمعرّفات ثابتة وفقاعات مستخدم وردود مسطّحة.",
      "Application-owned messages with stable IDs, user bubbles and flat assistant replies.",
    ],
    file: "ChatThread.tsx",
  },
  {
    id: "chat-composer",
    name: ["محرر الرسائل", "ChatComposer"],
    description: [
      "إدخال متعدد الأسطر بمسودة يتحكم بها التطبيق وإرسال آمن.",
      "Controlled multiline entry with bounded growth and deliberate submission.",
    ],
    file: "ChatComposer.tsx",
  },
  {
    id: "prompt-bar",
    name: ["شريط الموجّه", "PromptBar"],
    description: [
      "مدخل مدمج لبدء مهمة مع اقتراحات اختيارية مرتبطة بالتطبيق.",
      "Compact task entry with optional host-connected suggestions.",
    ],
    file: "PromptBar.tsx",
  },

  {
    id: "code-block",
    name: ["كتلة الشيفرة", "CodeBlock"],
    description: [
      "شيفرة مقروءة مع تلوين خفيف ونسخ كامل.",
      "Readable source with lightweight highlighting and exact copying.",
    ],
    file: "CodeBlock.tsx",
  },
  {
    id: "markdown",
    name: ["ماركداون", "Markdown"],
    description: [
      "ردود منسّقة مع روابط آمنة وجداول وشيفرة.",
      "Formatted responses with safe links, tables and code.",
    ],
    file: "Markdown.tsx",
  },
  {
    id: "streaming-text",
    name: ["النص المتدفق", "StreamingText"],
    description: [
      "نص يصل من التطبيق مع حالة تدفق صريحة.",
      "Host-supplied text with an explicit streaming state.",
    ],
    file: "StreamingText.tsx",
  },

  {
    id: "tool-call",
    name: ["استدعاء الأداة", "ToolCall"],
    description: [
      "عملية أداة واحدة بحالة وتفاصيل يزوّدها التطبيق.",
      "One application-supplied tool operation with status and expandable details.",
    ],
    file: "ToolCall.tsx",
  },
  {
    id: "tool-chips",
    name: ["ملخص الأدوات", "ToolChips"],
    description: [
      "ملخص نشاط مدمج مع إجراءات اختيارية يربطها التطبيق.",
      "Compact activity summaries with optional host-connected actions.",
    ],
    file: "ToolChips.tsx",
  },
  {
    id: "loading-state",
    name: ["حالة التحميل", "LoadingState"],
    description: [
      "تحميل مدمج مع تسمية ووصف اختياري.",
      "Compact loading feedback with a label and optional description.",
    ],
    file: "LoadingState.tsx",
  },
  {
    id: "thinking-indicator",
    name: ["مؤشر النشاط", "ThinkingIndicator"],
    description: [
      "مؤشر نشاط صغير بتسمية يزوّدها التطبيق.",
      "Small inline activity feedback with an application-supplied label.",
    ],
    file: "ThinkingIndicator.tsx",
  },
  {
    id: "thinking-state",
    name: ["حالة النشاط", "ThinkingState"],
    description: [
      "ملخص نشاط موجز وتفاصيل قابلة للتوسيع يزوّدها التطبيق.",
      "A brief application-supplied activity summary with expandable details.",
    ],
    file: "ThinkingState.tsx",
  },
  {
    id: "file-tree",
    name: ["شجرة الملفات", "FileTree"],
    description: [
      "متصفح مدمج لبيانات الملفات والمجلدات التي يزوّدها التطبيق.",
      "A compact navigator for application-supplied files and folders.",
    ],
    file: "FileTree.tsx",
  },
  {
    id: "task-rows",
    name: ["صفوف المهام", "TaskRows"],
    description: [
      "صفوف مهام وكيل قابلة للتوسيع مع حالات تنفيذ يزوّدها التطبيق.",
      "Expandable agent-task rows with application-supplied execution states.",
    ],
    file: "TaskRows.tsx",
  },
  {
    id: "notification-list",
    name: ["قائمة الإشعارات", "NotificationList"],
    description: [
      "إشعارات بترتيب التطبيق مع حالة قراءة واضحة وإجراءات مستقلة.",
      "Notifications in supplied order with explicit read state and separate actions.",
    ],
    file: "NotificationList.tsx",
  },
  {
    id: "steps",
    name: ["الخطوات", "Steps"],
    description: [
      "تسلسل واضح لعملية يملكها التطبيق، مع حالات تقدم متاحة.",
      "A clear sequence for an application-owned process with accessible progress states.",
    ],
    file: "Steps.tsx",
  },
  {
    id: "timeline",
    name: ["الخط الزمني", "Timeline"],
    description: [
      "أحداث مرتبة كما يزوّدها التطبيق مع تواريخ ومحتوى اختياري.",
      "Events in application-supplied order with timestamps and optional content.",
    ],
    file: "Timeline.tsx",
  },
  {
    id: "slider",
    name: ["شريط التمرير", "Slider"],
    description: [
      "قيمة واحدة مع تحكم أصلي باللمس ولوحة المفاتيح.",
      "One value with native pointer and keyboard control.",
    ],
    file: "Slider.tsx",
  },
  {
    id: "otp-input",
    name: ["إدخال الرمز", "OTPInput"],
    description: [
      "إدخال واحد لأرقام الرمز مع تحرير ولصق أصلي.",
      "One editable input for code digits with native selection and paste.",
    ],
    file: "OTPInput.tsx",
  },
  {
    id: "date-picker",
    name: ["اختيار التاريخ", "DatePicker"],
    description: [
      "تاريخ ميلادي واحد مع تقويم متاح وقيمة دون توقيت.",
      "One Gregorian date with an accessible calendar and date-only value.",
    ],
    file: "DatePicker.tsx",
  },
  {
    id: "file-dropzone",
    name: ["اختيار الملفات", "FileDropzone"],
    description: [
      "اختيار ملفات محلي مع فحص واضح وإزالة متاحة، دون رفع.",
      "Local file selection with clear validation and accessible removal, without uploading.",
    ],
    file: "FileDropzone.tsx",
  },
  {
    id: "color-picker",
    name: ["اختيار اللون", "ColorPicker"],
    description: [
      "ألوان جاهزة وإدخال HEX واختيار لون أصلي، دون شفافية.",
      "Named presets, HEX entry and a native chooser for opaque RGB colors.",
    ],
    file: "ColorPicker.tsx",
  },
  {
    id: "tag-input",
    name: ["إدخال الوسوم", "TagInput"],
    description: [
      "قيم نصية متعددة مع إزالة واضحة وسلوك لوحة مفاتيح أصلي.",
      "Multiple text values with explicit removal and native text editing.",
    ],
    file: "TagInput.tsx",
  },
  {
    id: "filter-bar",
    name: ["شريط التصفية", "FilterBar"],
    description: [
      "تركيب خفيف للبحث وعوامل التصفية التي يملكها التطبيق.",
      "A lightweight composition of application-owned search and filters.",
    ],
    file: "FilterBar.tsx",
  },
  {
    id: "input-copy",
    name: ["إدخال النسخ", "InputCopy"],
    description: [
      "قيمة قابلة للتحديد مع نسخ كامل ونتيجة صادقة.",
      "Selectable text with full-value copying and honest feedback.",
    ],
    file: "InputCopy.tsx",
  },
  {
    id: "sidebar",
    name: ["شريط التنقّل", "Sidebar"],
    description: [
      "تنقّل جانبي مدمج، مع شريط أيقونات ولوحة Sheet على الهاتف.",
      "Compact side navigation, an icon rail and mobile Sheet composition.",
    ],
    file: "Sidebar.tsx",
  },
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

// Documentation-only groups. Keep page IDs, metadata and source APIs unchanged.
const documentationGroups = [
  {
    id: "ai",
    name: ["أنماط الذكاء الاصطناعي", "AI patterns"],
    ids: [
      "image-result",
      "sources",
      "insight-cards",
      "chat-thread",
      "chat-composer",
      "prompt-bar",
      "loading-state",
      "thinking-indicator",
      "thinking-state",
      "task-rows",
      "tool-call",
      "tool-chips",
      "code-block",
      "markdown",
      "streaming-text",
    ],
  },
  {
    id: "forms",
    name: ["النماذج", "Forms"],
    ids: [
      "button",
      "input",
      "slider",
      "otp-input",
      "date-picker",
      "tag-input",
      "color-picker",
      "input-copy",
      "select",
      "checkbox",
      "radio-group",
      "textarea",
      "switch",
    ],
  },
  {
    id: "files",
    name: ["الملفات", "Files"],
    ids: ["file-tree", "file-dropzone"],
  },
  {
    id: "navigation",
    name: ["التنقّل", "Navigation"],
    ids: ["sidebar", "tabs", "breadcrumbs", "pagination", "steps"],
  },
  {
    id: "data",
    name: ["البيانات", "Data"],
    ids: ["filter-bar", "table", "data-table", "timeline"],
  },
  {
    id: "display",
    name: ["العرض والتنبيهات", "Display & feedback"],
    ids: [
      "notification-list",
      "card",
      "accordion",
      "avatar",
      "avatar-group",
      "badge",
      "empty-state",
      "alert",
      "toast",
      "skeleton",
      "progress",
      "spinner",
    ],
  },
  {
    id: "overlays",
    name: ["النوافذ", "Overlays"],
    ids: ["dropdown", "sheet", "modal", "tooltip"],
  },
  {
    id: "charts",
    name: ["الرسوم", "Charts"],
    ids: ["line-chart", "area-chart", "bar-chart", "donut-chart"],
  },
] satisfies ReadonlyArray<{
  id: string;
  name: Localized;
  ids: Exclude<ComponentId, "field">[];
}>;

// Only implemented pages appear in documentation groups.
export const navigationGroups = documentationGroups
  .map((group) => ({
    ...group,
    items: group.ids
      .map((id) => navigationCatalog.find((item) => item.id === id))
      .filter((item) => item !== undefined),
  }))
  .filter((group) => group.items.length > 0);
