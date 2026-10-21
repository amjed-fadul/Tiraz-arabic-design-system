import type { Localized } from "./i18n";
import type { GuideId } from "./site-routes";
export interface Guide {
  id: GuideId;
  name: Localized;
  title: Localized;
  description: Localized;
  sections: { title: Localized; text: Localized; items?: Localized[] }[];
  code?: string;
  codeTitle?: Localized;
}
export const guides: readonly Guide[] = [
  {
    id: "introduction",
    name: ["مقدمة", "Introduction"],
    title: [
      "صُمّم للعربية. جاهز لتطبيقك.",
      "Built for Arabic. Ready for your app.",
    ],
    description: [
      "طِراز مكتبة React تملك مصدرها، بشاشات ومكوّنات تبدأ من العربية وتعمل بالإنجليزية أيضًا.",
      "Tiraz is a source-owned React library, with screens and components designed in Arabic and ready for English too.",
    ],
    sections: [
      {
        title: ["ابدأ بما تريد بناءه", "Start with what you want to build"],
        text: [
          "استكشف الشاشات لترى المكوّنات معًا، أو اختر مكوّنًا وجرّبه مباشرة. لكل صفحة معاينة قابلة للتخصيص، ومثال تنسخه، وإرشادات استخدام، ودليل خصائص.",
          "Explore the screens to see components working together, or choose a component and try it directly. Each page includes a customizable preview, a copyable example, usage guidance, and an API reference.",
        ],
      },
      {
        title: ["المصدر في تطبيقك", "The source lives in your app"],
        text: [
          "انسخ مجلد النظام كاملًا إلى مشروعك. تبقى المكوّنات والأنماط والأمثلة والإرشادات معًا؛ وتملك أنت البيانات والحالة والطلبات إلى الخادم. لا تحتاج إلى خدمة طِراز أو حساب جديد.",
          "Copy the complete system directory into your project. Components, styles, examples, and guidance stay together; your application owns data, state, and server requests. No Tiraz service or new account is needed.",
        ],
      },
      {
        title: ["من التفاصيل إلى الشاشة", "From a detail to a screen"],
        text: [
          "استخدم المكوّنات الأساسية للحالات البسيطة، وأنماط العمل عندما تحتاج إلى مسار كامل، مثل مراجعة مسودة أو طلب موافقة. أمثلة الشاشات تربطها ببيانات محلية لتوضيح الاستخدام.",
          "Use foundational components for simple interactions and composed patterns for complete workflows, such as reviewing a draft or requesting approval. Example screens connect them with local data to demonstrate their use.",
        ],
      },
    ],
  },
  {
    id: "installation",
    name: ["نسخ النظام", "Copy the system"],
    title: ["أضف طِراز إلى مشروعك", "Add Tiraz to your project"],
    description: [
      "ابدأ بالمصدر الكامل، ثم اربط الأنماط والخط في نقطة دخول تطبيقك.",
      "Start with the complete source, then connect the styles and font in your app entry point.",
    ],
    sections: [
      {
        title: ["انسخ المجلد كاملًا", "Copy the complete directory"],
        text: [
          "انسخ src/system مع مجلد ai ومحتوياته: الأمثلة والبيانات والإرشادات والأصول وتراخيصها. يمكنك استبعاد ملفات الاختبار. لا يحتاج التطبيق المستهلك إلى ملفات workbench.",
          "Copy src/system together with ai: its examples, metadata, guidance, assets, and licenses. Test files may be excluded. The consuming app does not need workbench files.",
        ],
      },
      {
        title: ["استخدم أدوات مشروعك", "Use your existing toolchain"],
        text: [
          "هذا المصدر مُتحقّق منه مع React 19 وTypeScript. افحص ملف الحزم والقفل عند النسخ، واحتفظ بالاعتماديات اللازمة للمكوّنات التي تستخدمها، ومنها lucide-react وحزم Radix. لا توجد خطوة تثبيت باسم tiraz ولا أداة أوامر خاصة به.",
          "The source is verified with React 19 and TypeScript. Check the package and lock files when copying, and retain the dependencies required by your components, including lucide-react and Radix packages. There is no tiraz package-install step or dedicated CLI.",
        ],
      },
      {
        title: ["حمّل الأنماط والخط مرة واحدة", "Load styles and fonts once"],
        text: [
          "حمّل tokens.css ثم components.css، وخط IBM Plex Sans Arabic بالأوزان العادي والمتوسط وشبه العريض. عدّل مسارات الاستيراد لتطابق مكان النظام في مشروعك، وتحقّق من تحميل الخط في المتصفح.",
          "Load tokens.css followed by components.css, and IBM Plex Sans Arabic in regular, medium, and semibold weights. Adjust imports to the system's location in your project and verify the font loads in the browser.",
        ],
      },
    ],
    codeTitle: ["في نقطة دخول التطبيق", "In your app entry point"],
    code: `import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";`,
  },
  {
    id: "providers",
    name: ["المزوّد واللغة", "Provider and language"],
    title: [
      "سياق واحد للمظهر والاتجاه",
      "One context for appearance and direction",
    ],
    description: [
      "ضع المزوّد حول واجهتك لتصل الإعدادات إلى المكوّنات والنوافذ المنبثقة معًا.",
      "Wrap your interface so components and their overlays share the same settings.",
    ],
    sections: [
      {
        title: ["ابدأ بالإعدادات الافتراضية", "Start from the defaults"],
        text: [
          "يقبل SystemProvider إعدادات النظام كاملة. انسخ defaultConfig ثم غيّر ما تحتاجه، مثل المظهر أو الاتجاه. لا تمرّر كائن إعدادات ناقصًا.",
          "SystemProvider accepts the complete system configuration. Spread defaultConfig, then override settings such as theme or direction. Do not pass a partial configuration object.",
        ],
      },
      {
        title: ["اللغة فوق المزوّد", "Place language above the provider"],
        text: [
          "ضع lang وdir على عنصر يحيط بالمزوّد، أو على المستند. بهذا ترث النوافذ والتنبيهات اللغة أيضًا. لا يملك SystemProvider خاصية lang؛ واللغة وحدها لا تغيّر النصوص التي يزوّدها تطبيقك.",
          "Set lang and dir on an ancestor of the provider, or on the document, so overlays and notifications inherit the language too. SystemProvider has no lang prop; language settings do not translate application-supplied copy.",
        ],
      },
      {
        title: [
          "التنبيهات ضمن السياق",
          "Keep notifications inside the context",
        ],
        text: [
          "عند استخدام التنبيهات، ضع ToastProvider داخل SystemProvider، واستدعِ useToast من أحد أبنائه. أبقِ المزوّد حول النوافذ كي تحتفظ بألوانها واتجاهها.",
          "For notifications, place ToastProvider inside SystemProvider and call useToast from a descendant. Keep the provider around overlays so their colors and direction remain scoped.",
        ],
      },
    ],
    codeTitle: ["واجهة عربية بمظهر فاتح", "An Arabic interface in light mode"],
    code: `import { Button, SystemProvider, defaultConfig } from "./system";

export function Example() {
  return (
    <div lang="ar" dir="rtl">
      <SystemProvider config={{ ...defaultConfig, direction: "rtl", theme: "light" }}>
        <Button onClick={() => console.log("Save requested")}>
          حفظ
        </Button>
      </SystemProvider>
    </div>
  );
}`,
  },
  {
    id: "theming",
    name: ["المظهر والرموز", "Theme and tokens"],
    title: ["غيّر المظهر من مكان واحد", "Change appearance in one place"],
    description: [
      "إعدادات مشتركة وألوان دلالية تحافظ على اتساق الواجهة.",
      "Shared settings and semantic colors keep the interface consistent.",
    ],
    sections: [
      {
        title: ["اختر المظهر ولون التمييز", "Choose a theme and accent"],
        text: [
          "تدعم الإعدادات المظهر الفاتح والداكن، ولوحات تمييز متوافقة معهما، مثل sage وblue وplum وclay وink. تختار المكوّنات ألوان الإجراء والتركيز من اللوحة النشطة.",
          "Configuration supports light and dark themes, with paired accents including sage, blue, plum, clay, and ink. Components take their action and focus colors from the active palette.",
        ],
      },
      {
        title: ["استخدم الرموز الدلالية", "Use semantic tokens"],
        text: [
          "عند تركيب شاشة، استخدم رموز السطح والنص والحدود والمسافات الموجودة في النظام. بهذه الطريقة تتبع العناصر الجديدة المظهر بدل تثبيت ألوان لا تناسب الوضع الداكن.",
          "When composing a screen, use the system's surface, text, border, and spacing tokens. New elements then follow the theme instead of carrying fixed colors that fail in dark mode.",
        ],
      },
      {
        title: ["اضبط الكثافة والحركة", "Tune density and motion"],
        text: [
          "اختر كثافة compact أو standard، واضبط reducedMotion عند الحاجة. احترم تفضيل تقليل الحركة في نظام التشغيل أيضًا، ولا تشغّل مثالًا تفاعليًا أو عملية لم يطلبها المستخدم.",
          "Choose compact or standard density and set reducedMotion when needed. Respect the operating system's motion preference too, and do not start an interactive demo or operation the person did not request.",
        ],
      },
    ],
    codeTitle: ["إعدادات مشتركة", "Shared configuration"],
    code: `const config = {
  ...defaultConfig,
  theme: "dark" as const,
  accent: "sage" as const,
  density: "standard" as const,
  reducedMotion: true,
};

<SystemProvider config={config}>{children}</SystemProvider>`,
  },
  {
    id: "rtl",
    name: ["الاتجاه والأرقام", "RTL and numerals"],
    title: ["العربية في كل تفصيل", "Arabic in every detail"],
    description: [
      "الاتجاه، الأرقام، والنص المختلط جزء من الواجهة نفسها.",
      "Direction, numerals, and mixed-script text are part of the interface itself.",
    ],
    sections: [
      {
        title: ["استخدم الاتجاه المنطقي", "Use logical direction"],
        text: [
          "استخدم خصائص CSS المنطقية مثل padding-inline وmargin-block. اعكس الأيقونات الاتجاهية فقط عبر tz-mirror-rtl، مثل سهم الانتقال؛ واترك أيقونات النسخ والشمس كما هي. احتفظ بـ :dir() في مسار بناء CSS.",
          "Use logical CSS properties such as padding-inline and margin-block. Mirror only directional icons with tz-mirror-rtl, such as a navigation arrow; leave copy and sun icons unchanged. Preserve :dir() in your CSS build pipeline.",
        ],
      },
      {
        title: [
          "نسّق الأرقام من الإعدادات",
          "Format numbers from configuration",
        ],
        text: [
          "استخدم numberLocale مع Intl.NumberFormat كي تتبع الأرقام اللغة وتفضيل numerals. تعرض العربية الأرقام العربية الهندية افتراضيًا، وتستخدم الإنجليزية الأرقام الغربية. الأرقام المكتوبة داخل نص جاهز لا تتحول تلقائيًا.",
          "Use numberLocale with Intl.NumberFormat so figures follow the language and numerals preference. Arabic defaults to Arabic-Indic digits, while English uses Western digits. Digits written directly into supplied text are not converted automatically.",
        ],
      },
      {
        title: ["اعزل المعرّفات اللاتينية", "Isolate Latin identifiers"],
        text: [
          "ضع المعرّفات والمسارات اللاتينية في bdi باتجاه ltr. اكتب الرسائل والعدادات بصيغ عربية صحيحة، وجرّب النص الطويل والمختلط بدل الاكتفاء بعكس تخطيط الصفحة.",
          "Wrap Latin identifiers and paths in bdi with ltr direction. Supply correct Arabic count and gender forms, and test long and mixed-script text rather than only reversing the layout.",
        ],
      },
    ],
    codeTitle: [
      "رقم يتبع لغة الواجهة",
      "A number that follows the interface language",
    ],
    code: `import { numberLocale, useSystem } from "./system";

function Total({ value, language }: { value: number; language: "ar" | "en" }) {
  const { config } = useSystem();
  return <span>{new Intl.NumberFormat(numberLocale(config, language)).format(value)}</span>;
}`,
  },
  {
    id: "accessibility",
    name: ["إمكانية الوصول", "Accessibility"],
    title: ["واجهة يمكن الوصول إليها", "An interface people can reach"],
    description: [
      "أسماء واضحة، لوحة مفاتيح كاملة، وتركيز يعود إلى مكان مفهوم.",
      "Clear names, complete keyboard paths, and focus that returns somewhere useful.",
    ],
    sections: [
      {
        title: ["سمِّ الأفعال بوضوح", "Give actions clear names"],
        text: [
          "ابدأ الاسم الميسّر بالنص المرئي. أعطِ الأزرار التي تحمل أيقونة فقط اسمًا يصف فعلها. اربط حقول الإدخال بتسمياتها ومساعدتها وأخطائها، واجعل لكل صفحة عنوانًا رئيسيًا واحدًا.",
          "Start accessible names with the visible text. Give icon-only buttons a name describing their action. Associate inputs with their labels, help, and errors, and give each page one main heading.",
        ],
      },
      {
        title: ["اختبر المسار بلوحة المفاتيح", "Test the keyboard path"],
        text: [
          "تحقّق من ترتيب Tab، ومؤشر التركيز، وإغلاق النوافذ بـ Escape، وعودة التركيز إلى الزر الذي فتحها. عند اختفاء عنصر مركّز، انقل التركيز إلى وجهة مناسبة. يجب ألا يسجّل الإغلاق أو الإلغاء أي قرار.",
          "Check Tab order, visible focus, Escape dismissal, and focus returning to the trigger. When a focused element disappears, move focus to a useful destination. Closing or cancelling must not record a decision.",
        ],
      },
      {
        title: ["أعلن التغيّر مرة واحدة", "Announce a transition once"],
        text: [
          "عند تركيب أنماط متعددة، اجعل شاشة واحدة تملك الإعلانات، وعطّل الإعلانات المتداخلة حيث تدعمها الواجهة. اترك منطقة الحالة فارغة عند الفتح، وأعلن النتائج عند حدوثها. افحص التباين والحركة والأحجام الصغيرة في اللغتين.",
          "When composing patterns, let the screen own announcements and turn off nested announcements where the API supports it. Keep the status region empty on mount and announce outcomes when they happen. Check contrast, motion, and narrow layouts in both languages.",
        ],
      },
    ],
  },
  {
    id: "ai",
    name: ["العمل مع مساعد برمجي", "Work with a coding assistant"],
    title: [
      "أعطِ المساعد المصدر الصحيح",
      "Give the assistant the right source",
    ],
    description: [
      "المصدر والأنواع هما المرجع، والإرشادات والأمثلة تساعده على تركيب الواجهة.",
      "Source and types are authoritative; guidance and examples help the assistant compose the interface.",
    ],
    sections: [
      {
        title: ["وجّه المساعد إلى الحزمة", "Point to the bundle"],
        text: [
          "اطلب منه العثور على النظام أولًا وقراءة ai/README.md وai/registry.json وai/composition.md. إذا لم يجد المصدر، فليتوقف ويطلب المسار بدل اختراع واجهة أو تثبيت مكتبة أخرى.",
          "Ask it to locate the system first and read ai/README.md, ai/registry.json, and ai/composition.md. If it cannot find the source, it should stop and request the path instead of inventing APIs or installing another library.",
        ],
      },
      {
        title: ["ابدأ بمثال قريب", "Start from a close example"],
        text: [
          "اختر مكوّنًا أو نمط عمل من المكتبة، ثم انسخ طلب «استخدمه في تطبيقك». يضم الطلب الإعدادات الحالية والمسارات اللازمة. يبقى نص الطلب بالإنجليزية في اللغتين.",
          "Choose a component or workflow from the Library, then copy its “Use it in your app” prompt. It includes current settings and the needed source paths. Prompt text stays in English in both languages.",
        ],
      },
      {
        title: ["تحقّق مما بُني", "Verify the result"],
        text: [
          "راجع التركيب والبيانات والأفعال في تطبيقك، واختبر العربية والإنجليزية ولوحة المفاتيح. لا تجعل نجاح مثال محلي يعني أن عملية إرسال أو موافقة حدثت في خدمة حقيقية.",
          "Review composition, data, and actions in your app, and test Arabic, English, and the keyboard. A successful local example must not imply that a real service sent a message or recorded an approval.",
        ],
      },
    ],
    codeTitle: ["طلب بداية", "Starter prompt"],
    code: `Locate Tiraz in this project and read ai/README.md, ai/registry.json, and ai/composition.md.
Use the actual component source and exported types as the API contract.
Keep the complete source bundle and its examples/assets together.
Build the requested interface in Arabic and English, with logical CSS and numberLocale formatting.
Keep application data and side effects in the host. Verify keyboard focus, cancellation, and both themes.
If Tiraz is missing, stop and ask for its path.`,
  },
];
