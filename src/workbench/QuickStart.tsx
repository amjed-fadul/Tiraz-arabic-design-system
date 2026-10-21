import { useId, useState } from "react";
import { Check, Copy, ArrowUpRight, ChevronDown } from "lucide-react";
import { numberLocale } from "../system/config";
import sourceGuide from "../system/ai/README.md?url";
import type { Language } from "./i18n";
import { words } from "./i18n";
import "./quick-start.css";

const setupPrompt = (
  existing: boolean,
) => `${existing ? "Add Tiraz to this existing React and TypeScript application. Preserve its routes, data, and toolchain." : "Create a React 19 and TypeScript application using Vite, then add Tiraz."}
I will provide the Tiraz source directory. Read src/system/ai/README.md and the registry before making changes.
Copy the complete src/system directory into the app, keeping ai/, examples, assets, and licenses. Test files may be excluded. Do not overwrite an existing system directory without reviewing the differences.
Inspect the source imports and Tiraz package/lock files, then install compatible dependencies in the app. Load tokens.css, components.css, and IBM Plex Sans Arabic weights 400, 500, and 600 once.
Wrap the app with SystemProvider using the full defaultConfig. Put lang and dir on an ancestor; support Arabic RTL and English LTR with translated application copy. Preserve :dir() in the CSS build target.
Add an AGENTS.md entry pointing to the copied system/ai/README.md. Verify the app starts and builds, fonts load, and keyboard focus and both directions work. Report any missing source or dependencies instead of inventing a Tiraz installer.`;

const prompts = [
  {
    name: ["لوحة العملاء", "Customer dashboard"],
    description: [
      "أرقام واضحة وجدول قابل للبحث.",
      "Clear metrics and a searchable table.",
    ],
    text: "Read system/ai/README.md and the registry. Build a customer dashboard with Tiraz: a balanced metrics row, a searchable DataTable, and a customer detail view. Use local sample data and label simulated actions accurately. Support Arabic RTL and English LTR, format numbers through numberLocale, and verify keyboard navigation and mobile layout. Reuse existing components and tokens; consult their exported types before choosing props.",
  },
  {
    name: ["مراجعة الفواتير", "Invoice review"],
    description: [
      "مسودة من المساعد، والقرار بيدك.",
      "An assistant draft, with you in control.",
    ],
    text: "Read system/ai/README.md and the registry. Build an invoice review screen with Tiraz DataTable and DraftReview. Let the user select an invoice, review an assistant-written reminder, edit it, and confirm one send. Use local sample data. Closing or cancelling must record nothing; a receipt should describe only the action actually recorded. Support Arabic RTL and English LTR, sensible focus return, reduced motion, and one initially empty polite live region.",
  },
  {
    name: ["إعدادات الفريق", "Team settings"],
    description: [
      "أعضاء وصلاحيات وحفظ واضح.",
      "Members, permissions, and clear save feedback.",
    ],
    text: "Read system/ai/README.md and the registry. Build a responsive team settings page using Tiraz components. Include member roles, notification preferences, validation, and an explicit Save action. Keep changes local until saved; confirm destructive actions and preserve focus during async feedback. Support Arabic RTL and English LTR, localized numbers, light and dark themes, and keyboard-only operation. Use the existing component APIs and semantic tokens.",
  },
] as const;

const entryCode = `import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
import { Button, SystemProvider, defaultConfig } from "./system";

export function App() {
  return (
    <div lang="ar" dir="rtl">
      <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
        <Button>ابدأ الآن</Button>
      </SystemProvider>
    </div>
  );
}`;

