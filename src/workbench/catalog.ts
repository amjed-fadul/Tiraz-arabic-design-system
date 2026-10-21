import type { ScreenSlug } from "../examples/frame/screen";
import type { Localized } from "./i18n";
export const catalog = [
  {
    id: "task-starter",
    name: ["ابدأ مهمة", "Start a task"],
    description: [
      "يبدأ أي طلب من الصفحة التي أنت فيها، ومعه السجلات المناسبة.",
      "Start any request from the page you are on, with the right records attached.",
    ],
    file: "TaskStarter.tsx",
  },
  {
    id: "cited-answer",
    name: ["إجابة موثّقة", "Cited answer"],
    description: [
      "يجيب عن سؤال ويُظهر المصدر الذي جاءت منه كل معلومة.",
      "Answer a question and show where each claim came from.",
    ],
    file: "CitedAnswer.tsx",
  },
  {
    id: "data-answer",
    name: ["اسأل بياناتك", "Ask your data"],
    description: [
      "يحوّل سؤالًا عن بياناتك إلى رسم وشرح قصير، ويبيّن كيف حُسب.",
      "Turn a question about your data into a chart and a short explanation, and show how it was worked out.",
    ],
    file: "DataAnswer.tsx",
  },
  {
    id: "agent-task",
    name: ["مهمة الوكيل", "Agent task"],
    description: [
      "يتيح للوكيل أن ينفّذ مهمة من عدة خطوات، ويبقى المستخدم متحكّمًا فيها.",
      "Let an agent run a multi-step job while the person stays in control.",
    ],
    file: "AgentTask.tsx",
  },
  {
    id: "decision-inbox",
    name: ["صندوق القرارات", "Decision inbox"],
    description: [
      "يجمع ما ينتظر قرارك من كل الوكلاء في مكان واحد، الأكثر إلحاحًا أولًا.",
      "Collect what waits on you from every agent in one place, most urgent first.",
    ],
    file: "DecisionInbox.tsx",
  },
  {
    id: "suggested-edits",
    name: ["تعديلات مقترحة", "Suggested edits"],
    description: [
      "يحسّن النص المحدّد بتعديلات متعقَّبة يقبلها المستخدم أو يرفضها.",
      "Improve selected text with tracked changes the person accepts or rejects.",
    ],
    file: "SuggestedEdits.tsx",
  },
  {
    id: "image-generation",
    name: ["توليد صورة", "Image generation"],
    description: [
      "ينشئ صورة من وصف مكتوب، ويختار المستخدم النسخة التي سيستخدمها.",
      "Make an image from a description and pick the version to use.",
    ],
    file: "ImageGeneration.tsx",
  },
  {
    id: "draft-review",
    name: ["مسودة للمراجعة", "Draft for review"],
    description: [
      "يكتب المساعد رسالة لسجل، ويراجعها المستخدم ويعدّلها ثم يرسلها.",
      "The assistant writes a message for a record; the person reviews, edits and sends it.",
    ],
    file: "DraftReview.tsx",
  },
  {
    id: "change-summary",
    name: ["ما الذي تغيّر", "What changed"],
    description: [
      "يخبر المدير بما تحرّك، ولماذا تحرّك، وما الذي يفعله بعد ذلك.",
      "Tell a manager what moved, why it moved, and what to do next.",
    ],
    file: "ChangeSummary.tsx",
  },
  {
    id: "assistant-controls",
    name: ["إعدادات المساعد", "Assistant controls"],
    description: [
      "يقرّر المستخدم ما يفعله المساعد دون سؤال، وما يتذكّره، وكم من السياق يستخدم.",
      "Decide what the assistant may do without asking, what it remembers and how much context it uses.",
    ],
    file: "AssistantControls.tsx",
  },
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
    name: ["مساحة عمل المساعد", "Assistant workspace"],
    description: [
      "محادثة تعرض أنماط المساعد رسائل، مع قائمة محادثات مجمّعة ولوحة جانبية للتفاصيل، ويتولّى تطبيقك الحالة والمحتوى.",
      "A conversation that shows the assistant's patterns as messages, with grouped conversations and a side panel for details; your app owns state and content.",
    ],
    file: "ChatApp.tsx",
  },

  {
    id: "ask-user-questions",
    name: ["أسئلة قبل البدء", "Clarifying questions"],
    description: [
      "يطرح سؤالًا إلى ثلاثة أسئلة عمّا لا يستطيع الوكيل تخمينه قبل أن يبدأ.",
      "Ask the one to three things the agent cannot guess before it starts.",
    ],
    file: "AskUserQuestions.tsx",
  },
  {
    id: "approval-card",
    name: ["طلب موافقة", "Approval request"],
    description: [
      "يبيّن بالضبط ما سيحدث ولمن وما لا يمكن التراجع عنه، ثم يتيح الموافقة أو التعديل أو الرفض.",
      "Show exactly what will happen, to whom, and what cannot be undone; then approve, edit or reject.",
    ],
    file: "ApprovalCard.tsx",
  },
  {
    id: "approval-flow",
    name: ["سلسلة موافقات", "Approval sequence"],
    description: [
      "يعرض طلبات موافقة مستقلة واحدًا بعد آخر، ولا ينتقل إلى التالي حتى يقبل تطبيقك القرار.",
      "Show independent approval requests one at a time, moving on only once the host accepts each decision.",
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

/** The job a pattern finishes; its section in component navigation. */
export type Job = "ask" | "delegate" | "create" | "understand";
export const jobNames: Record<Job, Localized> = {
  ask: ["اسأل", "Ask"],
  delegate: ["فوّض", "Delegate"],
  create: ["أنشئ", "Create"],
  understand: ["افهم وتحكّم", "Understand and control"],
};
/** The pattern pages and their jobs; a page here is a pattern page. */
export const patternJobs: Partial<Record<ComponentId, Job>> = {
  "task-starter": "ask",
  "cited-answer": "ask",
  "data-answer": "ask",
  "agent-task": "delegate",
  "ask-user-questions": "delegate",
  "approval-card": "delegate",
  "approval-flow": "delegate",
  "decision-inbox": "delegate",
  "suggested-edits": "create",
  "image-generation": "create",
  "draft-review": "create",
  "change-summary": "understand",
  "assistant-controls": "understand",
};
/** Public composition parts; classification is independent of menu placement. */
export const aiParts: readonly ComponentId[] = [
  "selection-actions",
  "context-meter",
  "model-selector",
  "image-result",
  "sources",
  "insight-cards",
  "chat-thread",
  "chat-composer",
  "prompt-bar",
  "thinking-indicator",
  "thinking-state",
  "task-rows",
  "tool-call",
  "tool-chips",
  "streaming-text",
];
/** Specialist pages remain addressable, but discovery lives with their parent. */
export const nestedParts = {
  "prompt-bar": "chat-composer",
  "thinking-indicator": "loading-state",
  "thinking-state": "agent-task",
  "tool-chips": "tool-call",
  "streaming-text": "chat-thread",
} as const satisfies Partial<Record<ComponentId, ComponentId>>;
export const relatedPages: Partial<
  Record<ComponentId, readonly ComponentId[]>
> = {
  "chat-composer": ["prompt-bar"],
  "task-starter": ["prompt-bar"],
  "loading-state": ["thinking-indicator"],
  "agent-task": ["thinking-state"],
  "cited-answer": ["thinking-state"],
  "tool-call": ["tool-chips"],
  "chat-thread": ["streaming-text"],
  markdown: ["streaming-text"],
};
interface DocumentationSection {
  id: string;
  name: Localized;
  ids: readonly ComponentId[];
}
const primaryGroups: readonly DocumentationSection[] = [
  { id: "screens", name: ["شاشات", "Screens"], ids: ["chat-app"] },
  {
    id: "ask",
    name: jobNames.ask,
    ids: [
      "task-starter",
      "cited-answer",
      "data-answer",
      "chat-composer",
      "chat-thread",
    ],
  },
  {
    id: "delegate",
    name: jobNames.delegate,
    ids: [
      "agent-task",
      "ask-user-questions",
      "approval-card",
      "approval-flow",
      "decision-inbox",
      "task-rows",
      "tool-call",
    ],
  },
  {
    id: "create",
    name: jobNames.create,
    ids: [
      "suggested-edits",
      "image-generation",
      "draft-review",
      "selection-actions",
    ],
  },
  {
    id: "understand",
    name: jobNames.understand,
    ids: [
      "change-summary",
      "assistant-controls",
      "model-selector",
      "context-meter",
    ],
  },
];

// Documentation-only groups. Keep page IDs, metadata and source APIs unchanged:
// pages only move between groups, so saved pages, props and links keep working.
const documentationGroups: readonly DocumentationSection[] = [
  ...primaryGroups,
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
    ids: [
      "filter-bar",
      "table",
      "data-table",
      "timeline",
      "sources",
      "insight-cards",
    ],
  },
  {
    id: "display",
    name: ["العرض والتنبيهات", "Display & feedback"],
    ids: [
      "image-result",
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
      // Content blocks, which left the AI group.
      "loading-state",
      "code-block",
      "markdown",
      "terminal",
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
];

// Only implemented pages appear in documentation groups and sections.
const pagesOf = (ids: readonly ComponentId[]) =>
  ids
    .map((id) => navigationCatalog.find((item) => item.id === id))
    .filter((item) => item !== undefined);
export const navigationGroups = documentationGroups
  .map((group) => ({
    ...group,
    items: pagesOf(group.ids),
  }))
  .filter((group) => group.items.length > 0);

/**
 * The docs pages each example screen is built from, in the order its screen
 * page lists them under «على هذه الشاشة». The screens themselves are
 * src/examples/frame/screen.ts's table.
 */
export const screenUses: Record<ScreenSlug, readonly ComponentId[]> = {
  dashboard: [
    "change-summary",
    "data-answer",
    "decision-inbox",
    "data-table",
    "filter-bar",
  ],
  "month-end-close": ["agent-task", "change-summary", "decision-inbox"],
  invoices: ["draft-review", "data-table", "filter-bar"],
  "customer-profile": ["task-starter", "data-answer", "timeline", "tabs"],
  onboarding: ["ask-user-questions", "steps", "otp-input", "file-dropzone"],
  "help-center": ["task-starter", "cited-answer", "prompt-bar"],
  "contract-review": ["suggested-edits", "approval-card", "file-tree"],
  "content-studio": [
    "image-generation",
    "suggested-edits",
    "tag-input",
    "color-picker",
  ],
  "agent-control-room": [
    "decision-inbox",
    "task-rows",
    "tool-call",
    "context-meter",
  ],
  "team-settings": ["assistant-controls", "data-table", "modal"],
  "sales-pipeline": ["change-summary", "draft-review", "card", "dropdown"],
};
