import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { numberLocale } from "../system/config";
import type { Accent, SystemConfig } from "../system";
import { QuickStart } from "../workbench/QuickStart";
import { persist, readDocumentation, storageKeys } from "../workbench/storage";
import { AccentPicker } from "./AccentPicker";
import { ComponentMarquee } from "./ComponentMarquee";
import { TirazMark } from "../brand/TirazMark";
import { ScreenShowcase } from "./ScreenShowcase";
import { Showcase } from "./Showcase";
import { WhyTiraz } from "./WhyTiraz";
import { Loom } from "./loom/Loom";
import { useLandingMotion, useSmoothScroll } from "./motion";
import finishedBand from "./assets/loom/finished-band.webp?url";

const repository = "https://github.com/amjed-fadul/Tiraz-arabic-design-system";
const docs = "/library";

function readLandingTheme(): SystemConfig["theme"] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKeys.theme) ?? "null");
    return saved === "light" || saved === "dark" ? saved : "dark";
  } catch {
    return "dark";
  }
}

function Wordmark() {
  return (
    <a className="lp-wordmark" href="#top">
      <TirazMark size={22} className="lp-warp-mark" />
      <span lang="ar">طِراز</span>
    </a>
  );
}

export function Landing() {
  const [ar, setAr] = useState(() => readDocumentation().language === "ar");
  const [accent, setAccent] = useState<Accent>("sage");
  const [theme, setTheme] = useState(readLandingTheme);
  const page = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const Forward = ar ? MoveLeft : MoveRight;
  const number = new Intl.NumberFormat(
    numberLocale(defaultConfig, ar ? "ar" : "en"),
    { minimumIntegerDigits: 2, useGrouping: false },
  );
  useLandingMotion(page);
  useSmoothScroll();
  useLayoutEffect(() => {
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    document.documentElement.style.colorScheme = theme;
    document.documentElement.dataset.landingTheme = theme;
    document.title = ar
      ? "طِراز · نظام تصميم للواجهات العربية"
      : "Tiraz · A design system for Arabic interfaces";
  }, [ar, theme]);
  useEffect(() => {
    persist(storageKeys.documentation, {
      ...readDocumentation(),
      language: ar ? "ar" : "en",
    });
  }, [ar]);
  useEffect(() => persist(storageKeys.theme, theme), [theme]);
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
              <a href="#in-action">{ar ? "الشاشات" : "Screens"}</a>
              <a href="#why">{ar ? "لماذا طِراز؟" : "Why Tiraz"}</a>
              <a href="#explore">{ar ? "المكوّنات" : "Components"}</a>
              <a href="#start">{ar ? "دليل البدء" : "Get started"}</a>
            </nav>
            <div className="lp-header-actions">
              <a className="lp-header-docs" href={docs}>
                {ar ? "المكتبة" : "Library"}
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
                      {ar ? (
                        <>
                          نظام تصميم لبناء واجهات <em>عربية</em>
                        </>
                      ) : (
                        <>
                          A design system for <em>Arabic</em> interfaces
                        </>
                      )}
                    </span>
                  </span>
                </h1>
                <p className="lp-lede lp-enter" data-step="2">
                  {ar
                    ? "مكوّنات React للوحات التحكم وتطبيقات الويب، بالعربية والإنجليزية. ثبّت الحزمة أو انسخ المصدر وعدّله ليناسب مشروعك."
                    : "React components for dashboards and web apps, in Arabic and English. Install the package or copy the source and make it your own."}
                </p>
                <div className="lp-actions lp-enter" data-step="3">
                  <a className="lp-primary-link" href="#start">
                    {ar ? "دليل البدء" : "Get started"}
                    <Forward size={16} aria-hidden="true" />
                  </a>
                  <a className="lp-secondary-link" href="#explore">
                    {ar ? "تصفّح المكوّنات" : "Browse components"}
                  </a>
                  <AccentPicker ar={ar} value={accent} onChange={setAccent} />
                </div>
              </div>
            </div>
            <div className="lp-hero-foot">
              <span className="lp-hero-meta">
                <bdi dir="ltr">
                  React {number.format(19)} · TypeScript · RTL
                </bdi>
              </span>
              <span className="lp-scroll-cue" aria-hidden="true">
                <i />
                {ar ? "جرّب المكوّنات أدناه" : "Try the components below"}
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
                <b>{number.format(1)}</b>
                {ar ? "جرّب طِراز" : "Try Tiraz"}
              </p>
              <h2 id="in-action-title">
                {ar
                  ? "من المكوّنات إلى شاشات متكاملة"
                  : "From components to complete screens"}
              </h2>
              <p>
                {ar
                  ? "جرّب لوحة العملاء ومراجعة الفواتير مع المساعد، بمكوّنات طِراز نفسها."
                  : "Try a customer dashboard and an assistant for invoice review, built with Tiraz."}
              </p>
            </div>
            <div className="lp-container lp-stage">
              <div className="lp-rise">
                <section
                  className="lp-live-example"
                  aria-label={ar ? "مثال منتج تفاعلي" : "Live product example"}
                >
                  <ScreenShowcase ar={ar} />
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
                    <b>{number.format(3)}</b>
                    {ar ? "استكشف النظام" : "Explore the system"}
                  </p>
                  <h2 id="explore-title">
                    {ar ? "مكوّنات تعمل معك" : "Components that work with you"}
                  </h2>
                </div>
                <a className="lp-text-link" href="/library">
                  {ar ? "كل المكوّنات" : "All components"}
                  <Arrow size={16} aria-hidden="true" />
                </a>
              </div>
              <Showcase ar={ar} />
              <p className="lp-source-note">
                {ar
                  ? "أمثلة تفاعلية ببيانات تجريبية، تعمل داخل متصفحك. افتح أي مكوّن للاطلاع على الكود وخيارات التخصيص."
                  : "Interactive demos with sample data, running in your browser. Open a component for its code and customization options."}
              </p>
            </div>
          </section>

          <div className="lp-section lp-start">
            <div className="lp-container">
              <p className="lp-kicker">
                <b>{number.format(4)}</b>
                {ar ? "ابدأ من المصدر" : "Start from source"}
              </p>
              <QuickStart language={ar ? "ar" : "en"} headingLevel={2} />
            </div>
          </div>

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
                  {ar
                    ? "شريط منسوج بنقش هندسي وخيوط ظاهرة عند طرفه."
                    : "A woven band with a geometric pattern and loose threads at one end."}
                </p>
                <div className="lp-closing-copy" data-reveal>
                  <p className="lp-kicker">
                    {ar ? "مفتوح المصدر" : "Open source"}
                  </p>
                  <h2 id="closing-title">
                    {ar ? "جرّب المكوّنات" : "Try the components"}
                  </h2>
                  <p>
                    {ar
                      ? "تصفّح الأمثلة، ثم اتبع دليل الاستخدام لإضافة طِراز إلى مشروعك."
                      : "Browse the examples, then follow the setup guide to use Tiraz in your project."}
                  </p>
                  <div className="lp-actions">
                    <a className="lp-primary-link" href="#explore">
                      {ar ? "تصفّح المكوّنات" : "Browse components"}
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
                ? "نظام تصميم للواجهات العربية."
                : "A design system for Arabic interfaces."}
            </p>
            <nav aria-label={ar ? "روابط التذييل" : "Footer links"}>
              <a href={docs}>{ar ? "المكتبة" : "Library"}</a>
              <a href={repository}>GitHub</a>
              <a href={`${repository}/blob/main/LICENSE`}>
                {ar ? "رخصة MIT" : "MIT license"}
              </a>
            </nav>
            <small>
              © {number.format(2026)}{" "}
              {ar ? "المساهمون في طِراز" : "Tiraz contributors"}
            </small>
          </div>
        </footer>
      </div>
    </SystemProvider>
  );
}
