import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import {
  Button,
  Input,
  LoadingState,
  ThinkingIndicator,
  ThinkingState,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import { AIFeedbackDemo } from "../../src/system/ai/examples/AIFeedbackExamples";
export function Fixture() {
  const q = new URLSearchParams(location.search),
    ar = q.get("lang") !== "en";
  const [open, setOpen] = useState(true),
    [active, setActive] = useState(true),
    [demo, setDemo] = useState(true),
    [replaced, setReplaced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    root = useRef<HTMLElement>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const container = root.current!;
    const observed = container.querySelectorAll('[role="status"]');
    const observer = new MutationObserver((records) => {
      const changed = new Set(
        records
          .map((r) =>
            (r.target.nodeType === Node.ELEMENT_NODE
              ? (r.target as Element)
              : r.target.parentElement
            )?.closest('[role="status"]'),
          )
          .filter(Boolean),
      );
      for (const status of changed) {
        const events = JSON.parse(container.dataset.statusEvents || "[]");
        events.push(status!.textContent);
        container.dataset.statusEvents = JSON.stringify(events);
      }
    });
    observed.forEach((el) =>
      observer.observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
      }),
    );
    return () => observer.disconnect();
  }, [demo]);
  const t = (a: string, e: string) => (ar ? a : e);
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: ar ? "rtl" : "ltr",
          theme: q.get("theme") === "dark" ? "dark" : "light",
          density: q.get("custom") === "true" ? "standard" : "compact",
          typography: q.get("custom") === "true" ? "large" : "standard",
          accent: q.get("custom") === "true" ? "plum" : "sage",
          radius: q.get("custom") === "true" ? 2 : 8,
          reducedMotion: q.get("motion") === "true",
        }}
      >
        <main
          ref={root}
          data-status-events="[]"
          style={{
            maxInlineSize: 740,
            marginInline: "auto",
            padding: "var(--space-4)",
            boxSizing: "border-box",
            minBlockSize: "100vh",
            display: "grid",
            alignContent: "start",
            gap: "var(--space-6)",
            minInlineSize: 0,
          }}
        >
          <h1 style={{ margin: 0 }}>{t("حالات النشاط", "AI feedback")}</h1>
          <section aria-label="LoadingState">
            <h2 style={{ fontSize: "var(--text-heading)", margin: 0 }}>
              LoadingState
            </h2>
            <LoadingState
              label={t("جارٍ تحميل الملاحظات", "Loading notes")}
              description={t(
                "تظهر الملاحظات هنا عند توفّرها.",
                "Notes will appear here when available.",
              )}
            />
            <LoadingState
              indicator="skeleton"
              label={t("تحميل العينة المحلية", "Loading local sample")}
            />
          </section>
          <section aria-label="ThinkingIndicator">
            <h2 style={{ fontSize: "var(--text-heading)", margin: 0 }}>
              ThinkingIndicator
            </h2>
            <ThinkingIndicator
              label={t("جارٍ إعداد الرد", "Preparing reply")}
            />
          </section>
          <section aria-label="ThinkingState">
            <h2 style={{ fontSize: "var(--text-heading)", margin: 0 }}>
              ThinkingState
            </h2>
            <ThinkingState
              active={active}
              label={
                active
                  ? t("جارٍ إعداد الملخص", "Preparing summary")
                  : t("الملخص جاهز", "Summary ready")
              }
              expanded={open}
              onExpandedChange={setOpen}
            >
              <p style={{ margin: 0 }}>
                {t(
                  "ملخص موجز للمستخدم يزوّده التطبيق مع محتوى مختلط: ",
                  "Brief user-facing summary supplied by the application with mixed content: ",
                )}
                <bdi dir="ltr">DEMO-2026/42</bdi>
              </p>
              {!replaced ? (
                <>
                  <Input label="Detail note" defaultValue="Retained note" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplaced(true);
                      setOpen(false);
                    }}
                  >
                    Replace details and collapse
                  </Button>
                </>
              ) : (
                <p>Host replaced details</p>
              )}
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Close details
              </Button>
            </ThinkingState>
          </section>
          <section
            aria-label="Focus probe"
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(() => setOpen(false), 500);
              }}
            >
              Collapse later
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setActive(!active)}
            >
              Change status
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDemo(!demo)}
            >
              {demo ? "Unmount demo" : "Mount demo"}
            </Button>
            <Button size="sm" variant="ghost">
              Outside
            </Button>
          </section>
          <section aria-label="Connected demo">
            <h2 style={{ fontSize: "var(--text-heading)", margin: 0 }}>
              {t("عرض محلي متصل", "Connected local demo")}
            </h2>
            {demo && <AIFeedbackDemo language={ar ? "ar" : "en"} />}
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
