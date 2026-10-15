import { createRoot } from "react-dom/client";
import { useEffect, useRef } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import {
  LoadingState,
  ThinkingIndicator,
  ThinkingState,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import type { Accent } from "../../src/system";
export function MotionStudy() {
  const q = new URLSearchParams(location.search),
    ar = q.get("lang") === "ar",
    phase = q.get("phase");
  const accent: Accent = ["blue", "plum", "clay"].includes(
    q.get("accent") ?? "",
  )
    ? (q.get("accent") as Accent)
    : "sage";
  const t = (a: string, e: string) => (ar ? a : e);
  const main = useRef<HTMLElement>(null);
  // Verification-only clock: freeze real CSS animations at an exact phase.
  // Omission leaves the rendered components running normally for recordings.
  useEffect(() => {
    if (phase === null) return;
    const frame = requestAnimationFrame(() => {
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = Number(phase);
      }
      main.current!.dataset.phase = phase;
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  useEffect(() => {
    const root = main.current!;
    const observer = new MutationObserver((records) => {
      const changed = records.some((r) =>
        (r.target.nodeType === Node.ELEMENT_NODE
          ? (r.target as Element)
          : r.target.parentElement
        )?.closest('[role="status"]'),
      );
      if (changed)
        root.dataset.statusChanges = String(
          Number(root.dataset.statusChanges) + 1,
        );
    });
    root.querySelectorAll('[role="status"]').forEach((el) =>
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
          ref={main}
          data-status-changes="0"
          style={{
            boxSizing: "border-box",
            maxInlineSize: 680,
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
              {t("طِراز · خيوط النسيج", "Tiraz · weaving threads")}
            </h1>
            <p
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {t(
                "دراسة الحركة · محتوى توضيحي ثابت",
                "Motion study · static sample content",
              )}
            </p>
          </header>
          <section aria-label="LoadingState">
            <h2
              style={{
                fontSize: "var(--text-meta)",
                fontWeight: 500,
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-2)",
              }}
            >
              LoadingState
            </h2>
            <LoadingState
              label={t("جارٍ تحميل الملاحظات", "Loading notes")}
              description={t(
                "تظهر الملاحظات هنا عند توفّرها.",
                "Notes will appear here when available.",
              )}
            />
          </section>
          <section aria-label="ThinkingIndicator">
            <h2
              style={{
                fontSize: "var(--text-meta)",
                fontWeight: 500,
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-2)",
              }}
            >
              ThinkingIndicator
            </h2>
            <ThinkingIndicator
              label={t("جارٍ إعداد الرد", "Preparing reply")}
            />
          </section>
          <section aria-label="ThinkingState">
            <h2
              style={{
                fontSize: "var(--text-meta)",
                fontWeight: 500,
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-2)",
              }}
            >
              ThinkingState
            </h2>
            <ThinkingState
              label={t("جارٍ إعداد الملخص", "Preparing summary")}
              active
              defaultExpanded
            >
              <p style={{ margin: 0 }}>
                {t(
                  "ملخص نشاط موجز يزوّده التطبيق للمستخدم. تبقى التفاصيل ثابتة ومقروءة.",
                  "A brief user-facing activity summary supplied by the application. Details stay still and readable.",
                )}
              </p>
            </ThinkingState>
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<MotionStudy />);
