import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../system/Button";
import { numberLocale } from "../system/config";
import { CopyControl } from "./CopyControl";
import type { Language } from "./i18n";
import { words } from "./i18n";
import { npmRelease } from "./npm-release";
import "./quick-start.css";

const setupPrompt = (
  existing: boolean,
) => `${existing ? "Use Tiraz in this existing React and TypeScript application. Preserve its routes, data, and toolchain." : "Use this Tiraz React 19 and TypeScript application created with Vite. Preserve its routes and toolchain."}
Read src/system/ai/README.md and the registry before making changes. The Tiraz installer places editable source in src/system and the optional Khayt runtime in src/mascot.
If that source is missing, report the gap and ask me to run the documented installer; do not invent an import or overwrite an existing system directory. Keep ai/, examples, assets, and licenses with the source.
Inspect the source imports and application package/lock files. Load tokens.css, components.css, and IBM Plex Sans Arabic weights 400, 500, and 600 once; preserve existing entry setup when already present.
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
  const [feedback, setFeedback] = useState<{
    key: string;
    result: "success" | "failure";
  } | null>(null);
  const id = useId();
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "arab" }, language),
  );
  const installCommand = `npx ${npmRelease.name}@${npmRelease.version} init${existing ? "" : " --new my-app\ncd my-app\nnpm run dev"}`;
  const packageInstallCommand = `npm install ${npmRelease.name}`;
  const packageCode = `import "${npmRelease.name}/styles.css";
import { Button, SystemProvider, defaultConfig } from "${npmRelease.name}";

