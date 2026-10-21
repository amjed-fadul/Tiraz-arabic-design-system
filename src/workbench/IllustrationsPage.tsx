import { useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Copy } from "lucide-react";
import source from "../system/EmptyStateIllustrations.tsx?raw";
import { illustrations } from "./illustrations";
import type { IllustrationId } from "./site-routes";
import { SiteLink } from "./SiteLink";
import type { Navigate } from "./SiteLink";
import { localize, words } from "./i18n";
import type { Language } from "./i18n";
export function IllustrationsPage({
  id,
  language,
  navigate,
}: {
  id?: IllustrationId;
  language: Language;
  navigate: Navigate;
}) {
  const t = words(language),
    item = illustrations.find((item) => item.id === id);
  const [size, setSize] = useState("medium");
  const [copied, setCopied] = useState<"example" | "source" | null>(null);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const example = item
    ? `import { ${item.exportName} } from "./system";

// Render inside your application's SystemProvider.
// The illustration is decorative; provide meaning in nearby text.
<div aria-hidden="true" style={{ inlineSize: "16rem", maxInlineSize: "100%" }}>
  <${item.exportName} />
</div>`
    : "";
  async function copy(kind: "example" | "source") {
    const current = ++request.current;
    try {
      await navigator.clipboard.writeText(
        kind === "example" ? example : source,
      );
      if (current !== request.current) return;
      setFailed(false);
      setCopied(kind);
    } catch {
      if (current === request.current) {
        setFailed(true);
        setCopied(null);
      }
    }
  }
  if (!item)
    return (
      <div className="illustrations-page">
        <header className="component-heading">
          <h1>{t("الرسوم التوضيحية", "Illustrations")}</h1>
          <p>
            {t(
              "رسوم أصلية هادئة للحالات الفارغة والبدايات الجديدة، بألوان تتبع واجهتك.",
              "Original, quiet illustrations for empty states and new beginnings, in colors that follow your interface.",
            )}
          </p>
        </header>
        <div className="illustration-grid">
          {illustrations.map(({ Component, ...entry }) => (
            <article key={entry.id} className="illustration-card">
              <SiteLink
                route={{ kind: "illustrations", id: entry.id }}
                navigate={navigate}
              >
                <div className="illustration-stage" aria-hidden="true">
                  <Component />
                </div>
                <div className="library-card-title">
                  <h2>{localize(entry.name, language)}</h2>
                  <ArrowUpRight
                    className="tz-mirror-rtl"
                    size={18}
                    aria-hidden="true"
                  />
                </div>
              </SiteLink>
              <p>{localize(entry.description, language)}</p>
            </article>
          ))}
        </div>
        <div className="illustration-note">
          <h2>
            {t("تتكيف مع المظهر والاتجاه", "Made for your theme and direction")}
          </h2>
          <p>
            {t(
              "جرّب المظهر الداكن من الشريط العلوي. تتبع الألوان رموز النظام، وينعكس رسم البداية الجديدة مع اتجاه القراءة. الرسوم زخرفية؛ أضف المعنى بالنص المجاور.",
              "Try dark mode from the header. Colors follow system tokens, and the getting-started scene mirrors with reading direction. These illustrations are decorative; supply meaning in nearby text.",
            )}
          </p>
        </div>
      </div>
    );
  const Scene = item.Component;
  return (
    <div className="illustrations-page">
      <SiteLink
        className="site-back"
        route={{ kind: "illustrations" }}
        navigate={navigate}
      >
        <ArrowLeft className="tz-mirror-rtl" size={15} aria-hidden="true" />
        {t("كل الرسوم", "All illustrations")}
      </SiteLink>
      <header className="component-heading">
        <h1>{localize(item.name, language)}</h1>
        <p>{localize(item.description, language)}</p>
      </header>
      <div className="illustration-detail-preview">
        <div
          className="illustration-size"
          role="group"
          aria-label={t("حجم المعاينة", "Preview size")}
        >
          {[
            ["small", "صغير", "Small"],
            ["medium", "متوسط", "Medium"],
            ["large", "كبير", "Large"],
          ].map(([value, ar, en]) => (
            <button
              type="button"
              key={value}
              aria-pressed={size === value}
              onClick={() => setSize(value)}
            >
              {t(ar, en)}
            </button>
          ))}
        </div>
        <div className="illustration-stage" data-size={size}>
          <Scene />
        </div>
      </div>
      <section className="illustration-usage">
        <h2>{t("استخدمه في تطبيقك", "Use it in your app")}</h2>
        <p>
          {t(
            "استورد الرسم داخل SystemProvider بعد تحميل أنماط النظام. يتحكم العنصر الحاوي في حجمه، ويظل مخفيًا عن قارئ الشاشة. أضف عنوانًا ووصفًا يشرحان الحالة؛ لا تعتمد على الرسم وحده.",
            "Import the illustration inside SystemProvider after loading the system styles. Its wrapper controls size, and the SVG stays hidden from screen readers. Add a heading and description for the state; do not rely on the drawing alone.",
          )}
        </p>
        <div className="illustration-copy-actions">
          {(["example", "source"] as const).map((kind) => (
            <button
              className="site-action"
              type="button"
              key={kind}
              onClick={() => void copy(kind)}
            >
              {copied === kind ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              {kind === "example"
                ? t("نسخ المثال", "Copy example")
                : t("نسخ ملف الرسوم", "Copy source file")}
            </button>
          ))}
          <span role="status">
            {failed
              ? t("تعذّر النسخ. حاول مرة أخرى.", "Could not copy. Try again.")
              : copied
                ? t("تم النسخ", "Copied")
                : ""}
          </span>
        </div>
        <details className="illustration-code">
          <summary>{t("عرض المثال", "View example")}</summary>
          <pre dir="ltr" lang="en" tabIndex={0}>
            <code>{example}</code>
          </pre>
        </details>
        <p className="site-muted">
          {t(
            "ملف المصدر يضم الرسوم الثلاثة:",
            "The source file includes all three illustrations:",
          )}{" "}
          <bdi dir="ltr">EmptyStateIllustrations.tsx</bdi>
        </p>
        <SiteLink
          className="note-link"
          route={{ kind: "component", id: "empty-state" }}
          navigate={navigate}
        >
          {t("ركّبه مع الحالة الفارغة", "Compose it with EmptyState")}
        </SiteLink>
      </section>
    </div>
  );
}
