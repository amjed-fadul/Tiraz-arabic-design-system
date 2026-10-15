import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUpLeft,
  ArrowUpRight,
  GitFork,
  Languages,
  Moon,
  Sun,
  MoveLeft,
  MoveRight,
} from "lucide-react";
import {
  Badge,
  BarChart,
  Button,
  Input,
  Progress,
  SystemProvider,
  defaultConfig,
} from "../system";
import type { Accent, SystemConfig } from "../system";
import { LiveExample } from "./LiveExample";
import { Weave } from "./Weave";
import { AccentPicker } from "./AccentPicker";
import warpSymbol from "./brand/assets/01-warp.svg?url";
const textile = new URL("./assets/woven-textile.png", import.meta.url).href;

const repository = "https://github.com/amjed-fadul/Tiraz-arabic-design-system";
const docs = "./index.html#main-content";
const source = `${repository}/tree/main/src/system`;

export function Landing() {
  const [ar, setAr] = useState(true);
  const [accent, setAccent] = useState<Accent>("sage");
  const [theme, setTheme] = useState<SystemConfig["theme"]>("light");
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const Forward = ar ? MoveLeft : MoveRight;
  useEffect(() => {
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    document.documentElement.style.colorScheme = theme;
    document.title = ar
      ? "طِراز · من أول خيط"
      : "Tiraz · Arabic interfaces, from the first thread";
  }, [ar, theme]);
  const why = [
    {
      number: "01",
      title: ar ? "العربية هي نقطة البداية" : "Arabic is the starting point",
      text: ar
        ? "اتجاه الواجهة، ترتيب التنقّل ومحاذاة المحتوى تبدأ من اليمين. تبقى أسماء الملفات والمعرّفات واضحة داخل النص العربي."
        : "Layout, navigation and content alignment begin on the right. File names and identifiers stay clear within Arabic text.",
      example: (
        <span dir="rtl" lang="ar">
          ملف المشروع <bdi dir="ltr">project.tsx</bdi>
        </span>
      ),
    },
    {
      number: "02",
      title: ar ? "نظام واحد، بطابعك" : "One system, your character",
      text: ar
        ? "غيّر اللون والكثافة والزوايا من إعدادات المزوّد. جرّب لونًا آخر من المقدمة وشاهد الرسم والأزرار تتغيّر معًا."
        : "Set accent, density and corners through the provider. Choose an accent in the hero and watch the chart and controls change together.",
      example: <bdi dir="ltr">SystemProvider → accent / density / radius</bdi>,
    },
    {
      number: "03",
      title: ar
        ? "تعليمات تسافر مع المصدر"
        : "Guidance travels with the source",
      text: ar
        ? "حزمة تعليمات ومرجع مكوّنات وأمثلة داخل المكتبة، ليقرأ مساعدك البرمجي الواجهات الفعلية قبل بناء الشاشة."
        : "Instructions, a component registry and examples live inside the library, so your coding assistant can read the real APIs before building.",
      example: <bdi dir="ltr">src/system/ai/README.md</bdi>,
    },
  ];
  return (
    <SystemProvider
      config={{
        ...defaultConfig,
        theme,
        accent,
        direction: ar ? "rtl" : "ltr",
      }}
    >
      <div className="lp-page">
        <a className="lp-skip" href="#content">
          {ar ? "انتقل إلى المحتوى" : "Skip to content"}
        </a>
        <header className="lp-header lp-container">
          <a
            className="lp-wordmark"
            href="#top"
            aria-label={ar ? "طِراز — البداية" : "Tiraz — home"}
          >
            <img
              className="lp-brand-symbol"
              src={warpSymbol}
              alt=""
              width="24"
              height="24"
            />
            <span lang="ar">طِراز</span>
            <span lang="en">Tiraz</span>
          </a>
          <nav
            className="lp-main-nav"
            aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}
          >
            <a href="#in-action">{ar ? "جرّب طِراز" : "In action"}</a>
            <a href="#explore">{ar ? "المكوّنات" : "Components"}</a>
            <a href="#start">{ar ? "ابدأ الآن" : "Get started"}</a>
          </nav>
          <div className="lp-header-actions">
            <a className="lp-header-docs" href={docs}>
              {ar ? "التوثيق" : "Documentation"}
              <Arrow size={14} aria-hidden="true" />
            </a>
            <a className="lp-icon-link" href={repository} aria-label="GitHub">
              <GitFork size={17} aria-hidden="true" />
            </a>
            <span className="lp-divider" />
            <Button
              variant="ghost"
              onClick={() => setAr(!ar)}
              aria-label={ar ? "English" : "العربية"}
            >
              <Languages size={16} aria-hidden="true" />
              <span lang={ar ? "en" : "ar"}>{ar ? "EN" : "عربي"}</span>
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
                <Moon size={17} aria-hidden="true" />
              ) : (
                <Sun size={17} aria-hidden="true" />
              )}
            </Button>
          </div>
        </header>
        <main id="content" tabIndex={-1}>
          <section className="lp-hero" id="top" aria-labelledby="hero-title">
            <Weave src={textile} />
            <div className="lp-container lp-hero-layout">
              <div className="lp-hero-copy">
                <p className="lp-eyebrow">
                  {ar
                    ? "نظام تصميم عربي · مفتوح المصدر"
                    : "ARABIC-FIRST · OPEN SOURCE"}
                </p>
                <h1 id="hero-title">
                  {ar ? (
                    <>
                      واجهات عربية،
                      <br />
                      من أول خيط.
                    </>
                  ) : (
                    <>
                      Arabic interfaces,
                      <br />
                      from the first thread.
                    </>
                  )}
                </h1>
                <p className="lp-intro">
                  {ar
                    ? "طِراز نظام تصميم مفتوح المصدر يستلهم أصالته من النسيج، لبناء لوحات التحكم والتطبيقات العربية."
                    : "An open-source design system rooted in Arabic craft, for building thoughtful dashboards and applications."}
                </p>
                <div className="lp-actions">
                  <a className="lp-primary-link" href={docs}>
                    {ar ? "ابدأ البناء" : "Start building"}
                    <Forward size={16} aria-hidden="true" />
                  </a>
                  <a className="lp-secondary-link" href="#explore">
                    {ar ? "استكشف المكوّنات" : "Explore components"}
                  </a>
                </div>
                <AccentPicker ar={ar} value={accent} onChange={setAccent} />
              </div>
              <p className="lp-hero-caption">
                {ar ? (
                  <>
                    من النسيج إلى الواجهة.
                    <br />
                    خيوط أصيلة، لواجهات معاصرة.
                  </>
                ) : (
                  <>
                    From textile to interface.
                    <br />
                    Original threads, contemporary applications.
                  </>
                )}
              </p>
            </div>
          </section>
          <div className="lp-principle-strip">
            <div className="lp-container">
              <p>
                {ar
                  ? "مصمّم للغة، ولما تبنيه بها."
                  : "Made for the language. And what you build with it."}
              </p>
              <a href="#in-action">
                {ar
                  ? "شاهد المكوّنات تعمل معًا"
                  : "See the components work together"}
                <ArrowDown size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
          <section
            className="lp-section lp-container"
            id="in-action"
            aria-label={ar ? "مثال منتج تفاعلي" : "Live product example"}
          >
            <div className="lp-section-heading">
              <div>
                <p className="lp-eyebrow">
                  {ar ? "٠١ / طِراز في الاستخدام" : "01 / TIRAZ IN ACTION"}
                </p>
                <h2>
                  {ar
                    ? "اختر لونك، وشاهد طِراز يتغيّر"
                    : "Choose a color. See Tiraz change."}
                </h2>
              </div>
              <p>
                {ar
                  ? "المكوّنات نفسها، بلونك المختار. بيانات تجريبية وتفاعل حقيقي، بلا خدمة خلفية."
                  : "The same real components, in your chosen accent. Sample data and working interactions, with no backend."}
              </p>
            </div>
            <LiveExample ar={ar} />
          </section>
          <section className="lp-why" id="why" aria-labelledby="why-title">
            <div className="lp-container">
              <div className="lp-section-heading">
                <div>
                  <p className="lp-eyebrow">
                    {ar ? "٠٢ / لماذا طِراز" : "02 / WHY TIRAZ"}
                  </p>
                  <h2 id="why-title">
                    {ar
                      ? "أساس واضح. تفاصيل مدروسة."
                      : "A clear foundation. Considered details."}
                  </h2>
                </div>
                <p>
                  {ar
                    ? "قرارات مشتركة تختصر العمل المتكرر، وتترك لك قرارات المنتج."
                    : "Shared decisions reduce repeated work, leaving the product decisions to you."}
                </p>
              </div>
              <div className="lp-why-grid">
                {why.map((item) => (
                  <article key={item.number}>
                    <span className="lp-feature-number" aria-hidden="true">
                      {item.number}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <div className="lp-feature-example">{item.example}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <section
            className="lp-section lp-container"
            id="explore"
            aria-labelledby="explore-title"
          >
            <div className="lp-section-heading">
              <div>
                <p className="lp-eyebrow">
                  {ar ? "٠٣ / استكشف النظام" : "03 / EXPLORE THE SYSTEM"}
                </p>
                <h2 id="explore-title">
                  {ar
                    ? "لبنات صغيرة. احتمالات واسعة."
                    : "Small building blocks. Room to build."}
                </h2>
              </div>
              <a className="lp-text-link" href="./index.html#examples-heading">
                {ar ? "استكشف أمثلة التوثيق" : "Explore documentation examples"}
                <Arrow size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="lp-explore-grid">
              <article className="lp-component">
                <div className="lp-component-preview">
                  <Input
                    label={ar ? "اسم المشروع" : "Project name"}
                    placeholder={ar ? "مشروعك القادم" : "Your next project"}
                  />
                  <Button
                    onClick={() => document.getElementById("start")?.focus()}
                  >
                    {ar ? "ابدأ مشروعك" : "Start building"}
                    <Forward size={14} aria-hidden="true" />
                  </Button>
                </div>
                <div className="lp-component-description">
                  <h3>{ar ? "نماذج واضحة" : "Clear forms"}</h3>
                  <p>
                    {ar
                      ? "حقول وأزرار لتكوين خطوات مفهومة."
                      : "Inputs and buttons for understandable steps."}
                  </p>
                  <a href={`${source}/Input.tsx`}>
                    Input / Button <Arrow size={14} aria-hidden="true" />
                  </a>
                </div>
              </article>
              <article className="lp-component">
                <div className="lp-component-preview lp-status-preview">
                  <div className="lp-badges">
                    <Badge tone="success">{ar ? "مكتمل" : "Completed"}</Badge>
                    <Badge tone="info">
                      {ar ? "قيد المراجعة" : "In review"}
                    </Badge>
                  </div>
                  <Progress
                    value={72}
                    label={
                      ar ? "تقدّم المشروع التجريبي" : "Sample project progress"
                    }
                    showValue
                    locale={ar ? "ar" : "en"}
                  />
                </div>
                <div className="lp-component-description">
                  <h3>{ar ? "حالة تُفهم" : "Status with meaning"}</h3>
                  <p>
                    {ar
                      ? "نص وحالة مرئية، بتفاصيل متّسقة."
                      : "Readable status, with consistent details."}
                  </p>
                  <a href={`${source}/Progress.tsx`}>
                    Badge / Progress <Arrow size={14} aria-hidden="true" />
                  </a>
                </div>
              </article>
              <article className="lp-component lp-chart-feature">
                <div className="lp-component-preview">
                  <BarChart
                    label={
                      ar
                        ? "طلبات تجريبية حسب القناة"
                        : "Sample orders by channel"
                    }
                    summary={
                      ar
                        ? "بيانات تجريبية · الموقع والمتجر، ٣ أيام."
                        : "Sample data · website and store, 3 days."
                    }
                    data={[
                      { category: ar ? "الأول" : "Day 1", web: 12, store: 8 },
                      { category: ar ? "الثاني" : "Day 2", web: 18, store: 10 },
                      { category: ar ? "الثالث" : "Day 3", web: 15, store: 12 },
                    ]}
                    series={[
                      { key: "web", label: ar ? "الموقع" : "Website" },
                      { key: "store", label: ar ? "المتجر" : "Store" },
                    ]}
                    height={180}
                    locale={ar ? "ar" : "en"}
                    dataTable
                  />
                </div>
                <div className="lp-component-description">
                  <h3>{ar ? "بيانات أقرب للقراءة" : "Data, easier to read"}</h3>
                  <p>
                    {ar
                      ? "رسوم مساحية وأعمدة، مع جدول للقيم."
                      : "Area and bar charts, with a table of exact values."}
                  </p>
                  <a href={`${source}/Charts.tsx`}>
                    {ar ? "مصدر الرسوم البيانية" : "Chart source"}
                    <Arrow size={14} aria-hidden="true" />
                  </a>
                </div>
              </article>
            </div>
            <p className="lp-source-note">
              {ar
                ? "المعاينات تستخدم المكوّنات الحالية. روابط المصدر تفتح ملفاتها على GitHub؛ اختر المكوّن من قائمة التوثيق لتجربة خصائصه."
                : "Previews use current components. Source links open their files on GitHub; choose a component in the documentation navigation to explore its properties."}
            </p>
          </section>
          <section
            className="lp-start"
            id="start"
            tabIndex={-1}
            aria-labelledby="start-title"
          >
            <div className="lp-container lp-start-grid">
              <div>
                <p className="lp-eyebrow">
                  {ar ? "٠٤ / ابدأ من المصدر" : "04 / START FROM SOURCE"}
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
                <span className="lp-start-meta">
                  React 19 · TypeScript · IBM Plex Sans Arabic
                </span>
              </div>
              <ol className="lp-steps">
                <li>
                  <h3>
                    {ar ? "انسخ المكتبة كاملة" : "Copy the complete library"}
                  </h3>
                  <p>
                    {ar ? (
                      <>
                        انسخ <bdi dir="ltr">src/system</bdi> مع مجلد{" "}
                        <bdi dir="ltr">ai/</bdi> وأصوله، مع استبعاد الاختبارات
                        عند الحاجة.
                      </>
                    ) : (
                      <>
                        Copy <bdi dir="ltr">src/system</bdi>, keeping{" "}
                        <bdi dir="ltr">ai/</bdi> and its assets. Tests may be
                        excluded.
                      </>
                    )}
                  </p>
                </li>
                <li>
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
                  <code dir="ltr">SystemProvider + defaultConfig</code>
                </li>
                <li>
                  <h3>{ar ? "ابنِ أول شاشة" : "Build your first screen"}</h3>
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
                </li>
              </ol>
            </div>
          </section>
          <section
            className="lp-closing lp-container"
            aria-labelledby="closing-title"
          >
            <div className="lp-closing-mark" lang="ar" aria-hidden="true">
              طِراز
            </div>
            <p className="lp-eyebrow">
              {ar
                ? "مفتوح المصدر، لتبني عليه"
                : "OPEN SOURCE. OPEN TO WHAT YOU BUILD."}
            </p>
            <h2 id="closing-title">
              {ar
                ? "ابدأ بشاشة. واصنع ما بعدها."
                : "Start with a screen. Build what comes next."}
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
              <a className="lp-text-link" href={repository}>
                <GitFork size={16} aria-hidden="true" />
                {ar ? "طِراز على GitHub" : "Tiraz on GitHub"}
                <Arrow size={15} aria-hidden="true" />
              </a>
            </div>
          </section>
        </main>
        <footer className="lp-footer lp-container">
          <a className="lp-wordmark" href="#top">
            <img
              className="lp-brand-symbol"
              src={warpSymbol}
              alt=""
              width="24"
              height="24"
            />
            <span lang="ar">طِراز</span>
            <span lang="en">Tiraz</span>
          </a>
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
        </footer>
      </div>
    </SystemProvider>
  );
}