export function App() {
  return (
    <div lang="ar" dir="rtl">
      <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
        <Button>ابدأ الآن</Button>
      </SystemProvider>
    </div>
  );
}`;
  const copyButton = (text: string, key: string, caption: string) => (
    <CopyControl
      text={text}
      caption={caption}
      language={language}
      iconOnly
      inlineFeedback={false}
      announcement="off"
      onFeedbackChange={(result) =>
        setFeedback((current) =>
          result === "idle"
            ? current?.key === key
              ? null
              : current
            : { key, result },
        )
      }
    />
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
          {t("ابدأ مع طِراز", "Get started with Tiraz")}
        </Heading>
        <p>
          {t(
            "أمر واحد يجهّز المكوّنات وإرشاداتها في مشروعك. بعدها افتح أداة البرمجة التي تفضّلها، وابدأ بأول شاشة. يتطلّب Node.js 22.12 أو أحدث وReact 19.",
            "One command adds the components and their guidance to your project. Then open your preferred coding tool and build your first screen. Requires Node.js 22.12 or newer and React 19.",
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
                "ابدأ مشروع Vite جديدًا، أو أضف المصدر إلى مشروع Vite قائم. لأدوات البناء الأخرى، استخدم الاستيراد من الحزمة أدناه.",
                "Create a Vite app or add editable source to an existing Vite React TypeScript app. For other bundlers, use package imports below.",
              )}
            </p>
            <div className="quick-start-install">
              <div
                className="quick-start-choice"
                role="group"
                aria-label={t("نوع المشروع", "Project type")}
              >
                <Button
                  variant={existing ? "ghost" : "secondary"}
                  aria-pressed={!existing}
                  onClick={() => {
                    setExisting(false);
                    setFeedback(null);
                  }}
                >
                  {t("مشروع جديد", "New project")}
                </Button>
                <Button
                  variant={existing ? "secondary" : "ghost"}
                  aria-pressed={existing}
                  onClick={() => {
                    setExisting(true);
                    setFeedback(null);
                  }}
                >
                  {t("مشروع قائم", "Existing project")}
                </Button>
              </div>
              <div
                className="quick-start-terminal"
                aria-label={t("أمر التثبيت", "Install command")}
              >
                <div className="quick-start-terminal-bar">
                  <span>
                    <bdi dir="ltr">npm</bdi>
                  </span>
                  <span className="quick-start-coming">
                    {npmRelease.published ? (
                      <bdi dir="ltr">v{npmRelease.version}</bdi>
                    ) : (
                      t("جاهزة للنشر", "Prepared for release")
                    )}
                  </span>
                  {copyButton(
                    installCommand,
                    "install",
                    t("نسخ أمر التثبيت", "Copy install command"),
                  )}
                </div>
                <pre
                  dir="ltr"
                  lang="en"
                  tabIndex={0}
                  role="region"
                  aria-label={t("أمر التثبيت", "Install command")}
                >
                  <code>{installCommand}</code>
                </pre>
                <p className="quick-start-package-note">
                  {npmRelease.published
                    ? t(
                        "ينسخ المصدر إلى src/system، ويحتفظ بالتراخيص وإرشادات المساعد. لا يستبدل ملفاتك الحالية.",
                        "Copies editable source to src/system, with licenses and agent guidance. Existing source is never overwritten.",
                      )
                    : t(
                        "الأمر جاهز للإطلاق، لكنه لن يعمل من سجل npm حتى يكتمل نشر الحزمة. يمكنك استخدام المصدر الآن.",
                        "This is the release command. It will work from npm once package publication is complete; you can use the source today.",
                      )}
                </p>
              </div>
            </div>
            <details className="quick-start-source">
              <summary>
                <span>
                  {t(
                    "طلب الإعداد لأداة البرمجة",
                    "Setup prompt for your coding tool",
                  )}
                </span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className="quick-start-source-body">
                <p>
                  {t(
                    "بعد التثبيت، افتح مجلد مشروعك في أداة البرمجة، ثم انسخ طلب الإعداد. تبقى الإرشادات والأصول والتراخيص مع المكوّنات.",
                    "After installation, open your project folder in your coding tool and copy the setup prompt. Guidance, assets and licenses stay with the components.",
                  )}
                </p>
                <div className="quick-start-prompt">
                  <div className="quick-start-prompt-bar">
                    <span>{t("طلب الإعداد", "Setup prompt")}</span>
                    {copyButton(
                      setupPrompt(existing),
                      "setup",
                      t("نسخ طلب الإعداد", "Copy setup prompt"),
                    )}
                  </div>
                  <pre
                    dir="ltr"
                    lang="en"
                    tabIndex={0}
                    role="region"
                    aria-label={t("طلب الإعداد", "Setup prompt")}
                  >
                    <code>{setupPrompt(existing)}</code>
                  </pre>
                </div>
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
                  <pre
                    dir="ltr"
                    lang="en"
                    tabIndex={0}
                    role="region"
                    aria-label={t("مثال الإعداد", "Setup example")}
                  >
                    <code>{entryCode}</code>
                  </pre>
                </details>
              </div>
            </details>
            <details className="quick-start-source">
              <summary>
                <span>
                  {t("تفضّل الاستيراد من حزمة؟", "Prefer package imports?")}
                </span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className="quick-start-source-body">
                <p>
                  {t(
                    "ثبّت الحزمة، ثم حمّل الأنماط وغلّف تطبيقك بالمزوّد. يضم ملف الأنماط الخط والرموز والمكوّنات. المصدر وإرشاداته مرفقة بالحزمة أيضًا.",
                    "Install the package, load its styles and wrap your app with the provider. The stylesheet includes the font, tokens and components. Editable source and guidance are also included.",
                  )}
                </p>
                <div className="quick-start-prompt">
                  <div className="quick-start-prompt-bar">
                    <span>{t("الطرفية", "Terminal")}</span>
                    {copyButton(
                      packageInstallCommand,
                      "npm",
                      t("نسخ أمر npm", "Copy npm command"),
                    )}
                  </div>
                  <pre dir="ltr" lang="en">
                    <code>{packageInstallCommand}</code>
                  </pre>
                </div>
                <div className="quick-start-prompt">
                  <div className="quick-start-prompt-bar">
                    <bdi dir="ltr">App.tsx</bdi>
                    {copyButton(
                      packageCode,
                      "package-entry",
                      t("نسخ مثال الاستيراد", "Copy package example"),
                    )}
                  </div>
                  <pre
                    dir="ltr"
                    lang="en"
                    tabIndex={0}
                    role="region"
                    aria-label={t(
                      "مثال الاستيراد من الحزمة",
                      "Package import example",
                    )}
                  >
                    <code>{packageCode}</code>
                  </pre>
                </div>
              </div>
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
                "بعد الإعداد، افتح مشروعك في أداة البرمجة. اختر شاشة وانسخ طلبها، ثم عدّله ليناسب فكرتك.",
                "After setup, open your project in your coding tool. Choose a screen, copy its prompt, and adapt it to your idea.",
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
                    <div className="quick-start-prompt-bar">
                      <span>
                        {t("طلب لأداة البرمجة", "Prompt for your coding tool")}
                      </span>
                      {copyButton(
                        prompt.text,
                        `example-${index}`,
                        `${t("نسخ طلب", "Copy prompt:")} ${prompt.name[language === "ar" ? 0 : 1]}`,
                      )}
                    </div>
                    <pre
                      dir="ltr"
                      lang="en"
                      tabIndex={0}
                      role="region"
                      aria-label={`${t("طلب", "Prompt:")} ${prompt.name[language === "ar" ? 0 : 1]}`}
                    >
                      <code>{prompt.text}</code>
                    </pre>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
      <div className="quick-start-after">
        <section aria-labelledby={`${id}-agent`}>
          <StepHeading id={`${id}-agent`}>
            {t("افتح مشروعك وابدأ", "Open your project and prompt")}
          </StepHeading>
          <p>
            {t(
              "استخدم أداة البرمجة التي تفضّلها، وأضف إلى ملف",
              "Use your preferred coding tool. Add a note to",
            )}{" "}
            <bdi dir="ltr">AGENTS.md</bdi> {t("توجيهًا لقراءة", "point to")}{" "}
            <bdi dir="ltr">system/ai/README.md</bdi>
            {t(
              "، لتبقى إرشادات طِراز مع كل طلب.",
              ", so Tiraz’s guidance stays with every prompt.",
            )}
          </p>
        </section>
        <section aria-labelledby={`${id}-verify`}>
          <StepHeading id={`${id}-verify`}>
            {t("راجع أول شاشة", "Check your first screen")}
          </StepHeading>
          <p>
            {t(
              "جرّب العربية والإنجليزية والمظهرين الفاتح والداكن. راجع الهاتف والتنقّل بلوحة المفاتيح، ثم شغّل فحوصات مشروعك وأمر البناء.",
              "Try Arabic and English, light and dark. Check mobile layout and keyboard navigation, then run your project’s checks and build.",
            )}
          </p>
        </section>
      </div>
      <p className="quick-start-feedback" role="status" aria-live="polite">
        {feedback?.result === "success"
          ? t(
              "نُسخ النص. الصقه في أداة البرمجة التي تستخدمها.",
              "Copied. Paste it into your coding tool.",
            )
          : feedback?.result === "failure"
            ? t(
                "تعذّر النسخ. يمكنك تحديد النص ونسخه يدويًا.",
                "Could not copy. Select the text and copy it manually.",
              )
            : ""}
      </p>
    </section>
  );
}
