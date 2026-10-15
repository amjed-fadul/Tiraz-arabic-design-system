import type { ComponentId } from "./catalog";
import { catalog } from "./catalog";
import { fields } from "./fields";
import { label, words } from "./i18n";
import type { Language } from "./i18n";
export function ApiReference({
  component,
  language,
}: {
  component: ComponentId;
  language: Language;
}) {
  const t = words(language);
  const file = catalog.find((item) => item.id === component)!.file;
  const chartRows: Array<[string, string, string]> = [
    [
      "label / summary",
      "string · required",
      t(
        "اسم متاح وملخص نصي ظاهر يكتبه التطبيق.",
        "Accessible name and visible application-owned text summary.",
      ),
    ],
    [
      "data",
      "ChartDatum[] / DonutDatum[]",
      t(
        "ترتيب البيانات محفوظ. category للتاريخ ISO أو النص؛ مفاتيح ثابتة للحلقات.",
        "Input order is preserved. category is ISO date or text; donut entries need stable keys.",
      ),
    ],
    [
      "series",
      "ChartSeries[] · Cartesian only",
      t(
        "key وlabel ولون CSS اختياري. لا تستخدم category كمفتاح سلسلة.",
        "key, label and optional CSS color. category is reserved; never use it as a series key.",
      ),
    ],
    [
      "legend / interactiveLegend",
      "boolean · false / true",
      t(
        "مفتاح اختياري، أزرار بلوحة المفاتيح وحالة aria-pressed، أو تسميات ثابتة.",
        "Optional legend with keyboard buttons and aria-pressed, or static labels.",
      ),
    ],
    [
      "grid / categoryFormat",
      'boolean / "text" | "date" · Cartesian only',
      t(
        "الشبكة ظاهرة افتراضيًا. التاريخ UTC؛ لا ينعكس الزمن في RTL.",
        "Grid defaults on. UTC dates; RTL never reverses time.",
      ),
    ],
    [
      "locale / numberFormat",
      "string / Intl.NumberFormatOptions",
      t(
        "اللغة من الاتجاه افتراضيًا؛ يمكنك تحديدها بشكل مستقل.",
        "Locale defaults from direction; set it independently when needed.",
      ),
    ],
    [
      "dataTable",
      "boolean · false",
      t(
        "جدول HTML اختياري بكل القيم، حتى السلاسل المخفية.",
        "Optional semantic table with all values, including hidden series.",
      ),
    ],
    [
      "height / className / style",
      "number / string / CSSProperties",
      t(
        "ارتفاع 240px بحد أدنى 180px؛ الكثافة تغيّر الحواف فقط.",
        "240px height, minimum 180px; density affects chrome.",
      ),
    ],
    [
      "Accessibility",
      "Recharts accessibilityLayer",
      t(
        "Tab ثم الأسهم. VoiceOver يحتاج إيقاف QuickNav؛ لم نتحقق من قارئات الشاشة يدويًا. استخدم الملخص والجدول.",
        "Tab then arrows. VoiceOver requires QuickNav off; manual screen-reader behavior is unverified. Use summary/table.",
      ),
    ],
    [
      "Missing / zero / motion",
      "null gaps / finite numbers",
      t(
        "القيم المفقودة فجوات؛ صفر يبقى صفرًا. الحلقة ترسم قيمًا موجبة فقط. دون حركات دخول؛ انتقالات تحترم تقليل الحركة.",
        "Missing values are gaps; zero stays zero. Donut renders positive values only. No entrance animation; transitions respect reduced motion.",
      ),
    ],
  ];
  const rows: Record<ComponentId, Array<[string, string, string]>> = {
    "file-tree": [
      [
        "nodes / label",
        "readonly FileTreeNode[] / string · required",
        t(
          "معرّفات فريدة ثابتة وname نصي وkind=file أو folder مع children. metadata نص اختياري.",
          "Unique stable IDs, string name and kind=file or folder with children. Optional string metadata.",
        ),
      ],
      [
        "expandedIds / defaultExpandedIds / onExpandedChange",
        "readonly string[] / (ids: string[]) => void",
        t(
          "حالة مضبوطة أو داخلية. حدّث القيمة المضبوطة في الدالة.",
          "Controlled or internal expansion. Update the controlled value in its callback.",
        ),
      ],
      [
        "selectedId / defaultSelectedId / onSelectedChange",
        "string | null / (id: string) => void",
        t(
          "اختيار واحد مستقل عن التركيز. null يعني عدم الاختيار.",
          "Single selection independent of focus. null means no selection.",
        ),
      ],
      [
        "onActivate",
        "(file: FileTreeFile) => void",
        t(
          "النقر أو Enter على ملف يفوّض الإجراء للتطبيق. لا وصول إلى نظام الملفات.",
          "File click or Enter delegates activation to the host. No filesystem access.",
        ),
      ],
      [
        "size / emptyState",
        "sm (default) | md / ReactNode",
        t(
          "محتوى فارغ غير تفاعلي. عناوين طويلة مع عزل اتجاه النص.",
          "Noninteractive empty content. Long names truncate with bidirectional isolation.",
        ),
      ],
      [
        "Keyboard / focus",
        "Tree pattern · one tab stop",
        t(
          "الأسهم وHome/End والبحث بالكتابة. الأسهم الأفقية معكوسة في RTL. المسافة تحدد؛ Enter ينشط. يعود التركيز لأقرب أصل ظاهر أو الموضع نفسه بعد الحذف دون سحب التركيز من الخارج.",
          "Arrows, Home/End and typeahead. Horizontal arrows mirror in RTL. Space selects; Enter activates. Removed focus recovers to the closest visible ancestor or same position without reclaiming outside focus.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<div> except children / onSelect",
        t(
          "السمات وref على جذر tree؛ className على الحاوية. الحالات والأدوار تديرها الشجرة.",
          "Attributes and ref target the tree root; className targets its wrapper. Tree roles and states are managed internally.",
        ),
      ],
    ],
    steps: [
      [
        "items / label",
        "readonly StepItem[] / string · required",
        t(
          "معرّفات فريدة ثابتة، تسمية ووصف اختياري وحالة upcoming/current/completed/error. قائمة مرتبة باسم متاح.",
          "Stable unique IDs, label, optional description and upcoming/current/completed/error status. Named native ordered list.",
        ),
      ],
      [
        "orientation",
        '"horizontal" | "vertical" · horizontal',
        t(
          "الترتيب يتبع اتجاه اللغة؛ المساحات الضيقة تتحول إلى عمودي.",
          "Order follows language direction; narrow spaces use a vertical layout.",
        ),
      ],
      [
        "currentId",
        "string · optional",
        t(
          "يتجاوز status=current، بما في ذلك الخطأ الحالي. دون القيمة يُعلّم أول current فقط؛ قيمة غير مطابقة تعني عدم وجود خطوة حالية.",
          "Overrides status=current, including a current error. Otherwise only the first current status is marked; an unmatched ID means no current step.",
        ),
      ],
      [
        "onStepActivate",
        "(id: string) => void · optional",
        t(
          "يحوّل العرض الثابت إلى أزرار لكل الخطوات. التطبيق يملك القواعد والتحقق والتقدم.",
          "Opts into real buttons for every step. The application owns rules, validation and progress.",
        ),
      ],
      [
        "locale / statusLabels",
        '"ar" | "en" / Record<StepStatus, string>',
        t(
          "لغة الأرقام والحالات من الاتجاه افتراضيًا؛ تسميات الحالات قابلة للترجمة. المؤشرات زخرفية والحالة متاحة نصيًا.",
          "Number/status locale defaults from direction; status labels can be translated. Indicators are decorative; status also has accessible text.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<ol> (except children)",
        t(
          "قائمة أصلية مع ref وسمات وأحداث؛ لا تضع عناصر تفاعلية داخل التسميات.",
          "Native list ref, attributes and events; keep labels free of interactive descendants.",
        ),
      ],
    ],
    "task-rows": [
      [
        "items / label",
        "readonly TaskRowItem[] / string · required",
        t(
          "id ثابت وفريد وtitle نصي وstate وcontent؛ summary نص قصير اختياري. لا عناصر تفاعلية في العنوان أو الملخص.",
          "Unique stable id, string title, state and content; optional short string summary. Title and summary are noninteractive.",
        ),
      ],
      [
        "state / appearance",
        "pending | running | completed | failed / capsules | list",
        t(
          "التطبيق يزوّد حالات التنفيذ. كبسولات منفصلة افتراضيًا أو قائمة متصلة. المؤشر والنص يشرحان الحالة دون الاعتماد على اللون.",
          "Execution state comes from the application. Separate capsules by default or connected list. Indicators and text explain state independently of color.",
        ),
      ],
      [
        "expandedIds / defaultExpandedIds / onExpandedChange",
        "readonly string[] / readonly string[] / (ids: string[]) => void",
        t(
          "توسيع متعدد اختياري مضبوط أو داخلي؛ الافتراضي مغلق. غيّر expandedIds في رد النداء للوضع المضبوط. التوسيع لا يغيّر التنفيذ.",
          "Optional controlled or internal multiple expansion; starts closed. Update expandedIds in the callback for controlled mode. Disclosure never changes execution.",
        ),
      ],
      [
        "content / stateLabels / emptyState",
        "ReactNode / Record<TaskState, string> / ReactNode",
        t(
          "إجراءات التطبيق داخل لوحة مرتبطة خارج زر التوسيع. شارات الحالة موجودة في النظام؛ الحركة والمرور يغطيان المهمة، والإغلاق يجعل اللوحة aria-hidden وinert فورًا. يعود التركيز لزرها عند الإغلاق الخارجي.",
          "Application actions live outside the trigger. Existing state Badges, whole-task hover and reduced-motion-aware disclosure transitions. Closing is immediately aria-hidden/inert; external collapse restores panel focus. Default labels follow direction.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<ul> (except children)",
        t(
          "قائمة أصلية بترتيب ومعرّفات ثابتة. المحاكاة المحلية فقط تملك المؤقتات مع إلغاء التشغيل السابق وإعادة المحاولة الصريحة. لا وكيل أو شبكة في المكتبة.",
          "Native list with supplied order and stable IDs. Only the local example owns timers, cancellation and explicit retry. No agent runtime or network in the library.",
        ),
      ],
    ],
    "notification-list": [
      [
        "items / label",
        "readonly NotificationItem[] / string · required",
        t(
          "id ثابت وفريد وtitle نصي وtimestamp وread؛ description وdateTime وavatar وicon وaction اختيارية.",
          "Unique stable id, string title, timestamp and read; optional description, dateTime, avatar, icon and action.",
        ),
      ],
      [
        "onMarkRead / onMarkAllRead",
        "(id: string) => void / () => void · optional",
        t(
          "التطبيق يحدّث حالة القراءة. العدد مشتق من العناصر. فتح الإجراء لا يغيّر القراءة.",
          "Application updates read state. Count derives from items. Opening an action never marks read.",
        ),
      ],
      [
        "labels",
        "{ unread; read; markRead; markAllRead } · optional strings",
        t(
          "ترجمة النصوص الداخلية؛ الافتراضي حسب الاتجاه. الأيقونة زخرفية والصورة يملكها التطبيق.",
          "Translate internal text; defaults follow direction. Icon is decorative; avatar content is application-owned.",
        ),
      ],
      [
        "timestamp / dateTime / emptyState",
        "string / string / ReactNode",
        t(
          "التطبيق ينسّق الوقت ويزوّد dateTime صالحًا عند توفره. فرّق بين الفراغ وعدم وجود غير مقروء. التصفية واستعادة التركيز في التطبيق.",
          "Application formats time and supplies valid dateTime when available. Distinguish empty from no unread. Filtering and focus recovery belong to the application.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<div> (except children)",
        t(
          "سمات الجذر وref على div؛ قائمة ul داخلية أصلية. لا حذف تلقائي أو جلب أو حفظ.",
          "Root attributes/ref target div; internal native ul. No automatic dismissal, fetching or persistence.",
        ),
      ],
    ],
    timeline: [
      [
        "items / label",
        "readonly TimelineItem[] / string · required",
        t(
          "id ثابت وtitle وtimestamp؛ description وdateTime وicon وcontent اختيارية. الترتيب كما هو دون فرز.",
          "Stable id, title and timestamp; optional description, dateTime, icon and content. Supplied order is preserved without sorting.",
        ),
      ],
      [
        "timestamp / dateTime",
        "string / string · per item",
        t(
          "التطبيق ينسّق التاريخ محليًا. dateTime صالح آليًا يُنتج time؛ دونه يُعرض النص فقط.",
          "The application formats localized dates. Valid machine-readable dateTime produces time; without it, timestamp is plain text.",
        ),
      ],
      [
        "icon / content",
        "ReactNode · optional",
        t(
          "الأيقونة زخرفية؛ ضع المعنى في العنوان. محتوى وإجراءات التطبيق تستخدم مكونات موجودة.",
          "Icon is decorative; include meaning in the title. Compose application content/actions with existing components.",
        ),
      ],
      [
        "emptyState",
        "ReactNode · optional",
        t(
          "محتوى الفراغ يملكه التطبيق؛ الافتراضي نص حسب الاتجاه. لا جلب أو مؤقتات أو حفظ.",
          "Application-owned empty content; default text follows direction. No fetching, timers or persistence.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<ol> (except children)",
        t(
          "قائمة مرتبة أصلية وخط منطقي دون خط بعد العنصر الأخير. RTL يغيّر موضع العرض فقط.",
          "Native ordered list, logical rail and no trailing connector. RTL changes layout only.",
        ),
      ],
    ],
    slider: [
      [
        "value / defaultValue / onValueChange",
        "number / number / (value: number) => void",
        t(
          "قيمة مضبوطة أو داخلية، دون callback أثناء العرض أو إعادة الضبط.",
          "Controlled or internal value; no callback during rendering or reset.",
        ),
      ],
      [
        "min / max / step",
        "0 / 100 / 1",
        t(
          "يُقيد ويُقرب إلى خطوات تبدأ من min، مع إزالة ضوضاء الكسور. القيمة الافتراضية منتصف النطاق. max الأقل يصبح min؛ الحدود غير المحدودة والخطوة غير الموجبة تعود للافتراضي.",
          "Clamp and snap to min-based steps with decimal noise rounded. Default value is the midpoint. A max below min becomes min; nonfinite bounds and nonpositive steps use defaults.",
        ),
      ],
      [
        "formatValue",
        "(value: number) => string",
        t(
          "عرض اختياري وaria-valuetext؛ لا يغير قيمة النموذج.",
          "Optional readout and aria-valuetext; never changes the form value.",
        ),
      ],
      [
        "label / helper / error / field / invalid",
        "Field associations",
        t(
          "تسمية مباشرة أو Field منفصل. ref والسمات والأحداث تستهدف input range الأصلي.",
          "Use labeled mode or separate Field. Ref, native attributes and events target the native range input.",
        ),
      ],
      [
        "name / form / disabled / reset",
        "native range submission",
        t(
          "name يرسل الرقم الحالي؛ المعطّل لا يرسل. reset يعيد القيمة الأولية للداخلي دون callback ويحترم إلغاء الحدث. المضبوط يحتاج onReset بالتطبيق.",
          "name submits the current numeric string; disabled omits it. Uncanceled uncontrolled reset restores the initial value without callback. Controlled reset needs application onReset.",
        ),
      ],
      [
        "Keyboard / RTL",
        "native browser behavior",
        t(
          "الأسهم وHome وEnd أصلية؛ RTL يعكس اتجاه اليمين واليسار. دون محرك سحب مخصص أو نطاق قيم.",
          "Native arrows, Home and End; RTL mirrors horizontal arrow direction. No custom gesture engine or ranges.",
        ),
      ],
    ],
    "otp-input": [
      [
        "value / defaultValue / onValueChange",
        "string / empty string / (value: string) => void",
        t(
          "يحافظ على الأصفار الأولى والقيم الجزئية. يقبل أرقام ASCII والعربية والفارسية ويُخرج ASCII فقط؛ يهمل غير الأرقام ويقص للعدد.",
          "Preserves leading zeros and partial values. Accepts ASCII, Arabic-Indic and Eastern Arabic digits; public values are ASCII. Other characters are removed and extra digits truncated.",
        ),
      ],
      [
        "length",
        "6; integer 1–12",
        t(
          "عدد ثابت قابل للضبط؛ يُقرب لأسفل ضمن 1–12؛ غير المحدود يعود إلى 6.",
          "Fixed configurable length, floored/clamped to 1–12; nonfinite uses 6.",
        ),
      ],
      [
        "Editing / autofill",
        "one text input",
        t(
          "تحرير وتحديد ولصق أصلي؛ inputMode=numeric وautocomplete=one-time-code. اتجاه LTR والخانات زخرفية. لا نقل تركيز أو إرسال تلقائي.",
          "Native editing, selection and paste; inputMode=numeric, autocomplete=one-time-code. LTR code order; decorative slots. No focus movement or automatic submission.",
        ),
      ],
      [
        "label / helper / error / field / invalid / readOnly",
        "Field / native input",
        t(
          "تسمية أو Field منفصل؛ ref يستهدف input. القراءة فقط تسمح بالتحديد والنسخ. عدد مكتمل لا يعني التحقق.",
          "Label or separate Field; ref targets input. Read-only preserves selection/copy. Complete length never means verified.",
        ),
      ],
      [
        "name / form / required / reset",
        "native text submission",
        t(
          "name يرسل النص الجزئي أيضًا. pattern يتطلب العدد الكامل عند تحقق النموذج؛ الفارغ مسموح إلا مع required. المعطّل لا يرسل. reset الداخلي يعيد الأولي دون callback؛ المضبوط يحتاج onReset؛ الإلغاء محترم.",
          "name includes partial text. Native pattern requires full length during form validation; empty is allowed unless required. Disabled omits it. Uncontrolled reset restores initial value without callback; controlled reset needs onReset; cancellation is respected.",
        ),
      ],
    ],
    "date-picker": [
      [
        "value / defaultValue / onValueChange",
        "YYYY-MM-DD / empty string / (value: string) => void",
        t(
          "تاريخ ميلادي فقط أو نص فارغ للمسح. التحويل بحقول السنة والشهر واليوم المحلية دون UTC أو انزياح توقيت. النص غير الصالح يظهر خطأ ويُرسل فارغًا؛ لا callback أثناء العرض.",
          "Gregorian date only, or empty string to clear. Local year/month/day conversion avoids UTC shifts. Invalid props show feedback and submit empty; no render-time callback.",
        ),
      ],
      [
        "min / max / disabled",
        "YYYY-MM-DD / boolean",
        t(
          "الحدود شاملة؛ غير الصالح يُهمل. يمنع التقويم واليوم اختيار خارجها. القيمة الخارجية الصحيحة خارج النطاق تبقى مع خطأ؛ التطبيق يملك التحقق.",
          "Inclusive bounds; invalid bounds ignored. Calendar and Today prevent out-of-range selection. A valid external date outside bounds remains with feedback; the application owns validation.",
        ),
      ],
      [
        "yearRange",
        "readonly [number, number]",
        t(
          "سنوات القائمة فقط؛ افتراضيًا السنة المعروضة ±١٠٠. السنة المعروضة متاحة دائمًا. لا يقيّد صلاحية التاريخ؛ min/max هما حدود التنقّل والاختيار. قائمة السنة تعرض خمسة صفوف قابلة للتمرير. الشهر والسنة للتنقّل دون تغيير التاريخ المحدد.",
          "Direct year choices only; defaults to viewed year ±100 and always includes the viewed year. Does not restrict valid dates; min/max bound navigation and selection. Year menu shows five scrollable rows. Month/year changes navigate without selecting a date.",
        ),
      ],
      [
        "locale / placeholder",
        "ar | en / string",
        t(
          "اللغة افتراضيًا حسب الاتجاه، والعرض ميلادي محلي. RTL يغير التخطيط لا قيمة YYYY-MM-DD.",
          "Language defaults from direction; localized Gregorian display. RTL changes layout, never YYYY-MM-DD meaning.",
        ),
      ],
      [
        "label / helper / error / field / invalid / ref",
        "Field / HTMLButtonElement",
        t(
          "تسمية أو Field؛ ref والأحداث والسمات على زر الفتح. اسم التسمية والتاريخ المحدد متاحان لقارئ الشاشة.",
          "Label or separate Field; ref, events and attributes target trigger. Label names it; selected date is part of its accessible name.",
        ),
      ],
      [
        "Calendar / popup",
        "DayPicker + Radix Popover",
        t(
          "الأسهم وHome/End وPageUp/Down للتنقل؛ Enter للاختيار. Escape يغلق التقويم أولًا ويعيد التركيز. البوابة في أقرب Provider أو Sheet أو Modal مع ضبط حدود الشاشة وتمرير داخلي.",
          "Arrows, Home/End and PageUp/Down navigate; Enter selects. Escape closes the calendar first and restores trigger focus. Portals into nearest Provider/Sheet/Modal with viewport collision handling and internal scrolling.",
        ),
      ],
      [
        "name / form / reset / validation",
        "hidden date-only submission",
        t(
          "name يرسل القيمة الكاملة أو الفارغ؛ المعطّل لا يرسل. لا required أو تحقق أصلي لحقل مخفي؛ التطبيق يمنع الإرسال عند الخطأ. reset الداخلي يعيد الأولي دون callback ويحترم الإلغاء؛ المضبوط يحتاج onReset.",
          "name submits the full date or empty string; disabled omits it. Hidden submission has no native required validation; the application blocks invalid forms. Uncontrolled reset restores initial value without callback and respects cancellation; controlled reset needs onReset.",
        ),
      ],
    ],
    "file-dropzone": [
      [
        "value / defaultValue / onValueChange",
        "File[] / File[] / (files: File[]) => void",
        t(
          "قيمة مضبوطة أو داخلية. الملفات محلية؛ لا رفع أو تخزين.",
          "Controlled or internal selected files. Local selection only; no upload or storage.",
        ),
      ],
      [
        "multiple / accept / maxFileSize / maxFiles",
        "boolean / string / bytes / number",
        t(
          "الفحص نفسه للتصفّح والسحب؛ النوع والحجم والعدد. multiple يضيف، والملف الواحد يستبدل بأول ملف صحيح. المقبول يبقى عند الرفض الجزئي.",
          "Identical browse/drop checks for type, byte size and count. Multiple appends; single replaces with the first valid file. Partial rejection preserves accepted files.",
        ),
      ],
      [
        "Duplicates / removal",
        "name + size + type + lastModified",
        t(
          "التكرار يُتجاهل مع تفسير؛ يمكنك إعادة اختيار الملف بعد حذفه. الحذف يُركّز زر التصفّح.",
          "Same-metadata duplicates are ignored with feedback; reselect after removal. Removal focuses Browse files.",
        ),
      ],
      [
        "label / helper / error / field / invalid / labels",
        "Field / FileDropzoneLabels",
        t(
          "إما تسمية أو Field منفصل. labels يترجم browse/drop/remove(file)/rejected(file,reason). ref والسمات والأحداث على input الأصلي المخفي.",
          "Use labeled mode or separate Field composition. labels translates browse/drop/remove(file)/rejected(file,reason). Ref, native attributes and events target the hidden native file input.",
        ),
      ],
      [
        "form / reset / submission",
        "application-owned FormData",
        t(
          "يُفرّغ input بعد الاختيار لتكرار التصفّح. لا name أو required؛ ابنِ FormData من File[] المختارة. reset يعيد defaultValue دون callback ويحترم الإلغاء؛ المضبوط يحتاج onReset.",
          "The native input clears after selection for reselection. No name or required API; construct FormData from the selected File array. Uncontrolled reset restores initial defaultValue without callback and respects cancellation; controlled reset requires application onReset.",
        ),
      ],
      [
        "Validation / scope",
        "convenience checks",
        t(
          "maxFiles يُقرب لأسفل ويُقيد بصفر؛ maxFileSize بايت غير سالب؛ غير المحدود يُتجاهل. يجب فحص الخادم. دون رفع أو تقدم أو معاينات أو مجلدات.",
          "maxFiles floors/clamps to zero; maxFileSize is nonnegative bytes; nonfinite limits are ignored. Client checks are convenience checks; validate on the server. No uploads, progress, previews or directories.",
        ),
      ],
    ],
    "color-picker": [
      [
        "value / defaultValue / onValueChange",
        "string / #316746 / (color: string) => void",
        t(
          "ألوان RGB معتمة فقط. يقبل #RGB أو #RRGGBB ويؤكد #RRGGBB بأحرف كبيرة. أعطِ props ألوانًا صحيحة؛ القيمة غير الصحيحة تعود إلى #316746.",
          "Opaque RGB only. Accepts #RGB/#RRGGBB; committed values are uppercase #RRGGBB. Supply valid color props; invalid props fall back to #316746.",
        ),
      ],
      [
        "HEX editing",
        "Enter / blur",
        t(
          "يبقى النص الناقص أثناء التعديل. Enter أو مغادرة الحقل يؤكد الصحيح؛ غير الصحيح يبقى مع رسالة دون تغيير اللون. onChange للنص، وonValueChange للون المؤكد.",
          "Incomplete text stays editable. Enter or blur commits valid text; invalid text remains with feedback and the selected color stays unchanged. onChange observes text; onValueChange reports committed colors.",
        ),
      ],
      [
        "swatches / labels",
        "ColorSwatch[] / ColorPickerLabels",
        t(
          "كل لون له label وvalue صحيح. [] يخفيها. aria-pressed وعلامة اختيار يوضحان الحالة؛ التركيز مستقل. labels يترجم chooser/swatches/invalid.",
          "Each swatch has a label and valid value. [] hides presets. aria-pressed and a check mark show selection; focus is distinct. labels translates chooser/swatches/invalid.",
        ),
      ],
      [
        "label / helper / error / field / invalid / ref",
        "Field / HTMLInputElement",
        t(
          "إما تسمية أو Field مستقل. ref والسمات على حقل HEX باتجاه LTR. اختيار أصلي متزامن؛ مظهره يختلف حسب المتصفح.",
          "Use labeled mode or separate Field composition. Ref/native attributes target the LTR HEX input. Native chooser is synchronized; its appearance varies by browser.",
        ),
      ],
      [
        "name / form / disabled / reset",
        "committed hidden value",
        t(
          "name يُرسل اللون المؤكد فقط؛ المعطّل لا يُرسل. reset غير المضبوط يعيد defaultValue دون callback بعد احترام الإلغاء. المضبوط يحتاج onReset. الخطأ المحلي وحده لا يمنع الإرسال؛ قيود required/pattern الأصلية تظل فعّالة. التطبيق يملك تحقق النموذج.",
          "name submits only the committed color; disabled omits it. Uncontrolled reset restores initial defaultValue without callback after respecting cancellation. Controlled reset needs application onReset. Local feedback alone does not block submission; native required/pattern constraints still apply. The application owns form validation.",
        ),
      ],
      [
        "Scope",
        "local sample only",
        t(
          "لا شفافية أو لوحة hue/saturation مخصصة. المثال يغيّر عيّنة مستقلة عن لون النظام.",
          "No alpha or custom hue/saturation canvas. The example changes a sample independently of the system accent.",
        ),
      ],
    ],
    "tag-input": [
      [
        "value / defaultValue / onValueChange",
        "string[] / string[] / (next: string[]) => void",
        t(
          "قيمة مضبوطة أو داخلية. Enter يضيف النص المشذّب؛ التكرار حساس لحالة الأحرف.",
          "Controlled or internal array. Enter adds trimmed text; duplicates use exact case-sensitive comparison.",
        ),
      ],
      [
        "label / helper / error / field",
        "Input-style Field contract",
        t(
          "وضع التسمية أو Field مستقل، دون الجمع بينهما. ref والسمات والأحداث على حقل النص.",
          "Use labeled convenience mode or separate Field composition. Ref, attributes and editing events target the draft input.",
        ),
      ],
      [
        "maxTags / disabled / readOnly / size / invalid / labels",
        "number / boolean / boolean / sm | md / boolean / TagInputLabels",
        t(
          "حد اختياري صحيح غير سالب؛ القيم غير المحدودة تُتجاهل. labels تترجم الحذف والتكرار والحد. sm افتراضي.",
          "Optional nonnegative integer cap; nonfinite values are ignored. labels translates removal, duplicate and maximum feedback. sm default.",
        ),
      ],
      [
        "name / form / reset",
        "native form association",
        t(
          "حقول مخفية بالاسم نفسه ترسل الوسوم المؤكدة فقط. المعطّل لا يُرسل؛ القراءة فقط تُرسل. إعادة الضبط غير المضبوطة تعود إلى defaultValue دون callback وتحترم الإلغاء؛ القيمة المضبوطة تحتاج onReset من التطبيق.",
          "Repeated hidden fields submit only committed tags. Disabled omits values; read-only submits. Uncontrolled reset restores initial defaultValue without callback and respects cancellation. Controlled reset needs application onReset.",
        ),
      ],
      [
        "Keyboard / paste / validation",
        "native text editing",
        t(
          "Backspace الفارغ يحذف الأخير؛ الحذف يُركّز حقل النص. Enter أثناء IME لا يضيف. اللصق نص فقط. لا تحقق أصلي مطلوب للوسوم، أو تحليل دفعي أو إكمال تلقائي.",
          "Empty Backspace removes the last tag; removal focuses the input. IME Enter does not add. Paste stays text. No tag required/native validation, bulk parsing or autocomplete.",
        ),
      ],
    ],
    "input-copy": [
      [
        "value",
        "string · required",
        t(
          "قيمة للقراءة والتحديد؛ زر النسخ ينسخ القيمة كاملة.",
          "Read-only selectable text; copy writes the full underlying value.",
        ),
      ],
      [
        "label / helper / error / field",
        "Input-style Field contract",
        t(
          "وضع تسمية أو تركيب Field؛ اسم واضح مطلوب عند غياب التسمية. ref والسمات على input.",
          "Labeled mode or Field composition; supply an accessible name without label. Ref and native attributes target input.",
        ),
      ],
      [
        "size / invalid / labels / disabled",
        "sm | md / boolean / InputCopyLabels / boolean",
        t(
          "labels: copy وcopied وfailure. sm افتراضي؛ المعطّل يعطّل النص والنسخ.",
          "labels: copy, copied and failure. sm default; disabled disables text and copy.",
        ),
      ],
      [
        "Clipboard / lifecycle",
        "navigator.clipboard.writeText",
        t(
          "زر النسخ داخل الحقل عند النهاية المنطقية، مع مساحة للنص وتركيز واضح. النجاح علامة صح وإعلان مخفي لثانيتين دون صف نصي ظاهر. الفشل يبقى لإرشاد النسخ اليدوي. تغيير القيمة أو إلغاء التركيب يلغي النتائج المؤجلة والمؤقتات.",
          "Copy button sits inside the logical-end edge with reserved text padding and keyboard focus. Success shows a check and hidden polite announcement for two seconds, with no visible success row/text. Failure persists for manual copying. Value replacement/unmount cancels pending feedback and timers.",
        ),
      ],
    ],
    "filter-bar": [
      [
        "label / search / children",
        "string · required / ReactNode / ReactNode",
        t(
          "مجموعة مسماة؛ ركّب Input وSelect وButton بالخصائص الأصلية.",
          "Named group; compose Input, Select and Button using their own APIs.",
        ),
      ],
      [
        "filters",
        "FilterBarFilter[] · []",
        t(
          "معرّف ثابت، label وremoveLabel وonRemove لكل عامل نشط. احرص على أسماء واضحة.",
          "Stable id, label, removeLabel and onRemove for each active filter. Supply meaningful accessible names.",
        ),
      ],
      [
        "onClearAll / clearLabel / disabled",
        "() => void / string / boolean",
        t(
          "إجراء اختياري يظهر عند وجود عوامل؛ التطبيق يملك جميع قيم التصفية. disabled يعطّل إزالة العوامل فقط؛ عطّل عناصر التحكم بنفسك.",
          "Optional Clear all appears with active filters. Application owns all filter values. disabled affects removal/Clear only; disable composed controls yourself.",
        ),
      ],
      [
        "Native props / focus / results",
        "div attributes/ref",
        t(
          "صفوف تلتف، وعوامل طويلة لا تتداخل. الإزالة تنقل التركيز إلى العامل التالي أو التحكم أو المجموعة. التطبيق يملك البحث والتصفية وعدد النتائج.",
          "Wrapping rows keep long filters separate. Removal focuses the next filter, a control or the group. Application owns search, filtering and result counts.",
        ),
      ],
    ],
    sidebar: [
      [
        "Sidebar",
        "native aside props/ref",
        t(
          "التطبيق يحدد الموضع والارتفاع. الرأس والتذييل ثابتان والمحتوى يتمرّر.",
          "Host sets placement/height. Header/footer remain available while content scrolls.",
        ),
      ],
      [
        "collapsed / defaultCollapsed / onCollapsedChange",
        "boolean / boolean / (value: boolean) => void",
        t(
          "وضع مضبوط أو داخلي. يبدأ موسّعًا افتراضيًا.",
          "Controlled or internal state. Expanded by default.",
        ),
      ],
      [
        "SidebarHeader / SidebarContent / SidebarFooter / SidebarIdentity",
        "native div / nav / div / div props/ref",
        t(
          "سمّ nav. ركّب الأيقونة أو الصورة وSidebarLabel داخل SidebarIdentity. الرأس أفقي ويصبح عموديًا في الشريط؛ التذييل يوسّط الصورة نفسها.",
          "Name the nav. Compose icon/avatar + SidebarLabel in SidebarIdentity. Header aligns identity and toggle in a row, stacking them in the rail; footer identity centers the avatar box.",
        ),
      ],
      [
        "SidebarGroup",
        "native div props/ref · heading?: string",
        t("عنوان اختياري للمجموعة.", "Optional group heading."),
      ],
      [
        "SidebarItem / SidebarAction",
        "native a / button props/ref · label, icon, count?",
        t(
          "روابط الوجهات وأزرار الإجراءات. active يعلن الصفحة الحالية؛ العدد نص زخرفي اختياري.",
          "Destination links and action buttons. Item active announces current page; count is optional decorative text.",
        ),
      ],
      [
        "SidebarDisclosure",
        "native button props/ref · label, icon, children",
        t(
          "مستوى واحد. open/defaultOpen/onOpenChange. activeChild يحدده التطبيق. من الشريط: يوسّع التنقّل ويفتح الأطفال.",
          "One level. open/defaultOpen/onOpenChange. Caller supplies activeChild. From the rail: expands Sidebar and opens children.",
        ),
      ],
      [
        "SidebarToggle",
        "native button props/ref · collapseLabel, expandLabel",
        t(
          "تسميات مترجمة مطلوبة. العناصر المخفية غير قابلة للتركيز، وينتقل التركيز إلى الأب أو زر الطي عند الحاجة.",
          "Required translated labels. Hidden content is inert; focus moves to parent or toggle when needed.",
        ),
      ],
      [
        "Mobile",
        "Sheet composition",
        t(
          "أعد استخدام المحتوى داخل Sheet. وجّه التركيز بعد استعادة زر الفتح؛ Escape يعيد التركيز إلى الزر.",
          "Reuse content in Sheet. Focus destination after trigger restoration; Escape returns to trigger.",
        ),
      ],
    ],
    "line-chart": chartRows,
    "area-chart": chartRows,
    "bar-chart": chartRows,
    "donut-chart": chartRows.filter(
      (row) => !["series", "grid / categoryFormat"].includes(row[0]),
    ),
    card: [
      [
        "Card / CardHeader / CardContent / CardFooter",
        "native div props / ref",
        t(
          "سطح غير تفاعلي؛ السمات والأحداث وref أصلية لكل جزء.",
          "Noninteractive surface; each part preserves native attributes, events and ref.",
        ),
      ],
      [
        "CardTitle / CardDescription",
        "native h3 / p props",
        t(
          "العنوان والوصف اختياريان عبر التركيب. استخدم عنوانًا أصليًا آخر عند الحاجة لمستوى مختلف.",
          "Optional composed title and description. Use a native heading when another level is needed.",
        ),
      ],
      [
        "children",
        "ReactNode",
        t(
          "ضع إجراءات التطبيق داخل الرأس أو التذييل. لا يوجد نمط بطاقة قابلة للنقر.",
          "Compose application actions in the header or footer. No clickable-card API.",
        ),
      ],
    ],
    accordion: [
      [
        "items",
        "readonly AccordionItem[]",
        t(
          "value ثابت وفريد وغير فارغ؛ label وcontent ومؤشر disabled اختياري. لا تضع أزرارًا داخل label.",
          "Stable unique nonempty value, label, content and optional disabled. No interactive children inside label.",
        ),
      ],
      [
        "value / defaultValue / onValueChange",
        "string? / string? / (value: string) => void",
        t(
          "حالة مضبوطة أو داخلية. السلسلة الفارغة تعني إغلاق الجميع. دون defaultValue يبدأ مغلقًا.",
          "Controlled or internal state. Empty string means none open; omitted defaultValue starts closed.",
        ),
      ],
      [
        "collapsible / headingLevel / className",
        "boolean? / 2 | 3 | 4 | 5 | 6 / string?",
        t(
          "الإغلاق false افتراضيًا؛ مستوى العنوان 3. Radix يملك ArrowUp/Down وHome/End وEnter/Space. الأقسام المغلقة غير تفاعلية فورًا أثناء حركة الإغلاق. قسم واحد؛ Tabs للعروض المرتبطة.",
          "Collapse defaults false; heading level 3. Radix handles ArrowUp/Down, Home/End and Enter/Space. Closed panels are immediately inert during exit motion. One disclosure; use Tabs for related views.",
        ),
      ],
    ],
    breadcrumbs: [
      [
        "items / label",
        "readonly BreadcrumbItem[] / string",
        t(
          "label اسم ميسر مترجم. عناصر المسار تحوي label وhref اختياريًا؛ آخر عنصر نص الصفحة الحالية حتى لو حوى href.",
          "Translated landmark label. Items have label and optional href; final item is current-page text even with href.",
        ),
      ],
      [
        "native nav props / ref",
        "ComponentPropsWithRef<nav>",
        t(
          "روابط أصلية؛ عناصر دون وجهة نص. الفواصل زخرفية وتتبع الاتجاه، والمسار يلتف.",
          "Native links; items without destinations are text. Decorative direction-aware separators and wrapping.",
        ),
      ],
    ],
    pagination: [
      [
        "page / totalPages / onPageChange",
        "number / number / (page: number) => void",
        t(
          "مضبوط فقط. القيم المحدودة تُقرب للأسفل وتثبت؛ غير المحدودة تصبح 1. مجموع الصفحات بين 1 وMAX_SAFE_INTEGER. لا استدعاء أثناء العرض.",
          "Controlled only. Finite values floor and clamp; nonfinite values become 1. Total is 1–MAX_SAFE_INTEGER. No render-time callbacks.",
        ),
      ],
      [
        "labels",
        "PaginationLabels",
        t(
          "navigation وprevious وnext ودالة page(number) بأسماء مترجمة.",
          "Translated navigation, previous, next and page(number) names.",
        ),
      ],
      [
        "locale / disabled / native nav props / ref",
        "ar | en / boolean? / native nav",
        t(
          "locale يتبع الاتجاه افتراضيًا. disabled يعطل كل الأزرار. 7 مواضع كحد أقصى، والفواصل غير تفاعلية. التطبيق يملك البيانات والحجم والتصفية؛ DataTable منفصل.",
          "Locale defaults from direction. disabled disables all buttons. At most seven slots with static ellipses. Caller owns data, size and filtering; DataTable is separate.",
        ),
      ],
    ],
    alert: [
      [
        "title / description",
        "string / string?",
        t(
          "عنوان مطلوب ووصف اختياري.",
          "Required title and optional description.",
        ),
      ],
      [
        "tone",
        "neutral | success | error | info",
        t(
          "info افتراضي؛ الألوان الدلالية مستقلة عن لون الهوية.",
          "Defaults to info; semantic colors stay independent of accent.",
        ),
      ],
      [
        "action",
        "ReactNode?",
        t(
          "إجراء يقدمه التطبيق؛ التطبيق يملك الإغلاق.",
          "Application-supplied action; the application owns dismissal.",
        ),
      ],
      [
        "announcement",
        "off | polite | assertive",
        t(
          "off افتراضي للرسائل الثابتة. polite يستخدم status؛ assertive يستخدم alert للتحديثات العاجلة فقط.",
          "Defaults to off for static messages. polite uses status; assertive uses alert for urgent updates only.",
        ),
      ],
    ],
    skeleton: [
      [
        "shape",
        "text | rectangle | circle",
        t(
          "text افتراضي. زخرفي دائمًا؛ التطبيق يعلن التحميل.",
          "Defaults to text. Always decorative; the host announces loading.",
        ),
      ],
      [
        "style / className",
        "CSSProperties? / string?",
        t(
          "حجم CSS أصلي؛ افتراضيات من الرموز المشتركة. تتوقف الحركة مع تقليل الحركة.",
          "Native CSS sizing with token defaults. Motion stops with either reduced-motion setting.",
        ),
      ],
    ],
    progress: [
      [
        "label",
        "string",
        t(
          "اسم مطلوب؛ يظهر بصريًا ويعلن مرة واحدة.",
          "Required name; visible and announced once.",
        ),
      ],
      [
        "value",
        "number | null | undefined",
        t(
          "من 0 إلى 100. القيم خارج النطاق تثبت؛ null والقيم غير المحدودة تحذف القيمة المعلنة.",
          "0–100. Out-of-range values clamp; null, missing and nonfinite values omit the numeric announcement.",
        ),
      ],
      [
        "showValue / locale",
        "boolean? / ar | en",
        t(
          "النسبة مخفية افتراضيًا؛ locale يتبع اتجاه النظام افتراضيًا. أرقام عربية في ar، ونسبة مقربة للعرض فقط.",
          "Value text defaults off; locale defaults from system direction. Arabic digits for ar; percentage rounds only for display.",
        ),
      ],
    ],
    spinner: [
      [
        "label / decorative",
        "string / boolean?",
        t(
          "label مطلوب إلا مع decorative=true؛ عندها يملك النص المجاور الإعلان.",
          "label is required unless decorative=true; adjacent text then owns the announcement.",
        ),
      ],
      [
        "size",
        "sm | md",
        t(
          "sm افتراضي. تتوقف الحركة مع تقليل الحركة مع بقاء المؤشر والتسمية.",
          "Defaults to sm. Reduced motion stops rotation while keeping the indicator and name.",
        ),
      ],
    ],
    avatar: [
      [
        "name / src / fallback",
        "string / string? / string?",
        t(
          "name مطلوب. الصورة زخرفية داخليًا؛ الاسم يعلن مرة واحدة. الأحرف ثابتة عند غياب الصورة أو فشلها؛ مرّر الأحرف العربية عمدًا.",
          "name is required and announced once. Image content is decorative internally. Stable initials cover missing/loading/failed images; supply deliberate Arabic initials.",
        ),
      ],
      [
        "size / decorative",
        "sm | md / boolean?",
        t(
          "sm افتراضي؛ decorative يخفي الصورة من قارئات الشاشة بجوار نص مكافئ.",
          "Defaults to sm. decorative hides the Avatar beside equivalent text.",
        ),
      ],
      [
        "native span props / ref",
        "ComponentPropsWithRef<span>",
        t(
          "باستثناء children وrole وaria-label. الاسم يحدد التسمية؛ ref على span.",
          "Except children, role and aria-label. name owns labeling; ref targets span.",
        ),
      ],
    ],
    "avatar-group": [
      [
        "members / label",
        "AvatarMember[] / string",
        t(
          "مطلوبة. العضو: id ثابت وفريد، name، src?، fallback?. الترتيب يتبع الاتجاه.",
          "Required. Members have stable unique id, name, optional src/fallback. Order follows direction.",
        ),
      ],
      [
        "maxVisible / size",
        "number? / sm | md",
        t(
          "الحد الافتراضي 4. تُقرب الكسور للأسفل وتُثبت القيم دون 1 عند 1؛ غير المحدودة تستخدم 4. الحجم sm.",
          "Limit defaults to 4. Fractions floor, values below 1 clamp to 1, nonfinite values use 4. Size defaults to sm.",
        ),
      ],
      [
        "overflowLabel",
        "(count: number) => string",
        t(
          "مطلوب لترجمة العدد الإضافي. أسماء الأعضاء المخفيين متاحة مع النص. ليس زرًا.",
          "Required translated overflow text. Hidden member names accompany it. Overflow is noninteractive.",
        ),
      ],
    ],
    tooltip: [
      [
        "trigger / content",
        "ReactElement / string",
        t(
          "مطلوبة. عنصر قابل للتركيز يحفظ refs والأحداث والاسم ومعرّفات الوصف. نص قصير غير تفاعلي فقط.",
          "Required. Use a focusable trigger; refs, events, name and existing description IDs are preserved. Short noninteractive text only.",
        ),
      ],
      [
        "delayDuration",
        "number? (milliseconds)",
        t(
          "500 افتراضي للمرور؛ التركيز فوري. Escape يغلق التلميح أولًا. البوابة ضمن أقرب مزود أو حوار.",
          "Hover defaults to 500ms; focus is immediate. Escape dismisses Tooltip first. Portal uses the nearest provider or overlay.",
        ),
      ],
    ],
    modal: [
      [
        "trigger / title / description / closeLabel / children",
        "ReactElement / string / string / string / ReactNode",
        t(
          "مطلوبة؛ زر الفتح يبقى موجودًا لاستعادة التركيز. يترجم التطبيق النصوص.",
          "Required; keep trigger mounted for focus restoration. Application translates copy.",
        ),
      ],
      [
        "footer / open / onOpenChange",
        "ReactNode? / boolean? / ((open: boolean) => void)?",
        t(
          "حالة داخلية عند حذف open؛ التحكم يحتاج تحديث open. التذييل اختياري؛ استخدم Radix Dialog.Close للإغلاق في الحالتين.",
          "Omit open for internal state; controlled usage updates open. Optional footer; Radix Dialog.Close works in both modes.",
        ),
      ],
      [
        "initialFocusRef",
        "RefObject<HTMLElement | null>?",
        t(
          "عنصر قابل للتركيز داخل المحتوى. عند غيابه يستخدم Radix أول عنصر قابل للتركيز. Tab محصور؛ Escape والخارج يغلقان الحوار.",
          "A focusable element inside content. Otherwise Radix focuses the first focusable element. Tab is contained; Escape and outside dismiss.",
        ),
      ],
      [
        "nested overlays / viewport",
        "Scoped portal / internal scrolling",
        t(
          "القائمة والاختيار والتلميح داخل نطاق الحوار. لا توجد إدارة مكدس أو عرض قابل للتعديل.",
          "Menu, Select and Tooltip stay inside dialog scope. No stack manager or configurable width.",
        ),
      ],
    ],
    "empty-state": [
      [
        "title / description / illustration / action",
        "string / string? / ReactNode? / ReactNode?",
        t(
          "عنوان مطلوب. الرسم اختياري أو مخصص وزخرفي؛ الإجراء من التطبيق ويجب ربطه بنتيجة فعلية.",
          "Required title. Illustration is optional/custom and decorative; application supplies an action connected to a real result.",
        ),
      ],
      [
        "NoRecordsIllustration / NoSearchResultsIllustration / GettingStartedIllustration",
        "() => JSX.Element",
        t(
          "تصديرات SVG أصلية بلا نص، مخفية من قارئات الشاشة وتستخدم رموز النظام.",
          "Original text-free SVG exports, hidden from assistive technology and using shared tokens.",
        ),
      ],
    ],
    badge: [
      [
        "children / tone",
        "ReactNode / neutral | success | error | info",
        t(
          "النص يوضح المعنى. محايد افتراضيًا؛ لا يوجد إجراء أو إعلان تلقائي.",
          "Text carries meaning. Defaults to neutral; no action or automatic announcement.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<span>",
        t(
          "خصائص span وref عليه. تجنب جعل الشارة زرًا.",
          "Span attributes and ref stay on the span. Keep the badge noninteractive.",
        ),
      ],
    ],
    checkbox: [
      [
        "label / helper / error",
        "string / string? / string?",
        t(
          "تسمية مطلوبة مع مساعدة وخطأ مرتبطين. التطبيق يملك التحقق.",
          "Required label with associated help and error. Application owns validation.",
        ),
      ],
      [
        "checked / defaultChecked / onChange",
        "boolean? / boolean? / ChangeEventHandler<HTMLInputElement>",
        t(
          "التحكم يحتاج تحديث checked من onChange. القيمة الافتراضية تدعم إعادة الضبط الأصلية.",
          "Controlled usage updates checked from onChange. Uncontrolled defaults support native reset.",
        ),
      ],
      [
        "disabled / required / name / value / form / ref",
        "Native input attributes / HTMLInputElement ref",
        t(
          "الخصائص والأحداث وclassName/style وref على input. لا يدعم الحالة غير المحددة أو اختيار الصفوف.",
          "Attributes, events, className/style and ref target input. No indeterminate state or row selection.",
        ),
      ],
      [
        "invalid / aria-describedby",
        "boolean? / string?",
        t(
          "الخطأ يعلّم العنصر غير صالح، وتُدمج معرفات الوصف الخارجية دون تكرار.",
          "Error marks invalid; external description IDs are merged without duplicates.",
        ),
      ],
    ],
    "radio-group": [
      [
        "label / name / options",
        "string / string / readonly RadioOption[]",
        t(
          "تسمية legend واسم مشترك مطلوبان. قيم فريدة ثابتة وتسميات نصية وdisabled اختياري لكل خيار.",
          "Required legend label and shared name. Unique stable values, string labels and optional disabled per option.",
        ),
      ],
      [
        "value / defaultValue / onValueChange",
        "string? / string? / (value: string) => void",
        t(
          "خيارات أصلية؛ احفظ تنقل الأسهم والاختيار الواحد. التحكم يحتاج تحديث القيمة من callback.",
          "Native radios retain arrow navigation and one choice. Controlled usage updates value from the callback.",
        ),
      ],
      [
        "required / disabled / helper / error",
        "boolean? / boolean? / string? / string?",
        t(
          "required على المدخلات؛ disabled على المجموعة. المساعدة والخطأ مرتبطان بالمجموعة وكل خيار.",
          "Required applies to inputs; disabled to the fieldset. Help/error describe the group and each option.",
        ),
      ],
      [
        "native attributes / form / ref",
        "ComponentPropsWithRef<fieldset> / HTMLFieldSetElement ref",
        t(
          "ref وclassName/style والأحداث على fieldset. form ينتقل إلى المدخلات. إعادة الضبط أصلية دون callback؛ الوضع المتحكم به يحتاج onReset من التطبيق.",
          "Ref, className/style and events target fieldset. Form association reaches inputs. Native uncontrolled reset emits no callback; controlled reset needs application onReset.",
        ),
      ],
    ],
    textarea: [
      [
        "label / helper / error / field",
        "Same convenience/composition modes as Input",
        t(
          "المساعدة والخطأ يرافقان التسمية. لا تجمع label/helper/error مع field. Field موثق تحت Input.",
          "Help/error accompany label. Do not combine label/helper/error with field. Field is documented under Input.",
        ),
      ],
      [
        "value / defaultValue / onChange",
        "Native textarea attributes",
        t(
          "التحكم وإعادة الضبط من التطبيق عند استخدام value. الوضع الافتراضي يحفظ إعادة الضبط الأصلية.",
          "Value mode needs application state and reset handling. DefaultValue retains native reset.",
        ),
      ],
      [
        "rows / disabled / readOnly / required / name / form / ref",
        "Native attributes / HTMLTextAreaElement ref",
        t(
          "٣ أسطر افتراضيًا. التحرير والتحديد والخصائص والأحداث وref على textarea. تغيير الحجم عمودي؛ لا نمو تلقائي أو عداد.",
          "Defaults to 3 rows. Editing, selection, attributes, events and ref target textarea. Vertical resizing; no automatic growth or counter.",
        ),
      ],
      [
        "invalid / aria-describedby / className / style",
        "Same as Input",
        t(
          "دمج معرفات الوصف الخارجية وحالة عدم الصلاحية على المدخل نفسه؛ التحقق من التطبيق.",
          "External descriptions and invalid state stay on the control; validation belongs to the application.",
        ),
      ],
    ],
    "data-table": [
      [
        "data / columns / getRowId",
        "readonly T[] / readonly DataTableColumn<T>[] / (row: T) => Key",
        t(
          "التطبيق يملك البيانات والتصفية والإجراءات. مفتاح ثابت وفريد لكل صف.",
          "Application owns data, filtering and actions. Supply a stable unique row ID.",
        ),
      ],
      [
        "DataTableColumn<T>",
        "id: string; header: string; cell: (row: T) => ReactNode; sortValue?: (row: T) => string; rowHeader?: boolean",
        t(
          "sortValue يتيح فرز النص. rowHeader يحدد عنوان الصف الأصلي.",
          "sortValue enables text sorting. rowHeader renders a native row header.",
        ),
      ],
      [
        "caption / locale",
        "string / string",
        t(
          "عنوان أصلي ولغة Intl.Collator مع numeric=true وsensitivity=base.",
          "Native caption and Intl.Collator locale with numeric=true and sensitivity=base.",
        ),
      ],
      [
        "labels",
        "DataTableLabels",
        t(
          "previous، next، pagination أسماء مترجمة. sortAscending(header)، sortDescending(header)، resultCount(from,to,total) تعيد نصًا.",
          "Translated previous, next, pagination strings. sortAscending(header), sortDescending(header), resultCount(from,to,total) return strings.",
        ),
      ],
      [
        "emptyContent / loading",
        "ReactNode / boolean? = false",
        t(
          "محتوى التطبيق للفراغ والتحميل والخطأ. loading يعلن aria-busy ويعطل أزرار الصفحات؛ مرر بيانات فارغة للتحميل.",
          "Application content for empty, loading and error states. loading sets aria-busy and disables page controls; supply empty data while loading.",
        ),
      ],
      [
        "pageSize / resetKey",
        "number? = 10 / string | number?",
        t(
          "حجم موجب يُقرب لعدد صحيح. تغيير resetKey يعيد الصفحة الأولى. الفرز يعيدها تلقائيًا؛ تقليل البيانات يثبت الصفحة ضمن النطاق.",
          "Positive size rounded down; invalid sizes normalize to 1 (nonfinite to 10). Change resetKey when filters change to return to page one. Sort resets automatically; shrinking data clamps the page permanently.",
        ),
      ],
      [
        "Scope",
        "Client-side only",
        t(
          "لا تحديد أو تحرير أو حذف أو افتراضية أو أعمدة ثابتة أو بيانات خادم. Table يبقى أساس HTML البسيط.",
          "No selection, editing, deletion, virtualization, sticky columns or server framework. Table remains the simple HTML foundation.",
        ),
      ],
    ],
    table: [
      [
        "Table · caption",
        "ReactNode?",
        t(
          "عنوان caption أصلي. بدونه سمّ الجدول عبر aria-label أو aria-labelledby.",
          "Native caption. Without it, name the table with aria-label or aria-labelledby.",
        ),
      ],
      [
        "Table · native attributes / ref",
        "ComponentPropsWithRef<table>",
        t(
          "الخصائص والأحداث والتنسيق وref على table نفسه.",
          "Attributes, events, className/style and ref target the table itself.",
        ),
      ],
      [
        "Table · containerProps",
        "ComponentPropsWithRef<div>?",
        t(
          "حاوية تمرير أفقية قابلة للتركيز، تسميتها من الجدول. خصائصها وref منفصلة؛ احفظ tabIndex=0 للوصول بلوحة المفاتيح.",
          "Focusable horizontal scroll container named from the table. Separate attributes/ref; retain tabIndex=0 for keyboard access.",
        ),
      ],
      [
        "TableHeader / TableBody / TableRow",
        "Native thead / tbody / tr props and refs",
        t(
          "تركيب HTML أصلي؛ استخدم مفتاحًا ثابتًا وفريدًا لكل صف بيانات.",
          "Native HTML composition; use stable unique keys for data rows.",
        ),
      ],
      [
        "TableHead / TableCell",
        "Native th / td props and refs",
        t(
          "scope=col افتراضي للعناوين، أو scope=row. الخلايا تقبل colSpan وheaders. الحالة الفارغة محتوى التطبيق.",
          "Headers default to scope=col; use scope=row for row headers. Cells accept colSpan/headers. Empty content belongs to the application.",
        ),
      ],
      [
        "Appearance / scope",
        "SystemProvider",
        t(
          "الكثافة وحجم النص والاتجاه من النظام. التفاف النص وتمرير أفقي؛ لا فرز أو تصفية أو تقسيم صفحات أو تحديد أو تحرير أو افتراضية أو أعمدة ثابتة.",
          "Shared density, text scale and direction. Wrapping and horizontal scroll; no sorting, filtering, pagination, selection, editing, virtualization or sticky columns.",
        ),
      ],
    ],
    field: [
      [
        "label / helper / error",
        "string / string? / string?",
        t(
          "التطبيق يملك قواعد التحقق. error يعرض الرسالة ويعلن عدم الصلاحية فقط.",
          "The application owns validation rules. error only displays feedback and marks the control invalid.",
        ),
      ],
      [
        "children",
        "(control: FieldControlProps) => ReactNode",
        t(
          "عنصر واحد: مرر control عبر field إلى Input أو Select؛ لا نسخ تلقائيًا للعناصر.",
          "One control: pass control as field to Input or Select; children are never cloned.",
        ),
      ],
      [
        "required / id / className / aria-describedby",
        "boolean? / string? / string? / string?",
        t(
          "معرف ثابت مولّد، أو id فريد من التطبيق. تجمع معرفات الأوصاف الخارجية.",
          "Stable generated ID or unique caller ID. External description IDs are merged.",
        ),
      ],
      [
        "FieldControlProps",
        "id, aria-labelledby, aria-describedby?, aria-invalid?, required?",
        t(
          "يربط التسمية والمساعدة والخطأ؛ field يملك id. required يعلن النجمة ويمرر القيد الأصلي.",
          "Associates label, help and error; field owns id. required shows an indicator and forwards the native constraint.",
        ),
      ],
    ],
    input: [
      [
        "label / helper / error",
        "string? / string? / string?",
        t(
          "ابدأ بـ Input: label يضيف Field داخليًا للتسمية والمساعدة والخطأ. helper وerror مع label فقط، ولا تجمع label مع field. الخطأ يعلن عدم الصلاحية دون تنفيذ التحقق.",
          "Start with Input. label adds Field internally for label, helper and error. helper/error require label; label and field cannot be combined. error marks invalid without running validation rules.",
        ),
      ],
      [
        "type / size",
        "InputType / sm | md",
        t(
          "text افتراضي. يدعم text/email/password/search/tel/url فقط. sm افتراضي.",
          "Defaults to text and sm. Supports text/email/password/search/tel/url only.",
        ),
      ],
      [
        "value / defaultValue / onChange",
        "Native input props",
        t(
          "القيمة المتحكم بها تحتاج onChange. reset أصلي للقيم الداخلية؛ عالج onReset في التطبيق للقيم المتحكم بها.",
          "Controlled value requires onChange. Uncontrolled reset is native; handle onReset in the application for controlled values.",
        ),
      ],
      [
        "field / invalid",
        "FieldControlProps? / boolean?",
        t(
          "بدون label يبقى input مستقلًا: تسمية HTML أو ARIA خارجية، أو field للتركيب منخفض المستوى. تُجمع الأوصاف الخارجية.",
          "Without label, Input stays standalone: use a native label/ARIA or field for lower-level composition. External descriptions are merged.",
        ),
      ],
      [
        "placeholder / disabled / readOnly / required / name / form / autoComplete",
        "Native input attributes",
        t(
          "يحافظ على التحرير والتحديد والملء التلقائي وسلوك النموذج الأصلي.",
          "Preserves native editing, selection, autofill and form behavior.",
        ),
      ],
      [
        "ref / id / className / style / ARIA / data-* / native events",
        "Ref<HTMLInputElement> / ComponentPropsWithRef<input>",
        t(
          "React 19: ref وclassName وstyle تبقى على input، حتى مع التسمية. size/type/children تستبدل الواجهة الأصلية.",
          "React 19 ref, className and style target input even in labeled mode. Native size/type/children are replaced by the typed API.",
        ),
      ],
    ],
    select: [
      [
        "options",
        "SelectOption[]: value, label, disabled?",
        t(
          "قيم فريدة غير فارغة وتسميات واضحة. القيمة الفارغة تعرض placeholder. لا بحث أو اختيار متعدد.",
          "Unique nonempty values and meaningful labels. Empty value shows the placeholder. Single select; no search or multi-select.",
        ),
      ],
      [
        "value / defaultValue / onValueChange",
        "string / string? / (string) => void",
        t(
          "طِراز يدير القيمة الداخلية. reset الناجح يطلب القيمة الأولية بعد اكتمال الحدث؛ الإلغاء يحفظ القيمة دون callback. يتبع النموذج الحالي عند استبداله أو إضافته لاحقًا دون إعادة تركيب Select.",
          "Tiraz manages uncontrolled values. Successful reset requests the initial value after event dispatch; cancellation preserves the value without a callback. Reset follows the current form after replacement or late insertion without remounting Select.",
        ),
      ],
      [
        "size / placeholder / disabled / required / invalid / field",
        "sm | md / string? / booleans / FieldControlProps?",
        t(
          "sm افتراضي؛ تسمية خارجية أو Field. لا يحقق قواعد التطبيق.",
          "sm default; name with an external label or Field. Does not perform application validation.",
        ),
      ],
      [
        "name / form / autoComplete",
        "string?",
        t(
          "select أصلي مخفي يدعم FormData وreset وrequired. checkValidity لا يغير التركيز. يُعاد التركيز لزر الاختيار عند التركيز الأصلي فقط؛ يمكن للتطبيق إلغاء invalid وتحديد ملخص الأخطاء عبر حاوية الحقل.",
          "The hidden select supports FormData, reset and required. checkValidity does not move focus. Actual native focus redirects to the trigger; ancestor invalid handlers can cancel reporting and focus an error summary. onInvalid remains a trigger-button prop.",
        ),
      ],
      [
        "ref / id / className / style / ARIA / data-* / button events",
        "Ref<HTMLButtonElement> / native button props",
        t(
          "ref يصل لزر الفتح. children/type/value/defaultValue/onChange مستبدلة؛ name/form للعنصر الأصلي. لا open/defaultOpen أو تخصيص popup في هذه الواجهة.",
          "ref targets trigger. children/type/value/defaultValue/onChange are replaced; name/form target native form participation. No open/defaultOpen or popup customization API.",
        ),
      ],
      [
        "keyboard / popup",
        "Radix Select 2.4.1",
        t(
          "أسهم وHome/End والكتابة وEnter/Escape، واستعادة التركيز. محتوى داخل SystemProvider وSheet، وتمرر القائمة داخليًا. الحركة شفافية فقط وتحترم تقليل الحركة.",
          "Arrows, Home/End, typeahead, Enter/Escape and focus restoration. Popup stays within SystemProvider/Sheet and scrolls internally. Opacity motion respects app and OS reduction.",
        ),
      ],
    ],
    button: [
      [
        "variant / state / size",
        "ButtonVariant / ButtonState / sm | md",
        t(
          "sm افتراضي. loading يمنع الضغط ويعلن aria-busy.",
          "sm is the default. Loading blocks clicks and manages aria-busy.",
        ),
      ],
      [
        "children / iconOnly / aria-label",
        "ReactNode / boolean / string",
        t(
          "الاسم المعلن مطلوب عند iconOnly. الأيقونات تركيب داخل children.",
          "An accessible name is required for iconOnly. Icons compose inside children.",
        ),
      ],
      [
        "disabled / type / id / className / style",
        "HTML button attributes",
        t(
          "سمات أصلية. النمط العريض مثال لـ style.",
          "Native attributes. The wide preset demonstrates style.",
        ),
      ],
      [
        "...HTML / ARIA / data-*",
        "ButtonHTMLAttributes",
        t(
          "يشمل title وname وvalue وform* وtabIndex وdir وautoFocus وغيرها. تُمرّرها في كود تطبيقك.",
          "Includes title, name, value, form*, tabIndex, dir, autoFocus and other native attributes. Pass these attributes in your application code.",
        ),
      ],
      [
        "onClick / ...native events",
        "React event handlers",
        t(
          "المحاكاة أو التسجيل يوضحان onClick. المعالجات الأخرى دوال تُربط في تطبيقك.",
          "Simulation and logging demonstrate onClick. Other event handlers are functions supplied by your application.",
        ),
      ],
      [
        "ref",
        "No explicit typed ref prop",
        t(
          "ButtonProps لا يعلن ref. لا يوجد تحكّم وهمي لهذا التفصيل.",
          "ButtonProps has no explicit ref prop; there is no pretend editor for it.",
        ),
      ],
    ],
    tabs: [
      [
        "items",
        "TabItem[]",
        t(
          "value فريد؛ label وcontent من نوع ReactNode؛ disabled اختياري. يمكن تركيب ReactNode في كود تطبيقك.",
          "Unique value; label/content are ReactNode; disabled is optional. Compose ReactNode content in your application code.",
        ),
      ],
      [
        "label / variant / className",
        "string / underline | segment / string",
        t(
          "label اسم قائمة التبويبات لقارئات الشاشة.",
          "label names the tab list for assistive technology.",
        ),
      ],
      [
        "value / defaultValue",
        "string",
        t(
          "حالة متحكّم بها أو قيمة أولية؛ الافتراضي أول عنصر مفعّل.",
          "Controlled value or initial value; defaults to the first enabled item.",
        ),
      ],
      [
        "onValueChange",
        "(value: string) => void",
        t(
          "تغيّر التحديد يظهر مباشرة في سجل الحدث والكود.",
          "Selection changes update the event record and usage code.",
        ),
      ],
      [
        "ref",
        "Not exposed",
        t(
          "لا يعلن المكوّن ref في واجهته.",
          "The component does not expose a ref.",
        ),
      ],
    ],
    switch: [
      [
        "label / description",
        "string",
        t(
          "label مرتبط بالمفتاح، وdescription مرتبط بـ aria-describedby.",
          "label is connected to the switch; description supplies aria-describedby.",
        ),
      ],
      [
        "checked / defaultChecked / onCheckedChange",
        "boolean / boolean / (boolean) => void",
        t(
          "اختر حالة متحكّم بها أو داخلية. Space يغيّر الحالة.",
          "Choose controlled or internal state. Space toggles it.",
        ),
      ],
      [
        "disabled / required / name / value / type",
        "Native switch/button props",
        t(
          "سمات النموذج الأصلية موروثة من Radix Switch.Root.",
          "Native form attributes inherited from Radix Switch.Root.",
        ),
      ],
      [
        "id / className / style / ...DOM attributes",
        "ComponentProps<Switch.Root>",
        t(
          "className على حاوية التسمية؛ style وسمات DOM على المفتاح نفسه.",
          "className styles the label wrapper; style and DOM attributes apply to the switch control.",
        ),
      ],
      [
        "children / asChild",
        "Managed by the wrapper",
        t(
          "المكوّن يملك بنية Thumb. لا تُمرّر children أو asChild.",
          "The wrapper owns its Thumb structure. children and asChild are excluded from its public API.",
        ),
      ],
      [
        "ref / ...native events",
        "Ref<HTMLButtonElement> / event handlers",
        t(
          "ref موروث ويصل إلى زر المفتاح. ليس قيمة قابلة للتحرير. باقي الأحداث دوال تطبيق.",
          "The inherited ref targets the switch button. It is not an editable value. Other native events are application functions.",
        ),
      ],
    ],
    dropdown: [
      [
        "trigger",
        "ReactElement",
        t(
          "المثال يركّب Button مع تسمية ونوع وحجم.",
          "The preset composes a Button label, variant and size.",
        ),
      ],
      [
        "items",
        "MenuItem[]",
        t(
          "id، label، icon: ReactNode، shortcut، disabled، destructive، separatorBefore، onSelect.",
          "id, label, icon: ReactNode, shortcut, disabled, destructive, separatorBefore, onSelect.",
        ),
      ],
      [
        "align / open / onOpenChange",
        "start | end / boolean / (boolean) => void",
        t(
          "open اختياري. في الحالة الداخلية يفتح زر التفعيل القائمة.",
          "open is optional; in internal mode the trigger opens the menu.",
        ),
      ],
      [
        "items[].onSelect",
        "() => void",
        t(
          "كل اختيار يسجّل معرّف العنصر. الدوال تُكتب في تطبيقك.",
          "Selections record item IDs. Callback functions belong to your application.",
        ),
      ],
      [
        "ref / children / className / side",
        "Not exposed as DropdownMenu props",
        t(
          "لا تضف هذه الخصائص. التحرير يتم عبر trigger وitems، والمحاذاة فقط.",
          "Do not add these props. Compose trigger/items and use alignment instead.",
        ),
      ],
    ],
    sheet: [
      [
        "trigger / children / footer",
        "ReactElement / ReactNode / ReactNode",
        t(
          "تركيب زر، نصوص ممثلة، وتذييل اختياري. زر التذييل يستخدم Radix Dialog.Close ليدعم الحالتين.",
          "Button composition, representative content and optional footer. The footer uses Radix Dialog.Close in both state modes.",
        ),
      ],
      [
        "title / description / closeLabel",
        "string",
        t(
          "مطلوبة لتسمية اللوحة ووصفها وزر إغلاقها.",
          "Required to name/describe the dialog and its close button.",
        ),
      ],
      [
        "open / onOpenChange",
        "boolean / (boolean) => void",
        t(
          "حالة متحكّم بها أو داخلية. الإغلاق يستعيد التركيز.",
          "Controlled or internal state. Dismissal restores focus.",
        ),
      ],
      [
        "side",
        "right | left (optional)",
        t(
          "إذا حُذفت: اليمين في RTL واليسار في LTR. العرض غير قابل للتعديل في API.",
          "When omitted: right in RTL, left in LTR. Width is not an API prop.",
        ),
      ],
      [
        "ref / className",
        "Not exposed",
        t(
          "لا توجد حقول تحرير لخصائص غير معروضة.",
          "No controls are fabricated for unexposed props.",
        ),
      ],
    ],
    toast: [
      [
        "ToastProvider.children / label / closeLabel",
        "ReactNode / string / string",
        t(
          "children محتوى التطبيق. label يسمي الإعلانات ومنطقة التنبيهات.",
          "children is application content. label names announcements and the toast viewport.",
        ),
      ],
      [
        "useToast().toast",
        "(ToastMessage) => void",
        t(
          "أرسل الرسالة من داخل ToastProvider. سجل الحدث يعرض tone وduration.",
          "Call inside ToastProvider. The event record shows tone and duration.",
        ),
      ],
      [
        "title / description / tone",
        "string / string? / success | error | info",
        t(
          "title مطلوب، والافتراضي info. description اختياري.",
          "title is required; tone defaults to info; description is optional.",
        ),
      ],
      [
        "duration",
        "number (milliseconds)",
        t(
          "5000 افتراضي. تحكم المدة هنا يعرض 1000–60000ms.",
          "Defaults to 5000. The inspector demonstrates 1000–60000ms.",
        ),
      ],
      [
        "open / ref / placement / className",
        "Not exposed",
        t(
          "الطابور والإغلاق داخليان. لا توجد خاصية لموضع التنبيه.",
          "Queue and dismissal are internal. Placement is not a configurable prop.",
        ),
      ],
    ],
  };
  return (
    <details className="api-reference">
      <summary>{label("api", language)}</summary>
      <p>
        {t("الواجهة الفعلية في", "Actual interface in")}{" "}
        <bdi dir="ltr">src/system/{file}</bdi>.
      </p>
      <div
        className="api-scroll"
        tabIndex={0}
        role="region"
        aria-label={label("api", language)}
      >
        <table>
          <thead>
            <tr>
              <th>{t("الخاصية", "Property")}</th>
              <th>{t("النوع والسلوك", "Type and behavior")}</th>
            </tr>
          </thead>
          <tbody>
            {rows[component].map(([name, type, note]) => (
              <tr key={name}>
                <td>
                  <code dir="ltr">{name}</code>
                </td>
                <td>
                  <code dir="ltr">{type}</code>
                  <p>{note}</p>
                </td>
              </tr>
            ))}
            {component === "input" && (
              <>
                <tr>
                  <td colSpan={2}>
                    <h3>
                      {t("Field · مساعد تركيب", "Field · composition helper")}
                    </h3>
                    <p>
                      {t(
                        "واجهة منخفضة المستوى لعناصر Input وSelect. يبقى التصدير والتركيب الحاليان متاحين.",
                        "Lower-level composition for Input and Select. Its public export and existing composition remain available.",
                      )}
                    </p>
                  </td>
                </tr>
                {rows.field.map(([name, type, note]) => (
                  <tr key={`field-${name}`}>
                    <td>
                      <code dir="ltr">Field: {name}</code>
                    </td>
                    <td>
                      <code dir="ltr">{type}</code>
                      <p>{note}</p>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      <p className="api-note">
        {t(
          "إعدادات المظهر مشتركة عبر SystemProvider. الخصائص غير المعروضة في المعاينة متاحة في API؛ تُربط الدوال وrefs في كود تطبيقك.",
          "Appearance is shared through SystemProvider. Properties omitted from the compact inspector remain available in the API; supply functions and refs in application code.",
        )}
      </p>
      <p className="sr-only">
        {fields[component].map((f) => f.api).join(", ")}
      </p>
    </details>
  );
}