/** Shared by the landing's adoption section and the workbench's Start here. */
export function QuickStart({
  language,
  headingLevel = 1,
}: {
  language: Language;
  headingLevel?: 1 | 2;
}) {
  const t = words(language);
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const StepHeading = headingLevel === 1 ? "h2" : "h3";
  const [existing, setExisting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const id = useId();
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "arab" }, language),
  );
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setFeedback(
        t(
          "نُسخ النص. الصقه في أداة البرمجة التي تستخدمها.",
          "Copied. Paste it into your coding tool.",
        ),
      );
    } catch {
      setCopied(null);
      setFeedback(
        t(
          "تعذّر النسخ. يمكنك تحديد النص ونسخه يدويًا.",
          "Could not copy. Select the text and copy it manually.",
        ),
      );
    }
  }
  const copyButton = (text: string, key: string, caption: string) => (
    <button
      type="button"
      className="quick-start-copy"
      onClick={() => void copy(text, key)}
    >
      {copied === key ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Copy size={16} aria-hidden="true" />
      )}
      {caption}
    </button>
  );
  return (
    <section
      id="start"
      className="quick-start"
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <header className="quick-start-intro">
        <Heading id={`${id}-title`}>
          {t("ابدأ من المصدر", "Start from source")}
        </Heading>
        <p>
          {t(
            "أضف طِراز إلى تطبيقك، ثم ابنِ أول شاشة مع أداة البرمجة التي تفضّلها. المكوّنات وإرشاداتها تبقى في مشروعك.",
            "Add Tiraz to your app, then build your first screen with your preferred coding tool. The components and their guidance live in your project.",
          )}
        </p>
      </header>
      <div className="quick-start-steps">
        <section className="quick-start-step" aria-labelledby={`${id}-setup`}>
          <span className="quick-start-number" aria-hidden="true">
            {number.format(1)}
          </span>
          <div className="quick-start-step-body">
            <StepHeading id={`${id}-setup`}>
              {t("أضف طِراز إلى مشروعك", "Add Tiraz to your project")}
            </StepHeading>
            <p>
              {t(
                "احصل على المصدر، ثم افتح مشروعك في أداة البرمجة ووفّر لها مجلد طِراز. انسخ طلب الإعداد المناسب أدناه.",
                "Get the source, open your project in your coding tool, and give it access to the Tiraz folder. Copy the matching setup prompt below.",
              )}
            </p>
            <div className="quick-start-links">
              <a
                href="https://github.com/amjed-fadul/Tiraz-arabic-design-system"
                target="_blank"
                rel="noreferrer"
              >
                {t("المصدر على GitHub", "Source on GitHub")}
                <ArrowUpRight
                  className="tz-mirror-rtl"
                  size={16}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  {t("، يفتح في تبويب جديد", ", opens in a new tab")}
                </span>
              </a>
              <a href={sourceGuide} download="tiraz-source-guide.md">
                {t("تنزيل دليل المصدر", "Download source guide")}
              </a>
            </div>
            <div
              className="quick-start-choice"
              role="group"
              aria-label={t("نوع المشروع", "Project type")}
            >
              <button
                type="button"
                aria-pressed={!existing}
                onClick={() => {
                  setExisting(false);
                  setCopied(null);
                }}
              >
                {t("مشروع جديد", "New project")}
              </button>
              <button
                type="button"
                aria-pressed={existing}
                onClick={() => {
                  setExisting(true);
                  setCopied(null);
                }}
              >
                {t("مشروع قائم", "Existing project")}
              </button>
            </div>
            <div className="quick-start-prompt">
              <div className="quick-start-prompt-bar">
                <span>{t("طلب الإعداد", "Setup prompt")}</span>
                {copyButton(
                  setupPrompt(existing),
                  "setup",
                  t("نسخ طلب الإعداد", "Copy setup prompt"),
                )}
              </div>
              <pre dir="ltr" lang="en" tabIndex={0}>
                <code>{setupPrompt(existing)}</code>
              </pre>
            </div>
            <p className="quick-start-note">
              {t("المصدر مُختبَر مع", "Source verified with")}{" "}
              <bdi dir="ltr">React {number.format(19)}</bdi> {t("و", "and")}{" "}
              <bdi dir="ltr">TypeScript</bdi>.{" "}
              {t("انسخ مجلد", "Copy the complete")}{" "}
              <bdi dir="ltr">src/system</bdi>{" "}
              {t(
                "كاملًا، مع الإرشادات والأصول وتراخيصها.",
                "directory, including guidance, assets, and licenses.",
              )}
            </p>
            <details className="quick-start-manual">
              <summary>
                {t("تُعدّ المشروع بنفسك؟", "Setting up by hand?")}
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>
                {t(
                  "بعد نسخ المصدر، ثبّت الاعتماديات المطلوبة من ملفات الحزم والاستيراد. حمّل الأنماط والخط مرة واحدة، ثم أضف المزوّد. هذا مثال لنقطة الدخول؛ عدّل المسارات لتناسب مشروعك.",
                  "After copying the source, install the dependencies listed in its package files and imports. Load styles and fonts once, then add the provider. This entry-point example assumes the system folder sits beside it; adjust paths for your app.",
                )}
              </p>
              {copyButton(
                entryCode,
                "entry",
                t("نسخ مثال الإعداد", "Copy setup example"),
              )}
              <pre dir="ltr" lang="en" tabIndex={0}>
                <code>{entryCode}</code>
              </pre>
            </details>
          </div>
        </section>
        <section className="quick-start-step" aria-labelledby={`${id}-build`}>
          <span className="quick-start-number" aria-hidden="true">
            {number.format(2)}
          </span>
          <div className="quick-start-step-body">
            <StepHeading id={`${id}-build`}>
              {t("جرّب أول شاشة", "Try your first screen")}
            </StepHeading>
            <p>
              {t(
                "اختر بداية، والصق الطلب في أداة البرمجة بعد إعداد المشروع. عدّل التفاصيل لتناسب تطبيقك.",
                "Choose a starting point and paste the prompt into your coding tool after setup. Adapt the details to your app.",
              )}
            </p>
            <div className="quick-start-examples">
              {prompts.map((prompt, index) => (
                <details key={prompt.name[1]}>
                  <summary>
                    <span>
                      <strong>{prompt.name[language === "ar" ? 0 : 1]}</strong>
                      <span>
                        {prompt.description[language === "ar" ? 0 : 1]}
                      </span>
                    </span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </summary>
                  <div className="quick-start-example-body">
                    <p dir="ltr" lang="en">
                      {prompt.text}
                    </p>
                    {copyButton(
                      prompt.text,
                      `example-${index}`,
                      `${t("نسخ طلب", "Copy prompt:")} ${prompt.name[language === "ar" ? 0 : 1]}`,
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="quick-start-step" aria-labelledby={`${id}-verify`}>
          <span className="quick-start-number" aria-hidden="true">
            {number.format(3)}
          </span>
          <div className="quick-start-step-body">
            <StepHeading id={`${id}-verify`}>
              {t("تحقّق من التفاصيل", "Check the details")}
            </StepHeading>
            <p>
              {t(
                "افتح الشاشة بالعربية والإنجليزية، وبالمظهرين الفاتح والداكن. جرّبها على الهاتف وباستخدام لوحة المفاتيح، ثم شغّل فحوصات مشروعك وأمر البناء.",
                "Open the screen in Arabic and English, in light and dark themes. Try it on mobile and with the keyboard, then run your project's checks and build command.",
              )}
            </p>
            <p className="quick-start-note">
              {t("أضف إلى ملف", "Add a note to")} <bdi dir="ltr">AGENTS.md</bdi>{" "}
              {t("في مشروعك توجيهًا لقراءة", "in your project to read")}{" "}
              <bdi dir="ltr">system/ai/README.md</bdi>{" "}
              {t(
                "قبل تعديل المكوّنات. تتبع الإرشادات المصدر أينما نقلته.",
                "before changing components. The guidance travels with the source.",
              )}
            </p>
          </div>
        </section>
      </div>
      <p className="quick-start-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
    </section>
  );
}
