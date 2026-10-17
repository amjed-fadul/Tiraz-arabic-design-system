import { useEffect, useRef, useState } from "react";
import {
  ArrowUpLeft,
  ArrowUpRight,
  GitFork,
  Languages,
  Moon,
  MoveLeft,
  MoveRight,
  Sun,
} from "lucide-react";
import { Button, SystemProvider, defaultConfig } from "../system";
import type { Accent, SystemConfig } from "../system";
import { AccentPicker } from "./AccentPicker";
import { ComponentMarquee, WarpMark } from "./ComponentMarquee";
import { LiveExample } from "./LiveExample";
import { Showcase } from "./Showcase";
import { WhyTiraz } from "./WhyTiraz";
import { Loom } from "./loom/Loom";
import { useLandingMotion, useSmoothScroll } from "./motion";
import finishedBand from "./assets/loom/finished-band.webp?url";

const repository = "https://github.com/amjed-fadul/Tiraz-arabic-design-system";
const docs = "./index.html#main-content";
const source = `${repository}/tree/main/src/system`;

/** The adoption snippet, tokenized for quiet syntax colors. */
const snippet: readonly (readonly [string, string?])[] = [
  ["import", "k"],
  [" { "],
  ["SystemProvider", "t"],
  [", defaultConfig, "],
  ["Button", "t"],
  [" } "],
  ["from", "k"],
  [" "],
  ['"./system"', "s"],
  [";\n\n"],
  ["export function", "k"],
  [" "],
  ["App", "f"],
  ["() {\n  "],
  ["return", "k"],
  [" (\n    <"],
  ["SystemProvider", "t"],
  ["\n      config={{ ...defaultConfig, direction: "],
  ['"rtl"', "s"],
  [" }}\n    >\n      <"],
  ["Button", "t"],
  [">"],
  ["ابدأ", "ar"],
  ["</"],
  ["Button", "t"],
  [">\n    </"],
  ["SystemProvider", "t"],
  [">\n  );\n}"],
];

function Wordmark() {
  return (
    <a className="lp-wordmark" href="#top">
      <WarpMark size={22} />
      <span lang="ar">طِراز</span>
      <span lang="en">Tiraz</span>
    </a>
  );
}

