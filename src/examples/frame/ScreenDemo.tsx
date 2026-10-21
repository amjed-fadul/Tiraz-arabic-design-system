import { useEffect, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { AIMark, Button, useReducedMotion } from "../../system";
import { useScreen } from "./screen";
import { ScreenDemoContext, useScreenDemo } from "./useScreenDemo";
import type { ScreenDemoState } from "./useScreenDemo";

const typingEnd = 2400;
const sendingEnd = 2800;
const workDuration = 4800;

const withInput = new Set([
  "customer-profile",
  "help-center",
  "content-studio",
]);

/** A one-shot presentation clock. It never invokes an application action. */
export function ScreenDemoProvider({ children }: { children: ReactNode }) {
  const { slug } = useScreen();
  const reduced = useReducedMotion();
  const enabled =
    !reduced &&
    new URLSearchParams(window.location.search).get("demo") !== "off";
  const input = withInput.has(slug);
  const workStart = input ? sendingEnd : 0;
  const duration = workStart + workDuration;
  const [elapsed, setElapsed] = useState(0);
  const [interrupted, setInterrupted] = useState(false);
  const [paused, setPaused] = useState(false);
  const takeoverKey = useRef<string | null>(null);
  const automatic = enabled && !interrupted;
  const active = automatic && elapsed < duration;
  const phase: ScreenDemoState["phase"] = !active
    ? "complete"
    : input && elapsed < typingEnd
      ? "typing"
      : input && elapsed < sendingEnd
        ? "sending"
        : "working";
  useEffect(() => {
    if (!active || paused) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "hidden")
        setElapsed((value) => Math.min(value + 40, duration));
    }, 40);
    return () => clearInterval(timer);
  }, [active, paused, duration]);
  const stop = () => {
    setInterrupted(true);
    setPaused(false);
  };
  const interrupt = (event: SyntheticEvent) => {
    if (
      !(event.target instanceof Element) ||
      event.target.closest("[data-demo-control]")
    )
      return;
    stop();
  };
  const value: ScreenDemoState = {
    submitted: input && elapsed >= sendingEnd,
    phase,
    active,
    automatic,
    paused,
    progress: Math.max(0, Math.min(1, (elapsed - workStart) / workDuration)),
    step: Math.min(2, Math.floor(Math.max(0, elapsed - workStart) / 1600)),
    draft: (text) =>
      phase === "typing"
        ? Array.from(text)
            .slice(
              0,
              Math.floor(Array.from(text).length * Math.min(1, elapsed / 2000)),
            )
            .join("")
        : phase === "sending"
          ? text
          : "",
    stop,
    toggle: () => setPaused((value) => !value),
    replay: () => {
      setElapsed(0);
      setInterrupted(false);
      setPaused(false);
    },
  };
  return (
    <ScreenDemoContext.Provider value={value}>
      <div
        className="screen-demo-host"
        data-demo-phase={phase}
        data-demo-paused={(active && paused) || undefined}
        onClickCapture={(event) => {
          if (
            active &&
            event.target instanceof Element &&
            event.target.closest(
              "[data-demo-submit], [data-demo-composer] .tz-chat-entry-send",
            )
          ) {
            // The animated prompt may cover a saved draft. Taking over must
            // never submit that draft before the person has seen it again.
            event.preventDefault();
            event.stopPropagation();
          }
          interrupt(event);
        }}
        onKeyDownCapture={(event) => {
          const target = event.target as Element;
          const submit = target.closest(
            "[data-demo-submit], [data-demo-composer] .tz-chat-entry-send",
          );
          const composer = target.closest("[data-demo-composer]");
          if (
            takeoverKey.current === event.key ||
            (active &&
              ((submit && (event.key === "Enter" || event.key === " ")) ||
                (composer && event.key === "Enter" && !event.shiftKey)))
          ) {
            takeoverKey.current = event.key;
            event.preventDefault();
            event.stopPropagation();
            interrupt(event);
            return;
          }
          if (
            !["Enter", " ", "Tab", "Shift", "Control", "Alt", "Meta"].includes(
              event.key,
            )
          )
            interrupt(event);
        }}
        onKeyUpCapture={(event) => {
          if (takeoverKey.current !== event.key) return;
          takeoverKey.current = null;
          event.preventDefault();
          event.stopPropagation();
        }}
        onFocus={(event) => {
          if (event.target.matches("input, textarea, [contenteditable=true]"))
            interrupt(event);
        }}
      >
        {children}
      </div>
    </ScreenDemoContext.Provider>
  );
}

export function ScreenDemoControls() {
  const { t } = useScreen();
  const demo = useScreenDemo();
  return (
    <div className="screen-demo-controls" data-demo-control>
      {demo.active ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={demo.toggle}
          aria-label={
            demo.paused
              ? t("متابعة العرض", "Resume demo")
              : t("إيقاف العرض مؤقتًا", "Pause demo")
          }
        >
          {demo.paused ? (
            <Play size={14} aria-hidden />
          ) : (
            <Pause size={14} aria-hidden />
          )}
          {demo.paused ? t("متابعة", "Resume") : t("إيقاف", "Pause")}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={demo.replay}>
          <RotateCcw size={14} aria-hidden />
          {t("إعادة العرض", "Replay demo")}
        </Button>
      )}
    </div>
  );
}

