import { useEffect, useRef, useState } from "react";
import {
  Button,
  LoadingState,
  ThinkingIndicator,
  ThinkingState,
} from "../../index";
import { Check } from "lucide-react";

type Language = "ar" | "en";
export function LoadingStateExample({
  language = "ar",
  label,
  indicator = "spinner",
  description = false,
  variant = "drive",
  elapsed = true,
}: {
  language?: Language;
  label?: string;
  indicator?: "spinner" | "skeleton";
  description?: boolean;
  variant?: "drive" | "dots" | "orbit";
  elapsed?: boolean;
}) {
  const ar = language === "ar";
  return (
    <LoadingState
      label={label ?? (ar ? "جارٍ تحميل الملاحظات" : "Loading notes")}
      indicator={indicator}
      variant={variant}
      elapsedMs={elapsed ? 12400 : undefined}
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
  words = true,
  textOnly = false,
}: {
  language?: Language;
  label?: string;
  words?: boolean;
  textOnly?: boolean;
}) {
  const ar = language === "ar";
  return (
    <ThinkingIndicator
      textOnly={textOnly}
      words={
        words
          ? ar
            ? ["جارٍ الإعداد", "جارٍ التخطيط", "جارٍ المراجعة", "جارٍ التحقق"]
            : ["Thinking", "Planning", "Refining", "Checking"]
          : undefined
      }
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
      <ol
        className="tz-thinking-steps"
        aria-label={
          ar
            ? "خطوات نموذجية يزوّدها التطبيق"
            : "Application-supplied sample steps"
        }
      >
        {(ar
          ? ["مراجعة تسميات العينة", "تجميع مواضيع العينة", "إعداد مخطط العينة"]
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
  );
}
/** Explicit local simulation. No AI service, network request or library progress. */
export function AIFeedbackDemo({ language = "ar" }: { language?: Language }) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [phase, setPhase] = useState<
    "idle" | "loading" | "arranging" | "ready" | "cancelled"
  >("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef(0);
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
    startedAt.current = Date.now();
    setElapsedMs(0);
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
  useEffect(() => {
    if (!active) return;
    const clock = setInterval(
      () => setElapsedMs(Date.now() - startedAt.current),
      100,
    );
    return () => clearInterval(clock);
  }, [active]);
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
          elapsedMs={elapsedMs}
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
