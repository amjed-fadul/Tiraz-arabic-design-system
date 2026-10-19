import type { Localized } from "./i18n";
export const catalog = [
  {
    id: "terminal",
    name: ["الطرفية", "Terminal"],
    description: [
      "يعرض الأوامر ومخرجاتها كما في الطرفية، للقراءة فقط.",
      "Read-only presentation of application-supplied commands and output.",
    ],
    file: "Terminal.tsx",
  },
  {
    id: "chat-app",
    name: ["تطبيق المحادثة", "ChatApp"],
    description: [
      "يجمع أجزاء المحادثة في واجهة واحدة، ويترك الحالة والمحتوى لتطبيقك.",
      "Reusable chat composition with application-owned state and content.",
    ],
    file: "ChatApp.tsx",
  },

  {
    id: "ask-user-questions",
    name: ["أسئلة للمستخدم", "AskUserQuestions"],
    description: [
      "يطرح أسئلتك على المستخدم، ويتيح له تعديل إجاباته قبل إرسالها.",
      "Application-supplied questions with editable answers and deliberate submission.",
    ],
    file: "AskUserQuestions.tsx",
  },
  {
    id: "approval-card",
    name: ["بطاقة القرار", "ApprovalCard"],
    description: [
      "يعرض الإجراء وهدفه وعواقبه ليوافق المستخدم عليه أو يرفضه مرة واحدة.",
      "A concrete one-time action preview with independent approve and reject decisions.",
    ],
    file: "ApprovalCard.tsx",
  },
  {
    id: "approval-flow",
    name: ["تسلسل القرارات", "ApprovalFlow"],
    description: [
      "يعرض طلبات مستقلة بالتتابع، وينتقل إلى التالي حين يقبل تطبيقك القرار.",
      "A short sequence of independent requests, advanced after host acceptance.",
    ],
    file: "ApprovalFlow.tsx",
  },

  {
    id: "selection-actions",
    name: ["إجراءات التحديد", "SelectionActions"],
    description: [
      "يقترح إجراءات سريعة للنص المحدّد داخل منطقة تعيّنها، ويترك النتيجة لتطبيقك.",
      "Compact actions for text selected inside an explicit scope; the host owns the result.",
    ],
    file: "SelectionActions.tsx",
  },
  {
    id: "context-meter",
    name: ["مقياس السياق", "ContextMeter"],
    description: [
      "يلخّص استهلاك السياق وسعته، ويعرض التفاصيل من القيم التي تمرّرها.",
      "Compact usage summary and details from application-supplied values.",
    ],
    file: "ContextMeter.tsx",
  },
  {
    id: "model-selector",
    name: ["اختيار النموذج", "ModelSelector"],
    description: [
      "يتيح اختيار نموذج من القائمة التي تمرّرها، ويدير تطبيقك القيمة بمعرّف ثابت.",
      "Controlled selection from application-supplied models with stable IDs.",
    ],
    file: "ModelSelector.tsx",
  },
  {
    id: "image-result",
    name: ["نتيجة الصورة", "ImageResult"],
    description: [
      "يعرض صورك في إطار ثابت، مع حالتي التحميل والخطأ.",
      "Application-supplied images in a stable frame with loading and failure states.",
    ],
    file: "ImageResult.tsx",
  },
  {
    id: "sources",
    name: ["المصادر والاستشهادات", "Sources / InlineCitation"],
    description: [
      "يربط كل إشارة في النص بمصدرها، مع روابط آمنة وتفاصيل موجزة.",
      "Stable references and connected citations with safe links and compact details.",
    ],
    file: "Sources.tsx",
  },
  {
    id: "insight-cards",
    name: ["بطاقات النتائج", "InsightCards"],
    description: [
      "يعرض النتائج باختصار، مع تفاصيلها والإجراءات المرتبطة بها.",
      "Concise application-supplied findings with details and connected actions.",
    ],
    file: "InsightCards.tsx",
  },

  {
    id: "chat-thread",
    name: ["المحادثة", "ChatThread"],
    description: [
      "يعرض رسائل المحادثة، فيضع رسائل المستخدم في فقاعات ويترك ردود المساعد بلا إطار.",
      "Application-owned messages with stable IDs, user bubbles and flat assistant replies.",
    ],
    file: "ChatThread.tsx",
  },
  {
    id: "chat-composer",
    name: ["محرر الرسائل", "ChatComposer"],
    description: [
      "يتيح كتابة رسالة من عدة أسطر، ويدير تطبيقك المسودة حتى يرسلها المستخدم.",
      "Controlled multiline entry with bounded growth and deliberate submission.",
    ],
    file: "ChatComposer.tsx",
  },
  {
    id: "prompt-bar",
    name: ["شريط الطلب", "PromptBar"],
    description: [
      "يتيح للمستخدم بدء مهمة من حقل مدمج، مع اقتراحات اختيارية من تطبيقك.",
      "Compact task entry with optional host-connected suggestions.",
    ],
    file: "PromptBar.tsx",
  },

  {
    id: "code-block",
    name: ["كتلة الكود", "CodeBlock"],
    description: [
      "يعرض الكود بتلوين خفيف يسهّل قراءته، وينسخه كاملًا.",
      "Readable source with lightweight highlighting and exact copying.",
    ],
    file: "CodeBlock.tsx",
  },
  {
    id: "markdown",
    name: ["ماركداون", "Markdown"],
    description: [
      "يعرض الردود المنسّقة بما فيها من روابط آمنة وجداول وكود.",
      "Formatted responses with safe links, tables and code.",
    ],
    file: "Markdown.tsx",
  },
  {
    id: "streaming-text",
    name: ["النص المتتابع", "StreamingText"],
    description: [
      "يعرض النص الذي يصل تباعًا من تطبيقك، ويوضّح متى يكتمل.",
      "Host-supplied text with an explicit streaming state.",
    ],
    file: "StreamingText.tsx",
  },

  {
    id: "tool-call",
    name: ["استدعاء الأداة", "ToolCall"],
    description: [
      "يعرض استدعاء أداة واحدًا بحالته، مع تفاصيل تنفتح عند الحاجة.",
      "One application-supplied tool operation with status and expandable details.",
    ],
    file: "ToolCall.tsx",
  },
  {
    id: "tool-chips",
    name: ["ملخص الأدوات", "ToolChips"],
    description: [
      "يلخّص نشاط الأدوات في سطر مدمج، مع إجراءات اختيارية يربطها تطبيقك.",
      "Compact activity summaries with optional host-connected actions.",
    ],
    file: "ToolChips.tsx",
  },
  {
    id: "loading-state",
    name: ["حالة التحميل", "LoadingState"],
    description: [
      "يُظهر حالة التحميل بتسمية قصيرة ووصف اختياري.",
      "Compact loading feedback with a label and optional description.",
    ],
    file: "LoadingState.tsx",
  },
  {
    id: "thinking-indicator",
    name: ["مؤشر النشاط", "ThinkingIndicator"],
    description: [
      "يُظهر أن المساعد يعمل، بمؤشر صغير وتسمية تختارها.",
      "Small inline activity feedback with an application-supplied label.",
    ],
    file: "ThinkingIndicator.tsx",
  },
  {
    id: "thinking-state",
    name: ["حالة النشاط", "ThinkingState"],
    description: [
      "يلخّص ما يفعله المساعد في سطر، مع تفاصيل تنفتح عند الحاجة.",
      "A brief application-supplied activity summary with expandable details.",
    ],
    file: "ThinkingState.tsx",
  },
  {
    id: "file-tree",
    name: ["شجرة الملفات", "FileTree"],
    description: [
      "يتيح التنقّل بين ملفاتك ومجلداتك في شجرة مدمجة.",
      "A compact navigator for application-supplied files and folders.",
    ],
    file: "FileTree.tsx",
  },
  {
    id: "task-rows",
    name: ["صفوف المهام", "TaskRows"],
    description: [
      "يعرض مهام الوكيل وحالة تنفيذ كل منها، مع تفاصيل تنفتح عند الحاجة.",
      "Expandable agent-task rows with application-supplied execution states.",
    ],
    file: "TaskRows.tsx",
  },
  {
    id: "notification-list",
    name: ["قائمة الإشعارات", "NotificationList"],
    description: [
      "يعرض الإشعارات بالترتيب الذي تمرّره، ويميّز المقروء منها، ولكل إشعار إجراءاته.",
      "Notifications in supplied order with explicit read state and separate actions.",
    ],
    file: "NotificationList.tsx",
  },
  {
    id: "steps",
    name: ["الخطوات", "Steps"],
    description: [
      "يوضّح مراحل العملية التي يديرها تطبيقك، وأين وصل المستخدم منها.",
      "A clear sequence for an application-owned process with accessible progress states.",
    ],
    file: "Steps.tsx",
  },
  {
    id: "timeline",
    name: ["الخط الزمني", "Timeline"],
    description: [
      "يعرض الأحداث بالترتيب الذي تمرّره، مع تواريخها ومحتوى اختياري.",
      "Events in application-supplied order with timestamps and optional content.",
    ],
    file: "Timeline.tsx",
  },
  {
    id: "slider",
    name: ["شريط التمرير", "Slider"],
    description: [
      "يتيح اختيار قيمة واحدة بالسحب أو بلوحة المفاتيح.",
      "One value with native pointer and keyboard control.",
    ],
    file: "Slider.tsx",
  },
  {
    id: "otp-input",
    name: ["إدخال الرمز", "OTPInput"],
    description: [
      "يجمع أرقام الرمز في حقل واحد يقبل التعديل واللصق كالمعتاد.",
      "One editable input for code digits with native selection and paste.",
    ],
    file: "OTPInput.tsx",
  },
  {
    id: "date-picker",
    name: ["اختيار التاريخ", "DatePicker"],
    description: [
      "يتيح اختيار تاريخ ميلادي واحد من التقويم، ويعيده دون وقت.",
      "One Gregorian date with an accessible calendar and date-only value.",
    ],
    file: "DatePicker.tsx",
  },
  {
    id: "file-dropzone",
    name: ["اختيار الملفات", "FileDropzone"],
    description: [
      "يتيح اختيار ملفات من الجهاز وفحصها وإزالتها، دون رفعها.",
      "Local file selection with clear validation and accessible removal, without uploading.",
    ],
    file: "FileDropzone.tsx",
  },
  {
    id: "color-picker",
    name: ["اختيار اللون", "ColorPicker"],
    description: [
      "يقدّم ألوانًا جاهزة وحقلًا لرمز HEX ومنتقي المتصفح، دون شفافية.",
      "Named presets, HEX entry and a native chooser for opaque RGB colors.",
    ],
    file: "ColorPicker.tsx",
  },
  {
    id: "tag-input",
    name: ["إدخال الوسوم", "TagInput"],
    description: [
      "يجمع عدة قيم نصية في وسوم يسهل حذفها، مع تحرير النص كالمعتاد.",
      "Multiple text values with explicit removal and native text editing.",
    ],
    file: "TagInput.tsx",
  },
  {
    id: "filter-bar",
    name: ["شريط التصفية", "FilterBar"],
    description: [
      "يجمع البحث وعوامل التصفية في شريط خفيف، ويترك قيمها لتطبيقك.",
      "A lightweight composition of application-owned search and filters.",
    ],
    file: "FilterBar.tsx",
  },
  {
    id: "input-copy",
    name: ["حقل النسخ", "InputCopy"],
    description: [
      "يعرض قيمة يمكن تحديدها ونسخها كاملة، ويخبر المستخدم إن نجح النسخ أو تعذّر.",
      "Selectable text with full-value copying and honest feedback.",
    ],
    file: "InputCopy.tsx",
  },
  {
    id: "sidebar",
    name: ["شريط التنقّل", "Sidebar"],
    description: [
      "يعرض التنقّل في شريط جانبي مدمج يُطوى إلى أيقونات، وفي لوحة Sheet على الهاتف.",
      "Compact side navigation, an icon rail and mobile Sheet composition.",
    ],
    file: "Sidebar.tsx",
  },
  {
    id: "button",
    name: ["الأزرار", "Button"],
    description: [
      "يتيح للمستخدم تنفيذ إجراء واضح، ويُظهر حالات التحميل والنجاح والخطأ.",
      "Clear actions, with loading, success and error states.",
    ],
    file: "Button.tsx",
  },
  {
    id: "tabs",
    name: ["التبويبات", "Tabs"],
    description: [
      "يتيح التنقّل بين أقسام المحتوى بمؤشر سلس ولوحة المفاتيح.",
      "Navigate related content with a smooth indicator and keyboard support.",
    ],
    file: "Tabs.tsx",
  },
  {
    id: "switch",
    name: ["مفتاح التبديل", "Switch"],
    description: [
      "يشغّل إعدادًا أو يوقفه، مع تسمية مرتبطة به.",
      "A labeled two-state control for settings and preferences.",
    ],
    file: "Switch.tsx",
  },
  {
    id: "dropdown",
    name: ["القائمة المنسدلة", "Dropdown menu"],
    description: [
      "يعرض إجراءات العنصر الحالي، ويدعم لوحة المفاتيح ويعيد التركيز عند الإغلاق.",
      "Contextual actions with keyboard navigation and focus restoration.",
    ],
    file: "DropdownMenu.tsx",
  },
  {
    id: "sheet",
    name: ["اللوحة الجانبية", "Sheet"],
    description: [
      "يعرض التفاصيل دون مغادرة الصفحة، ويُبقي التركيز داخل اللوحة حتى تُغلق.",
      "Show details without leaving the page, with managed modal focus.",
    ],
    file: "Sheet.tsx",
  },
  {
    id: "toast",
    name: ["التنبيهات", "Toast"],
    description: [
      "يعرض رسائل قصيرة للنجاح والخطأ والمعلومات، وتعلنها قارئات الشاشة.",
      "Success, error and informational feedback with accessible announcements.",
    ],
    file: "Toast.tsx",
  },
  {
    id: "field",
    name: ["الحقل", "Field"],
    description: [
      "يربط التسمية والمساعدة والخطأ بعنصر إدخال واحد، ويتولّى تطبيقك التحقق.",
      "Label, help and errors associated with one control. The application owns validation.",
    ],
    file: "Field.tsx",
  },
  {
    id: "input",
    name: ["الإدخال", "Input"],
    description: [
      "يتيح إدخال نص، مع تسمية ومساعدة ورسالة خطأ اختيارية.",
      "Native text entry with optional label, helper and error text.",
    ],
    file: "Input.tsx",
  },
  {
    id: "select",
    name: ["الاختيار", "Select"],
    description: [
      "يتيح اختيار قيمة واحدة من قائمة، ويعمل مع لوحة المفاتيح والنماذج.",
      "Choose one value with keyboard and form support.",
    ],
    file: "Select.tsx",
  },
  {
    id: "table",
    name: ["الجدول", "Table"],
    description: [
      "يعرض البيانات في جدول HTML بعناوين وصفوف، ويمرّر أفقيًا داخل حاويته.",
      "A native HTML table with headers, rows and internal horizontal scrolling.",
    ],
    file: "Table.tsx",
  },
  {
    id: "data-table",
    name: ["جدول البيانات", "DataTable"],
    description: [
      "يتيح إدارة العملاء بالبحث والتصفية والفرز وتقسيم الصفحات. استخدم Table للجداول البسيطة.",
      "Manage customers with search, filtering, sorting and pagination. Use Table for simple tables.",
    ],
    file: "DataTable.tsx",
  },
  {
    id: "badge",
    name: ["الشارة", "Badge"],
    description: [
      "يُظهر الحالة نصًا قصيرًا بألوان دلالية هادئة.",
      "Static status text with subtle semantic tones.",
    ],
    file: "Badge.tsx",
  },
  {
    id: "checkbox",
    name: ["مربع الاختيار", "Checkbox"],
    description: [
      "يتيح تفعيل خيار مستقل أو إلغاءه، مع تسمية ومساعدة ورسالة خطأ.",
      "An independent native checkbox with label, help and errors.",
    ],
    file: "Checkbox.tsx",
  },
  {
    id: "radio-group",
    name: ["مجموعة الخيارات", "RadioGroup"],
    description: [
      "يطلب من المستخدم اختيارًا واحدًا من مجموعة مسمّاة.",
      "One native choice within a named group.",
    ],
    file: "RadioGroup.tsx",
  },
  {
    id: "textarea",
    name: ["مربع النص", "Textarea"],
    description: [
      "يتيح كتابة نص من عدة أسطر، مع تغيير الحجم عموديًا.",
      "Native multiline text with vertical resizing.",
    ],
    file: "Textarea.tsx",
  },
  {
    id: "avatar",
    name: ["الصورة الشخصية", "Avatar"],
    description: [
      "يعرض صورة الشخص أو الأحرف الأولى من اسمه، مع اسم واضح.",
      "An image or stable initials with a meaningful name.",
    ],
    file: "Avatar.tsx",
  },
  {
    id: "avatar-group",
    name: ["مجموعة الصور", "AvatarGroup"],
    description: [
      "يعرض صور الأعضاء بترتيب ثابت، ثم عدد من لم يظهر منهم.",
      "Ordered members with a static overflow count.",
    ],
    file: "AvatarGroup.tsx",
  },
  {
    id: "tooltip",
    name: ["التلميح", "Tooltip"],
    description: [
      "يُظهر توضيحًا قصيرًا عند المرور بالمؤشر أو التركيز بلوحة المفاتيح.",
      "A short explanation on hover or keyboard focus.",
    ],
    file: "Tooltip.tsx",
  },
  {
    id: "modal",
    name: ["النافذة الحوارية", "Modal"],
    description: [
      "يفتح نافذة في وسط الشاشة لمهمة واحدة، ويُبقي التركيز داخلها.",
      "A centered dialog for one focused task with managed focus.",
    ],
    file: "Modal.tsx",
  },
  {
    id: "empty-state",
    name: ["الحالة الفارغة", "EmptyState"],
    description: [
      "يوضّح سبب غياب المحتوى وكيف يبدأ المستخدم، برسم اختياري وإجراء من تطبيقك.",
      "Clear text, optional decorative artwork and an application action.",
    ],
    file: "EmptyState.tsx",
  },
  {
    id: "alert",
    name: ["الرسالة الدلالية", "Alert"],
    description: [
      "يعرض رسالة تبقى داخل المحتوى، ويمكن أن تعلنها قارئات الشاشة.",
      "Persistent inline feedback with optional announcements.",
    ],
    file: "Alert.tsx",
  },
  {
    id: "skeleton",
    name: ["هيكل التحميل", "Skeleton"],
    description: [
      "يحجز مكان المحتوى بأشكال مؤقتة حتى يكتمل تحميله.",
      "Decorative placeholders while content is loading.",
    ],
    file: "Skeleton.tsx",
  },
  {
    id: "progress",
    name: ["التقدم", "Progress"],
    description: [
      "يُظهر نسبة التقدّم، أو يوضّح أن العمل جارٍ حين لا تُعرف النسبة.",
      "Determinate progress or waiting without a numeric value.",
    ],
    file: "Progress.tsx",
  },
  {
    id: "spinner",
    name: ["مؤشر التحميل", "Spinner"],
    description: [
      "يُظهر مؤشر انتظار صغيرًا بتسمية خاصة به أو بجوار نص يشرحه.",
      "A small named indicator or decoration beside equivalent text.",
    ],
    file: "Spinner.tsx",
  },
  {
    id: "card",
    name: ["البطاقة", "Card"],
    description: [
      "يجمع العنوان والمحتوى والإجراءات على سطح هادئ.",
      "A quiet surface with composable heading, content and application actions.",
    ],
    file: "Card.tsx",
  },
  {
    id: "accordion",
    name: ["الأكورديون", "Accordion"],
    description: [
      "يفتح قسمًا واحدًا ويُبقي العناوين كلها ظاهرة.",
      "Reveal one section while keeping headings available.",
    ],
    file: "Accordion.tsx",
  },
  {
    id: "breadcrumbs",
    name: ["مسار التنقل", "Breadcrumbs"],
    description: [
      "يبيّن موقع الصفحة بروابط للمستويات الأعلى، ثم اسم الصفحة الحالية.",
      "Native path links with current-page text.",
    ],
    file: "Breadcrumbs.tsx",
  },
  {
    id: "pagination",
    name: ["تقسيم الصفحات", "Pagination"],
    description: [
      "يتيح التنقّل بين الصفحات، ويتولّى تطبيقك البيانات.",
      "Controlled page navigation; the application owns data.",
    ],
    file: "Pagination.tsx",
  },
  {
    id: "line-chart",
    name: ["الرسم الخطي", "Line chart"],
    description: [
      "يُظهر اتجاه القيم عبر الزمن، ويترك فجوة حيث تغيب قيمة.",
      "Trends over time, with gaps for missing values.",
    ],
    file: "Charts.tsx",
  },
  {
    id: "area-chart",
    name: ["الرسم المساحي", "Area chart"],
    description: [
      "يُظهر اتجاه القيم بتعبئة هادئة أسفل كل خط.",
      "Trends with a restrained fill beneath each line.",
    ],
    file: "Charts.tsx",
  },
  {
    id: "bar-chart",
    name: ["الرسم العمودي", "Bar chart"],
    description: [
      "يقارن الفئات أو السلاسل بقيم واضحة.",
      "Compare categories or series with clear values.",
    ],
    file: "Charts.tsx",
  },
  {
    id: "donut-chart",
    name: ["الرسم الحلقي", "Donut chart"],
    description: [
      "يُظهر نصيب كل جزء من الكل، دون تحريك الشرائح.",
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

// The pages that share one chart renderer. Playground and generateCode branch
// on this list, so a chart page left out of it fails type-checking there.
export const chartIds = [
  "line-chart",
  "area-chart",
  "bar-chart",
  "donut-chart",
] as const satisfies readonly ComponentId[];

// Field remains a public family; its composition reference lives under Input.
export const navigationCatalog = catalog.filter((item) => item.id !== "field");

// Documentation-only groups. Keep page IDs, metadata and source APIs unchanged.
const documentationGroups = [
  {
    id: "ai",
    name: ["أنماط الذكاء الاصطناعي", "AI patterns"],
    ids: [
      "terminal",
      "chat-app",
      "ask-user-questions",
      "approval-card",
      "approval-flow",
      "selection-actions",
      "context-meter",
      "model-selector",
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
