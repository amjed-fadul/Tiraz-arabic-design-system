import { useEffect, useRef, useState } from "react";
import {
  LoadingState,
  ThinkingIndicator,
  ThinkingState,
  useReducedMotion,
} from "../../index";
import { Check } from "lucide-react";

type Language = "ar" | "en";
const steps = {
  ar: [
    "قراءة ٢١٧ فاتورة من شركة مدار",
    "مطابقة المبالغ مع أوامر الشراء",
    "إعداد ملخص الفروقات",
  ],
  en: [
    "Read 217 invoices from Madar",
    "Match totals against purchase orders",
    "Draft a summary of the differences",
  ],
};
function StepList({
  language,
  count = 3,
}: {
  language: Language;
  count?: number;
}) {
  return (
    <ol
      className="tz-thinking-steps"
      aria-label={language === "ar" ? "خطوات الإعداد" : "Preparation steps"}
    >
      {steps[language].slice(0, count).map((text) => (
        <li key={text}>
          <Check aria-hidden="true" />
          <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}
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
            ? "ستظهر الملاحظات هنا حين تجهز."
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
            ? ["جارٍ التفكير", "جارٍ التخطيط", "جارٍ المراجعة", "جارٍ التحقق"]
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
  const ar = language === "ar",
    reduced = useReducedMotion();
  // While active, each step lands in turn and the label follows the work. The
  // run starts afresh each time it becomes active, and its third step lands
  // 800 ms before a Replay's 2.6 s Working step ends, so all three labels show.
  const [run, setRun] = useState({ active, reached: 1 });
  if (run.active !== active) setRun({ active, reached: 1 });
  useEffect(() => {
    if (!active || reduced) return;
    const timers = [900, 1800].map((delay, index) =>
      setTimeout(
        () => setRun((current) => ({ ...current, reached: index + 2 })),
        delay,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, reduced]);
  const count = active && !reduced ? run.reached : 3;
  const working = ar
    ? ["جارٍ قراءة الفواتير", "جارٍ مطابقة المبالغ", "جارٍ إعداد الملخص"]
    : ["Reading invoices", "Matching totals", "Preparing summary"];
  return (
    <ThinkingState
      key={String(defaultExpanded)}
      label={active ? working[count - 1] : ar ? "الملخص جاهز" : "Summary ready"}
      active={active}
      defaultExpanded={defaultExpanded}
    >
      <StepList language={language} count={count} />
    </ThinkingState>
  );
}
/** One short scripted run on mount; unmount clears every timer. */
export function AIFeedbackDemo({ language = "ar" }: { language?: Language }) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const reduced = useReducedMotion();
  const [run, setRun] = useState<"reading" | "matching" | "ready">("reading");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef(0);
  const phase = reduced ? "ready" : run;
  const active = phase !== "ready";
  useEffect(() => {
    if (reduced) return;
    startedAt.current = Date.now();
    const timers = [
      setTimeout(() => setRun("matching"), 1200),
      setTimeout(() => setRun("ready"), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);
  useEffect(() => {
    if (!active) return;
    const clock = setInterval(
      () => setElapsedMs(Date.now() - startedAt.current),
      100,
    );
    return () => clearInterval(clock);
  }, [active]);
  const labels = {
    reading: t("جارٍ قراءة الفواتير", "Reading invoices"),
    matching: t("جارٍ مطابقة المبالغ", "Matching totals"),
    ready: t("ملخص المطابقة جاهز", "Reconciliation summary ready"),
  };
  return (
    <div style={{ display: "grid", gap: "var(--space-3)", minInlineSize: 0 }}>
      {phase === "reading" && (
        <LoadingState
          announcement="off"
          elapsedMs={elapsedMs}
          label={t("جارٍ قراءة ٢١٧ فاتورة", "Reading 217 invoices")}
        />
      )}
      {phase === "matching" && (
        <ThinkingIndicator
          announcement="off"
          label={t(
            "جارٍ مطابقة المبالغ مع أوامر الشراء",
            "Matching totals against purchase orders",
          )}
        />
      )}
      <ThinkingState label={labels[phase]} active={active}>
        <StepList
          language={language}
          count={phase === "reading" ? 1 : phase === "matching" ? 2 : 3}
        />
        {phase === "ready" && (
          <p style={{ marginBlockEnd: 0 }}>
            {t(
              "تطابقت ٢١٤ فاتورة، وتحتاج ٣ فواتير إلى مراجعة. أكبر فرق ١٬٢٥٠ ر.س في INV-1043.",
              "214 invoices match and 3 need review. The largest gap is 1,250 SAR on INV-1043.",
            )}
          </p>
        )}
      </ThinkingState>
    </div>
  );
}