/** Identifies the AI workspace without adding another live region. */
export function ScreenAgentHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  const { t } = useScreen();
  const demo = useScreenDemo();
  return (
    <div className="screen-agent-heading">
      <div className="screen-agent-identity">
        <AIMark size="sm" working={demo.active && !demo.paused} />
        <div>
          <span className="screen-agent-eyebrow">
            {t("مساعد ذكي", "AI agent")}
          </span>
          <h2>{title}</h2>
        </div>
      </div>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

/** Background screens start with the agent inspecting their existing records. */
export function ScreenActivity({
  steps,
  ready,
}: {
  steps: readonly [string, string, string];
  ready: string;
}) {
  const demo = useScreenDemo();
  return (
    <div className="screen-activity" data-working={demo.active || undefined}>
      {demo.active ? (
        <AIMark size="xs" working={!demo.paused} />
      ) : (
        <Check size={14} aria-hidden />
      )}
      <span key={demo.active ? demo.step : "ready"}>
        {demo.active ? steps[demo.step] : ready}
      </span>
      <span className="screen-activity-steps" aria-hidden>
        {steps.map((_, index) => (
          <i
            key={index}
            data-done={!demo.active || index <= demo.step || undefined}
          />
        ))}
      </span>
    </div>
  );
}

const activity = {
  dashboard: [
    ["قراءة الطلبات الأخيرة", "Reading recent orders"],
    ["مقارنة أداء الأسبوع", "Comparing the week"],
    ["تجهيز ملخّص العملاء", "Preparing customer insights"],
    ["ملخّص العملاء جاهز", "Customer insights ready"],
  ],
  "month-end-close": [
    ["مطابقة حسابات المورّدين", "Reconciling supplier accounts"],
    ["مراجعة كشف البنك", "Checking the bank statement"],
    ["تجهيز قيود الاستحقاق", "Preparing accrual entries"],
    ["المراجعة جاهزة لقرارك", "Ready for your review"],
  ],
  invoices: [
    ["قراءة الفواتير المتأخرة", "Reading overdue invoices"],
    ["مراجعة سجل السداد", "Checking payment history"],
    ["كتابة تذكير بالسداد", "Writing a payment reminder"],
    ["التذكيرات جاهزة للمراجعة", "Reminders ready for review"],
  ],
  "customer-profile": [
    ["قراءة سجل العميل", "Reading the customer record"],
    ["حساب أيام التأخير", "Calculating payment delays"],
    ["تجهيز الإجابة", "Preparing the answer"],
    ["يمكنك طرح سؤال عن هذا العميل", "Ask a question about this customer"],
  ],
  "sales-pipeline": [
    ["قراءة الصفقات المفتوحة", "Reading open deals"],
    ["مراجعة حركة المراحل", "Checking stage changes"],
    ["تجهيز ملخّص المبيعات", "Preparing pipeline insights"],
    ["الصفقات جاهزة للمتابعة", "Pipeline ready for follow-up"],
  ],
  onboarding: [
    ["تجهيز مساحة المنشأة", "Preparing your company workspace"],
    ["مراجعة متطلّبات التوثيق", "Checking verification requirements"],
    ["تجهيز خطوات التسجيل", "Preparing your setup steps"],
    ["ابدأ ببيانات منشأتك", "Start with your company details"],
  ],
  "help-center": [
    ["قراءة السؤال", "Reading your question"],
    ["البحث في دليل المساعدة", "Searching the help articles"],
    ["كتابة إجابة موثّقة", "Writing a sourced answer"],
    ["المساعد جاهز لأسئلتك", "Your assistant is ready"],
  ],
  "contract-review": [
    ["قراءة ملحق العقد", "Reading the contract annex"],
    ["مراجعة شروط الدفع", "Checking payment terms"],
    ["تجهيز التعديلات المقترحة", "Preparing suggested edits"],
    ["التعديلات جاهزة لقرارك", "Edits ready for your review"],
  ],
  "content-studio": [
    ["قراءة موجز الحملة", "Reading the campaign brief"],
    ["تكوين الصور", "Composing the artwork"],
    ["إضافة اللمسات الأخيرة", "Finishing the details"],
    ["اختر النسخة المناسبة لحملتك", "Choose a version for your campaign"],
  ],
  "agent-control-room": [
    ["مراجعة مهام الوكلاء", "Checking agent tasks"],
    ["جمع نتائج الأدوات", "Gathering tool results"],
    ["ترتيب القرارات المنتظرة", "Organizing pending decisions"],
    ["الوكلاء بانتظار توجيهك", "Your agents are ready for direction"],
  ],
  "team-settings": [
    ["قراءة أعضاء الفريق", "Reading team members"],
    ["مراجعة أذونات المساعد", "Reviewing assistant permissions"],
    ["تجهيز إعدادات الفريق", "Preparing team settings"],
    [
      "أنت تتحكّم في صلاحيات المساعد",
      "You control the assistant’s permissions",
    ],
  ],
} as const;

export function ScreenOpeningActivity() {
  const { slug, t } = useScreen();
  const lines = activity[slug];
  return (
    <ScreenActivity
      steps={[
        t(lines[0][0], lines[0][1]),
        t(lines[1][0], lines[1][1]),
        t(lines[2][0], lines[2][1]),
      ]}
      ready={t(lines[3][0], lines[3][1])}
    />
  );
}