export function Landing() {
  const [ar, setAr] = useState(true);
  const [accent, setAccent] = useState<Accent>("sage");
  const [theme, setTheme] = useState<SystemConfig["theme"]>("dark");
  const page = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const Forward = ar ? MoveLeft : MoveRight;
  useLandingMotion(page);
  useSmoothScroll();
  useEffect(() => {
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    document.documentElement.style.colorScheme = theme;
    document.documentElement.dataset.landingTheme = theme;
    document.title = ar
      ? "طِراز · من أول خيط"
      : "Tiraz · Arabic interfaces, from the first thread";
  }, [ar, theme]);
  return (
    <SystemProvider
      config={{
        ...defaultConfig,
        theme,
        accent,
        direction: ar ? "rtl" : "ltr",
      }}
    >
      <div className="lp-page" ref={page}>
        <a className="lp-skip" href="#content">
          {ar ? "انتقل إلى المحتوى" : "Skip to content"}
        </a>
        <header className="lp-header">
          <div className="lp-bar">
            <Wordmark />
            <nav
              className="lp-main-nav"
              aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}
            >
              <a href="#in-action">{ar ? "جرّب طِراز" : "In action"}</a>
              <a href="#why">{ar ? "لماذا طِراز؟" : "Why Tiraz"}</a>
              <a href="#explore">{ar ? "المكوّنات" : "Components"}</a>
              <a href="#start">{ar ? "ابدأ الآن" : "Get started"}</a>
            </nav>
            <div className="lp-header-actions">
              <a className="lp-header-docs" href={docs}>
                {ar ? "التوثيق" : "Documentation"}
                <Arrow size={14} aria-hidden="true" />
              </a>
              <a className="lp-icon-link" href={repository} aria-label="GitHub">
                <GitFork size={16} aria-hidden="true" />
              </a>
              <Button
                variant="ghost"
                onClick={() => setAr(!ar)}
                aria-label={ar ? "English" : "العربية"}
              >
                <Languages size={16} aria-hidden="true" />
                <span lang={ar ? "en" : "ar"}>
                  {ar ? "English" : "العربية"}
                </span>
              </Button>
              <Button
                variant="ghost"
                iconOnly
                aria-label={
                  ar
                    ? theme === "light"
                      ? "استخدام المظهر الداكن"
                      : "استخدام المظهر الفاتح"
                    : theme === "light"
                      ? "Use dark theme"
                      : "Use light theme"
                }
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <Moon size={16} aria-hidden="true" />
                ) : (
                  <Sun size={16} aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </header>
        <main id="content" tabIndex={-1}>
          <section className="lp-hero" id="top" aria-labelledby="hero-title">
            <Loom band={band} ar={ar} />
            <div className="lp-hero-inner">
              <div className="lp-band-slot" ref={band} aria-hidden="true" />
              <div className="lp-hero-copy">
                <p className="lp-pill lp-enter" data-step="1">
                  <span className="lp-pill-dot" aria-hidden="true" />
                  {ar
                    ? "نظام تصميم عربي · مفتوح المصدر"
                    : "Arabic-first design system · Open source"}
                </p>
                <h1 id="hero-title">
                  <span className="lp-line">
                    <span>
                      {ar ? "واجهات عربية،" : "Arabic interfaces,"}{" "}
                      {ar ? "من أول " : "from the first "}
                      <em>{ar ? "خيط" : "thread"}</em>.
                    </span>
                  </span>
                </h1>
                <p className="lp-lede lp-enter" data-step="2">
                  {ar
                    ? "طِراز نظام تصميم مفتوح المصدر لبناء لوحات التحكم والتطبيقات العربية. العربية فيه أساس البناء، لا إضافة في آخره."
                    : "Tiraz is an open-source design system for Arabic dashboards and applications. Arabic sits in its foundations, not added at the end."}
                </p>
                <div className="lp-actions lp-enter" data-step="3">
                  <a className="lp-primary-link" href={docs}>
                    {ar ? "ابدأ البناء" : "Start building"}
                    <Forward size={16} aria-hidden="true" />
                  </a>
                  <a className="lp-secondary-link" href="#explore">
                    {ar ? "استكشف المكوّنات" : "Explore components"}
                  </a>
                  <AccentPicker ar={ar} value={accent} onChange={setAccent} />
                </div>
              </div>
            </div>
            <div className="lp-hero-foot">
              <span className="lp-hero-meta">
                <bdi dir="ltr">React 19 · TypeScript · RTL</bdi>
              </span>
              <span className="lp-scroll-cue" aria-hidden="true">
                <i />
                {ar
                  ? "مرّر لترى النسيج يصبح واجهة"
                  : "Scroll to watch the weave become an interface"}
              </span>
            </div>
          </section>

          <section
            className="lp-section lp-product"
            id="in-action"
            aria-labelledby="in-action-title"
          >
            <div className="lp-container lp-section-intro" data-reveal>
              <p className="lp-kicker">
                <b>{ar ? "٠١" : "01"}</b>
                {ar ? "جرّب طِراز" : "Try Tiraz"}
              </p>
              <h2 id="in-action-title">
                {ar ? "من الخيط إلى الواجهة." : "From thread to interface."}
              </h2>
              <p>
                {ar
                  ? "المكوّنات نفسها التي تنسخها إلى مشروعك. غيّر اللون من الأعلى، وستتبعه الواجهة كلها."
                  : "The same components you copy into your project. Change the accent above and the whole interface follows."}
              </p>
            </div>
            <div className="lp-container lp-stage">
              <div className="lp-rise">
                <section
                  className="lp-live-example"
                  aria-label={ar ? "مثال منتج تفاعلي" : "Live product example"}
                >
                  <LiveExample ar={ar} />
                </section>
              </div>
            </div>
          </section>

          <ComponentMarquee ar={ar} />

          <WhyTiraz ar={ar} />

          <section
            className="lp-section"
            id="explore"
            aria-labelledby="explore-title"
          >
            <div className="lp-container">
              <div className="lp-section-heading" data-reveal>
                <div>
                  <p className="lp-kicker">
                    <b>{ar ? "٠٣" : "03"}</b>
                    {ar ? "استكشف النظام" : "Explore the system"}
                  </p>
                  <h2 id="explore-title">
                    {ar ? (
                      <>
                        لبنات صغيرة.
                        <br />
                        احتمالات واسعة.
                      </>
                    ) : (
                      <>
                        Small building blocks.
                        <br />
                        Room to build.
                      </>
                    )}
                  </h2>
                </div>
                <a
                  className="lp-text-link"
                  href="./index.html#examples-heading"
                >
                  {ar
                    ? "استكشف أمثلة التوثيق"
                    : "Explore documentation examples"}
                  <Arrow size={16} aria-hidden="true" />
                </a>
              </div>
              <Showcase ar={ar} />
              <p className="lp-source-note">
                {ar
                  ? "المعاينات مكوّنات طِراز الفعلية. تضبط هذه الصفحة رمز الخط على خط ثمانية حين يكون مثبّتًا لديك، ويأتي طِراز افتراضيًا بخط IBM Plex Sans Arabic."
                  : "Previews are real Tiraz components. This page sets the font token to Thmanyah where it is installed; Tiraz ships with IBM Plex Sans Arabic."}
              </p>
            </div>
          </section>

          <section
            className="lp-section lp-start"
            id="start"
            tabIndex={-1}
            aria-labelledby="start-title"
          >
            <div className="lp-container">
              <div className="lp-section-intro lp-start-intro" data-reveal>
                <p className="lp-kicker">
                  <b>{ar ? "٠٤" : "04"}</b>
                  {ar ? "ابدأ من المصدر" : "Start from source"}
                </p>
                <h2 id="start-title">
                  {ar
                    ? "المصدر عندك. والقرار لك."
                    : "Your source. Your decisions."}
                </h2>
                <p>
                  {ar
                    ? "طِراز مكتبة تنسخها إلى مشروعك وتطوّرها معه. ابدأ بقراءة دليل الاستخدام والمتطلبات الحالية."
                    : "Tiraz is a library you copy into your project and evolve with it. Begin with the usage guide and current requirements."}
                </p>
                <a
                  className="lp-text-link"
                  href={`${repository}/blob/main/README.md#use-the-system`}
                >
                  {ar ? "اقرأ دليل الاستخدام" : "Read the adoption guide"}
                  <Arrow size={16} aria-hidden="true" />
                </a>
              </div>
              <div className="lp-start-grid">
                <ol className="lp-steps">
                  <li data-reveal>
                    <span className="lp-step-number" aria-hidden="true">
                      {ar ? "١" : "1"}
                    </span>
                    <div>
                      <h3>
                        {ar
                          ? "انسخ المكتبة كاملة"
                          : "Copy the complete library"}
                      </h3>
                      <p>
                        {ar ? (
                          <>
                            انسخ <bdi dir="ltr">src/system</bdi> مع مجلد{" "}
                            <bdi dir="ltr">ai/</bdi> وأصوله، مع استبعاد
                            الاختبارات عند الحاجة.
                          </>
                        ) : (
                          <>
                            Copy <bdi dir="ltr">src/system</bdi>, keeping{" "}
                            <bdi dir="ltr">ai/</bdi> and its assets. Tests may
                            be excluded.
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                  <li data-reveal>
                    <span className="lp-step-number" aria-hidden="true">
                      {ar ? "٢" : "2"}
                    </span>
                    <div>
                      <h3>
                        {ar
                          ? "جهّز المتطلبات والمزوّد"
                          : "Set up dependencies and the provider"}
                      </h3>
                      <p>
                        {ar
                          ? "ثبّت متطلبات التشغيل المذكورة في الدليل، بما فيها إعدادات Radix المطلوبة. حمّل الخطوط وملفّي CSS ثم لفّ التطبيق بالمزوّد."
                          : "Install the documented runtime dependencies and required Radix overrides. Load fonts and both CSS files, then wrap your app in the provider."}
                      </p>
                    </div>
                  </li>
                  <li data-reveal>
                    <span className="lp-step-number" aria-hidden="true">
                      {ar ? "٣" : "3"}
                    </span>
                    <div>
                      <h3>
                        {ar ? "ابنِ أول شاشة" : "Build your first screen"}
                      </h3>
                      <p>
                        {ar
                          ? "اقرأ أمثلة المكتبة، أو وجّه مساعدك البرمجي إلى دليلها المحمول. اربط الأحداث ببيانات تطبيقك."
                          : "Read the library examples, or point your coding assistant to its portable guide. Connect events to your application data."}
                      </p>
                      <a href={`${source}/ai/README.md`}>
                        {ar
                          ? "دليل المكتبة والمساعد البرمجي"
                          : "Library and coding assistant guide"}
                        <Arrow size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </li>
                </ol>
                <figure className="lp-code" data-reveal>
                  <figcaption>
                    <span className="lp-code-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <bdi dir="ltr">App.tsx</bdi>
                  </figcaption>
                  <pre dir="ltr">
                    <code>
                      {snippet.map(([text, kind], index) =>
                        kind ? (
                          <span
                            className={`tk-${kind}`}
                            lang={kind === "ar" ? "ar" : undefined}
                            key={index}
                          >
                            {text}
                          </span>
                        ) : (
                          text
                        ),
                      )}
                    </code>
                  </pre>
                </figure>
              </div>
            </div>
          </section>

          <section className="lp-closing" aria-labelledby="closing-title">
            <div className="lp-container">
              <div className="lp-closing-frame">
                <img
                  src={finishedBand}
                  alt={
                    ar
                      ? "شريط منسوج مكتمل بنقش هندسي أخضر، وما زالت خيوط بدايته ظاهرة"
                      : "A finished woven band with a green geometric pattern, its starting threads still visible"
                  }
                  width="1536"
                  height="864"
                  loading="lazy"
                  decoding="async"
                />
                <p className="lp-closing-caption">
                  <b>{ar ? "الشريط المكتمل." : "The finished band."}</b>{" "}
                  {ar
                    ? "من الخيط الأول إلى منتج متكامل، وخيوط البداية ما زالت ظاهرة."
                    : "From the first thread to a complete product, its first threads still in view."}
                </p>
                <div className="lp-closing-copy" data-reveal>
                  <p className="lp-kicker">
                    {ar
                      ? "مفتوح المصدر، لتبني عليه"
                      : "Open source. Open to what you build."}
                  </p>
                  <h2 id="closing-title">
                    {ar ? (
                      <>
                        ابدأ بشاشة.
                        <br />
                        واصنع ما بعدها.
                      </>
                    ) : (
                      <>
                        Start with a screen.
                        <br />
                        Build what comes next.
                      </>
                    )}
                  </h2>
                  <p>
                    {ar
                      ? "استكشف المكوّنات، اقرأ المصدر، وشارك في تطوير طِراز."
                      : "Explore the components, read the source, and contribute to Tiraz."}
                  </p>
                  <div className="lp-actions">
                    <a className="lp-primary-link" href={docs}>
                      {ar ? "افتح التوثيق" : "Open documentation"}
                      <Forward size={16} aria-hidden="true" />
                    </a>
                    <a className="lp-secondary-link" href={repository}>
                      <GitFork size={16} aria-hidden="true" />
                      {ar ? "طِراز على GitHub" : "Tiraz on GitHub"}
                    </a>
                  </div>
                </div>
              </div>
              <div className="lp-giant-wordmark" lang="ar" aria-hidden="true">
                طِراز
              </div>
            </div>
          </section>
        </main>
        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <Wordmark />
            <p>
              {ar
                ? "نظام تصميم يبدأ من العربية."
                : "A design system that begins with Arabic."}
            </p>
            <nav aria-label={ar ? "روابط التذييل" : "Footer links"}>
              <a href={docs}>{ar ? "التوثيق" : "Documentation"}</a>
              <a href={repository}>GitHub</a>
              <a href={`${repository}/blob/main/LICENSE`}>
                {ar ? "رخصة MIT" : "MIT license"}
              </a>
            </nav>
            <small>
              © 2026 {ar ? "المساهمون في طِراز" : "Tiraz contributors"}
            </small>
          </div>
        </footer>
      </div>
    </SystemProvider>
  );
}
