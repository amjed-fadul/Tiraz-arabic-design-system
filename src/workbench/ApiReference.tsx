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
  const rows: Record<ComponentId, Array<[string, string, string]>> = {
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
