import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import {
  Button,
  LoadingState,
  ThinkingIndicator,
  ThinkingState,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import type { Accent } from "../../src/system";
import { AIFeedbackDemo } from "../../src/system/ai/examples/AIFeedbackExamples";
export function MotionStudy() {
  const q = new URLSearchParams(location.search),
    ar = q.get("lang") === "ar",
    phase = q.get("phase");
  const accent: Accent = ["blue", "plum", "clay"].includes(
    q.get("accent") ?? "",
  )
    ? (q.get("accent") as Accent)
    : "sage";
  const [active, setActive] = useState(true),
    [expanded, setExpanded] = useState(true);
  const root = useRef<HTMLElement>(null);
  const t = (a: string, e: string) => (ar ? a : e);
  useEffect(() => {
    if (phase === null) return;
    const frame = requestAnimationFrame(() => {
      document.getAnimations().forEach((animation) => {
        animation.pause();
        animation.currentTime = Number(phase);
      });
      document.querySelectorAll("svg").forEach((svg) => {
        svg.pauseAnimations?.();
        svg.setCurrentTime?.(Number(phase) / 1000);
      });
      root.current!.dataset.phase = phase;
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  useEffect(() => {
    const main = root.current!;
    const observer = new MutationObserver((records) => {
      if (
        records.some((r) =>
          (r.target.nodeType === Node.ELEMENT_NODE
            ? (r.target as Element)
            : r.target.parentElement
          )?.closest('[role="status"]'),
        )
      )
        main.dataset.statusChanges = String(
          Number(main.dataset.statusChanges) + 1,
        );
    });
    main.querySelectorAll('[role="status"]').forEach((el) =>
      observer.observe(el, {
        subtree: true,
        childList: true,
        characterData: true,
      }),
    );
    return () => observer.disconnect();
  }, []);
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: ar ? "rtl" : "ltr",
          theme: q.get("theme") === "dark" ? "dark" : "light",
          accent,
          reducedMotion: q.get("motion") === "true",
          density: q.get("custom") === "true" ? "standard" : "compact",
          typography: q.get("custom") === "true" ? "large" : "standard",
        }}
      >
        <main
          ref={root}
          data-status-changes="0"
          style={{
            boxSizing: "border-box",
            maxInlineSize: 760,
            minBlockSize: "100vh",
            marginInline: "auto",
            padding: "var(--space-6)",
            display: "grid",
            alignContent: "start",
            gap: "var(--space-6)",
            minInlineSize: 0,
          }}
        >
          <header>
            <h1 style={{ fontSize: "var(--text-heading)", margin: 0 }}>
              {t(
                "طِراز · حركة حالات النشاط",
                "Tiraz · activity feedback motion",
              )}
            </h1>
            <p
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {t(
                "أمثلة محلية · محتوى يزوّده التطبيق",
                "Local samples · application-supplied content",
              )}
            </p>
          </header>
          <section aria-label="LoadingState">
            <h2
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-3)",
              }}
            >
              LoadingState
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-4)",
              }}
            >
              {(["drive", "dots", "orbit"] as const).map((variant) => (
                <div
                  key={variant}
                  style={{ display: "grid", gap: "var(--space-1)" }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-meta)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {variant[0].toUpperCase() + variant.slice(1)}
                  </span>
                  <LoadingState
                    label={t("جارٍ التحميل", "Working")}
                    variant={variant}
                    elapsedMs={12400}
                  />
                </div>
              ))}
            </div>
          </section>
          <section aria-label="ThinkingIndicator">
            <h2
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-3)",
              }}
            >
              ThinkingIndicator
            </h2>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <ThinkingIndicator
                label={t("جارٍ إعداد الرد", "Preparing reply")}
                words={
                  ar
                    ? [
                        "جارٍ الإعداد",
                        "جارٍ التخطيط",
                        "جارٍ المراجعة",
                        "جارٍ التحقق",
                      ]
                    : ["Thinking", "Planning", "Refining", "Checking"]
                }
              />
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  minInlineSize: 0,
                }}
              >
                <span>{t("المساعد", "Assistant")}</span>
                <ThinkingIndicator
                  label={t("جارٍ إعداد الرد النصي", "Preparing text reply")}
                  words={
                    ar
                      ? ["جارٍ الإعداد", "جارٍ التحقق"]
                      : ["Thinking", "Checking"]
                  }
                  textOnly
                />
              </span>
            </div>
          </section>
          <section aria-label="ThinkingState">
            <h2
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-3)",
              }}
            >
              ThinkingState
            </h2>
            <ThinkingState
              label={
                active
                  ? t("جارٍ إعداد الملخص", "Preparing summary")
                  : t("ملخص العينة جاهز", "Sample summary ready")
              }
              active={active}
              expanded={expanded}
              onExpandedChange={setExpanded}
            >
              <ol
                className="tz-thinking-steps"
                aria-label={t("خطوات نموذجية", "Sample steps")}
              >
                {(ar
                  ? [
                      "مراجعة تسميات العينة",
                      "تجميع مواضيع العينة",
                      "إعداد مخطط العينة",
                    ]
                  : [
                      "Review sample labels",
                      "Group sample topics",
                      "Prepare sample outline",
                    ]
                ).map((text) => (
                  <li key={text}>
                    <Check aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </ThinkingState>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActive(!active)}
            >
              {active
                ? t("إكمال العينة", "Complete sample")
                : t("إعادة العينة", "Replay sample")}
            </Button>
          </section>
          <section aria-label="Connected demo">
            <h2
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-2)",
              }}
            >
              {t("عرض محلي متصل", "Connected local demo")}
            </h2>
            <AIFeedbackDemo language={ar ? "ar" : "en"} />
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<MotionStudy />);
