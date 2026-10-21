import { useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Copy } from "lucide-react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import emptySource from "../system/EmptyStateIllustrations.tsx?raw";
import vaultSource from "../illustrations/DocumentVault.tsx?raw";
import handoffSource from "../illustrations/AgentHandoff.tsx?raw";
import voiceSource from "../illustrations/VoiceField.tsx?raw";
import { illustrations, type IllustrationCategory } from "./illustrations";
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
  const [size, setSize] = useState(
    item?.category === "empty" ? "medium" : "large",
  );
  const [category, setCategory] = useState<IllustrationCategory | "all">("all");
  const [activePreview, setActivePreview] = useState<IllustrationId | null>(
    null,
  );
  const [playback, setPlayback] = useState(0);
  const [copied, setCopied] = useState<"example" | "source" | null>(null);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const isScene = item && item.category !== "empty";
  const sourceFile = isScene
    ? `${item.exportName}.tsx`
    : "EmptyStateIllustrations.tsx";
  const source =
    item?.id === "document-vault"
      ? vaultSource
      : item?.id === "agent-handoff"
        ? handoffSource
        : item?.id === "voice-field"
          ? voiceSource
          : emptySource;
  const example = item
    ? `import { ${item.exportName} } from "${isScene ? `./illustrations/${item.exportName}` : "./system"}";

// Load Tiraz tokens.css and render inside SystemProvider.
// Provide context in nearby text.
<div${isScene ? "" : ' aria-hidden="true"'} style={{ inlineSize: "${isScene ? "36" : "16"}rem", maxInlineSize: "100%" }}>
  <${item.exportName}${isScene ? ` language="${language}"${item.id === "document-vault" ? " interactive" : item.id === "voice-field" ? " interactive animated" : " animated"}` : ""} />
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
              "مواد ملموسة، وحركة لها معنى. مشاهد تفاعلية للوكلاء والصوت والمستندات، مع رسوم للحالات الفارغة.",
              "Tactile materials, purposeful motion. Interactive scenes for agents, voice, and documents, alongside simple empty states.",
            )}
          </p>
        </header>
        <div
          className="illustration-filters"
          role="group"
          aria-label={t("تصفية الرسوم", "Filter illustrations")}
        >
          {(
            [
              ["all", "الكل", "All"],
              ["agents", "الوكلاء والاتصال", "Agents & connections"],
              ["workspace", "مساحة العمل", "Workspace"],
              ["empty", "الحالات الفارغة", "Empty states"],
            ] as const
          ).map(([value, ar, en]) => (
            <button
              type="button"
              key={value}
              aria-pressed={category === value}
              onClick={() => {
                setCategory(value);
                setActivePreview(null);
              }}
            >
              {t(ar, en)}
            </button>
          ))}
        </div>
        <div className="illustration-grid">
          {illustrations
            .filter(
              (entry) => category === "all" || entry.category === category,
            )
            .map(({ Component, ...entry }) => (
              <article key={entry.id} className="illustration-card">
                <SiteLink
                  route={{ kind: "illustrations", id: entry.id }}
                  navigate={navigate}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse")
                      setActivePreview(entry.id);
                  }}
                  onPointerLeave={() => setActivePreview(null)}
                  onFocus={() => setActivePreview(entry.id)}
                  onBlur={() => setActivePreview(null)}
                >
                  <div
                    className="illustration-stage"
                    data-kind={entry.category === "empty" ? "empty" : "scene"}
                    aria-hidden="true"
                  >
                    <Component
                      language={language}
                      animated={activePreview === entry.id}
                    />
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
              "مرّر المؤشر لمعاينة الحركة، أو افتح الرسم لتجربة تفاعلاته. تتكيّف المواد مع المظهر الفاتح والداكن، وتظهر التسميات بالعربية أو الإنجليزية. عند تقليل الحركة، تستقر المشاهد دون انتقالات.",
              "Hover to preview, or open a scene to explore its interactions. Materials adapt to light and dark themes, with Arabic and English labels. Reduced motion shows settled states without transitions.",
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
        <div className="illustration-preview-toolbar">
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
          {isScene && item.id !== "document-vault" && (
            <button
              className="site-action"
              type="button"
              onClick={() => setPlayback((value) => value + 1)}
            >
              <ArrowClockwiseIcon
                size={18}
                weight="regular"
                aria-hidden="true"
              />
              {t("إعادة الحركة", "Replay animation")}
            </button>
          )}
        </div>
        <div
          className="illustration-stage"
          data-kind={isScene ? "scene" : "empty"}
          data-size={size}
        >
          <Scene
            key={playback}
            language={language}
            interactive={!!isScene}
            animated={!!isScene && item.id !== "document-vault"}
          />
        </div>
      </div>
      <section className="illustration-usage">
        <h2>{t("استخدمه في تطبيقك", "Use it in your app")}</h2>
        <p>
          {t(
            "انسخ ملف المصدر والمثال، ثم حمّل رموز طراز واعرض الرسم داخل SystemProvider. يتحكم العنصر الحاوي في الحجم. أضف السياق بالنص المجاور؛ يُخفى الرسم الزخرفي عن قارئ الشاشة وتبقى أزرار التحكم متاحة.",
            "Copy the source file and example, load Tiraz tokens, and render inside SystemProvider. The wrapper controls size. Give context in nearby text; decorative artwork is hidden from screen readers while controls remain accessible.",
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
        {isScene && (
          <p className="site-muted">
            {t(
              "المشهد ثابت افتراضيًا. تحدد language لغة التسميات، وتُظهر interactive أزرار الملف وحالات الصوت. تشغّل animated حركة المعاينة؛ غيّر key لإعادة تسلسل الوكلاء أو الصوت.",
              "Scenes are static by default. language sets labels; interactive reveals folder and voice controls. animated starts the preview; change key to replay the agent or voice sequence.",
            )}
          </p>
        )}
        <p className="site-muted">
          {isScene
            ? t(
                "ملف مستقل لهذا المشهد:",
                "A self-contained file for this scene:",
              )
            : t(
                "ملف المصدر يضم الرسوم الثلاثة:",
                "The source file includes all three illustrations:",
              )}{" "}
          <bdi dir="ltr">{sourceFile}</bdi>
        </p>
        {!isScene && (
          <SiteLink
            className="note-link"
            route={{ kind: "component", id: "empty-state" }}
            navigate={navigate}
          >
            {t("ركّبه مع الحالة الفارغة", "Compose it with EmptyState")}
          </SiteLink>
        )}
      </section>
    </div>
  );
}
