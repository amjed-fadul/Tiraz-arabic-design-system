import { useEffect, useRef, useState } from "react";
import {
  Button,
  LoadingState,
  ThinkingIndicator,
  ThinkingState,
} from "./system";

type Language = "ar" | "en";
export function LoadingStateExample({
  language = "ar",
  label,
  indicator = "spinner",
  description = true,
}: {
  language?: Language;
  label?: string;
  indicator?: "spinner" | "skeleton";
  description?: boolean;
}) {
  const ar = language === "ar";
  return (
    <LoadingState
      label={label ?? (ar ? "جارٍ تحميل الملاحظات" : "Loading notes")}
      indicator={indicator}
      description={
        description
          ? ar
            ? "تظهر الملاحظات هنا عند توفّرها."
            : "Notes will appear here when available."
          : undefined
      }
    />
  );
}
export function ThinkingIndicatorExample({
  language = "ar",
  label,
}: {
  language?: Language;
  label?: string;
}) {
  return (
    <ThinkingIndicator
      label={
        label ?? (language === "ar" ? "جارٍ إعداد الرد" : "Preparing reply")
      }
    />
  );
}
export function ThinkingStateExample({
  language = "ar",
  active = true,
  defaultExpanded = false,
}: {
  language?: Language;
  active?: boolean;
  defaultExpanded?: boolean;
}) {
  const ar = language === "ar";
  return (
    <ThinkingState
      key={String(defaultExpanded)}
      label={
        active
          ? ar
            ? "جارٍ إعداد الملخص"
            : "Preparing summary"
          : ar
            ? "الملخص جاهز"
            : "Summary ready"
      }
      active={active}
      defaultExpanded={defaultExpanded}
    >
      <p style={{ margin: 0 }}>
        {ar
          ? "ملخص نشاط يزوّده التطبيق للمستخدم: ترتيب الملاحظات المختارة حسب الموضوع."
          : "Application-supplied activity summary: grouping the selected notes by topic."}
      </p>
    </ThinkingState>
  );
}
/** Explicit local simulation. No AI service, network request or library progress. */
export function AIFeedbackDemo({ language = "ar" }: { language?: Language }) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [phase, setPhase] = useState<
    "idle" | "loading" | "arranging" | "ready" | "cancelled"
  >("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    generation = useRef(0);
  function clearRun() {
    generation.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  useEffect(() => () => clearRun(), []);
  function run() {
    clearRun();
    const current = generation.current;
    setPhase("loading");
    timers.current = [
      setTimeout(() => {
        if (generation.current === current) setPhase("arranging");
      }, 900),
      setTimeout(() => {
        if (generation.current === current) {
          timers.current = [];
          setPhase("ready");
        }
      }, 1800),
    ];
  }
  const active = phase === "loading" || phase === "arranging";
  const labels = {
    idle: t("العرض جاهز", "Demo ready"),
    loading: t("عرض توضيحي: إعداد العينة", "Demo: preparing sample"),
    arranging: t("عرض توضيحي: ترتيب العينة", "Demo: arranging sample"),
    ready: t("ملخص العرض جاهز", "Demo summary ready"),
    cancelled: t("أُلغي العرض", "Demo cancelled"),
  };
  return (
    <div style={{ display: "grid", gap: "var(--space-3)", minInlineSize: 0 }}>
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: "var(--text-meta)",
        }}
      >
        {t("محاكاة محلية", "Local simulation")}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Button size="sm" variant="secondary" onClick={run}>
          {phase === "idle"
            ? t("تشغيل العرض", "Run demo")
            : t("إعادة العرض", "Replay demo")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-disabled={!active}
          onClick={() => {
            if (!active) return;
            clearRun();
            setPhase("cancelled");
          }}
        >
          {t("إلغاء العرض", "Cancel demo")}
        </Button>
      </div>
      {phase === "loading" && (
        <LoadingState
          announcement="off"
          label={t("تحميل عينة محلية", "Loading local sample")}
        />
      )}
      {phase === "arranging" && (
        <ThinkingIndicator
          announcement="off"
          label={t("ترتيب ملاحظات العينة", "Arranging sample notes")}
        />
      )}
      <ThinkingState label={labels[phase]} active={active}>
        <p style={{ margin: 0 }}>
          {t(
            "عينة ثابتة: اتجاه عربي افتراضي، حالات تحميل موجزة، وتفاصيل اختيارية.",
            "Fixed sample: Arabic by default, compact loading feedback, and optional details.",
          )}
        </p>
        {phase === "ready" && (
          <p style={{ marginBlockEnd: 0 }}>
            {t(
              "تجمع هذه العينة ثلاث ملاحظات في ملخص قصير.",
              "This sample combines three notes into a short summary.",
            )}
          </p>
        )}
      </ThinkingState>
    </div>
  );
}

import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example() { return <div lang={"en"}><SystemProvider config={{...defaultConfig,...{"accent":"sage","density":"compact","typography":"standard","radius":8,"reducedMotion":false,"direction":"ltr","theme":"dark"}}}><div style={{display:"grid",gap:"var(--space-8)",minInlineSize:0}}><ThinkingStateExample language={"en"} {...{"active":true,"defaultExpanded":false}} /></div></SystemProvider></div>; }
