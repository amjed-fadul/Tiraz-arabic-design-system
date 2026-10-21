import { useId } from "react";
import registrySource from "../system/ai/registry.json?raw";
import type { ComponentId } from "./catalog";
import { catalog } from "./catalog";
import { fields } from "./fields";
import { label, words } from "./i18n";
import type { Language } from "./i18n";
type Prop = {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
};
// The registry's own record of each prop. Its prose is English-only, so the
// tables take only its facts from it, whether a prop is required and its
// default, and keep the page's bilingual rows for the rest.
const registry = JSON.parse(registrySource) as {
  components: readonly { id: string; props?: readonly Prop[] }[];
};
const propsOf = (id: string) =>
  registry.components.find((item) => item.id === id)?.props ?? [];
/**
 * A default the table can show as code: a literal that fits the prop's type,
 * never a description. The registry writes some numbers and booleans as
 * strings, and those show without quotes. A number or boolean prop with any
 * other string, or a union of bare words that leaves the string out, shows none.
 */
function literal(value: unknown, type: string) {
  if (typeof value === "string") {
    if (/^-?\d+(\.\d+)?$|^(true|false)$/.test(value)) return value;
    return value === "undefined" ||
      /\s/.test(value) ||
      /^(number|boolean)$/.test(type) ||
      (/^[\w-]+( \| [\w-]+)+$/.test(type) && !type.split(" | ").includes(value))
      ? undefined
      : JSON.stringify(value);
  }
  return typeof value === "boolean" ||
    typeof value === "number" ||
    value === null ||
    (Array.isArray(value) && value.length === 0)
    ? JSON.stringify(value)
    : undefined;
}
export function ApiReference({
  component,
  language,
}: {
  component: ComponentId;
  language: Language;
}) {
  const t = words(language);
  const id = useId();
  const file = catalog.find((item) => item.id === component)!.file;
  const chartRows: Array<[string, string, string]> = [
    [
      "label / summary",
      "string · required",
      t(
        "يسمّي label الرسم لقارئ الشاشة، ويعرض summary ملخصًا نصيًا ظاهرًا تكتبه أنت.",
        "Accessible name and visible application-owned text summary.",
      ),
    ],
    [
      "data",
      "ChartDatum[] / DonutDatum[]",
      t(
        "تُعرض البيانات بالترتيب الذي تمرّره. ضع في category تاريخًا بصيغة ISO أو نصًا، وأعطِ كل شريحة في الرسم الحلقي مفتاحًا ثابتًا.",
        "Input order is preserved. category is ISO date or text; donut entries need stable keys.",
      ),
    ],
    [
      "series",
      "ChartSeries[] · Cartesian only",
      t(
        "لكل سلسلة key وlabel ولون CSS اختياري. لا تستخدم category مفتاحًا لأي سلسلة.",
        "key, label and optional CSS color. category is reserved; never use it as a series key.",
      ),
    ],
    [
      "legend / interactiveLegend",
      "boolean · false / true",
      t(
        "يُظهر legend مفتاح الرسم عند تفعيله. مع interactiveLegend تصبح عناصره أزرارًا تعمل بلوحة المفاتيح وتعلن حالتها عبر aria-pressed، وإلا تبقى تسميات ثابتة.",
        "Optional legend with keyboard buttons and aria-pressed, or static labels.",
      ),
    ],
    [
      "grid / categoryFormat",
      'boolean / "text" | "date" · Cartesian only',
      t(
        "تظهر الشبكة افتراضيًا. تُقرأ التواريخ بتوقيت UTC، ولا ينعكس اتجاه الزمن في RTL.",
        "Grid defaults on. UTC dates; RTL never reverses time.",
      ),
    ],
    [
      "locale / numberFormat",
      "string / Intl.NumberFormatOptions",
      t(
        "تُستنتج اللغة من الاتجاه افتراضيًا، ويمكنك ضبطها بنفسك.",
        "Locale defaults from direction; set it independently when needed.",
      ),
    ],
    [
      "dataTable",
      "boolean · false",
      t(
        "يضيف جدول HTML اختياريًا يعرض كل القيم، حتى قيم السلاسل المخفية.",
        "Optional semantic table with all values, including hidden series.",
      ),
    ],
    [
      "height / className / style",
      "number / string / CSSProperties",
      t(
        "الارتفاع 240px ولا يقل عن 180px. تغيّر الكثافة الحواف فقط.",
        "240px height, minimum 180px; density affects chrome.",
      ),
    ],
    [
      "Accessibility",
      "Recharts accessibilityLayer",
      t(
        "انتقل إلى الرسم بـ Tab ثم تنقّل بالأسهم. يحتاج VoiceOver إلى إيقاف QuickNav. لم نختبر قارئات الشاشة يدويًا، لذا اعتمد على الملخص والجدول.",
        "Tab then arrows. VoiceOver requires QuickNav off; manual screen-reader behavior is unverified. Use summary/table.",
      ),
    ],
    [
      "Missing / zero / motion",
      "null gaps / finite numbers",
      t(
        "تظهر القيم المفقودة فجوات، ويبقى الصفر صفرًا. يرسم الرسم الحلقي القيم الموجبة فقط. لا حركة عند الظهور، والانتقالات تحترم تقليل الحركة.",
        "Missing values are gaps; zero stays zero. Donut renders positive values only. No entrance animation; transitions respect reduced motion.",
      ),
    ],
  ];
  const rows: Record<ComponentId, Array<[string, string, string]>> = {
    "task-starter": [
      [
        "value / onValueChange / onSubmit",
        "string / (value) => void / (value, context: ContextItem[]) => void | Promise<void> · required",
        t(
          "يدير تطبيقك المسودة. يصلك نصها كما كُتب مع السجلات المرفقة عند Enter أو زر الإرسال. إذا رُفض الوعد بقيت المسودة وظهر السبب نصًّا. أثناء الإرسال يصير الحقل للقراءة فقط، وتتعطّل الاقتراحات ويُمنع التكرار.",
          "Your app owns the draft. Enter or Send hands you its text as written with the attached records. A rejected promise keeps the draft and shows the reason as text. While sending, the text area is read-only, the suggestions are disabled and a repeat is blocked.",
        ),
      ],
      [
        "context / onRemoveContext",
        "ContextItem[] / (id: string) => void",
        t(
          "السجلات المرفقة، لكلٍّ منها id وlabel، وlabel وkind وicon اختيارية. يظهر زر إزالة لكل سجل إذا مرّرت onRemoveContext، ولا يزيل Backspace في حقل فارغ أيًّا منها. إذا زال زر وهو في التركيز انتقل التركيز إلى النمط.",
          "The attached records: each has an id and a label, and optionally a kind and an icon. Each gets a remove button when you pass onRemoveContext, and Backspace in an empty field removes none. If a button that has focus goes away, focus moves to the pattern.",
        ),
      ],
      [
        "mentionOptions / onAddContext / onMention",
        "ContextItem[] / (id) => void / (query: string) => void",
        t(
          "مع mentionOptions يفتح الحرف @ قائمة بالسجلات غير المرفقة، وتضيق بما يُكتب بعده. الحقل يبقى في التركيز ويملك aria-activedescendant. يختار Enter السجل فيستدعي onAddContext(id) ويُزال «@ والكلمة»، ويغلق Escape القائمة وحدها، ولا يختار الإدخال بمحرر (IME) شيئًا ولا يفتحها، وتواصل المفتوحة تصفية ما يُكتب. دون mentionOptions يستدعي كل تغيير في كلمة @ الدالة onMention(query)، ويستدعيها زر @ بنص فارغ ليفتح تطبيقك قائمته.",
          "With mentionOptions, @ opens a list of the records not yet attached, narrowing as you type after it. The text area keeps focus and owns aria-activedescendant. Enter chooses the record, calling onAddContext(id) and removing «@ and the word»; Escape closes the list alone; an input method (IME) never chooses or opens it, and an open list keeps filtering what is composed. Without mentionOptions, each change to the @ word calls onMention(query), and the @ button calls it with an empty string for your own picker.",
        ),
      ],
      [
        "modes / mode / onModeChange",
        "ModeOption[] / string / (id: string) => void",
        t(
          "يعرض زر واحد الوضع الحالي، وتحمل قائمته الأوضاع عناصر اختيار لكلٍّ منها وصفها. تعيد Escape التركيز إلى الزر. يختار تطبيقك الوضع ويمرّره من جديد.",
          "One button shows the current mode and its menu holds the modes as radio items, each with its description. Escape returns focus to the button. Your app sets the mode and passes it back.",
        ),
      ],
      [
        "models / model / onModelChange",
        "ModelOption[] / string / (id: string) => void",
        t(
          "قسم ثانٍ من عناصر الاختيار في القائمة نفسها لمن يحتاج نماذج صريحة. تظهر النماذج غير المتاحة معطّلة مع كلمة «غير متاح».",
          "A second section of radio items in the same menu, for hosts that need explicit models. Unavailable models show disabled, marked «Unavailable».",
        ),
      ],
      [
        "contextUsage",
        "ContextMeterProps",
        t(
          "بيانات ContextMeter نفسها: used وcapacity وthresholds. تظهر حلقة صغيرة قرب اسم الوضع يتبع لونها العتبات، وسطر «السياق المستخدم ٣٢٪ · سجلّان مرفقان» في آخر القائمة، والعدد يتبع المعدود في العربية.",
          "The same data as ContextMeter: used, capacity and thresholds. A small ring beside the mode takes its color from the thresholds, and the menu ends with «Context used 32% · 2 records attached», its count agreeing in Arabic.",
        ),
      ],
      [
        "modeMenuOpen / onModeMenuOpenChange",
        "boolean / (open: boolean) => void",
        t(
          "يتحكم تطبيقك في فتح القائمة. تعتمد عليهما حالة «اختيار الوضع» في هذه الصفحة.",
          "Your app can hold the menu open. This page's Choosing mode state relies on them.",
        ),
      ],
      [
        "suggestions / onSuggestion",
        "{ id, label, prompt?, icon? }[] / (id: string) => void",
        t(
          "اقتراحات من الصفحة الحالية تبقى ظاهرة أثناء الكتابة وتتعطّل أثناء الإرسال. يصلك id الاقتراح، فتملأ الحقل بـ prompt أو بالتسمية، أو ترسل.",
          "Suggestions from the current page stay while you type and are disabled while sending. You get the suggestion's id, and fill the field with its prompt or label, or send.",
        ),
      ],
      [
        "recent / onOpenRecent",
        "{ id, title, status, time }[] / (id: string) => void",
        t(
          "مهام حديثة، لكلٍّ منها حالة بالألوان والكلمات المشتركة ووقت نسبي تكتبه أنت. تفتح onOpenRecent المهمة في تطبيقك.",
          "Recent tasks, each with a status in the shared colors and words and a relative time you write. onOpenRecent opens the task in your app.",
        ),
      ],
      [
        "onAttach / onVoice",
        "() => void",
        t(
          "يظهر زر الإرفاق وزر الإملاء الصوتي إذا مرّرت دالتيهما. لا يرفع المكوّن ملفات ولا يتعرّف على الكلام، فكلاهما نيّة يعالجها تطبيقك.",
          "The attach and dictate buttons show when you pass their callbacks. The pattern uploads nothing and recognizes no speech; both are intents your app handles.",
        ),
      ],
      [
        "greeting / title / disabled / disabledReason",
        "ReactNode / ReactNode / boolean / ReactNode",
        t(
          "greeting سطر صغير فوق السؤال، وtitle هو السؤال «ماذا نُنجز اليوم؟» افتراضيًا. مع disabled يتعطّل الحقل وأدواته، ويظهر disabledReason سطرًا تحته.",
          "greeting is the small line above the question, and title is the question, «What should we get done today?» by default. With disabled the field and its tools are off, and disabledReason shows as a line under it.",
        ),
      ],
      [
        "headingLevel / labels / appearance",
        '2–6 · 3 / Partial<TaskStarterLabels> / "card" | "plain" · card',
        t(
          "headingLevel مستوى السؤال، وقائمة المهام الحديثة أدنى منه بمستوى. يستبدل labels أي نص مضمّن. card يضع الحقل على صينية، وplain يتركه على سطح تطبيقك.",
          "headingLevel is the question's level, and the recent list sits one below it. labels replaces any built-in text. card puts the field on a tray; plain leaves it on your app's own surface.",
        ),
      ],
    ],
    "cited-answer": [
      [
        "status / question",
        "thinking | writing | completed | failed | stopped · required / ReactNode?",
        t(
          "يقرّر تطبيقك الحالة ويمرّر النص كما يصل. السؤال هو عنوان القسم، واحذفه إذا كانت المحادثة تعرضه. لا يتقدّم النمط بنفسه.",
          "Your app owns the status and passes the text as it arrives. The question is the section's heading; leave it out when a conversation shows it. The pattern never moves on by itself.",
        ),
      ],
      [
        "content / sources",
        "string · required / readonly SourceReference[] · required",
        t(
          "نص Markdown فيه علامات [n] يقابل كلٌّ منها number في مصدر، بأرقام لاتينية أو عربية هندية أو فارسية، وتستشهد [1, 3] أو [٢، ٣] بأكثر من مصدر فتظهر أرقامًا متجاورة. تصير العلامة رقم استشهاد يعرض المصدر عند المرور أو التركيز ويفتحه Enter أو النقر، وتفتح لمسةٌ على شاشة لمس بطاقة المصدر بدل اتباع الرابط. تبقى العلامة نصًا إذا خلا أحد أرقامها من مصدر أو كانت داخل الكود. وتمرّ روابط الإجابة عبر sourceHref، فيُعرض mailto: وأمثاله نصًا.",
          "Markdown with [n] markers, each naming a source's number, in ASCII, Arabic-Indic or Persian digits; [1, 3] or [٢، ٣] cites several, as adjacent chips. A marker becomes a citation chip that previews its source on hover or focus and opens it on Enter or click; a tap on a touch screen opens the source's card instead of following the link. A marker with no source for any of its numbers, or inside code, stays text. Links in the answer pass through sourceHref, so mailto: and the like show as text.",
        ),
      ],
      [
        "thinking / thinkingOpen / onThinkingOpenChange",
        "{ elapsed, searched, steps } / boolean? / (open: boolean) => void",
        t(
          "elapsed بالثواني وsearched المصادر التي بُحث فيها وsteps الخطوات. تظهر أول ثلاثة مصادر رقاقاتٍ، ويعرض زر «+٢» البقية. تنفتح اللوحة أثناء التفكير وتنطوي إلى «فكّر لمدة ٦ث» عند بدء الكتابة، إلا إذا تحكّمت فيها بالزوج thinkingOpen وonThinkingOpenChange. وإذا أُوقفت الإجابة أو تعثّرت قبل أن تُكتب كلمة صارت اللوحة «أُوقف بعد ٦ث» أو «تعثّر بعد ٦ث» وبقي خيطها ساكنًا، فمرّر ما وصل فقط.",
          "elapsed in seconds, searched for the sources covered and steps for the steps. The first three sources show as chips, and «+2» shows the rest. The panel is open while thinking and folds to «Thought for 6s» when writing starts, unless you hold it with the thinkingOpen pair. A stop or a failure before a word was written leaves the panel at «Stopped after 6s» or «Failed after 6s», its thread still, so pass only what had arrived.",
        ),
      ],
      [
        "followUps / onFollowUp",
        "readonly { id, label }[] / (id: string) => void",
        t(
          "أسئلة تالية تظهر عند الاكتمال أزرارًا في قائمة. يطرح تطبيقك السؤال المختار.",
          "Next questions, shown as a list of buttons once the answer is complete. Your app asks the one picked.",
        ),
      ],
      [
        "feedback / reason / onFeedbackChange / onCopy / onRegenerate",
        'null | "up" | "down" / FeedbackReason? / (value, reason?) => void / (text: string) => void | Promise<void> / () => void',
        t(
          "الإجابة المفيدة وغير المفيدة زران قابلان للتبديل، وعند «غير مفيدة» تظهر أربعة أسباب. يستلم onCopy النص المنسوخ: الإجابة كما كُتبت، ثم «المصادر» وسطر لكل مصدر برقمه وعنوانه، ورابطه إن كان http أو https. انسخ هذا النص لا content وحده. يظهر «نُسخت» ثانيتين بعد أن يكتمل نسخ تطبيقك. يظهر كل زر إذا وُجد معالجه.",
          "Helpful and not helpful are toggles; not helpful offers four reasons. onCopy receives the text to copy: the answer as written, then «Sources» and a line per source with its number, its title and its link when it is http or https. Copy that text, not content alone. «Copied» shows for two seconds once your copy resolves. Each button shows only when its handler exists.",
        ),
      ],
      [
        "onStop / onRetry / error",
        "() => void / () => void / ReactNode",
        t(
          "أثناء التفكير والكتابة يظهر «إيقاف». عند التعثّر تبقى الإجابة الجزئية ويظهر error نصًا ومعه «أعد المحاولة». عند الإيقاف يظهر «إعادة التوليد». إذا اختفى الزر الذي عليه التركيز انتقل التركيز إلى القسم.",
          "Stop shows while thinking and writing. When it fails the partial answer stays, with error as text and Try again; when stopped, Regenerate. If the focused button goes away, focus moves to the section.",
        ),
      ],
      [
        "duration",
        "number · seconds",
        t(
          "تظهر مع عدد المصادر في الشريط السفلي، «٣ مصادر · ٦٫٢ث»، والعدد هو زر قائمة المصادر.",
          "Shown with the sources' count in the footer, «3 sources · 6.2s»; the count is the button that opens the list.",
        ),
      ],
      [
        "appearance / headingLevel / labels",
        '"card" | "plain" · card / 2 | 3 | 4 | 5 | 6 · 3 / Partial<CitedAnswerLabels>',
        t(
          "استخدم plain داخل محادثة أو نمط آخر. وتستبدل labels أي نص مدمج، ومنها نصوص اللوحة والشريط.",
          "Use plain inside a conversation or another pattern. labels replaces any built-in text, including the panel's and the bar's.",
        ),
      ],
    ],
    "data-answer": [
      [
        "status / question",
        "thinking | completed | failed | empty · required / ReactNode · required",
        t(
          "يقرّر تطبيقك الحالة ولا يتقدّم النمط بنفسه. السؤال هو عنوان القسم، وبجانبه علامة الذكاء الاصطناعي وكلمة الحالة: «يفكّر» أو «اكتملت» (للمكتملة وللفارغة) أو «تعثّرت».",
          "Your app owns the status; the pattern never moves on by itself. The question is the section's heading, with the AI mark and one status word beside it: «Thinking», «Done» (for completed and empty) or «Failed».",
        ),
      ],
      [
        "chart / chartTypes / onChartTypeChange",
        '{ type: "line" | "area" | "bar", props: CartesianChartProps } | { type: "donut", props: DonutChartProps } / readonly ("line" | "area" | "bar" | "donut")[] / (type) => void',
        t(
          "يُرسم chart.type في عائلته من العائلات الأربع، وتصلها chart.props كما هي. مع نوعين أو أكثر في chartTypes ومع onChartTypeChange تظهر مجموعة «نوع الرسم» بأزرار اختيار أصلية. الاختيار يستدعي onChartTypeChange فقط، ويبقى الرسم الحالي حتى يمرّر تطبيقك رسمًا جديدًا شكّل بياناته للنوع الجديد. اعرض الأنواع التي تناسب البيانات وحدها: خطوط ومساحة لاتجاه عبر الزمن، وأعمدة لمقارنة، وحلقي لحصص من كل.",
          "chart.type picks the chart family and chart.props go to it as given. With two or more chartTypes and an onChartTypeChange, a «Chart type» group of native radios appears. A choice only calls onChartTypeChange; the chart stays until your app passes a new one, with its data reshaped for the new type. Offer only the types that fit the data: lines and area for a trend over time, bars for a comparison, donut for parts of a whole.",
        ),
      ],
      [
        "explanation / sources",
        "string (Markdown) / readonly SourceReference[]",
        t(
          "شرح من جملتين بصيغة Markdown. كل [n] فيه يسمّي number مصدرٍ في sources، وهي الجداول التي تقوم عليها الإجابة، فيصير رقم استشهاد يعرض الجدول عند المرور أو التركيز وتفتح لمسةٌ على شاشة لمس بطاقته. تبقى العلامة نصًا إذا لم يوجد مصدرها. وتمرّ الروابط عبر sourceHref.",
          "A two-sentence explanation in Markdown. Each [n] names the number of a source in sources, the tables the answer rests on, and becomes a citation chip that previews the table on hover or focus; a tap on a touch screen opens its card. A marker with no source stays text. Links pass through sourceHref.",
        ),
      ],
      [
        "method",
        "{ range: string; filters?: string }",
        t(
          "يملأ «كيف حُسب هذا؟»: range هو «الفترة»، وfilters هو «التصفية» أو «بلا تصفية» إذا غاب، وتُسرد sources في «الجداول». تبقى مطويّة حتى يفتحها المستخدم، وتظهر مع الإجابة المكتملة ومع الفترة الفارغة فقط، ولا تظهر دون method.",
          "Fills «How was this calculated?»: range is the date range, filters the filters or «None» when absent, and sources are listed as the source tables. It stays folded until opened, shows with a completed answer or an empty period only, and not at all without method.",
        ),
      ],
      [
        "thinking",
        "{ elapsed: number; searched: readonly SourceReference[]; steps? }",
        t(
          "ما غطّاه البحث: elapsed بالثواني وsearched الجداول التي وُجدت حتى الآن وsteps الخطوات. تنفتح اللوحة أثناء التفكير وتنطوي بعده، وإذا تعثّرت الإجابة قرأت «تعثّر بعد ٦ث» وبقي خيطها ساكنًا، فمرّر ما وصل فقط. حدّث elapsed مرة في الثانية على الأكثر.",
          "What the search covered: elapsed in seconds, searched for the tables found so far and steps. The panel is open while thinking and folds after; if the answer failed it reads «Failed after 6s» with its thread still, so pass only what had arrived. Update elapsed at most once a second.",
        ),
      ],
      [
        "onPin / onOpenTable / onCopy",
        "() => void / () => void / (text: string) => void | Promise<void>",
        t(
          "يظهر «ثبّت في اللوحة» (الزر الأساسي) و«افتح في جدول» مع الإجابة المكتملة، كلٌّ إذا وُجد معالجه، وهما نيّتان يعالجهما تطبيقك. يستلم onCopy النص المنسوخ: الشرح كما كُتب، ثم «كيف حُسب هذا؟» ومعه الفترة والتصفية، ثم «المصادر» وسطر مرقَّم لكل جدول. انسخ هذا النص لا explanation وحده. يظهر «نُسخت» ثانيتين بعد أن يكتمل نسخ تطبيقك.",
          "Pin to dashboard (the primary button) and Open in a table show with a completed answer, each only when its handler exists; both are intents your app handles. onCopy receives the text to copy: the explanation as written, then «How was this calculated?» with the range and the filters, then «Sources» and a numbered line per table. Copy that text, not explanation alone. «Copied» shows for two seconds once your copy resolves.",
        ),
      ],
      [
        "onRetry / error",
        "() => void / ReactNode",
        t(
          "عند التعثّر يبقى error نصًا ثابتًا تحت «تعذّر إكمال الإجابة» ومعه «أعد المحاولة» زرًّا أساسيًا. إذا اختفى الزر الذي عليه التركيز انتقل التركيز إلى القسم. وللفترة الفارغة جملتها على الورقة: «لا توجد بيانات لهذه الفترة».",
          "When it fails, error stays as text under «Couldn't finish the answer», with Try again as the primary button. If the focused button goes away, focus moves to the section. An empty period says «No data for this period» on the paper.",
        ),
      ],
      [
        "appearance / headingLevel / labels",
        '"card" | "plain" · card / 2 | 3 | 4 | 5 | 6 · 3 / Partial<DataAnswerLabels>',
        t(
          "استخدم plain داخل لوحة أو نمط آخر. headingLevel مستوى السؤال. وتستبدل labels أي نص مدمج، وتحمل thinkingPanel وfeedbackBar كلمات الجزأين داخله.",
          "Use plain inside a dashboard or another pattern. headingLevel is the question's level. labels replaces any built-in text; thinkingPanel and feedbackBar carry the nested parts' words.",
        ),
      ],
    ],
    "change-summary": [
      [
        "status / title",
        "updating | ready | stale | failed · required / ReactNode?",
        t(
          "يقرّر تطبيقك الحالة. أثناء التحديث تصير الصفوف خطوطًا هيكلية، وفي القديم يظهر «قد يكون الملخص قديمًا» مع «تحديث».",
          "Your app owns the status. While updating the rows become skeleton lines; stale shows «The summary may be out of date» with Refresh.",
        ),
      ],
      [
        "rows",
        "readonly { id, metric, change, direction, tone, series? }[] · required",
        t(
          "تُعرض أول ستة صفوف. change بلا إشارة + أو −. السهم من direction (up | down | flat) يبيّن الاتجاه، واللون من tone (good | bad | neutral) يبيّن المعنى، فارتفاع الفواتير المتأخرة أحمر. series اختيارية ترسم خطًا صغيرًا يجري من اليسار إلى اليمين دائمًا.",
          "The first six show. change carries no + or − sign. direction (up | down | flat) draws the arrow and tone (good | bad | neutral) the color, so more late invoices is red. An optional series draws a sparkline that always runs left to right.",
        ),
      ],
      [
        "reason / sources / basedOn / updated",
        "ReactNode / readonly SourceReference[] / ReactNode / ReactNode",
        t(
          "«السبب الأرجح» ومعه استشهاد لكل مصدر في sources. basedOn وupdated نصّان من تطبيقك في الشريط السفلي، مثل «اعتمادًا على ٣ تقارير» و«حُدّث قبل ٥ د».",
          "«Most likely reason» with a citation for each of sources. basedOn and updated are your own text in the footer, such as «Based on 3 reports» and «Updated 5 min ago».",
        ),
      ],
      [
        "actions",
        "readonly { id, label, primary?, onSelect }[]",
        t(
          "تظهر مع الملخص الجاهز فقط: خطوة تالية أساسية واحدة وأخرى ثانوية.",
          "Shown with a ready summary only: one primary next step and one secondary.",
        ),
      ],
      [
        "onRefresh",
        "() => void",
        t(
          "يطلب تحديث ملخص قديم أو متعثّر. وإذا اختفى الزر الذي عليه التركيز انتقل التركيز إلى القسم.",
          "Asks for a stale or failed summary to be refreshed. If the focused button goes away, focus moves to the section.",
        ),
      ],
      [
        "appearance / headingLevel / labels",
        '"card" | "plain" · card / 2 | 3 | 4 | 5 | 6 · 3 / Partial<ChangeSummaryLabels>',
        t(
          "استخدم plain داخل لوحة أو نمط آخر. وتستبدل labels أي نص مدمج.",
          "Use plain inside a dashboard or another pattern. labels replaces any built-in text.",
        ),
      ],
    ],
    "agent-task": [
      [
        "title / agent / status",
        "ReactNode / ReactNode? / plan | running | needs-you | failed | stopped | completed · required",
        t(
          "يمرّر تطبيقك العنوان والوكيل والحالة، ويقرّر متى تتغيّر الحالة. لا يتقدّم النمط بنفسه.",
          "Your app supplies the title, the agent and the status, and decides when the status changes. The pattern never moves on by itself.",
        ),
      ],
      [
        "steps",
        "readonly AgentStep[] · required",
        t(
          "لكل خطوة id ثابت وtitle وstate، ومعها اختياريًا detail وduration بالثواني وtools وnotes وrequest وapproval وerror.",
          "Each step has a stable id, a title and a state, with an optional detail, duration in seconds, tools, notes, request, approval and error.",
        ),
      ],
      [
        "elapsed",
        "number · seconds",
        t(
          "يظهر في الشارة أثناء العمل وعند الاكتمال، ولا يُعلن أبدًا. حدّثه مرة في الثانية على الأكثر.",
          "Shown in the pill while running and once done, and never announced. Update it at most once a second.",
        ),
      ],
      [
        "autoStartAfter / onStart / onEditPlan",
        "number? / () => void / () => void",
        t(
          "في الخطة المقترحة عدّ تنازلي يتوقف ما دام المؤشر أو التركيز داخل المهمة، ثم يستدعي onStart. ويبدأ Ctrl أو Cmd+Enter الخطة بعد نصف ثانية من ظهورها أو تغيّرها.",
          "A proposed plan counts down while neither the pointer nor focus is inside, then calls onStart. Ctrl or Cmd+Enter starts the plan half a second after it appears or changes.",
        ),
      ],
      [
        "onSteer / onStop",
        '(text, when: "next" | "now") => void / () => void',
        t(
          "أثناء العمل يوجّه Enter الوكيل مع الخطوة التالية، وCtrl أو Cmd+Enter فورًا، ثم يُفرَّغ الحقل. لا توجيه أثناء الكتابة بلوحة إدخال.",
          "While running, Enter steers at the next step and Ctrl or Cmd+Enter steers now; the field then clears. Nothing steers while an input method is composing.",
        ),
      ],
      [
        "onDecision",
        "(request, decision, { signal }) => void | Promise<void>",
        t(
          "يظهر طلب الخطوة المنتظرة بطاقة موافقة مدمجة بقواعدها كلها. وبلا onDecision يظهر الطلب نصًا دون إجراءات.",
          "A waiting step's request shows as a plain approval card, with all its rules. Without onDecision the request shows as text, with no actions.",
        ),
      ],
      [
        "onRetryStep / onSkipStep / onReconnect",
        "(id: string) => void",
        t(
          "طرق المتابعة بعد التعثّر، لما تذكره error.actions في الخطوة. إذا اختفى الزر الذي عليه التركيز انتقل التركيز إلى المهمة.",
          "Ways forward from a failed step, for those its error.actions lists. If the focused button goes away, focus moves to the task.",
        ),
      ],
      [
        "outputs / primaryAction",
        "readonly { id, label, icon?, onOpen? }[] / { label, onSelect }",
        t(
          "عند الاكتمال تظهر نتائج المهمة رقاقاتٍ، ومعها الإجراء التالي الأساسي.",
          "Once done, what the task produced shows as chips, with the primary next action.",
        ),
      ],
      [
        "appearance / headingLevel / labels",
        '"card" | "plain" · card / 2 | 3 | 4 | 5 | 6 · 3 / Partial<AgentTaskLabels>',
        t(
          "استخدم plain داخل محادثة أو نمط آخر. وتستبدل labels أي نص مدمج.",
          "Use plain inside a conversation or another pattern. labels replaces any built-in text.",
        ),
      ],
    ],
    "suggested-edits": [
      [
        "children / actions / onAction",
        "ReactNode / readonly { id, label, icon? }[] · required / (id, { text, start, end }) => void · required",
        t(
          "يلفّ children نص تطبيقك كما يلفّه SelectionActions، وتظهر الإجراءات عند تحديد جزء منه. يمرّر onAction الإجراء والنص المحدّد وموضعه في نص المنطقة.",
          "children wraps your app's text as SelectionActions does, and the actions show when part of it is selected. onAction hands over the action, the selected text and where it sits in the region's text.",
        ),
      ],
      [
        "status / selection",
        "idle | rewriting | reviewing | applied · required / { start, end }?",
        t(
          "يقرّر تطبيقك الحالة. في rewriting يبقى التحديد مُعلَّمًا بخط المساعد ويظهر «يعيد الصياغة…»، وفي reviewing تُفتح بطاقة المراجعة تحته، وفي applied يظهر الإيصال. مرّر selection لتعيد موضعًا حفظته، وإلا استُخدم موضع آخر إجراء.",
          "Your app owns the status. While rewriting the selection keeps the assistant's underline and «Rewriting…» shows; reviewing opens the review card below it; applied shows the receipt. Pass selection to restore a range you saved; otherwise the last action's range is used.",
        ),
      ],
      [
        "suggestion / decisions / onDecisionsChange",
        "{ title, segments: DiffSegment[] }? / Record<id, accepted | rejected>? / (next) => void",
        t(
          "كل تعديل سلسلة متتالية من الإضافات والحذوفات، ويُعرف بمعرّف أول جزء فيه. أبقِ suggestion وdecisions حتى applied ليحسب الإيصال التعديلات. وبدون decisions يحتفظ النمط بقراراته.",
          "Each change is a run of consecutive inserts and deletes, keyed by its first segment's id. Keep suggestion and decisions through applied, so the receipt can count them. Without decisions the pattern keeps its own.",
        ),
      ],
      [
        "onApply / onUndo / onDismiss",
        "(text, { start, end }) => void / () => void / () => void",
        t(
          "يسلّم onApply النص بعد التعديلات المقبولة وموضعه، ولا يتغيّر نص تطبيقك قبل ذلك. يظهر «تراجع» في الإيصال مع onUndo فقط، ويستدعي Escape الدالة onDismiss ويعيد التركيز إلى النص.",
          "onApply hands over the text with the accepted changes and its range; your app's text never changes before then. Undo shows in the receipt only with onUndo, and Escape calls onDismiss and returns focus to the text.",
        ),
      ],
      [
        "labels",
        "Partial<SuggestedEditsLabels>",
        t(
          "تستبدل أي نص مدمج، ومنه كلمات InlineDiff.",
          "Replaces any built-in text, InlineDiff's words included.",
        ),
      ],
    ],
    "image-generation": [
      [
        "prompt / options",
        "ReactNode · required / readonly { id, label }[]",
        t(
          "prompt وصف المستخدم للصورة بكلماته. وoptions ما طُلب معه، كالنسبة والأسلوب والعدد، وتظهر شرائح للقراءة فقط.",
          "prompt is the person's description of the image, in their own words. options is what was asked with it, such as ratio, style and count, shown as read-only chips.",
        ),
      ],
      [
        "status / progress",
        "queued | weaving | completed | failed | blocked · required / number | null?",
        t(
          "يقرّر تطبيقك الحالة. في queued وweaving تكون اللوحة نسّاجة: مع progress من 0 إلى 100 يتبع النسج النسبة، وبدونها يعبر مكّوك واحد الصفوف حتى تصل الصورة فيكتمل النسج في أقل من 1.2 ثانية. ومع الحركة المخفَّضة تظهر الصورة كاملة تدريجيًا في 200ms بلا حلقة. وتبقى النسخ والإجراءات معطّلة حتى completed.",
          "Your app owns the status. While queued or weaving the canvas is a loom: with progress from 0 to 100 the weave follows it; without, one shuttle crosses the rows until a picture arrives, and the weave then finishes in under 1.2 seconds. With reduced motion the picture fades in whole over 200ms and nothing loops. The versions and actions stay inert until completed.",
        ),
      ],
      [
        "images / selected / onSelectedChange",
        "readonly { id, src?, alt, width, height }[] · required / string? / (id: string) => void",
        t(
          "تُعرض النسخ مجموعة اختيار أصلية باسم «اختر نسخة»، وتُسمّى النسخة ١ والنسخة ٢ وهكذا. selected اختيارية، وبدونها يحتفظ النمط باختياره ويبدأ من الأولى. تحدّد width وheight شكل اللوحة قبل وصول الصورة، وتسمّي alt الصورة لقارئ الشاشة.",
          "The versions are a native radio group named «Choose a version», called Version 1, Version 2 and so on. selected is optional: without it the pattern keeps its own choice, starting at the first. width and height set the canvas's shape before the picture arrives, and alt names the image for assistive technology.",
        ),
      ],
      [
        "onUse / onVariations / onEditPrompt / onRetry",
        "(id) => void / (id) => void / () => void / () => void",
        t(
          "يستدعي «استخدم الصورة» الدالة onUse بمعرّف النسخة المختارة، و«تنويعات مشابهة» الدالة onVariations بالمعرّف نفسه، و«تعديل بالوصف» الدالة onEditPrompt. ويستدعي «أعد المحاولة» في عرض الإخفاق الدالة onRetry بعد أن ينقل التركيز إلى الصورة، فإن زالت الصورة وهي في التركيز انتقل التركيز إلى النمط.",
          "Use image calls onUse with the chosen version's id, Similar variations calls onVariations with the same id, and Edit with a description calls onEditPrompt. Try again in the failed view calls onRetry after moving focus to the figure; if the figure goes while it has focus, focus moves to the pattern.",
        ),
      ],
      [
        "blockedReason",
        "ReactNode?",
        t(
          "يعرضها عرض blocked، أي طلب رفضته سياسة المنتج، نصًّا ثابتًا مع «تعديل بالوصف». ولا يُعدّ الرفض فشلًا: الحالة «بانتظارك».",
          "Shown by the blocked view, a request that product policy refused, as persistent text beside Edit with a description. A refusal is not a failure: the status is Needs you.",
        ),
      ],
      [
        "agent / duration",
        "ReactNode? / number? (seconds)",
        t(
          "يقرأ الشريط السفلي «الوكيل · عدد الصور · المدة»، مثل «مصمّم الحملات · ٤ صور · ١٢ث». مرّر المدة مرة واحدة عند الاكتمال.",
          "The footer reads «agent · image count · time», such as «Campaign designer · 4 images · 12s». Pass the duration once, when it is done.",
        ),
      ],
      [
        "headingLevel / labels / appearance",
        '2 | 3 | 4 | 5 | 6 · 3 / Partial<ImageGenerationLabels> / "card" | "plain" · card',
        t(
          "استخدم plain داخل محادثة أو نمط آخر. وتستبدل labels أي نص مدمج.",
          "Use plain inside a conversation or another pattern. labels replaces any built-in text.",
        ),
      ],
    ],
    terminal: [
      [
        "command / output",
        "string? / string",
        t(
          "يعرض النص بأمان باتجاه LTR ويحفظ مسافاته كما هي. يجمع النسخ الأمر ثم سطرًا جديدًا ثم المخرجات.",
          "Safe whitespace-preserving LTR text. Copy joins command, newline and output; output alone if no command.",
        ),
      ],
      [
        "state / exitCode / duration",
        '"running" | "completed" | "failed" / number? / string?',
        t(
          "تمرّر هذه القيم من تطبيقك. لا ينفّذ المكوّن الأوامر ولا يقيس الوقت.",
          "Application-supplied presentation; no execution or timing.",
        ),
      ],
      [
        "label / labels",
        "string / InputCopyLabels",
        t(
          "يعرض label عنوانًا ظاهرًا ويسمّي منطقة التمرير. تخصّص labels نصوص النسخ والفشل التي يقرؤها قارئ الشاشة.",
          "Visible title, named scroll region and accessible copy feedback.",
        ),
      ],
      [
        "followOutput / className",
        "boolean / string",
        t(
          "فعّل followOutput لمتابعة المخرجات الجديدة حين يكون المستخدم قرب النهاية، دون أن يفقد النص الذي حدّده.",
          "Opt-in near-bottom following respects selection; internal keyboard scrolling.",
        ),
      ],
    ],
    "chat-app": [
      [
        "conversations / activeConversationId",
        "ChatConversationItem[] / string | null",
        t(
          "مرّر المحادثات من تطبيقك بمعرّفات فريدة ثابتة وعناوينها. تجتمع المحادثات التي تشترك في group تحت عنوان واحد بترتيب ظهورها الأول، وتبقى غير المجمّعة تحت عنوان القائمة.",
          "Host-owned unique stable IDs and titles. Conversations that share a group sit under one heading, in first-seen order; ungrouped ones stay under the list's own heading.",
        ),
      ],
      [
        "onConversationSelect / onNewConversation",
        "(id: string) => void / () => void",
        t(
          "مرّر الدالتين، فكلتاهما مطلوبة. بعد الاختيار أو الإنشاء يُغلق التنقّل على الجوال ويعود التركيز.",
          "Required host callbacks; mobile navigation dismisses and restores trigger focus.",
        ),
      ],
      [
        "onConversationRename / onConversationDelete",
        "(id: string) => void · optional",
        t(
          "مع أيٍّ منهما يحصل كل صف على قائمة «خيارات {العنوان}» فيها «إعادة التسمية» و«حذف». هما نيّتان فقط: يتولّى تطبيقك حقل الاسم والتأكيد، ويغلق اختيار إحداهما لوحة التنقّل على الجوال.",
          "With either, each row gets an options menu with Rename and Delete. They are intents only: your app owns the rename field and the confirmation, and on a phone choosing one closes the sheet.",
        ),
      ],
      [
        "children / composer / toolbar / actions",
        "ReactNode / ReactNode / ReactNode? / ReactNode?",
        t(
          "ركّب داخلها ChatThread وأنماط المساعد رسائل بمظهر plain، وTaskStarter بمظهر plain محرّرًا. تقع toolbar وactions في نهاية الترويسة، وactions بعد toolbar. يتولّى تطبيقك الحالة والإلغاء.",
          "Put ChatThread inside, with the assistant's patterns as messages in plain appearance, and Start a task in plain appearance as the composer. toolbar and actions sit at the header's end, actions last. Host owns state and cancellation; key the thread and composer by conversation ID.",
        ),
      ],
      [
        "sidePanel",
        "ReactNode?",
        t(
          "لوحة جانبية (aside) في نهاية السطر لأدلة أو مسودة أو تفاصيل مهمة، وتتمرّر وحدها. تنزل تحت المحادثة حين يقلّ عرض الحاوية عن 960px. يسمّيها labels.sidePanel، والاسم الافتراضي «التفاصيل».",
          "An aside at the inline end for evidence, a draft or a task's details; it scrolls on its own and moves under the conversation when the container is narrower than 960px. labels.sidePanel names it (Details by default).",
        ),
      ],
      [
        "brand / title / labels / className",
        "ReactNode? / string? / ChatAppLabels? / string?",
        t(
          "الهوية والعنوان والتسميات اختيارية، ولا يظهر شيء للهوية إن لم تمرّرها. يُستخدم Sheet حين لا يتجاوز عرض الحاوية 640px.",
          "Optional identity, title and labels; nothing shows for brand unless you pass it. Existing Sheet at container widths up to 640px. Bound shell height; thread, navigation and side panel scroll independently.",
        ),
      ],
    ],
    "ask-user-questions": [
      [
        "questions",
        "readonly UserQuestion[] · required",
        t(
          "يدعم سؤال الاختيار الواحد مع خيار «أخرى» اختياري، أو سؤالًا نصيًا فقط. استخدم معرّفات فريدة وثابتة.",
          "Single choice with optional Other, or text only. Unique stable IDs; choice values are unique and reserve other.",
        ),
      ],
      [
        "value / onValueChange",
        "QuestionAnswers / (answers) => void · required",
        t(
          "يدير تطبيقك المسودات، ويستطيع المستخدم تعديل إجاباته حتى يرسلها.",
          "Controlled drafts keyed by question ID; answers remain editable before submission.",
        ),
      ],
      [
        "onSubmit",
        "(answers, {signal}) => void | Promise<void> · required",
        t(
          "يستقبل الإجابات الفعلية. إذا فشل الإرسال تبقى المسودة كما هي. يتولّى تطبيقك التحقق.",
          "Receives actual answers. Failure preserves drafts; required validation focuses the first incomplete question. Host validates independently.",
        ),
      ],
      [
        "label / submitLabel / resetKey / className",
        "string? / string? / string | number? / string?",
        t(
          "يسمّي label النموذج، وتُكتب التسميات بلغتك. تغيير resetKey أو الأسئلة يلغي أي عمل معلّق.",
          "Form name and submit label; reset or schema replacement aborts pending work. Host resets controlled drafts explicitly.",
        ),
      ],
      [
        "appearance / headingLevel",
        '"card" | "plain" · card / 2 | 3 | 4 | 5 | 6 · 3',
        t(
          "تضع card الأسئلة على صينية بعرض أقصاه 38rem، وتتركها plain على سطح تطبيقك. يحدد headingLevel مستوى عنوان السؤال.",
          "card sits on a tray up to 38rem wide; plain lives on your app's paper. headingLevel sets the question heading's level.",
        ),
      ],
      [
        "labels / agent",
        "Partial<AskUserQuestionsLabels> / ReactNode",
        t(
          "تستبدل labels أي نص مدمج: التنقل والحالة والخطأ وتلميح المفاتيح. ويسمّي agent الوكيل الذي يسأل في الرأس.",
          "labels replaces any built-in text: navigation, status, error and the key hint. agent names the asking agent in the header.",
        ),
      ],
      [
        "onSkip / receipt / onEditAnswers",
        "() => void / boolean / () => void",
        t(
          "يضيف onSkip زر «تخطّي الأسئلة». ومع receipt تُطوى الإجابات التي قبلها تطبيقك في «إجاباتك»، ويضيف onEditAnswers زر «تعديل الإجابات».",
          "onSkip adds Skip questions. With receipt, the answers your app accepted fold into Your answers; onEditAnswers adds Edit answers.",
        ),
      ],
      [
        "answered",
        "boolean",
        t(
          "مع receipt تظهر الأسئلة من البداية على هيئة «إجاباتك» مبنيّة من value، لأن تطبيقك يملك الإجابات أصلًا، فلا يُرسل شيء ولا يُعلَن شيء.",
          "With receipt, the questions mount straight into Your answers, built from value: your app already holds the answers, so nothing is submitted or announced.",
        ),
      ],
      [
        "keyboard",
        "native radios / Tab / Enter / Ctrl+Enter",
        t(
          "تعمل الأسهم كما في أزرار الاختيار الأصلية، وتعمل الأرقام ١–٩ داخل البطاقة. يرسل Ctrl+Enter أو ⌘+Enter النص.",
          "Native radio arrows; 1–9 within the card. Enter submits; Ctrl/Command+Enter submits from the textarea. No automatic advance.",
        ),
      ],
    ],
    "approval-card": [
      [
        "request",
        "ApprovalRequest · required",
        t(
          "مرّر معرّفًا ثابتًا والإجراء وهدفه وعواقبه، مع تسميات صريحة للموافقة والرفض.",
          "Stable ID, concrete action, target, verbatim consequences, approveLabel and rejectLabel.",
        ),
      ],
      [
        "onDecision",
        "(request, decision, { signal }) => void | Promise<void>",
        t(
          "يبلّغ بالقرار فقط. انتظار الوعد لا يعني تنفيذ الإجراء. إذا فشل، تبقى التفاصيل والتركيز في مكانهما.",
          "Reports a decision only. Promise acceptance does not imply execution. Failure preserves details and focus.",
        ),
      ],
      [
        "value / resetKey",
        "ApprovalRecord | null / string | number",
        t(
          "يدير تطبيقك value، ويرتبط السجل ببصمة محتوى الطلب. تغيير resetKey يلغي الاستدعاءات المعلّقة.",
          "Optional controlled record binds requestId and approvalRequestKey; reset aborts pending callbacks.",
        ),
      ],
      [
        "host responsibilities",
        "identity / authorization / execution",
        t(
          "يتحقق تطبيقك من كل منها بنفسه، ويحترم AbortSignal عند تغيير الطلب أو إزالة المكوّن.",
          "Host validates each independently and honors AbortSignal on replacement/unmount. No ongoing permissions.",
        ),
      ],
      [
        "impact / irreversible",
        "readonly { id, label, value?, note? }[] / boolean | ReactNode",
        t(
          "يعرض impact في جدول من يتأثر مع المبالغ. وتُظهر irreversible ملاحظة بلون الانتباه، وتلغي اختصار الموافقة.",
          "impact lists who is affected, with amounts, in a table. irreversible shows a note in the attention color and removes the approve shortcut.",
        ),
      ],
      [
        "reversible",
        "boolean",
        t(
          "يتيح Ctrl أو Cmd+Enter للموافقة بعد نصف ثانية من ظهور الطلب، ما لم يكن irreversible أيضًا. ويرفض Escape دائمًا.",
          "Lets Ctrl or Cmd+Enter approve, half a second after the request appears, unless it is also irreversible. Escape always rejects.",
        ),
      ],
      [
        "expiryLabel / expired",
        "ReactNode / boolean",
        t(
          "يمرّر تطبيقك نص المهلة، ولا تشغّل البطاقة ساعة. وحين يمرّر expired تحل محل الإجراءات «انتهت مهلة الطلب»، ويُلغى أي قرار قيد التسجيل.",
          "Your app supplies the expiry text; the card runs no clock. expired replaces the actions with Request expired and aborts a decision in flight.",
        ),
      ],
      [
        "secondaryAction / receiptTime",
        "{ label, onSelect } / ReactNode",
        t(
          "إجراء أوسط اختياري بين الرفض والموافقة، مثل عرض الرسائل، ووقت يكتبه تطبيقك بعد «تمت الموافقة».",
          "An optional middle action between reject and approve, such as viewing the messages, and host-formatted time after Approved.",
        ),
      ],
      [
        "appearance / headingLevel / labels",
        '"card" | "plain" · card / 2 | 3 | 4 | 5 | 6 · 3 / Partial<ApprovalCardLabels>',
        t(
          "استخدم plain داخل نمط آخر مثل مهمة الوكيل. وتستبدل labels أي نص مدمج.",
          "Use plain inside another pattern, such as Agent task. labels replaces any built-in text.",
        ),
      ],
      [
        "className",
        "string?",
        t(
          "يضيف فئة CSS، وتبقى إعدادات طِراز المشتركة سارية.",
          "Additional class; shared Tiraz configuration applies.",
        ),
      ],
    ],
    "approval-flow": [
      [
        "label / requests",
        "string / readonly ApprovalRequest[] · required",
        t(
          "مرّر من تطبيقك سلسلة قصيرة من الطلبات بمعرّفات فريدة.",
          "A short application-owned sequence with unique stable request IDs.",
        ),
      ],
      [
        "onDecision",
        "ApprovalCardProps[onDecision] · required",
        t(
          "لا ينتقل التسلسل إلى الطلب التالي حتى يقبل تطبيقك القرار.",
          "Advances only after host acceptance. Each request requires a fresh decision.",
        ),
      ],
      [
        "value / onValueChange",
        "readonly ApprovalRecord[] / (records) => void",
        t(
          "مرّرهما إن أردت أن يدير تطبيقك السجلات. يرتبط كل سجل بمعرّف الطلب وبصمة محتواه.",
          "Optional controlled records bind requestId and approvalRequestKey. Changed requests reopen; unchanged records survive append/reorder. Publish records in onValueChange.",
        ),
      ],
      [
        "approval",
        "(request) => ApprovalDetails | undefined",
        t(
          "ما تعرضه بطاقة كل طلب فوق الطلب نفسه: الأثر وعدم إمكان التراجع وإمكانه والمهلة.",
          "What each request's card shows beyond the request: impact, irreversibility, reversibility and expiry.",
        ),
      ],
      [
        "labels / headingLevel / appearance",
        'Partial<ApprovalFlowLabels> / 2 | 3 | 4 | 5 | 6 · 3 / "card" | "plain" · card',
        t(
          "تصل أرقام position منسّقة بحسب إعداد الأرقام. وتضع card السلسلة كلها على صينية واحدة، وبطاقتها مدمجة داخلها.",
          "position receives digits already formatted for the numerals setting. card puts the whole sequence on one tray, its card plain inside.",
        ),
      ],
      [
        "resetKey / className",
        "string | number? / string?",
        t(
          "تغيير resetKey يلغي القرار المعلّق. إن كان تطبيقك يدير السجلات فامسحها أيضًا.",
          "Reset cancels pending work; hosts also clear controlled records. The host independently validates identity, authorization and execution.",
        ),
      ],
    ],

    "selection-actions": [
      [
        "children / label",
        "ReactNode / string · required",
        t(
          "يحدد children نطاقًا صريحًا للمحتوى يستقبل التركيز. لا يعمل داخل المحررات والكود والروابط والأزرار، ولا مع تحديد يتجاوز النطاق.",
          "Explicit focusable content scope; excludes editors, code, links, buttons and cross-scope selection.",
        ),
      ],
      [
        "actions",
        "readonly SelectionAction[] · required",
        t(
          "لكل إجراء id وlabel وonSelect(text, { start, end })، وicon وdisabled اختياريان. يحدّد start وend موضع النص المحدّد في نص النطاق. يظهر أول إجراءين، ثم زر «المزيد».",
          "id, label and onSelect(text, { start, end }), where start and end place the selection in the scope's text; optional icon/disabled. First two actions then More.",
        ),
      ],
      [
        "focus / dismissal",
        "Alt+Enter / arrows / Escape",
        t(
          "لا يأخذ الشريط التركيز وحده. ينقل Alt+Enter التركيز إلى الإجراءات، ويعيده Escape إلى النطاق. يُغلق الشريط عند التمرير أو تغيير الحجم، ويبقى النص المحدد عند تنفيذ إجراء.",
          "No focus stealing; Alt+Enter moves to actions, Escape returns to scope. Scroll/resize dismiss. Selected text survives activation.",
        ),
      ],
      [
        "labels / className",
        "localized strings / string",
        t(
          "تترجم labels نصوص الإجراءات وزر «المزيد» والتلميح. أضف data-selection-actions-exclude لاستثناء منطقة أخرى.",
          "Action, more/less and hint labels. data-selection-actions-exclude excludes another region.",
        ),
      ],
    ],
    "context-meter": [
      [
        "used / capacity",
        "number | null?",
        t(
          "مرّر أرقامًا محدودة غير سالبة. تُعرض القيمة المفقودة أو غير الصالحة على أنها غير متاحة، والصفر ليس قيمة مفقودة. يظهر تجاوز السعة بوضوح.",
          "Finite nonnegative host values; missing/invalid is unavailable, zero remains zero. Over-capacity stays explicit.",
        ),
      ],
      [
        "estimated / details / metadata",
        "boolean / ContextMeterPart[] / string",
        t(
          "يُوسَم التقدير بنص يوضّح أنه تقديري. التفاصيل اختيارية بمعرّفات ثابتة. لا يقدّر المكوّن الأرقام ولا يبحث عن الحدود ولا يقتطع المحتوى.",
          "Estimates are labeled. Optional details with stable IDs; no estimation, limit lookup or truncation.",
        ),
      ],
      [
        "label / unit / locale / className",
        "string?",
        t(
          "اكتب تسمية واضحة. تعرض التفاصيل الأرقام الدقيقة، ويفتحها ملخص موجز عبر زر يعمل بلوحة المفاتيح.",
          "Clear name and full values in details; compact summary uses a keyboard-accessible disclosure button.",
        ),
      ],
      [
        "thresholds / open / onOpenChange",
        "{ high?, near? } · 0.8, 0.95 / boolean? / (open) => void",
        t(
          "تحدّد thresholds نسبة السعة التي تنتقل عندها الحالة إلى «يقترب من الامتلاء» ثم «شبه ممتلئ»، ويبقى تجاوز السعة فوق ١ دائمًا. مرّر open مع onOpenChange لتتحكم في التفاصيل من تطبيقك.",
          "thresholds sets the share of capacity where the status moves to Filling up and then Near capacity; over capacity is always above 1. Pass open with onOpenChange to hold the details from your app.",
        ),
      ],
    ],
    "model-selector": [
      [
        "models / value / onValueChange",
        "ModelOption[] / string / (id) => void · required",
        t(
          "يدير تطبيقك الاختيار. استخدم معرّفات فريدة ثابتة غير فارغة، وحدّث value من تطبيقك.",
          "Controlled choice; unique nonempty stable IDs; host updates value.",
        ),
      ],
      [
        "ModelOption",
        "id, name, provider?, description?, tags?, context?, price?, disabled?",
        t(
          "تأتي كل البيانات من تطبيقك. تبقى الخيارات غير المتاحة ظاهرة لكنها معطّلة. لا يحتاج المكوّن مفاتيح ولا يتصل بأي مزوّد.",
          "All data comes from the host; unavailable options remain visible and disabled. No keys or provider connection.",
        ),
      ],
      [
        "label / placeholder / disabled / size / className",
        "string? / string? / boolean / sm | md / string",
        t(
          "يفتح زر موجز القائمة. تنقّل بالأسهم وHome/End أو بالكتابة للبحث، ويعيد Escape التركيز إلى الزر.",
          "Compact trigger; arrows, Home/End, typeahead and Escape with focus restoration.",
        ),
      ],
      [
        "labels",
        "{ unavailable? }",
        t(
          "الكلمة التي تظهر بجوار نموذج لا يمكن اختياره، «غير متاح» افتراضيًا. تُقرأ أيضًا في وصف الخيار.",
          "The word beside a model that cannot be chosen, «Unavailable» by default. It is also read in the option's description.",
        ),
      ],
    ],
    "image-result": [
      [
        "progress",
        "number | null? · 0–100",
        t(
          "مرّر نسبة التقدم الفعلية من تطبيقك. دون قيمة يظهر تحميل غير محدّد. لا تُنهي النسبة التحميل تلقائيًا.",
          "Real application-supplied percentage; omit/null for indeterminate loading. Progress never completes loading automatically.",
        ),
      ],
      [
        "src / alt",
        "string? / string · required",
        t(
          "مرّر الصورة من تطبيقك مع وصف بديل مفيد.",
          "Application-owned image and meaningful alt text.",
        ),
      ],
      [
        "state / aspectRatio",
        "loading | loaded | error / landscape | square | portrait",
        t(
          "يبقى حجم الإطار ثابتًا. إذا فشل المتصفح في تحميل الصورة يزول الخطأ عند تغيير src.",
          "Stable frame; browser failures recover on source replacement.",
        ),
      ],
      [
        "caption / metadata",
        "string?",
        t(
          "مرّر التعليق والبيانات من تطبيقك.",
          "Application-supplied caption and metadata.",
        ),
      ],
      [
        "onRetry / action",
        "() => void / {label, onClick}",
        t(
          "لا تظهر الأزرار إلا إذا ربطتها بسلوك فعلي. يظهر action بعد تحميل الصورة فقط.",
          "Only connected behavior; action appears after the image loads.",
        ),
      ],
      [
        "labels / native figure",
        "ImageResultLabels / HTML attributes",
        t(
          "خصّص التسميات وسمات إطار figure. لا يرفع المكوّن صورًا ولا يولّدها.",
          "Localized labels and native figure attributes; no upload or generation.",
        ),
      ],
    ],
    sources: [
      [
        "items",
        "SourceReference[]",
        t(
          "لكل مصدر id وnumber ثابتان وtitle، أما href والوصف والبيانات فاختيارية.",
          "Stable id and number; title, optional href, description and metadata.",
        ),
      ],
      [
        "defaultExpanded / expanded / onExpandedChange / labels",
        "boolean / boolean? / (expanded: boolean) => void / SourcesLabels",
        t(
          "يعرض صفًا موجزًا يفتح قائمة المصادر، وقيمة defaultExpanded الافتراضية false. تحكّم في القائمة بالزوج expanded وonExpandedChange.",
          "Compact summary expands to rows; defaults false. Control the list with the expanded pair.",
        ),
      ],
      [
        "highlightedId",
        "string?",
        t(
          "يعلّم صف المصدر الذي تُعرض معاينة استشهاده.",
          "Marks the row of the source whose citation is being previewed.",
        ),
      ],
      [
        "InlineCitation.source / mode / onOpenChange",
        "SourceReference / disclosure | link | preview / (open: boolean) => void",
        t(
          "مرّر كائن المصدر نفسه. يعرض وضع disclosure التفاصيل بزر، وينتقل وضع link برابط أصلي. وضع preview رابط يعرض المصدر عند المرور أو التركيز: يفتحه Enter أو النقر، ويغلقه Escape أو فقدان التركيز، وتبقى المعاينة مفتوحة إذا انتقل المؤشر إليها. إذا رُفضت الوجهة صار زرًا يعرض المعاينة عند التركيز أو النقر. وتفتح لمسةٌ على شاشة لمس بطاقة المصدر بدل اتباع الرابط: نافذة باسم المصدر فيها رابط «فتح المصدر» إن قُبلت الوجهة، تغلقها لمسة ثانية أو لمسة خارجها أو Escape.",
          "Same source record; button disclosure or native link navigation. preview is a link that shows the source on hover or focus: Enter or click opens it, Escape or blur closes it, and the pointer moving onto it keeps it open. If the destination is rejected it is a button that shows the preview on focus or click. A tap on a touch screen opens the source's card instead of following the link: a dialog named by the title, with an «Open source» link when the destination is accepted, closed by a second tap, a tap outside or Escape.",
        ),
      ],
      [
        "URL restrictions",
        "HTTP(S) / local relative / fragment",
        t(
          "تُرفض البروتوكولات الأخرى والمسارات الشبكية والشرطات العكسية. إذا لم تتوفر وجهة صالحة يظهر المصدر نصًا عاديًا.",
          "Other protocols, network paths and backslashes rejected; unavailable destinations remain text.",
        ),
      ],
      [
        "Popup / focus",
        "@radix-ui/react-popover 1.3.1",
        t(
          "تنفتح النافذة عند التفعيل داخل أقرب حوار، ويعيد Escape التركيز.",
          "Opens on activation; scoped to nearest dialog; Escape restores focus.",
        ),
      ],
    ],
    "insight-cards": [
      [
        "items",
        "InsightItem[]",
        t(
          "لكل نتيجة id وtitle، أما details وlabel وtone وaction فاختيارية.",
          "id and title; optional details, label, tone and action.",
        ),
      ],
      [
        "Selection",
        "stable item ID",
        t(
          "تعرض نتيجة واحدة مع زرّي السابق والتالي. تبقى النتيجة المختارة كما هي إذا تغيّر الترتيب.",
          "One finding with previous/next; selection survives reordering.",
        ),
      ],
      [
        "details / action",
        "ReactNode / {label, onClick}",
        t(
          "مرّر محتوى موجزًا وسلوكًا من تطبيقك. لا يولّد المكوّن أي محتوى.",
          "Concise host-owned content and behavior; no generation.",
        ),
      ],
      [
        "tone",
        "BadgeTone · neutral",
        t(
          "استخدم لونًا دلاليًا فقط حين تبرّره البيانات ويظهر label معه.",
          "Semantic Badge tone only when supplied evidence justifies a label.",
        ),
      ],
      [
        "headingLevel",
        "2 | 3 | 4 | 5 | 6 · 3",
        t(
          "مستوى عنوان النتيجة، فاجعله تابعًا لما قبله في صفحتك.",
          "The level of the finding's title; set it to follow the heading before it on your page.",
        ),
      ],
      [
        "labels / className",
        "InsightCardsLabels / string",
        t(
          "تترجم نصوص العنوان والتنقل والموضع والحالة الفارغة.",
          "Title, navigation, position and empty-state labels.",
        ),
      ],
    ],

    "code-block": [
      [
        "code",
        "string · required",
        t(
          "مرّر الكود كاملًا. يُنسخ كما هو بمسافاته.",
          "Exact supplied source, including whitespace; copied verbatim.",
        ),
      ],
      [
        "language / label",
        "string? / string?",
        t(
          "يحدد language لغة التلوين، وlabel عنوان ظاهر اختياري. اللغة الافتراضية نص عادي.",
          "Highlight language and optional visible header/region name; defaults to Text.",
        ),
      ],
      [
        "labels",
        "InputCopyLabels?",
        t(
          "خصّص copy وcopied وfailure. يظهر النجاح علامة صح مع إعلان لقارئ الشاشة فقط.",
          "copy, copied and failure overrides; check-only success with a polite announcement.",
        ),
      ],
      [
        "Languages",
        "JS / TS / JSON / Python / Bash",
        t(
          "الأسماء المختصرة للغات موثّقة في حزمة ai. تظهر اللغات غير المدعومة نصًا عاديًا. يُعرض الكود باتجاه LTR ويتمرّر داخليًا بلوحة المفاتيح.",
          "Aliases documented in ai/; unsupported languages stay plain. Code is LTR with internal keyboard scrolling.",
        ),
      ],
      [
        "Native attributes / ref",
        "div",
        t(
          "يقبل className وstyle. ليس محررًا ولا ينفّذ الكود.",
          "className/style and React 19 ref; no editor or execution.",
        ),
      ],
    ],
    markdown: [
      [
        "text",
        "string · required",
        t(
          "يعرض نص CommonMark مع GFM: الفقرات والعناوين والقوائم والروابط والاقتباسات والتأكيد والكود والجداول.",
          "CommonMark plus GFM: paragraphs, headings, lists, links, quotes, emphasis, inline/fenced code and tables.",
        ),
      ],
      [
        "Parser / dependencies",
        "react-markdown 10.1.0 + remark-gfm 4.0.1",
        t(
          "يعتمد على محلل مُصان وإضافة GFM للجداول والنص المشطوب. ثبّت الحزمتين عند نسخ المصدر.",
          "Maintained React parser plus the GFM plugin for tables/strikethrough; install both when copying source.",
        ),
      ],
      [
        "HTML / URLs",
        "skipHtml + defaultUrlTransform",
        t(
          "لا يعرض HTML، ويرفض بروتوكولات javascript وdata وvbscript وfile. تظهر الروابط المرفوضة نصًا، والصور وصفها البديل. يقرّر تطبيقك أي الوجهات موثوقة.",
          "Raw HTML discarded; javascript, data, vbscript and file protocols rejected. Unsafe links become text; images become alt text. Host owns destination trust.",
        ),
      ],
      [
        "renderCitation / links",
        '(marker: number) => ReactNode / "default" | "strict" · default',
        t(
          'يتحوّل كل رقم في علامة [n] أو [n, m] أو [n، m]، بأرقام لاتينية أو عربية هندية أو فارسية، إلى renderCitation(n) مرةً لكل رقم، وتصير المجموعة عُقدًا متجاورة. يبقى الكود كما هو، وتبقى العلامة نصًا إذا لم تُرجع الدالة شيئًا لأحد أرقامها. يمرّر links="strict" الروابط والصور عبر sourceHref فلا يبقى إلا http وhttps والنسبي والجزء.',
          'Each number in an [n], [n, m] or [n، m] marker, in ASCII, Arabic-Indic or Persian digits, becomes renderCitation(n), once per number, a group as adjacent nodes; code is left alone, and a marker stays text if the function returns nothing for any of its numbers. links="strict" sends links and images through sourceHref, so only http, https, relative and fragment targets survive.',
        ),
      ],
      [
        "Code / tables",
        "CodeBlock / Table",
        t(
          "يبقى الكود باتجاه LTR، وتتمرّر الجداول الدلالية داخليًا. لا تضمينات ولا تنفيذ.",
          "Code stays LTR; semantic tables scroll internally. No embeds or execution.",
        ),
      ],
      [
        "Native attributes / ref",
        "div",
        t(
          "يدعم className وstyle وref.",
          "Supports className, style and React 19 ref.",
        ),
      ],
    ],
    "chat-thread": [
      [
        "messages",
        "ChatMessage[] · required",
        t(
          "لكل رسالة معرّف فريد ثابت ودور user أو assistant ومحتوى ReactNode. يمكنك تمرير identity وavatar وactions من تطبيقك. وتأخذ status بإحدى القيم streaming وcompleted وstopped وfailed: تكتب الرسالة الموقوفة «أُوقف الرد»، وتعرض الفاشلة error نصًا دائمًا مع «أعد المحاولة» تستدعي onRetry.",
          "Unique stable id, user/assistant role and ReactNode content; optional host-supplied identity, avatar and actions. status is streaming, completed, stopped or failed: a stopped message says so, and a failed one keeps error as text with Retry calling onRetry.",
        ),
      ],
      [
        "ChatThreadMessage",
        "{ message: ChatMessage } · article props",
        t(
          "يرسم رسالة واحدة كما يرسمها ChatThread، ويعمل خارج أي محادثة. تتبع data-status قيمة status.",
          "Draws one message the way ChatThread does, and works outside a thread. Its data-status follows status.",
        ),
      ],
      [
        "followOutput / label",
        "boolean · false / string?",
        t(
          "يسمّي label منطقة التمرير. يتابع followOutput الرسائل الجديدة فقط حين يكون المستخدم على بعد 48px من النهاية. افتراضيًا يتولّى تطبيقك التمرير. لا يُعلن الرد كاملًا لقارئ الشاشة.",
          "Named scroll region; opt-in following only within 48px of the bottom. Host scrolling by default. No response-wide live announcements.",
        ),
      ],
      [
        "Native attributes / ref",
        "div",
        t(
          "يحدد تطبيقك الارتفاع وحدود التمرير. لا يخزّن المكوّن الرسائل ولا يدير المحادثات.",
          "Host sets height/scroll bounds; no persistence or conversation orchestration.",
        ),
      ],
    ],
    "chat-composer": [
      [
        "value / onValueChange / onSubmit",
        "string / (string) => void / (string) => void | Promise<void> · required",
        t(
          "يدير تطبيقك القيمة بالكامل: يقبل الإرسال ثم يمسح value. يُمنع إرسال المسافات وحدها، ويبقى النص الصحيح كما هو. إذا فشل الإرسال تبقى المسودة والتركيز.",
          "Fully controlled. Host accepts submission and clears value. Whitespace-only input is blocked; valid text is unchanged. Failure keeps draft and focus.",
        ),
      ],
      [
        "Keyboard / IME",
        "Enter / Shift+Enter",
        t(
          "يرسل Enter، ويضيف Shift+Enter سطرًا جديدًا. تمنع أحداث composition وisComposing وkeyCode 229 الإرسال أثناء الكتابة بـ IME.",
          "Enter sends; Shift+Enter adds a newline. Composition events, isComposing and keyCode 229 guard IME submission.",
        ),
      ],
      [
        "state / onStop",
        '"idle" | "submitting" | "streaming" · idle / (() => void)?',
        t(
          "يحدد تطبيقك state. يُمنع تكرار الإرسال ما دام الوعد معلّقًا. في حالة streaming يظهر زر الإيقاف فقط إذا مرّرت onStop. يستطيع المستخدم تحرير المسودة أثناء ذلك.",
          "Host state; pending promises block duplicate sends. Streaming shows Stop only with a callback. Draft remains editable during activity.",
        ),
      ],
      [
        "label / labels / disabled",
        "string? / ChatEntryLabels? / boolean",
        t(
          "خصّص الأسماء بلغتك عبر labels.send وstop وfailure. يتمدد الحقل حتى 160px ثم يتمرّر داخليًا.",
          "Localized overridable names; labels.send, stop, failure. Entry grows to 160px then scrolls internally.",
        ),
      ],
      [
        "tools / compact / appearance",
        '{ start?, end? } / boolean · false / "card" | "plain" · card',
        t(
          "يضع tools أدواتك في صف تحت الحقل: start ثم مساحة مرنة ثم end ثم زر الإرسال أخيرًا. يعطي compact حدّ PromptBar. ويُسقط plain الظل العائم ليسكن الحقل داخل سطح آخر.",
          "tools puts your controls on a row under the text area: start, a flexible space, end, and send last. compact gives PromptBar's limit. plain drops the floating shadow, for an entry inside another surface.",
        ),
      ],
      [
        "Native attributes / ref",
        "textarea",
        t(
          "يشير ref إلى textarea، ويُطبَّق className وstyle على الجذر. يتبع اتجاه الإدخال النظام افتراضيًا، ويمكنك تغييره بـ dir. في RTL يبدأ المؤشر من اليمين حتى لو كان النص إنجليزيًا.",
          "Ref targets textarea; className/style target wrapper. Entry direction defaults to the system; native dir overrides it. RTL starts on the right, including English drafts.",
        ),
      ],
    ],
    "prompt-bar": [
      [
        "Entry / submission",
        "ChatComposerProps",
        t(
          "يعمل مثل ChatComposer: يدير تطبيقك القيمة، ويُحمى الإرسال أثناء IME، ويتبع اتجاه النظام، فيبدأ المؤشر من اليمين في RTL. حقل مدمج لبدء مهمة، حدّه 80px.",
          "Same controlled submission, IME guards and system direction; RTL starts on the right. Compact task entry bounded to 80px. Shares the entry engine.",
        ),
      ],
      [
        "suggestions / onSuggestionSelect",
        "(string | { id, label, prompt?, icon? })[]? / (string) => void",
        t(
          "إذا مرّرت suggestions فمرّر onSuggestionSelect أيضًا، ثم املأ الحقل أو أرسل صراحةً من تطبيقك. يصلك prompt الاقتراح، أو تسميته إن لم يكن له prompt. تظهر الاقتراحات حين يكون الحقل فارغًا فقط.",
          "Supplying suggestions requires the callback; host explicitly populates or submits. It receives the suggestion's prompt, or its label without one. Shown only with an empty value.",
        ),
      ],
      [
        "Host boundaries",
        "No model/upload/history/queue",
        t(
          "لا أدوات للزينة ولا تنفيذ داخلي. يتولّى تطبيقك الإرسال والإيقاف.",
          "No decorative tools or internal execution; host owns submission and cancellation.",
        ),
      ],
    ],
    "streaming-text": [
      [
        "text / state",
        'string / "streaming" | "completed" | "stopped" | "failed" · required',
        t(
          "مرّر النص الحالي وحالته من تطبيقك. يظهر كل تحديث فورًا دون طابور كتابة. يبقي stopped وfailed ما وصل من النص، ويزيلان المؤشر والحركة، ويعلنان «أُوقف الرد» أو «تعذّر إكمال الرد».",
          "Current host-supplied text and state. Updates render immediately without a typing queue. stopped and failed keep what arrived, end the cursor and the motion, and announce «Response stopped» or «Couldn't finish the response».",
        ),
      ],
      [
        "markdown",
        "boolean · false",
        t(
          "يعرض النص عبر Markdown. تبقى أسوار الكود والصياغة غير المكتملة مؤقتة، ويُعاد تحليلها مع كل قطعة جديدة.",
          "Reuses Markdown; unfinished fences and syntax remain provisional and reparse on every update.",
        ),
      ],
      [
        "statusLabel / announcement",
        'string? / "polite" | "off" · polite',
        t(
          "يعلن حالة موجزة لا كل حرف. عند الإلغاء أبقِ النص واضبط state على stopped، وعند الفشل اضبطها على failed. ويستبدل statusLabel الجملة المعلنة.",
          "Concise status without character announcements. On cancel retain text and set state to stopped; on failure set failed. statusLabel replaces the announced sentence.",
        ),
      ],
      [
        "renderCitation / links",
        '(marker: number) => ReactNode / "default" | "strict"',
        t(
          "في وضع markdown فقط: تعمل كما في Markdown، فتصير كل علامة، [n] أو مجموعة بأي أرقام، استشهادات وتُفلتر الروابط عبر sourceHref عند strict.",
          "In markdown mode only: they work as in Markdown, so each marker, [n] or a group in any digits, becomes citations and links go through sourceHref when strict.",
        ),
      ],
      [
        "Reveal / motion",
        "360ms / reduced motion",
        t(
          "تظهر الكلمات بحركة خفيفة ومعها مؤشر كتابة ما دام الرد يصل تباعًا. مع تقليل الحركة يظهر التحديث فورًا. لا مؤقت داخلي ولا اتصال بنموذج.",
          "Brief word blur and a trailing cursor only while streaming; reduced motion shows updates immediately. No internal timer or model connection.",
        ),
      ],
      [
        "Host responsibilities",
        "text / transport / cancellation",
        t(
          "يتولّى تطبيقك النقل والأخطاء والحدود والإلغاء. قد تغيّر إعادة تحليل الصياغة غير المكتملة بنية العقد المتأثرة فقط.",
          "Host owns transport, errors, limits and cancellation. Reinterpreting partial Markdown may replace affected nodes; settled nodes stay stable.",
        ),
      ],
      [
        "Native attributes / ref",
        "div",
        t(
          "يدعم className وstyle وref.",
          "Supports className, style and React 19 ref.",
        ),
      ],
    ],

    "loading-state": [
      [
        "label / description",
        "string / string?",
        t(
          "label مطلوب، وdescription اختياري.",
          "Required label and optional description.",
        ),
      ],
      [
        "variant / elapsedMs",
        '"drive" | "dots" | "orbit" · drive / number?',
        t(
          "يعرض شبكة بكسلات صغيرة. مرّر الوقت المنقضي بالمللي ثانية من تطبيقك، فلا ساعة داخلية في المكوّن.",
          "Compact pixel grid and host-supplied elapsed milliseconds; no internal clock.",
        ),
      ],
      [
        "indicator",
        '"spinner" | "skeleton" · spinner',
        t(
          "باقٍ للتوافق: يختار spinner شبكة البكسلات، ويعرض skeleton عنصرًا نائبًا.",
          "Compatibility: spinner selects the pixel grid; skeleton shows a placeholder.",
        ),
      ],
      [
        "announcement",
        '"polite" | "off" · polite',
        t(
          "اختر off إذا كان عنصر أب يتولّى الإعلان.",
          "Turn off if a surrounding region owns announcements.",
        ),
      ],
      [
        "Native attributes / ref",
        "div",
        t(
          "يقبل className وstyle وسمات العنصر الأصلي.",
          "className, style and native attributes on the wrapper.",
        ),
      ],
      [
        "Choose",
        "Spinner / Skeleton",
        t(
          "استخدم Spinner لمؤشر بسيط، وSkeleton لشكل المحتوى، وLoadingState حين تحتاج تسمية ووصفًا.",
          "Spinner for a bare indicator; Skeleton for content shape; LoadingState for a label and description.",
        ),
      ],
    ],
    "thinking-indicator": [
      [
        "words / textOnly",
        "readonly string[]? / boolean · false",
        t(
          "تتبدّل الكلمات كاملة للعرض فقط، ويبقى الاسم الذي يقرؤه قارئ الشاشة ثابتًا. يُخفي textOnly الرمز ويُبقي النص.",
          "Whole display words rotate cosmetically; accessible label stays stable. Text only omits the glyph.",
        ),
      ],
      [
        "label",
        "string · required",
        t(
          "اسم ثابت تمرّره من تطبيقك ويقرؤه قارئ الشاشة. يظهر نصًا حين لا تمرّر words.",
          "Stable accessible application-supplied label; displayed when words are omitted.",
        ),
      ],
      [
        "announcement",
        '"polite" | "off" · polite',
        t(
          "تبقى التسمية ثابتة، والحركة للزينة فقط.",
          "Stable label; animation is decorative.",
        ),
      ],
      [
        "Native attributes / ref",
        "span",
        t("يدعم className وstyle.", "Supports className and style."),
      ],
      [
        "Choose",
        "Spinner / ThinkingState",
        t(
          "مؤشر داخل السطر لواجهة المساعد. استخدم ThinkingState إذا احتجت تفاصيل.",
          "Inline assistant feedback; ThinkingState adds optional details. Use Spinner for general loading.",
        ),
      ],
    ],
    "tool-call": [
      [
        "label / tool / state",
        "string / string / ToolCallState · required",
        t(
          "مرّر من تطبيقك عنوانًا يفهمه المستخدم واسم الأداة وحالتها.",
          "User-facing action, tool name and host-supplied pending/running/needs-you/completed/failed state.",
        ),
      ],
      [
        "appearance / labels / headingLevel",
        '"card" | "plain" · card / Partial<ToolLabels> / 2 | 3 | 4 | 5 | 6 · 4',
        t(
          "استخدم plain داخل نمط آخر مثل مهمة الوكيل. تستبدل labels كلمات الحالة والأقسام، ويحدّد headingLevel مستوى عناوين المدخلات والمخرجات.",
          "Use plain inside another pattern, such as Agent task. labels replaces the state and section words; headingLevel sets the level of the input and output headings.",
        ),
      ],
      [
        "input / output / error",
        "ReactNode · optional",
        t(
          "يظهر النص منسقًا كما هو، أو تظهر الواجهة التي يرسمها تطبيقك. عند الفشل يظهر الخطأ.",
          "Strings render as preformatted text; nodes render supplied UI. Error replaces output on failure.",
        ),
      ],
      [
        "duration",
        "string · optional",
        t(
          "مرّر المدة منسقة من تطبيقك، فلا مؤقت داخلي.",
          "Formatted host duration. No library timer.",
        ),
      ],
      [
        "expanded / defaultExpanded / onExpandedChange",
        "boolean / boolean · false / (boolean) => void",
        t(
          "يدير تطبيقك الفتح أو يديره المكوّن. عند الطي يعود التركيز إلى زر التوسيع.",
          "Controlled or internal disclosure; hidden details leave the tab order and focus returns on collapse.",
        ),
      ],
      [
        "onRetry / retryLabel",
        "(() => void)? / string?",
        t(
          "إجراء إعادة المحاولة من تطبيقك، يظهر خارج زر التوسيع عند الفشل.",
          "Host retry outside disclosure, shown only on failure. Focus returns to disclosure before retry.",
        ),
      ],
      [
        "announcement",
        "polite | off · polite",
        t(
          "يعلن الحالة فقط، دون المدة أو المخرجات.",
          "Announces label and state only, excluding duration and output.",
        ),
      ],
      [
        "Choose",
        "ToolChips / TaskRows / ThinkingState",
        t(
          "استخدم ToolChips للملخص، وTaskRows لتتبع المهام، وThinkingState لوصف النشاط باختصار.",
          "ToolChips summarizes activity; TaskRows tracks tasks; ThinkingState describes brief user-facing activity.",
        ),
      ],
    ],
    "tool-chips": [
      [
        "label / items",
        "string / readonly ToolChipItem[] · required",
        t(
          "يسمّي label القائمة. لكل عنصر معرّف ثابت وتسمية وحالة، وعدد اختياري.",
          "Named list; stable id, concise label, state and optional nonnegative count per item.",
        ),
      ],
      [
        "labels",
        "Partial<ToolLabels>",
        t("تستبدل أي كلمة حالة.", "Replaces any state word."),
      ],
      [
        "items[].onActivate",
        "() => void · optional",
        t(
          "تصبح الشريحة زرًا فقط إذا ربطتها بإجراء حقيقي، وإلا تبقى نصًا.",
          "Creates a native button only when a real host action is connected; otherwise static text.",
        ),
      ],
      [
        "items[].controls / expanded",
        "string? / boolean?",
        t(
          "مرّر معرّف التفاصيل وحالة فتحها حين تكون مرتبطة فعلًا.",
          "Supply the real details ID and expansion state only when connected.",
        ),
      ],
      [
        "Native attributes / ref",
        "ul",
        t(
          "لا تفتح الشرائح التفاصيل ولا تنفّذ الأدوات تلقائيًا.",
          "No automatic details, execution, timers or orchestration. Pair with ToolCall for details.",
        ),
      ],
    ],
    "thinking-state": [
      [
        "label / active / children",
        "string / boolean / ReactNode · required",
        t(
          "مرّر من تطبيقك ملخصًا موجزًا وحالة النشاط والتفاصيل، دون أي استدلال خاص.",
          "Brief user-facing summary, activity flag and details supplied by the host; never private reasoning.",
        ),
      ],
      [
        "expanded / defaultExpanded",
        "boolean / boolean · false",
        t(
          "يدير تطبيقك الفتح أو يديره المكوّن. يُقرأ defaultExpanded مرة واحدة عند البداية.",
          "Controlled or internal expansion; default initializes once.",
        ),
      ],
      [
        "onExpandedChange",
        "(expanded: boolean) => void",
        t(
          "حدّث expanded من هنا إذا كان تطبيقك يدير الفتح.",
          "Update expanded when controlled.",
        ),
      ],
      [
        "announcement",
        '"polite" | "off" · polite',
        t(
          "يُعلن الملخص وحده بإعلان مهذب، وتبقى التفاصيل خارج المنطقة الحية.",
          "Only the summary is announced politely; details stay outside the live region.",
        ),
      ],
      [
        "Native attributes / ref",
        "div",
        t(
          "تُخفى التفاصيل المطوية وتصبح خاملة، ويُستعاد التركيز بعد طيّها.",
          "Collapsed details are hidden and inert with focus recovery.",
        ),
      ],
      [
        "Choose",
        "ThinkingIndicator / TaskRows",
        t(
          "استخدم ThinkingIndicator لحالة واحدة قصيرة، وTaskRows لعدة مهام لكل منها حالتها.",
          "ThinkingIndicator for one short inline status; TaskRows for multiple tasks with independent states.",
        ),
      ],
    ],
    "file-tree": [
      [
        "nodes / label",
        "readonly FileTreeNode[] / string · required",
        t(
          "لكل عقدة معرّف فريد ثابت وname نصي وkind=file، أو kind=folder مع children. metadata نص اختياري.",
          "Unique stable IDs, string name and kind=file or folder with children. Optional string metadata.",
        ),
      ],
      [
        "expandedIds / defaultExpandedIds / onExpandedChange",
        "readonly string[] / (ids: string[]) => void",
        t(
          "يدير تطبيقك الفتح أو يديره المكوّن. إن كان تطبيقك يديره فحدّث expandedIds داخل onExpandedChange.",
          "Controlled or internal expansion. Update the controlled value in its callback.",
        ),
      ],
      [
        "selectedId / defaultSelectedId / onSelectedChange",
        "string | null / (id: string) => void",
        t(
          "يُختار عنصر واحد، والاختيار مستقل عن التركيز. null يعني أن لا شيء مختار.",
          "Single selection independent of focus. null means no selection.",
        ),
      ],
      [
        "onActivate",
        "(file: FileTreeFile) => void",
        t(
          "النقر على ملف أو ضغط Enter يستدعي onActivate ليتولّى تطبيقك الإجراء. لا يصل المكوّن إلى نظام الملفات.",
          "File click or Enter delegates activation to the host. No filesystem access.",
        ),
      ],
      [
        "size / emptyState",
        "sm (default) | md / ReactNode",
        t(
          "emptyState محتوى غير تفاعلي. تُعرض الأسماء الطويلة مع عزل اتجاه النص.",
          "Noninteractive empty content. Long names truncate with bidirectional isolation.",
        ),
      ],
      [
        "Keyboard / focus",
        "Tree pattern · one tab stop",
        t(
          "تنقّل بالأسهم وHome/End أو بالكتابة للبحث. تنعكس الأسهم الأفقية في RTL. يختار Space العنصر ويفعّله Enter. إذا حُذف العنصر المركّز ينتقل التركيز إلى أقرب أصل ظاهر أو إلى الموضع نفسه، دون أن يسحب التركيز من خارج الشجرة.",
          "Arrows, Home/End and typeahead. Horizontal arrows mirror in RTL. Space selects; Enter activates. Removed focus recovers to the closest visible ancestor or same position without reclaiming outside focus.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<div> except children / onSelect",
        t(
          "تُطبَّق السمات وref على جذر tree، وclassName على الحاوية. تدير الشجرة أدوارها وحالاتها بنفسها.",
          "Attributes and ref target the tree root; className targets its wrapper. Tree roles and states are managed internally.",
        ),
      ],
    ],
    steps: [
      [
        "items / label",
        "readonly StepItem[] / string · required",
        t(
          "لكل خطوة معرّف فريد ثابت وتسمية ووصف اختياري وحالة upcoming أو current أو completed أو error. تُعرض قائمةً مرتبة يسمّيها label لقارئ الشاشة.",
          "Stable unique IDs, label, optional description and upcoming/current/completed/error status. Named native ordered list.",
        ),
      ],
      [
        "orientation",
        '"horizontal" | "vertical" · horizontal',
        t(
          "يتبع الترتيب اتجاه اللغة، وفي المساحات الضيقة تتحول الخطوات إلى عمود.",
          "Order follows language direction; narrow spaces use a vertical layout.",
        ),
      ],
      [
        "currentId",
        "string · optional",
        t(
          "يتقدّم currentId على status=current، حتى لو كانت الخطوة الحالية خطأً. دونه تُعلَّم أول خطوة current فقط، وإذا لم يطابق أي خطوة فلا خطوة حالية.",
          "Overrides status=current, including a current error. Otherwise only the first current status is marked; an unmatched ID means no current step.",
        ),
      ],
      [
        "onStepActivate",
        "(id: string) => void · optional",
        t(
          "يحوّل كل الخطوات إلى أزرار بدل العرض الثابت. يتولّى تطبيقك القواعد والتحقق والتقدم.",
          "Opts into real buttons for every step. The application owns rules, validation and progress.",
        ),
      ],
      [
        "locale / statusLabels",
        '"ar" | "en" / Record<StepStatus, string>',
        t(
          "تُستنتج لغة الأرقام والحالات من الاتجاه افتراضيًا، ويمكنك ترجمة تسميات الحالات. المؤشرات للزينة، والحالة مكتوبة نصًا لقارئ الشاشة.",
          "Number/status locale defaults from direction; status labels can be translated. Indicators are decorative; status also has accessible text.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<ol> (except children)",
        t(
          "قائمة أصلية تقبل ref والسمات والأحداث. لا تضع عناصر تفاعلية داخل التسميات.",
          "Native list ref, attributes and events; keep labels free of interactive descendants.",
        ),
      ],
    ],
    "task-rows": [
      [
        "items / label",
        "readonly TaskRowItem[] / string · required",
        t(
          "لكل مهمة id فريد ثابت وtitle نصي وstate وcontent، وsummary نص قصير اختياري. لا تضع عناصر تفاعلية في العنوان أو الملخص.",
          "Unique stable id, string title, state and content; optional short string summary. Title and summary are noninteractive.",
        ),
      ],
      [
        "state / appearance",
        "pending | running | needs-you | completed | failed / capsules | list | plain",
        t(
          "مرّر حالات التنفيذ من تطبيقك. تظهر المهام كبسولات منفصلة افتراضيًا، أو قائمة متصلة، أو صفوفًا بلا سطح في plain داخل نمط آخر. يشرح المؤشر والنص الحالة دون الاعتماد على اللون.",
          "Execution state comes from the application. Separate capsules by default, a connected list, or plain rows inside another pattern. Indicators and text explain state independently of color.",
        ),
      ],
      [
        "expandedIds / defaultExpandedIds / onExpandedChange",
        "readonly string[] / readonly string[] / (ids: string[]) => void",
        t(
          "يمكن فتح عدة مهام معًا، ويدير تطبيقك الفتح أو يديره المكوّن. تبدأ المهام مغلقة. إن كان تطبيقك يدير الفتح فغيّر expandedIds داخل onExpandedChange. فتح التفاصيل لا يغيّر التنفيذ.",
          "Optional controlled or internal multiple expansion; starts closed. Update expandedIds in the callback for controlled mode. Disclosure never changes execution.",
        ),
      ],
      [
        "content / stateLabels / emptyState / labels",
        "ReactNode / Partial<Record<TaskState, string>> / ReactNode / { empty?: string }",
        t(
          "ضع إجراءات تطبيقك داخل اللوحة المرتبطة، خارج زر التوسيع. تستخدم الحالة شارات النظام الموجودة، وتغطي الحركة وتأثير المرور المهمة كلها. عند الإغلاق تصبح اللوحة aria-hidden وinert فورًا، وإذا أُغلقت من الخارج يعود التركيز إلى زرها. تستبدل stateLabels أي كلمة حالة، وlabels.empty عنوان الحالة الفارغة.",
          "Application actions live outside the trigger. Existing state Badges, whole-task hover and reduced-motion-aware disclosure transitions. Closing is immediately aria-hidden/inert; external collapse restores panel focus. Default labels follow direction; stateLabels replaces any state word and labels.empty the empty state's title.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<ul> (except children)",
        t(
          "قائمة أصلية بالترتيب الذي تمرّره ومعرّفات ثابتة. المؤقتات موجودة في المحاكاة المحلية وحدها، وهي تلغي التشغيل السابق وتعيد المحاولة صراحةً. لا وكيل ولا شبكة في المكتبة.",
          "Native list with supplied order and stable IDs. Only the local example owns timers, cancellation and explicit retry. No agent runtime or network in the library.",
        ),
      ],
    ],
    "notification-list": [
      [
        "items / label",
        "readonly NotificationItem[] / string · required",
        t(
          "لكل إشعار id فريد ثابت وtitle نصي وtimestamp وread، أما description وdateTime وavatar وicon وaction فاختيارية.",
          "Unique stable id, string title, timestamp and read; optional description, dateTime, avatar, icon and action.",
        ),
      ],
      [
        "onMarkRead / onMarkAllRead",
        "(id: string) => void / () => void · optional",
        t(
          "يحدّث تطبيقك حالة القراءة. يُحسب العدد من العناصر نفسها. فتح الإجراء لا يعلّم الإشعار كمقروء.",
          "Application updates read state. Count derives from items. Opening an action never marks read.",
        ),
      ],
      [
        "labels",
        "{ unread; read; markRead; markAllRead } · optional strings",
        t(
          "تترجم النصوص الداخلية، وتتبع القيم الافتراضية الاتجاه. الأيقونة للزينة، والصورة الشخصية من تطبيقك.",
          "Translate internal text; defaults follow direction. Icon is decorative; avatar content is application-owned.",
        ),
      ],
      [
        "timestamp / dateTime / emptyState",
        "string / string / ReactNode",
        t(
          "نسّق الوقت في تطبيقك، ومرّر dateTime صالحًا متى توفّر. فرّق بين قائمة فارغة وقائمة لا غير مقروء فيها. يتولّى تطبيقك التصفية واستعادة التركيز.",
          "Application formats time and supplies valid dateTime when available. Distinguish empty from no unread. Filtering and focus recovery belong to the application.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<div> (except children)",
        t(
          "تُطبَّق سمات الجذر وref على div، وفي داخله قائمة ul أصلية. لا يحذف المكوّن شيئًا تلقائيًا ولا يجلب البيانات ولا يحفظها.",
          "Root attributes/ref target div; internal native ul. No automatic dismissal, fetching or persistence.",
        ),
      ],
    ],
    timeline: [
      [
        "items / label",
        "readonly TimelineItem[] / string · required",
        t(
          "لكل عنصر id ثابت وtitle وtimestamp، أما description وdateTime وicon وcontent فاختيارية. تبقى العناصر بالترتيب الذي تمرّره دون فرز.",
          "Stable id, title and timestamp; optional description, dateTime, icon and content. Supplied order is preserved without sorting.",
        ),
      ],
      [
        "timestamp / dateTime",
        "string / string · per item",
        t(
          "نسّق التاريخ بلغة المستخدم في تطبيقك. إذا مرّرت dateTime صالحًا آليًا يُنتج عنصر time، ودونه يظهر النص فقط.",
          "The application formats localized dates. Valid machine-readable dateTime produces time; without it, timestamp is plain text.",
        ),
      ],
      [
        "icon / content",
        "ReactNode · optional",
        t(
          "الأيقونة للزينة، فضع المعنى في العنوان. ركّب محتوى تطبيقك وإجراءاته من المكوّنات الموجودة.",
          "Icon is decorative; include meaning in the title. Compose application content/actions with existing components.",
        ),
      ],
      [
        "emptyState",
        "ReactNode · optional",
        t(
          "مرّر محتوى الحالة الفارغة من تطبيقك، والنص الافتراضي يتبع الاتجاه. لا جلب ولا مؤقتات ولا حفظ.",
          "Application-owned empty content; default text follows direction. No fetching, timers or persistence.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<ol> (except children)",
        t(
          "قائمة مرتبة أصلية يصل بين عناصرها خط يتبع الاتجاه، ولا يمتد بعد العنصر الأخير. يغيّر RTL موضع العرض فقط.",
          "Native ordered list, logical rail and no trailing connector. RTL changes layout only.",
        ),
      ],
    ],
    slider: [
      [
        "value / defaultValue / onValueChange",
        "number / number / (value: number) => void",
        t(
          "يدير تطبيقك القيمة أو يديرها المكوّن. لا يُستدعى callback أثناء العرض أو إعادة الضبط.",
          "Controlled or internal value; no callback during rendering or reset.",
        ),
      ],
      [
        "min / max / step",
        "0 / 100 / 1",
        t(
          "تُحصر القيمة في النطاق وتُقرّب إلى خطوات تبدأ من min، مع إزالة بواقي الكسور العشرية. القيمة الافتراضية منتصف النطاق. إذا كان max أقل من min يصبح مساويًا له، وتعود الحدود غير المحدودة والخطوة غير الموجبة إلى قيمها الافتراضية.",
          "Clamp and snap to min-based steps with decimal noise rounded. Default value is the midpoint. A max below min becomes min; nonfinite bounds and nonpositive steps use defaults.",
        ),
      ],
      [
        "formatValue",
        "(value: number) => string",
        t(
          "يعرض القيمة منسّقة ويضبط aria-valuetext، دون أن يغيّر القيمة المرسلة في النموذج.",
          "Optional readout and aria-valuetext; never changes the form value.",
        ),
      ],
      [
        "label / helper / error / field / invalid",
        "Field associations",
        t(
          "استخدم label مباشرة أو Field منفصلًا. تُطبَّق ref والسمات والأحداث على input range الأصلي.",
          "Use labeled mode or separate Field. Ref, native attributes and events target the native range input.",
        ),
      ],
      [
        "name / form / disabled / reset",
        "native range submission",
        t(
          "مع name يُرسل الرقم الحالي، ولا يُرسل شيء إذا كان الحقل معطّلًا. حين يدير المكوّن القيمة، يعيد reset القيمة الأولية دون callback ويحترم إلغاء الحدث. وحين يديرها تطبيقك، عالج onReset بنفسك.",
          "name submits the current numeric string; disabled omits it. Uncanceled uncontrolled reset restores the initial value without callback. Controlled reset needs application onReset.",
        ),
      ],
      [
        "Keyboard / RTL",
        "native browser behavior",
        t(
          "تعمل الأسهم وHome وEnd كما في المتصفح، ويعكس RTL اتجاه اليمين واليسار. لا محرك سحب مخصص ولا نطاق بقيمتين.",
          "Native arrows, Home and End; RTL mirrors horizontal arrow direction. No custom gesture engine or ranges.",
        ),
      ],
    ],
    "otp-input": [
      [
        "value / defaultValue / onValueChange",
        "string / empty string / (value: string) => void",
        t(
          "تبقى الأصفار في البداية والقيم الجزئية كما هي. يقبل أرقام ASCII والعربية والفارسية، ويُخرج أرقام ASCII فقط. يحذف ما ليس رقمًا، ويقصّ ما يزيد على length.",
          "Preserves leading zeros and partial values. Accepts ASCII, Arabic-Indic and Eastern Arabic digits; public values are ASCII. Other characters are removed and extra digits truncated.",
        ),
      ],
      [
        "length",
        "6; integer 1–12",
        t(
          "عدد الخانات ثابت ويمكنك ضبطه. يُقرّب لأسفل ويُحصر بين 1 و12، والقيمة غير المحدودة تعود إلى 6.",
          "Fixed configurable length, floored/clamped to 1–12; nonfinite uses 6.",
        ),
      ],
      [
        "Editing / autofill",
        "one text input",
        t(
          "التحرير والتحديد واللصق أصلية، مع inputMode=numeric وautocomplete=one-time-code. يُكتب الرمز باتجاه LTR، والخانات للزينة. لا ينتقل التركيز ولا يُرسل النموذج تلقائيًا.",
          "Native editing, selection and paste; inputMode=numeric, autocomplete=one-time-code. LTR code order; decorative slots. No focus movement or automatic submission.",
        ),
      ],
      [
        "label / helper / error / field / invalid / readOnly",
        "Field / native input",
        t(
          "استخدم label أو Field منفصلًا، ويشير ref إلى input. في وضع القراءة فقط يبقى التحديد والنسخ متاحين. اكتمال الخانات لا يعني أن الرمز صحيح.",
          "Label or separate Field; ref targets input. Read-only preserves selection/copy. Complete length never means verified.",
        ),
      ],
      [
        "name / form / required / reset",
        "native text submission",
        t(
          "يُرسل name النص الجزئي أيضًا. عند تحقق النموذج يتطلب pattern العدد الكامل، ويُسمح بالحقل الفارغ إلا مع required. لا يُرسل الحقل المعطّل. حين يدير المكوّن القيمة يعيد reset القيمة الأولية دون callback، وحين يديرها تطبيقك تحتاج onReset. يُحترم إلغاء الحدث في الحالتين.",
          "name includes partial text. Native pattern requires full length during form validation; empty is allowed unless required. Disabled omits it. Uncontrolled reset restores initial value without callback; controlled reset needs onReset; cancellation is respected.",
        ),
      ],
    ],
    "date-picker": [
      [
        "value / defaultValue / onValueChange",
        "YYYY-MM-DD / empty string / (value: string) => void",
        t(
          "تاريخ ميلادي فقط، أو نص فارغ لمسح القيمة. يُحوَّل التاريخ عبر السنة والشهر واليوم المحلية، دون UTC ولا انزياح في التوقيت. القيمة غير الصالحة تُظهر خطأ وتُرسل فارغة. لا يُستدعى callback أثناء العرض.",
          "Gregorian date only, or empty string to clear. Local year/month/day conversion avoids UTC shifts. Invalid props show feedback and submit empty; no render-time callback.",
        ),
      ],
      [
        "min / max / disabled",
        "YYYY-MM-DD / boolean",
        t(
          "الحدود شاملة، ويُتجاهل غير الصالح منها. يمنع التقويم وزر «اليوم» الاختيار خارجها. إذا مرّرت تاريخًا صحيحًا خارج النطاق يبقى كما هو مع رسالة خطأ. يتولّى تطبيقك التحقق.",
          "Inclusive bounds; invalid bounds ignored. Calendar and Today prevent out-of-range selection. A valid external date outside bounds remains with feedback; the application owns validation.",
        ),
      ],
      [
        "yearRange",
        "readonly [number, number]",
        t(
          "يحدد سنوات القائمة فقط، وافتراضيًا السنة المعروضة ±١٠٠، وتبقى السنة المعروضة متاحة دائمًا. لا يقيّد صلاحية التاريخ، فحدود التنقّل والاختيار هي min وmax. تعرض قائمة السنة خمسة صفوف تتمرّر. تغيير الشهر أو السنة ينقل العرض دون أن يغيّر التاريخ المحدد.",
          "Direct year choices only; defaults to viewed year ±100 and always includes the viewed year. Does not restrict valid dates; min/max bound navigation and selection. Year menu shows five scrollable rows. Month/year changes navigate without selecting a date.",
        ),
      ],
      [
        "locale / placeholder",
        "ar | en / string",
        t(
          "تتبع اللغة الاتجاه افتراضيًا، ويُعرض التاريخ ميلاديًا بلغة المستخدم. يغيّر RTL التخطيط فقط، لا معنى قيمة YYYY-MM-DD.",
          "Language defaults from direction; localized Gregorian display. RTL changes layout, never YYYY-MM-DD meaning.",
        ),
      ],
      [
        "label / helper / error / field / invalid / ref",
        "Field / HTMLButtonElement",
        t(
          "استخدم label أو Field. تُطبَّق ref والأحداث والسمات على زر الفتح. يقرأ قارئ الشاشة التسمية والتاريخ المحدد.",
          "Label or separate Field; ref, events and attributes target trigger. Label names it; selected date is part of its accessible name.",
        ),
      ],
      [
        "Calendar / popup",
        "DayPicker + Radix Popover",
        t(
          "تنقّل بالأسهم وHome/End وPageUp/Down، واختر بـ Enter. يغلق Escape التقويم أولًا ويعيد التركيز. يُعرض التقويم في أقرب Provider أو Sheet أو Modal، ويبقى داخل حدود الشاشة ويتمرّر داخليًا.",
          "Arrows, Home/End and PageUp/Down navigate; Enter selects. Escape closes the calendar first and restores trigger focus. Portals into nearest Provider/Sheet/Modal with viewport collision handling and internal scrolling.",
        ),
      ],
      [
        "name / form / reset / validation",
        "hidden date-only submission",
        t(
          "يُرسل name التاريخ كاملًا أو نصًا فارغًا، ولا يُرسل الحقل المعطّل. الحقل المخفي لا يدعم required ولا التحقق الأصلي، لذا امنع الإرسال من تطبيقك عند وجود خطأ. حين يدير المكوّن القيمة يعيد reset القيمة الأولية دون callback ويحترم الإلغاء، وحين يديرها تطبيقك تحتاج onReset.",
          "name submits the full date or empty string; disabled omits it. Hidden submission has no native required validation; the application blocks invalid forms. Uncontrolled reset restores initial value without callback and respects cancellation; controlled reset needs onReset.",
        ),
      ],
    ],
    "file-dropzone": [
      [
        "value / defaultValue / onValueChange",
        "File[] / File[] / (files: File[]) => void",
        t(
          "يدير تطبيقك الملفات أو يديرها المكوّن. الاختيار محلي فقط، دون رفع أو تخزين.",
          "Controlled or internal selected files. Local selection only; no upload or storage.",
        ),
      ],
      [
        "multiple / accept / maxFileSize / maxFiles",
        "boolean / string / bytes / number",
        t(
          "يُفحص النوع والحجم والعدد بالطريقة نفسها عند التصفّح والسحب. مع multiple تُضاف الملفات، ودونه يُستبدل الملف بأول ملف صحيح. إذا رُفض بعض الملفات يبقى المقبول منها.",
          "Identical browse/drop checks for type, byte size and count. Multiple appends; single replaces with the first valid file. Partial rejection preserves accepted files.",
        ),
      ],
      [
        "Duplicates / removal",
        "name + size + type + lastModified",
        t(
          "يُتجاهل الملف المكرر مع رسالة توضّح السبب، ويمكن اختياره من جديد بعد حذفه. بعد الحذف ينتقل التركيز إلى زر التصفّح.",
          "Same-metadata duplicates are ignored with feedback; reselect after removal. Removal focuses Browse files.",
        ),
      ],
      [
        "label / helper / error / field / invalid / labels",
        "Field / FileDropzoneLabels",
        t(
          "استخدم label أو Field منفصلًا. تترجم labels النصوص browse/drop/remove(file)/rejected(file,reason). تُطبَّق ref والسمات والأحداث على input الأصلي المخفي.",
          "Use labeled mode or separate Field composition. labels translates browse/drop/remove(file)/rejected(file,reason). Ref, native attributes and events target the hidden native file input.",
        ),
      ],
      [
        "form / reset / submission",
        "application-owned FormData",
        t(
          "يُفرَّغ input بعد كل اختيار ليمكن التصفّح مجددًا. لا يدعم name ولا required، فابنِ FormData من مصفوفة File[] المختارة. يعيد reset قيمة defaultValue دون callback ويحترم الإلغاء. وحين يدير تطبيقك القيمة تحتاج onReset.",
          "The native input clears after selection for reselection. No name or required API; construct FormData from the selected File array. Uncontrolled reset restores initial defaultValue without callback and respects cancellation; controlled reset requires application onReset.",
        ),
      ],
      [
        "Validation / scope",
        "convenience checks",
        t(
          "يُقرّب maxFiles لأسفل ولا يقل عن صفر، وmaxFileSize عدد بايتات غير سالب، ويُتجاهل الحد غير المحدود. افحص الملفات على الخادم أيضًا. لا رفع ولا تقدم ولا معاينات ولا مجلدات.",
          "maxFiles floors/clamps to zero; maxFileSize is nonnegative bytes; nonfinite limits are ignored. Client checks are convenience checks; validate on the server. No uploads, progress, previews or directories.",
        ),
      ],
    ],
    "color-picker": [
      [
        "value / defaultValue / onValueChange",
        "string / #316746 / (color: string) => void",
        t(
          "ألوان RGB معتمة فقط. يقبل #RGB أو #RRGGBB، ويعتمد اللون بصيغة #RRGGBB بأحرف كبيرة. مرّر في props ألوانًا صحيحة، فالقيمة غير الصحيحة تعود إلى #316746.",
          "Opaque RGB only. Accepts #RGB/#RRGGBB; committed values are uppercase #RRGGBB. Supply valid color props; invalid props fall back to #316746.",
        ),
      ],
      [
        "HEX editing",
        "Enter / blur",
        t(
          "يبقى النص الناقص في الحقل أثناء التعديل. يعتمد Enter أو مغادرة الحقل النص الصحيح، أما غير الصحيح فيبقى مع رسالة دون أن يتغيّر اللون. يتابع onChange النص، ويبلّغ onValueChange باللون المعتمد.",
          "Incomplete text stays editable. Enter or blur commits valid text; invalid text remains with feedback and the selected color stays unchanged. onChange observes text; onValueChange reports committed colors.",
        ),
      ],
      [
        "swatches / labels",
        "ColorSwatch[] / ColorPickerLabels",
        t(
          "لكل لون label وvalue صحيح، ومرّر [] لإخفاء الألوان الجاهزة. يوضّح aria-pressed وعلامة الاختيار اللون المحدد، ويبقى مؤشر التركيز مستقلًا عنهما. تترجم labels النصوص chooser/swatches/invalid.",
          "Each swatch has a label and valid value. [] hides presets. aria-pressed and a check mark show selection; focus is distinct. labels translates chooser/swatches/invalid.",
        ),
      ],
      [
        "label / helper / error / field / invalid / ref",
        "Field / HTMLInputElement",
        t(
          "استخدم label أو Field منفصلًا. تُطبَّق ref والسمات على حقل HEX، واتجاهه LTR. يبقى منتقي الألوان الأصلي متزامنًا معه، ويختلف مظهره من متصفح لآخر.",
          "Use labeled mode or separate Field composition. Ref/native attributes target the LTR HEX input. Native chooser is synchronized; its appearance varies by browser.",
        ),
      ],
      [
        "name / form / disabled / reset",
        "committed hidden value",
        t(
          "يُرسل name اللون المعتمد فقط، ولا يُرسل الحقل المعطّل. حين يدير المكوّن القيمة يعيد reset قيمة defaultValue دون callback إن لم يُلغَ الحدث، وحين يديرها تطبيقك تحتاج onReset. رسالة الخطأ المحلية وحدها لا تمنع الإرسال، وتبقى قيود required/pattern الأصلية سارية. يتولّى تطبيقك تحقق النموذج.",
          "name submits only the committed color; disabled omits it. Uncontrolled reset restores initial defaultValue without callback after respecting cancellation. Controlled reset needs application onReset. Local feedback alone does not block submission; native required/pattern constraints still apply. The application owns form validation.",
        ),
      ],
      [
        "Scope",
        "local sample only",
        t(
          "لا يدعم الشفافية ولا لوحة hue/saturation مخصصة. يغيّر المثال عيّنة مستقلة عن اللون الأساسي للنظام.",
          "No alpha or custom hue/saturation canvas. The example changes a sample independently of the system accent.",
        ),
      ],
    ],
    "tag-input": [
      [
        "value / defaultValue / onValueChange",
        "string[] / string[] / (next: string[]) => void",
        t(
          "يدير تطبيقك الوسوم أو يديرها المكوّن. يضيف Enter النص بعد حذف المسافات من طرفيه، ويُكشف التكرار بمطابقة تراعي حالة الأحرف.",
          "Controlled or internal array. Enter adds trimmed text; duplicates use exact case-sensitive comparison.",
        ),
      ],
      [
        "label / helper / error / field",
        "Input-style Field contract",
        t(
          "استخدم label أو Field منفصلًا، ولا تجمع بينهما. تُطبَّق ref والسمات والأحداث على حقل النص.",
          "Use labeled convenience mode or separate Field composition. Ref, attributes and editing events target the draft input.",
        ),
      ],
      [
        "maxTags / disabled / readOnly / size / invalid / labels",
        "number / boolean / boolean / sm | md / boolean / TagInputLabels",
        t(
          "maxTags حد اختياري بعدد صحيح غير سالب، وتُتجاهل القيم غير المحدودة. تترجم labels رسائل الحذف والتكرار والحد الأقصى. الحجم الافتراضي sm.",
          "Optional nonnegative integer cap; nonfinite values are ignored. labels translates removal, duplicate and maximum feedback. sm default.",
        ),
      ],
      [
        "name / form / reset",
        "native form association",
        t(
          "تُرسل حقول مخفية بالاسم نفسه الوسوم المعتمدة فقط. لا يُرسل الحقل المعطّل، ويُرسل حقل القراءة فقط. حين يدير المكوّن القيمة تعود إعادة الضبط إلى defaultValue دون callback وتحترم الإلغاء، وحين يديرها تطبيقك تحتاج onReset.",
          "Repeated hidden fields submit only committed tags. Disabled omits values; read-only submits. Uncontrolled reset restores initial defaultValue without callback and respects cancellation. Controlled reset needs application onReset.",
        ),
      ],
      [
        "Keyboard / paste / validation",
        "native text editing",
        t(
          "يحذف Backspace في حقل فارغ آخر وسم، وينتقل التركيز بعد الحذف إلى حقل النص. لا يضيف Enter وسمًا أثناء الكتابة بـ IME. يُلصق النص كما هو. لا يدعم required أو التحقق الأصلي للوسوم، ولا تقسيم النص الملصق إلى وسوم، ولا الإكمال التلقائي.",
          "Empty Backspace removes the last tag; removal focuses the input. IME Enter does not add. Paste stays text. No tag required/native validation, bulk parsing or autocomplete.",
        ),
      ],
    ],
    "input-copy": [
      [
        "value",
        "string · required",
        t(
          "تُعرض القيمة للقراءة والتحديد، وينسخها زر النسخ كاملة.",
          "Read-only selectable text; copy writes the full underlying value.",
        ),
      ],
      [
        "label / helper / error / field",
        "Input-style Field contract",
        t(
          "استخدم label أو ركّبه داخل Field. دون label مرّر اسمًا واضحًا لقارئ الشاشة. تُطبَّق ref والسمات على input.",
          "Labeled mode or Field composition; supply an accessible name without label. Ref and native attributes target input.",
        ),
      ],
      [
        "size / invalid / labels / disabled",
        "sm | md / boolean / InputCopyLabels / boolean",
        t(
          "تخصّص labels النصوص copy وcopied وfailure. الحجم الافتراضي sm، ويعطّل disabled النص والنسخ معًا.",
          "labels: copy, copied and failure. sm default; disabled disables text and copy.",
        ),
      ],
      [
        "Clipboard / lifecycle",
        "navigator.clipboard.writeText",
        t(
          "يقع زر النسخ داخل الحقل عند نهايته المنطقية، مع مساحة محجوزة للنص وتركيز واضح. عند النجاح تظهر علامة صح مع إعلان مخفي لمدة ثانيتين، دون سطر نصي ظاهر. تبقى رسالة الفشل ظاهرة لترشد المستخدم إلى النسخ اليدوي. تغيير القيمة أو إزالة المكوّن يلغي النتائج المعلّقة والمؤقتات.",
          "Copy button sits inside the logical-end edge with reserved text padding and keyboard focus. Success shows a check and hidden polite announcement for two seconds, with no visible success row/text. Failure persists for manual copying. Value replacement/unmount cancels pending feedback and timers.",
        ),
      ],
    ],
    "filter-bar": [
      [
        "label / search / children",
        "string · required / ReactNode / ReactNode",
        t(
          "مجموعة يسمّيها label. ركّب داخلها Input وSelect وButton بخصائصها كما هي.",
          "Named group; compose Input, Select and Button using their own APIs.",
        ),
      ],
      [
        "filters",
        "FilterBarFilter[] · []",
        t(
          "لكل عامل تصفية نشط معرّف ثابت وlabel وremoveLabel وonRemove. اكتب أسماءً واضحة.",
          "Stable id, label, removeLabel and onRemove for each active filter. Supply meaningful accessible names.",
        ),
      ],
      [
        "onClearAll / clearLabel / disabled",
        "() => void / string / boolean",
        t(
          "يظهر زر المسح الاختياري حين توجد عوامل نشطة. يتولّى تطبيقك كل قيم التصفية. يعطّل disabled إزالة العوامل فقط، فعطّل عناصر التحكم الأخرى بنفسك.",
          "Optional Clear all appears with active filters. Application owns all filter values. disabled affects removal/Clear only; disable composed controls yourself.",
        ),
      ],
      [
        "Native props / focus / results",
        "div attributes/ref",
        t(
          "تلتف الصفوف ولا تتداخل العوامل الطويلة. بعد الإزالة ينتقل التركيز إلى العامل التالي، أو إلى عنصر تحكم، أو إلى المجموعة. يتولّى تطبيقك البحث والتصفية وعدد النتائج.",
          "Wrapping rows keep long filters separate. Removal focuses the next filter, a control or the group. Application owns search, filtering and result counts.",
        ),
      ],
    ],
    sidebar: [
      [
        "Sidebar",
        "native aside props/ref",
        t(
          "يحدد تطبيقك الموضع والارتفاع. يبقى الرأس والتذييل ثابتين بينما يتمرّر المحتوى.",
          "Host sets placement/height. Header/footer remain available while content scrolls.",
        ),
      ],
      [
        "collapsed / defaultCollapsed / onCollapsedChange",
        "boolean / boolean / (value: boolean) => void",
        t(
          "يدير تطبيقك الطي أو يديره المكوّن. يبدأ الشريط موسّعًا افتراضيًا.",
          "Controlled or internal state. Expanded by default.",
        ),
      ],
      [
        "SidebarHeader / SidebarContent / SidebarFooter / SidebarIdentity",
        "native div / nav / div / div props/ref",
        t(
          "أعطِ nav اسمًا. ركّب الأيقونة أو الصورة مع SidebarLabel داخل SidebarIdentity. يصطف الرأس أفقيًا ويصبح عموديًا في الشريط المطوي، ويوسّط التذييل الصورة نفسها.",
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
          "SidebarItem رابط لوجهة، وSidebarAction زر لإجراء. يعلن active الصفحة الحالية، وcount نص اختياري للزينة.",
          "Destination links and action buttons. Item active announces current page; count is optional decorative text.",
        ),
      ],
      [
        "SidebarDisclosure",
        "native button props/ref · label, icon, children",
        t(
          "يدعم مستوى واحدًا عبر open/defaultOpen/onOpenChange. يحدد تطبيقك activeChild. عند الضغط عليه والشريط مطوي، يوسّع التنقّل ويفتح العناصر الفرعية.",
          "One level. open/defaultOpen/onOpenChange. Caller supplies activeChild. From the rail: expands Sidebar and opens children.",
        ),
      ],
      [
        "SidebarToggle",
        "native button props/ref · collapseLabel, expandLabel",
        t(
          "التسميات المترجمة مطلوبة. لا تستقبل العناصر المخفية التركيز، وينتقل التركيز عند الحاجة إلى العنصر الأب أو زر الطي.",
          "Required translated labels. Hidden content is inert; focus moves to parent or toggle when needed.",
        ),
      ],
      [
        "Mobile",
        "Sheet composition",
        t(
          "أعد استخدام المحتوى نفسه داخل Sheet. انقل التركيز إلى الوجهة بعد أن يعود إلى زر الفتح، ويعيد Escape التركيز إلى الزر.",
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
          "سطح غير تفاعلي. يقبل كل جزء السمات والأحداث وref الأصلية.",
          "Noninteractive surface; each part preserves native attributes, events and ref.",
        ),
      ],
      [
        "CardTitle / CardDescription",
        "native h3 / p props",
        t(
          "ركّب العنوان والوصف حين تحتاجهما. إذا احتجت مستوى عنوان مختلفًا فاستخدم عنصر عنوان أصليًا.",
          "Optional composed title and description. Use a native heading when another level is needed.",
        ),
      ],
      [
        "children",
        "ReactNode",
        t(
          "ضع إجراءات تطبيقك في الرأس أو التذييل. لا تدعم البطاقة النقر عليها كاملة.",
          "Compose application actions in the header or footer. No clickable-card API.",
        ),
      ],
    ],
    accordion: [
      [
        "items",
        "readonly AccordionItem[]",
        t(
          "لكل قسم value فريد ثابت غير فارغ وlabel وcontent، وdisabled اختياري. لا تضع أزرارًا داخل label.",
          "Stable unique nonempty value, label, content and optional disabled. No interactive children inside label.",
        ),
      ],
      [
        "value / defaultValue / onValueChange",
        "string? / string? / (value: string) => void",
        t(
          "يدير تطبيقك الحالة أو يديرها المكوّن. النص الفارغ يعني أن كل الأقسام مغلقة، ودون defaultValue تبدأ كلها مغلقة.",
          "Controlled or internal state. Empty string means none open; omitted defaultValue starts closed.",
        ),
      ],
      [
        "collapsible / headingLevel / className",
        "boolean? / 2 | 3 | 4 | 5 | 6 / string?",
        t(
          "قيمة collapsible الافتراضية false، ومستوى العنوان 3. يتولّى Radix مفاتيح ArrowUp/Down وHome/End وEnter/Space. يتوقف القسم عن التفاعل فور إغلاقه، حتى أثناء حركة الإغلاق. يُفتح قسم واحد في كل مرة، واستخدم Tabs للعروض المرتبطة.",
          "Collapse defaults false; heading level 3. Radix handles ArrowUp/Down, Home/End and Enter/Space. Closed panels are immediately inert during exit motion. One disclosure; use Tabs for related views.",
        ),
      ],
    ],
    breadcrumbs: [
      [
        "items / label",
        "readonly BreadcrumbItem[] / string",
        t(
          "label اسم مترجم يقرؤه قارئ الشاشة. لكل عنصر في المسار label وhref اختياري، ويظهر آخر عنصر نصًا للصفحة الحالية حتى لو كان له href.",
          "Translated landmark label. Items have label and optional href; final item is current-page text even with href.",
        ),
      ],
      [
        "native nav props / ref",
        "ComponentPropsWithRef<nav>",
        t(
          "روابط أصلية، والعنصر الذي لا وجهة له يظهر نصًا. الفواصل للزينة وتتبع الاتجاه، ويلتف المسار.",
          "Native links; items without destinations are text. Decorative direction-aware separators and wrapping.",
        ),
      ],
    ],
    pagination: [
      [
        "page / totalPages / onPageChange",
        "number / number / (page: number) => void",
        t(
          "يدير تطبيقك الصفحة دائمًا. تُقرّب القيم المحدودة لأسفل وتُحصر في النطاق، وتصبح القيم غير المحدودة 1. عدد الصفحات بين 1 وMAX_SAFE_INTEGER. لا يُستدعى onPageChange أثناء العرض.",
          "Controlled only. Finite values floor and clamp; nonfinite values become 1. Total is 1–MAX_SAFE_INTEGER. No render-time callbacks.",
        ),
      ],
      [
        "labels",
        "PaginationLabels",
        t(
          "تترجم labels أسماء navigation وprevious وnext، وتُرجع الدالة page(number) اسم كل صفحة.",
          "Translated navigation, previous, next and page(number) names.",
        ),
      ],
      [
        "locale / disabled / native nav props / ref",
        "ar | en / boolean? / native nav",
        t(
          "يتبع locale الاتجاه افتراضيًا، ويعطّل disabled كل الأزرار. يعرض 7 مواضع على الأكثر، والفواصل غير تفاعلية. يتولّى تطبيقك البيانات وحجم الصفحة والتصفية، وDataTable مكوّن منفصل.",
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
        "neutral | success | error | info | warning | ai",
        t(
          "القيمة الافتراضية info. لا تتأثر الألوان الدلالية باللون الأساسي.",
          "Defaults to info; semantic colors stay independent of accent.",
        ),
      ],
      [
        "action",
        "ReactNode?",
        t(
          "مرّر الإجراء من تطبيقك، ويتولّى تطبيقك الإغلاق أيضًا.",
          "Application-supplied action; the application owns dismissal.",
        ),
      ],
      [
        "announcement",
        "off | polite | assertive",
        t(
          "القيمة الافتراضية off للرسائل الثابتة. يستخدم polite الدور status، ويستخدم assertive الدور alert، فاحصره في التحديثات العاجلة.",
          "Defaults to off for static messages. polite uses status; assertive uses alert for urgent updates only.",
        ),
      ],
    ],
    skeleton: [
      [
        "shape",
        "text | rectangle | circle",
        t(
          "القيمة الافتراضية text. الهيكل للزينة دائمًا، ويعلن تطبيقك التحميل بنفسه.",
          "Defaults to text. Always decorative; the host announces loading.",
        ),
      ],
      [
        "style / className",
        "CSSProperties? / string?",
        t(
          "اضبط الحجم بـ CSS، والقيم الافتراضية من الرموز المشتركة. تتوقف الحركة عند تفعيل تقليل الحركة.",
          "Native CSS sizing with token defaults. Motion stops with either reduced-motion setting.",
        ),
      ],
    ],
    progress: [
      [
        "label",
        "string",
        t(
          "اسم مطلوب يظهر على الشاشة ويُعلن مرة واحدة.",
          "Required name; visible and announced once.",
        ),
      ],
      [
        "value",
        "number | null | undefined",
        t(
          "من 0 إلى 100، وتُحصر القيم الخارجة عن النطاق فيه. مع null أو القيم غير المحدودة لا تُعلن أي قيمة.",
          "0–100. Out-of-range values clamp; null, missing and nonfinite values omit the numeric announcement.",
        ),
      ],
      [
        "showValue / locale",
        "boolean? / ar | en",
        t(
          "النسبة مخفية افتراضيًا، ويتبع locale اتجاه النظام افتراضيًا. تظهر الأرقام عربية مع ar، وتُقرّب النسبة عند العرض فقط.",
          "Value text defaults off; locale defaults from system direction. Arabic digits for ar; percentage rounds only for display.",
        ),
      ],
    ],
    spinner: [
      [
        "label / decorative",
        "string / boolean?",
        t(
          "label مطلوب إلا مع decorative=true، وعندها يتولّى النص المجاور الإعلان.",
          "label is required unless decorative=true; adjacent text then owns the announcement.",
        ),
      ],
      [
        "size",
        "sm | md",
        t(
          "الحجم الافتراضي sm. مع تقليل الحركة يتوقف الدوران ويبقى المؤشر والتسمية.",
          "Defaults to sm. Reduced motion stops rotation while keeping the indicator and name.",
        ),
      ],
      [
        "tone",
        "neutral | ai",
        t(
          "القيمة الافتراضية neutral. استخدم ai حين يعمل المساعد، فيأخذ القوس لون الذكاء الاصطناعي.",
          "Defaults to neutral. ai paints the arc in the AI color, for work the assistant is doing.",
        ),
      ],
    ],
    avatar: [
      [
        "name / src / fallback",
        "string / string? / string?",
        t(
          "name مطلوب ويُعلن مرة واحدة، والصورة داخله للزينة. تظهر أحرف ثابتة إذا غابت الصورة أو فشل تحميلها، فاختر الأحرف العربية بنفسك.",
          "name is required and announced once. Image content is decorative internally. Stable initials cover missing/loading/failed images; supply deliberate Arabic initials.",
        ),
      ],
      [
        "size / decorative",
        "sm | md / boolean?",
        t(
          "الحجم الافتراضي sm. استخدم decorative لإخفاء الصورة عن قارئات الشاشة حين يجاورها نص يؤدي المعنى نفسه.",
          "Defaults to sm. decorative hides the Avatar beside equivalent text.",
        ),
      ],
      [
        "native span props / ref",
        "ComponentPropsWithRef<span>",
        t(
          "كل سمات span عدا children وrole وaria-label. يحدد name التسمية، ويشير ref إلى span.",
          "Except children, role and aria-label. name owns labeling; ref targets span.",
        ),
      ],
    ],
    "avatar-group": [
      [
        "members / label",
        "AvatarMember[] / string",
        t(
          "كلاهما مطلوب. لكل عضو id فريد ثابت وname، وsrc وfallback اختياريان. يتبع الترتيب الاتجاه.",
          "Required. Members have stable unique id, name, optional src/fallback. Order follows direction.",
        ),
      ],
      [
        "maxVisible / size",
        "number? / sm | md",
        t(
          "الحد الافتراضي 4. تُقرّب الكسور لأسفل، والقيم الأقل من 1 تصبح 1، والقيم غير المحدودة تعود إلى 4. الحجم الافتراضي sm.",
          "Limit defaults to 4. Fractions floor, values below 1 clamp to 1, nonfinite values use 4. Size defaults to sm.",
        ),
      ],
      [
        "overflowLabel",
        "(count: number) => string",
        t(
          "مطلوب لترجمة نص العدد الإضافي. يقرأ قارئ الشاشة أسماء الأعضاء المخفيين معه. ليس زرًا.",
          "Required translated overflow text. Hidden member names accompany it. Overflow is noninteractive.",
        ),
      ],
    ],
    tooltip: [
      [
        "trigger / content",
        "ReactElement / string",
        t(
          "كلاهما مطلوب. استخدم عنصرًا يستقبل التركيز، وتبقى refs والأحداث والاسم ومعرّفات الوصف كما هي. المحتوى نص قصير غير تفاعلي فقط.",
          "Required. Use a focusable trigger; refs, events, name and existing description IDs are preserved. Short noninteractive text only.",
        ),
      ],
      [
        "delayDuration",
        "number? (milliseconds)",
        t(
          "التأخير الافتراضي عند المرور 500 ملّي ثانية، والظهور فوري عند التركيز. يغلق Escape التلميح أولًا. يُعرض داخل أقرب مزوّد أو حوار.",
          "Hover defaults to 500ms; focus is immediate. Escape dismisses Tooltip first. Portal uses the nearest provider or overlay.",
        ),
      ],
    ],
    modal: [
      [
        "trigger / title / description / closeLabel / children",
        "ReactElement / string / string / string / ReactNode",
        t(
          "كلها مطلوبة. أبقِ زر الفتح في الصفحة ليعود إليه التركيز. يترجم تطبيقك النصوص.",
          "Required; keep trigger mounted for focus restoration. Application translates copy.",
        ),
      ],
      [
        "footer / open / onOpenChange",
        "ReactNode? / boolean? / ((open: boolean) => void)?",
        t(
          "إذا حذفت open يدير المكوّن الحالة، وإن مرّرته فحدّثه بنفسك. التذييل اختياري، واستخدم Radix Dialog.Close للإغلاق في الحالتين.",
          "Omit open for internal state; controlled usage updates open. Optional footer; Radix Dialog.Close works in both modes.",
        ),
      ],
      [
        "initialFocusRef",
        "RefObject<HTMLElement | null>?",
        t(
          "عنصر يستقبل التركيز داخل المحتوى. دونه ينقل Radix التركيز إلى أول عنصر يستقبله. يبقى Tab داخل الحوار، ويُغلق الحوار بـ Escape أو بالنقر خارجه.",
          "A focusable element inside content. Otherwise Radix focuses the first focusable element. Tab is contained; Escape and outside dismiss.",
        ),
      ],
      [
        "nested overlays / viewport",
        "Scoped portal / internal scrolling",
        t(
          "تبقى القوائم وSelect والتلميحات داخل نطاق الحوار. لا يدير المكوّن مكدسًا للحوارات، ولا يمكن تعديل عرضه.",
          "Menu, Select and Tooltip stay inside dialog scope. No stack manager or configurable width.",
        ),
      ],
    ],
    "empty-state": [
      [
        "title / description / illustration / action",
        "string / string? / ReactNode? / ReactNode?",
        t(
          "title مطلوب. الرسم اختياري أو مخصص، وهو للزينة. مرّر الإجراء من تطبيقك واربطه بنتيجة فعلية.",
          "Required title. Illustration is optional/custom and decorative; application supplies an action connected to a real result.",
        ),
      ],
      [
        "NoRecordsIllustration / NoSearchResultsIllustration / GettingStartedIllustration",
        "() => JSX.Element",
        t(
          "رسوم SVG أصلية بلا نص، مخفية عن قارئات الشاشة، وتستخدم رموز النظام.",
          "Original text-free SVG exports, hidden from assistive technology and using shared tokens.",
        ),
      ],
    ],
    badge: [
      [
        "children / tone",
        "ReactNode / neutral | success | error | info | warning | ai",
        t(
          "النص هو ما يحمل المعنى. اللون محايد افتراضيًا، ولا إجراء ولا إعلان تلقائي.",
          "Text carries meaning. Defaults to neutral; no action or automatic announcement.",
        ),
      ],
      [
        "native attributes / ref",
        "ComponentPropsWithRef<span>",
        t(
          "تُطبَّق خصائص span وref عليه. لا تجعل الشارة زرًا.",
          "Span attributes and ref stay on the span. Keep the badge noninteractive.",
        ),
      ],
    ],
    checkbox: [
      [
        "label / helper / error",
        "string / string? / string?",
        t(
          "label مطلوب، ويرتبط به نص المساعدة والخطأ. يتولّى تطبيقك التحقق.",
          "Required label with associated help and error. Application owns validation.",
        ),
      ],
      [
        "checked / defaultChecked / onChange",
        "boolean? / boolean? / ChangeEventHandler<HTMLInputElement>",
        t(
          "إن كان تطبيقك يدير القيمة فحدّث checked من onChange. مع defaultChecked تعمل إعادة الضبط الأصلية.",
          "Controlled usage updates checked from onChange. Uncontrolled defaults support native reset.",
        ),
      ],
      [
        "disabled / required / name / value / form / ref",
        "Native input attributes / HTMLInputElement ref",
        t(
          "تُطبَّق الخصائص والأحداث وclassName/style وref على input. لا يدعم الحالة غير المحددة ولا تحديد الصفوف.",
          "Attributes, events, className/style and ref target input. No indeterminate state or row selection.",
        ),
      ],
      [
        "invalid / aria-describedby",
        "boolean? / string?",
        t(
          "يعلّم error العنصر غير صالح، وتُدمج معرّفات الوصف الخارجية دون تكرار.",
          "Error marks invalid; external description IDs are merged without duplicates.",
        ),
      ],
    ],
    "radio-group": [
      [
        "label / name / options",
        "string / string / readonly RadioOption[]",
        t(
          "label الذي يظهر في legend وname المشترك مطلوبان. لكل خيار قيمة فريدة ثابتة وتسمية نصية، وdisabled اختياري.",
          "Required legend label and shared name. Unique stable values, string labels and optional disabled per option.",
        ),
      ],
      [
        "value / defaultValue / onValueChange",
        "string? / string? / (value: string) => void",
        t(
          "خيارات أصلية تحفظ التنقل بالأسهم والاختيار الواحد. إن كان تطبيقك يدير القيمة فحدّثها من onValueChange.",
          "Native radios retain arrow navigation and one choice. Controlled usage updates value from the callback.",
        ),
      ],
      [
        "required / disabled / helper / error",
        "boolean? / boolean? / string? / string?",
        t(
          "يُطبَّق required على المدخلات، وdisabled على المجموعة. يرتبط نص المساعدة والخطأ بالمجموعة وبكل خيار.",
          "Required applies to inputs; disabled to the fieldset. Help/error describe the group and each option.",
        ),
      ],
      [
        "native attributes / form / ref",
        "ComponentPropsWithRef<fieldset> / HTMLFieldSetElement ref",
        t(
          "تُطبَّق ref وclassName/style والأحداث على fieldset، وتصل form إلى المدخلات. حين يدير المكوّن القيمة تعمل إعادة الضبط الأصلية دون callback، وحين يديرها تطبيقك تحتاج onReset.",
          "Ref, className/style and events target fieldset. Form association reaches inputs. Native uncontrolled reset emits no callback; controlled reset needs application onReset.",
        ),
      ],
    ],
    textarea: [
      [
        "label / helper / error / field",
        "Same convenience/composition modes as Input",
        t(
          "يعمل helper وerror مع label. لا تجمع label/helper/error مع field. تجد توثيق Field تحت Input.",
          "Help/error accompany label. Do not combine label/helper/error with field. Field is documented under Input.",
        ),
      ],
      [
        "value / defaultValue / onChange",
        "Native textarea attributes",
        t(
          "مع value يتولّى تطبيقك الحالة وإعادة الضبط. مع defaultValue تبقى إعادة الضبط الأصلية.",
          "Value mode needs application state and reset handling. DefaultValue retains native reset.",
        ),
      ],
      [
        "rows / disabled / readOnly / required / name / form / ref",
        "Native attributes / HTMLTextAreaElement ref",
        t(
          "٣ أسطر افتراضيًا. يجري التحرير والتحديد على textarea، وتُطبَّق عليه الخصائص والأحداث وref. يتغيّر الحجم عموديًا، ولا يتمدد الحقل تلقائيًا ولا يعرض عدادًا.",
          "Defaults to 3 rows. Editing, selection, attributes, events and ref target textarea. Vertical resizing; no automatic growth or counter.",
        ),
      ],
      [
        "invalid / aria-describedby / className / style",
        "Same as Input",
        t(
          "تُدمج معرّفات الوصف الخارجية وحالة عدم الصلاحية على الحقل نفسه. يتولّى تطبيقك التحقق.",
          "External descriptions and invalid state stay on the control; validation belongs to the application.",
        ),
      ],
    ],
    "data-table": [
      [
        "data / columns / getRowId",
        "readonly T[] / readonly DataTableColumn<T>[] / (row: T) => Key",
        t(
          "يتولّى تطبيقك البيانات والتصفية والإجراءات. أعِد من getRowId مفتاحًا فريدًا ثابتًا لكل صف.",
          "Application owns data, filtering and actions. Supply a stable unique row ID.",
        ),
      ],
      [
        "DataTableColumn<T>",
        "id: string; header: string; cell: (row: T) => ReactNode; sortValue?: (row: T) => string; rowHeader?: boolean",
        t(
          "يتيح sortValue فرز العمود نصيًا، ويجعل rowHeader الخلية عنوانًا أصليًا للصف.",
          "sortValue enables text sorting. rowHeader renders a native row header.",
        ),
      ],
      [
        "caption / locale",
        "string / string",
        t(
          "caption عنوان أصلي للجدول، وlocale لغة Intl.Collator مع numeric=true وsensitivity=base.",
          "Native caption and Intl.Collator locale with numeric=true and sensitivity=base.",
        ),
      ],
      [
        "labels",
        "DataTableLabels",
        t(
          "previous وnext وpagination نصوص مترجمة، أما sortAscending(header) وsortDescending(header) وresultCount(from,to,total) فدوال تُرجع نصًا.",
          "Translated previous, next, pagination strings. sortAscending(header), sortDescending(header), resultCount(from,to,total) return strings.",
        ),
      ],
      [
        "emptyContent / loading",
        "ReactNode / boolean? = false",
        t(
          "مرّر من تطبيقك محتوى حالتي الفراغ والخطأ. يضبط loading السمة aria-busy ويعرض صفحة من صفوف هيكل التحميل ويعطّل أزرار الصفحات.",
          "Application content for empty and error states. loading sets aria-busy, shows a page of skeleton rows and disables page controls.",
        ),
      ],
      [
        "pageSize / resetKey",
        "number? = 10 / string | number?",
        t(
          "حجم موجب يُقرّب إلى عدد صحيح. غيّر resetKey للعودة إلى الصفحة الأولى، والفرز يعيدها تلقائيًا. إذا قلّت البيانات تبقى الصفحة ضمن النطاق.",
          "Positive size rounded down; invalid sizes normalize to 1 (nonfinite to 10). Change resetKey when filters change to return to page one. Sort resets automatically; shrinking data clamps the page permanently.",
        ),
      ],
      [
        "Scope",
        "Client-side only",
        t(
          "لا يدعم التحديد ولا التحرير ولا الحذف ولا virtualization ولا الأعمدة الثابتة ولا بيانات الخادم. يبقى Table الأساس البسيط المبني على HTML.",
          "No selection, editing, deletion, virtualization, sticky columns or server framework. Table remains the simple HTML foundation.",
        ),
      ],
    ],
    table: [
      [
        "Table · caption",
        "ReactNode?",
        t(
          "عنوان caption أصلي. دونه سمِّ الجدول عبر aria-label أو aria-labelledby.",
          "Native caption. Without it, name the table with aria-label or aria-labelledby.",
        ),
      ],
      [
        "Table · native attributes / ref",
        "ComponentPropsWithRef<table>",
        t(
          "تُطبَّق الخصائص والأحداث والتنسيق وref على table نفسه.",
          "Attributes, events, className/style and ref target the table itself.",
        ),
      ],
      [
        "Table · containerProps",
        "ComponentPropsWithRef<div>?",
        t(
          "حاوية تمرير أفقي تستقبل التركيز وتأخذ اسمها من الجدول. لها خصائص وref منفصلة، وأبقِ tabIndex=0 ليصل إليها مستخدم لوحة المفاتيح.",
          "Focusable horizontal scroll container named from the table. Separate attributes/ref; retain tabIndex=0 for keyboard access.",
        ),
      ],
      [
        "TableHeader / TableBody / TableRow",
        "Native thead / tbody / tr props and refs",
        t(
          "تركيب HTML أصلي. استخدم مفتاحًا فريدًا ثابتًا لكل صف بيانات.",
          "Native HTML composition; use stable unique keys for data rows.",
        ),
      ],
      [
        "TableHead / TableCell",
        "Native th / td props and refs",
        t(
          "العناوين scope=col افتراضيًا، واستخدم scope=row لعناوين الصفوف. تقبل الخلايا colSpan وheaders. مرّر محتوى الحالة الفارغة من تطبيقك.",
          "Headers default to scope=col; use scope=row for row headers. Cells accept colSpan/headers. Empty content belongs to the application.",
        ),
      ],
      [
        "Appearance / scope",
        "SystemProvider",
        t(
          "تأتي الكثافة وحجم النص والاتجاه من النظام. يلتف النص ويتمرّر الجدول أفقيًا. لا فرز ولا تصفية ولا تقسيم صفحات ولا تحديد ولا تحرير ولا virtualization ولا أعمدة ثابتة.",
          "Shared density, text scale and direction. Wrapping and horizontal scroll; no sorting, filtering, pagination, selection, editing, virtualization or sticky columns.",
        ),
      ],
    ],
    field: [
      [
        "label / helper / error",
        "string / string? / string?",
        t(
          "يتولّى تطبيقك قواعد التحقق. يعرض error الرسالة ويعلّم الحقل غير صالح فقط.",
          "The application owns validation rules. error only displays feedback and marks the control invalid.",
        ),
      ],
      [
        "children",
        "(control: FieldControlProps) => ReactNode",
        t(
          "لعنصر واحد: مرّر control إلى Input أو Select عبر field. لا يستنسخ المكوّن العناصر تلقائيًا.",
          "One control: pass control as field to Input or Select; children are never cloned.",
        ),
      ],
      [
        "required / id / className / aria-describedby",
        "boolean? / string? / string? / string?",
        t(
          "يولّد المكوّن معرّفًا ثابتًا، أو مرّر id فريدًا من تطبيقك. تُدمج معرّفات الأوصاف الخارجية.",
          "Stable generated ID or unique caller ID. External description IDs are merged.",
        ),
      ],
      [
        "FieldControlProps",
        "id, aria-labelledby, aria-describedby?, aria-invalid?, required?",
        t(
          "يربط التسمية بنص المساعدة والخطأ، وتأتي id من field. يُظهر required النجمة ويمرّر القيد الأصلي.",
          "Associates label, help and error; field owns id. required shows an indicator and forwards the native constraint.",
        ),
      ],
    ],
    input: [
      [
        "label / helper / error",
        "string? / string? / string?",
        t(
          "ابدأ بـ Input: يضيف label مكوّن Field داخليًا للتسمية والمساعدة والخطأ. يعمل helper وerror مع label فقط، ولا تجمع label مع field. يعلّم error الحقل غير صالح دون أن ينفّذ التحقق.",
          "Start with Input. label adds Field internally for label, helper and error. helper/error require label; label and field cannot be combined. error marks invalid without running validation rules.",
        ),
      ],
      [
        "type / size",
        "InputType / sm | md",
        t(
          "النوع الافتراضي text والحجم الافتراضي sm. يدعم text/email/password/search/tel/url فقط.",
          "Defaults to text and sm. Supports text/email/password/search/tel/url only.",
        ),
      ],
      [
        "value / defaultValue / onChange",
        "Native input props",
        t(
          "إن كان تطبيقك يدير value فمرّر onChange. حين يدير المكوّن القيمة يعمل reset الأصلي، وحين يديرها تطبيقك عالج onReset بنفسك.",
          "Controlled value requires onChange. Uncontrolled reset is native; handle onReset in the application for controlled values.",
        ),
      ],
      [
        "field / invalid",
        "FieldControlProps? / boolean?",
        t(
          "دون label يبقى Input مستقلًا: سمِّه بتسمية HTML أو ARIA خارجية، أو استخدم field للتركيب منخفض المستوى. تُدمج الأوصاف الخارجية.",
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
          "في React 19 تبقى ref وclassName وstyle على input حتى مع label. أما size/type/children فتحل محل الخصائص الأصلية بالاسم نفسه.",
          "React 19 ref, className and style target input even in labeled mode. Native size/type/children are replaced by the typed API.",
        ),
      ],
    ],
    select: [
      [
        "options",
        "SelectOption[]: value, label, disabled?",
        t(
          "استخدم قيمًا فريدة غير فارغة وتسميات واضحة. حين تكون القيمة فارغة يظهر placeholder. لا بحث ولا اختيار متعدد.",
          "Unique nonempty values and meaningful labels. Empty value shows the placeholder. Single select; no search or multi-select.",
        ),
      ],
      [
        "value / defaultValue / onValueChange",
        "string / string? / (string) => void",
        t(
          "حين يدير طِراز القيمة، يطلب reset الناجح القيمة الأولية بعد اكتمال الحدث، وإلغاء الحدث يُبقي القيمة دون callback. يتبع reset النموذج الحالي حتى لو استُبدل أو أُضيف لاحقًا، دون إعادة تركيب Select.",
          "Tiraz manages uncontrolled values. Successful reset requests the initial value after event dispatch; cancellation preserves the value without a callback. Reset follows the current form after replacement or late insertion without remounting Select.",
        ),
      ],
      [
        "size / placeholder / disabled / required / invalid / field",
        "sm | md / string? / booleans / FieldControlProps?",
        t(
          "الحجم الافتراضي sm. سمِّه بتسمية خارجية أو Field. لا ينفّذ قواعد التحقق في تطبيقك.",
          "sm default; name with an external label or Field. Does not perform application validation.",
        ),
      ],
      [
        "name / form / autoComplete",
        "string?",
        t(
          "يدعم select أصلي مخفي FormData وreset وrequired. لا يغيّر checkValidity التركيز. حين يتلقى العنصر الأصلي التركيز فعلًا ينتقل التركيز إلى زر الاختيار. يستطيع تطبيقك إلغاء حدث invalid من حاوية الحقل ونقل التركيز إلى ملخص الأخطاء.",
          "The hidden select supports FormData, reset and required. checkValidity does not move focus. Actual native focus redirects to the trigger; ancestor invalid handlers can cancel reporting and focus an error summary. onInvalid remains a trigger-button prop.",
        ),
      ],
      [
        "ref / id / className / style / ARIA / data-* / button events",
        "Ref<HTMLButtonElement> / native button props",
        t(
          "يشير ref إلى زر الفتح. تُستبدل children/type/value/defaultValue/onChange، وتذهب name/form إلى العنصر الأصلي. لا تتيح هذه الواجهة open/defaultOpen ولا تخصيص القائمة المنبثقة.",
          "ref targets trigger. children/type/value/defaultValue/onChange are replaced; name/form target native form participation. No open/defaultOpen or popup customization API.",
        ),
      ],
      [
        "keyboard / popup",
        "Radix Select 2.4.1",
        t(
          "تنقّل بالأسهم وHome/End أو بالكتابة، واستخدم Enter/Escape، ويعود التركيز بعد الإغلاق. تبقى القائمة داخل SystemProvider وSheet وتتمرّر داخليًا. الحركة تغيير في الشفافية فقط، وتحترم تقليل الحركة.",
          "Arrows, Home/End, typeahead, Enter/Escape and focus restoration. Popup stays within SystemProvider/Sheet and scrolls internally. Opacity motion respects app and OS reduction.",
        ),
      ],
    ],
    button: [
      [
        "variant / state / size",
        "ButtonVariant / ButtonState / sm | md",
        t(
          "الحجم الافتراضي sm. تمنع حالة loading الضغط وتضبط aria-busy.",
          "sm is the default. Loading blocks clicks and manages aria-busy.",
        ),
      ],
      [
        "children / iconOnly / aria-label",
        "ReactNode / boolean / string",
        t(
          "مع iconOnly يلزمك اسم يقرؤه قارئ الشاشة. ضع الأيقونات داخل children.",
          "An accessible name is required for iconOnly. Icons compose inside children.",
        ),
      ],
      [
        "disabled / type / id / className / style",
        "HTML button attributes",
        t(
          "سمات أصلية. النمط العريض في المعاينة مثال على style.",
          "Native attributes. The wide preset demonstrates style.",
        ),
      ],
      [
        "...HTML / ARIA / data-*",
        "ButtonHTMLAttributes",
        t(
          "يشمل title وname وvalue وform* وtabIndex وdir وautoFocus وغيرها. مرّرها في كود تطبيقك.",
          "Includes title, name, value, form*, tabIndex, dir, autoFocus and other native attributes. Pass these attributes in your application code.",
        ),
      ],
      [
        "onClick / ...native events",
        "React event handlers",
        t(
          "توضّح المحاكاة أو سجل الأحداث عمل onClick. اربط المعالجات الأخرى بدوال في تطبيقك.",
          "Simulation and logging demonstrate onClick. Other event handlers are functions supplied by your application.",
        ),
      ],
      [
        "ref",
        "No explicit typed ref prop",
        t(
          "لا يعرّف ButtonProps خاصية ref صريحة، لذا لا نعرض لها حقل تحكّم وهميًا.",
          "ButtonProps has no explicit ref prop; there is no pretend editor for it.",
        ),
      ],
    ],
    tabs: [
      [
        "items",
        "TabItem[]",
        t(
          "لكل تبويب value فريد، وlabel وcontent من نوع ReactNode، وdisabled اختياري. ركّب محتوى ReactNode في كود تطبيقك.",
          "Unique value; label/content are ReactNode; disabled is optional. Compose ReactNode content in your application code.",
        ),
      ],
      [
        "label / variant / className",
        "string / underline | segment / string",
        t(
          "يسمّي label قائمة التبويبات لقارئات الشاشة.",
          "label names the tab list for assistive technology.",
        ),
      ],
      [
        "value / defaultValue",
        "string",
        t(
          "يدير تطبيقك value، أما defaultValue فقيمة أولية. دونهما يُختار أول تبويب مفعّل.",
          "Controlled value or initial value; defaults to the first enabled item.",
        ),
      ],
      [
        "onValueChange",
        "(value: string) => void",
        t(
          "يظهر كل تغيير في التحديد مباشرة في سجل الأحداث والكود.",
          "Selection changes update the event record and usage code.",
        ),
      ],
      [
        "ref",
        "Not exposed",
        t(
          "لا يعرض المكوّن ref في واجهته.",
          "The component does not expose a ref.",
        ),
      ],
    ],
    switch: [
      [
        "label / description",
        "string",
        t(
          "يرتبط label بالمفتاح، ويصل description إليه عبر aria-describedby.",
          "label is connected to the switch; description supplies aria-describedby.",
        ),
      ],
      [
        "checked / defaultChecked / onCheckedChange",
        "boolean / boolean / (boolean) => void",
        t(
          "اختر أن يدير تطبيقك الحالة أو يديرها المكوّن. يبدّل Space الحالة.",
          "Choose controlled or internal state. Space toggles it.",
        ),
      ],
      [
        "disabled / required / name / value / type",
        "Native switch/button props",
        t(
          "يرث سمات النموذج الأصلية من Radix Switch.Root.",
          "Native form attributes inherited from Radix Switch.Root.",
        ),
      ],
      [
        "id / className / style / ...DOM attributes",
        "ComponentProps<Switch.Root>",
        t(
          "يُطبَّق className على حاوية التسمية، وstyle وسمات DOM على المفتاح نفسه.",
          "className styles the label wrapper; style and DOM attributes apply to the switch control.",
        ),
      ],
      [
        "children / asChild",
        "Managed by the wrapper",
        t(
          "يبني المكوّن Thumb بنفسه، فلا تمرّر children أو asChild.",
          "The wrapper owns its Thumb structure. children and asChild are excluded from its public API.",
        ),
      ],
      [
        "ref / ...native events",
        "Ref<HTMLButtonElement> / event handlers",
        t(
          "يصل ref الموروث إلى زر المفتاح، وليس قيمة تُعدَّل هنا. باقي الأحداث دوال في تطبيقك.",
          "The inherited ref targets the switch button. It is not an editable value. Other native events are application functions.",
        ),
      ],
    ],
    dropdown: [
      [
        "trigger",
        "ReactElement",
        t(
          "يركّب المثال Button بتسمية ونوع وحجم.",
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
          "open اختياري. حين يدير المكوّن الحالة يفتح زر التفعيل القائمة.",
          "open is optional; in internal mode the trigger opens the menu.",
        ),
      ],
      [
        "items[].onSelect",
        "() => void",
        t(
          "يُسجَّل معرّف العنصر عند كل اختيار. اكتب الدوال في تطبيقك.",
          "Selections record item IDs. Callback functions belong to your application.",
        ),
      ],
      [
        "ref / children / className / side",
        "Not exposed as DropdownMenu props",
        t(
          "لا تضف هذه الخصائص. خصّص القائمة عبر trigger وitems والمحاذاة فقط.",
          "Do not add these props. Compose trigger/items and use alignment instead.",
        ),
      ],
    ],
    sheet: [
      [
        "trigger / children / footer",
        "ReactElement / ReactNode / ReactNode",
        t(
          "ركّب زرًا للفتح ومحتوى تمثيليًا وتذييلًا اختياريًا. يستخدم زر التذييل Radix Dialog.Close ليعمل في الحالتين.",
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
          "يدير تطبيقك الحالة أو يديرها المكوّن. يعود التركيز بعد الإغلاق.",
          "Controlled or internal state. Dismissal restores focus.",
        ),
      ],
      [
        "side",
        "right | left (optional)",
        t(
          "إذا حذفتها تظهر اللوحة يمينًا في RTL ويسارًا في LTR. لا تتيح API تعديل العرض.",
          "When omitted: right in RTL, left in LTR. Width is not an API prop.",
        ),
      ],
      [
        "ref / className",
        "Not exposed",
        t(
          "لا نعرض حقول تحرير لخصائص لا تتيحها الواجهة.",
          "No controls are fabricated for unexposed props.",
        ),
      ],
    ],
    toast: [
      [
        "ToastProvider.children / label / closeLabel",
        "ReactNode / string / string",
        t(
          "children محتوى تطبيقك، ويسمّي label الإعلانات ومنطقة التنبيهات.",
          "children is application content. label names announcements and the toast viewport.",
        ),
      ],
      [
        "useToast().toast",
        "(ToastMessage) => void",
        t(
          "استدعِ toast من داخل ToastProvider. يعرض سجل الأحداث tone وduration.",
          "Call inside ToastProvider. The event record shows tone and duration.",
        ),
      ],
      [
        "title / description / tone",
        "string / string? / success | error | info | warning",
        t(
          "title مطلوب وdescription اختياري، وقيمة tone الافتراضية info.",
          "title is required; tone defaults to info; description is optional.",
        ),
      ],
      [
        "duration",
        "number (milliseconds)",
        t(
          "القيمة الافتراضية 5000. يتيح حقل المدة في المعاينة من 1000 إلى 60000ms.",
          "Defaults to 5000. The inspector demonstrates 1000–60000ms.",
        ),
      ],
      [
        "open / ref / placement / className",
        "Not exposed",
        t(
          "يدير المكوّن الطابور والإغلاق بنفسه. لا توجد خاصية لتحديد موضع التنبيه.",
          "Queue and dismissal are internal. Placement is not a configurable prop.",
        ),
      ],
    ],
  };
  // One table per group: the page's own props, then a group the reference
  // names under a heading of its own (Input's Field).
  function table(
    list: Array<[string, string, string]>,
    props: readonly Prop[],
    labelledBy: string,
  ) {
    return (
      <div
        className="api-scroll"
        tabIndex={0}
        role="region"
        aria-labelledby={labelledBy}
      >
        <table aria-labelledby={labelledBy}>
          <thead>
            <tr>
              <th scope="col">{t("الخاصية", "Prop")}</th>
              <th scope="col">{t("النوع", "Type")}</th>
              <th scope="col">{t("الافتراضي", "Default")}</th>
              <th scope="col">{t("الوصف", "Description")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map(([name, type, note]) => {
              // A row may name several props, «a / b»; its facts follow them.
              const named = name.split(" / ");
              const facts = named.map((part) =>
                props.find((prop) => prop.name === part),
              );
              const required = named.filter((_, at) => facts[at]?.required);
              const defaults = facts.map((fact) =>
                literal(fact?.default, fact?.type ?? ""),
              );
              return (
                <tr key={name}>
                  <th scope="row">
                    <code dir="ltr">{name}</code>
                    {required.length > 0 && (
                      <span className="api-required">
                        {t("مطلوبة", "Required")}
                        {required.length < named.length && (
                          <>
                            {": "}
                            <code dir="ltr">{required.join(" / ")}</code>
                          </>
                        )}
                      </span>
                    )}
                  </th>
                  <td>
                    <code dir="ltr">{type}</code>
                  </td>
                  <td>
                    {defaults.some(Boolean) ? (
                      <code dir="ltr">
                        {defaults.map((value) => value ?? "—").join(" / ")}
                      </code>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  // Always open: the page's last section, under its own heading, which also
  // names the table's scrolling box.
  return (
    <section className="reference-section">
      <div className="section-title-row">
        <h2 id={`${id}-api`}>{label("api", language)}</h2>
      </div>
      <p>
        {t("تجد الواجهة الفعلية في", "Actual interface in")}{" "}
        <bdi dir="ltr">src/system/{file}</bdi>.
      </p>
      {table(rows[component], propsOf(component), `${id}-api`)}
      {component === "input" && (
        <>
          <h3 id={`${id}-field`}>
            {t("Field · مساعد تركيب", "Field · composition helper")}
          </h3>
          <p>
            {t(
              "واجهة منخفضة المستوى لتركيب Input وSelect. يبقى تصديرها وطريقة تركيبها الحالية متاحين.",
              "Lower-level composition for Input and Select. Its public export and existing composition remain available.",
            )}
          </p>
          {table(rows.field, propsOf("field"), `${id}-field`)}
        </>
      )}
      <p className="api-note">
        {t(
          "يشارك SystemProvider إعدادات المظهر بين المكوّنات. الخصائص التي لا تظهر في المعاينة متاحة في API، فاربط الدوال وrefs في كود تطبيقك.",
          "Appearance is shared through SystemProvider. Properties omitted from the compact inspector remain available in the API; supply functions and refs in application code.",
        )}
      </p>
      <p className="sr-only">
        {fields[component].map((f) => f.api).join(", ")}
      </p>
    </section>
  );
}
