import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play";
import { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { Button } from "../system/Button";
import { ColorPicker } from "../system/ColorPicker";
import { useReducedMotion } from "../system/useReducedMotion";
import { numberLocale } from "../system/config";
import { SiteLink } from "../workbench/SiteLink";
import type { Navigate } from "../workbench/SiteLink";
import { Khayt } from "./Khayt";
import { khaytStates } from "./khayt-motion";
import type { KhaytState } from "./khayt-motion";
import { agentSwatches } from "./agent-swatches";
import { useAgentColor } from "./useAgentColor";
import "./khayt-studio.css";

const labels = {
  ar: {
    idle: "جاهز",
    thinking: "يفكّر",
    working: "يعمل",
    waiting: "بانتظارك",
    done: "اكتملت المهمة",
    blocked: "يحتاج مساعدة",
  },
  en: {
    idle: "Ready",
    thinking: "Thinking",
    working: "Working",
    waiting: "Needs you",
    done: "Done",
    blocked: "Blocked",
  },
};
const descriptions = {
  ar: {
    idle: "جاهز لمراجعة الفواتير.",
    thinking: "يراجع سجل العميل قبل صياغة التذكير.",
    working: "يصيغ تذكيرًا واضحًا ولطيفًا بالسداد.",
    waiting: "المسودة جاهزة. القرار لك.",
    done: "انتهت المعاينة. لم تُرسل أي رسالة.",
    blocked: "بيانات جهة الاتصال ناقصة. أضف البريد للمتابعة.",
  },
  en: {
    idle: "Ready to review the invoices.",
    thinking: "Checking the customer’s history before drafting.",
    working: "Writing a clear, considerate payment reminder.",
    waiting: "The draft is ready. You decide what happens next.",
    done: "Preview complete. No message was sent.",
    blocked: "Contact details are missing. Add an email to continue.",
  },
};

export function KhaytStudio({
  language,
  navigate,
}: {
  language: "ar" | "en";
  navigate: Navigate;
}) {
  const ar = language === "ar",
    t = (a: string, e: string) => (ar ? a : e);
  const reduced = useReducedMotion();
  const [state, setState] = useState<KhaytState>("idle");
  const [paused, setPaused] = useState(false);
  const [demo, setDemo] = useState(false);
  const [announcement, setAnnouncement] = useState<KhaytState | null>(null);
  const [color, setColor] = useAgentColor("collections");
  const elapsed = useRef(0);
  const format = new Intl.NumberFormat(
    numberLocale({ direction: ar ? "rtl" : "ltr" }),
  );
  const select = (next: KhaytState) => {
    setDemo(false);
    setState(next);
    setAnnouncement(next);
  };
  useEffect(() => {
    if (!demo || paused) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      elapsed.current += 50;
      const next =
        elapsed.current < 1800
          ? "thinking"
          : elapsed.current < 6000
            ? "working"
            : "waiting";
      setState(next);
      setAnnouncement(next);
      if (next === "waiting") setDemo(false);
    }, 50);
    return () => clearInterval(timer);
  }, [demo, paused]);
  function playTask() {
    elapsed.current = 0;
    setPaused(false);
    setDemo(true);
    setState("thinking");
    setAnnouncement("thinking");
  }
  return (
    <div
      className="khayt-studio"
      style={{ "--agent-color": color } as CSSProperties}
    >
      <SiteLink
        className="khayt-back"
        route={{ kind: "illustrations" }}
        navigate={navigate}
      >
        <ArrowLeftIcon size={16} className="tz-mirror-rtl" aria-hidden />
        {t("الرسوم التوضيحية", "Illustrations")}
      </SiteLink>
      <header className="component-heading">
        <h1>{t("خيط", "Khayt")}</h1>
        <p>
          {t(
            "شخصية لمساعدك. خيط يتحرّك مع العمل، ونظرة تنتظر قرارك.",
            "A character for your agent. A thread that follows the work, a glance that waits for you.",
          )}
        </p>
      </header>
      <div className="khayt-studio-grid">
        <section
          className="khayt-stage"
          aria-label={t("معاينة خيط", "Khayt preview")}
        >
          <div className="khayt-stage-top">
            <span>
              {t("قُطن، وخيط من الفضول", "Cotton, with a curious streak")}
            </span>
            <span className="khayt-state-label">{labels[language][state]}</span>
          </div>
          <div className="khayt-stage-art">
            <Khayt state={state} color={color} animated={!paused} />
          </div>
          <div className="khayt-playback">
            <Button variant="secondary" onClick={playTask}>
              <PlayIcon weight="fill" size={14} aria-hidden />
              {t("جرّب مهمة", "Play a task")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
            >
              {paused ? (
                <PlayIcon size={16} aria-hidden />
              ) : (
                <PauseIcon size={16} aria-hidden />
              )}
              {paused ? t("استئناف", "Resume") : t("إيقاف مؤقت", "Pause")}
            </Button>
          </div>
          <p className="khayt-stage-caption">
            {reduced
              ? t(
                  "تقليل الحركة مفعّل. تتغيّر الوضعيات دون حركة مستمرة.",
                  "Reduced motion is on. Poses change without continuous movement.",
                )
              : t(
                  "حركة هادئة عند الاستعداد، وتعابير مختلفة لكل خطوة.",
                  "Quiet at rest. A different expression for every step.",
                )}
          </p>
        </section>
        <div className="khayt-studio-controls">
          <section className="khayt-control-section">
            <h2>{t("حالة المساعد", "Agent state")}</h2>
            <div
              className="khayt-states"
              role="group"
              aria-label={t("حالة المساعد", "Agent state")}
            >
              {khaytStates.map((value) => (
                <Button
                  key={value}
                  variant={state === value ? "secondary" : "ghost"}
                  aria-pressed={state === value}
                  onClick={() => select(value)}
                >
                  {labels[language][value]}
                </Button>
              ))}
            </div>
            <p className="khayt-state-description">
              {descriptions[language][state]}
            </p>
          </section>
          <section className="khayt-control-section">
            <h2>{t("لون يخصّ مساعدك", "Make it your agent")}</h2>
            <ColorPicker
              label={t("لون وكيل التحصيل", "Collections agent color")}
              helper={t(
                "يُحفظ لهذا المساعد، ويظهر أيضًا في شاشة الفواتير.",
                "Saved for this agent, including on the Invoices screen.",
              )}
              value={color}
              onValueChange={setColor}
              swatches={agentSwatches(ar)}
              announcement="off"
            />
          </section>
          <section className="khayt-control-section">
            <h2>{t("واضح، حتى بالحجم الصغير", "Recognizable at a glance")}</h2>
            <div className="khayt-sizes">
              {[24, 32, 48].map((size) => (
                <div key={size}>
                  <div className="khayt-size-avatar">
                    <Khayt state={state} color={color} size={size} />
                  </div>
                  <span>
                    {format.format(size)} {t("بكسل", "px")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <section
        className="khayt-context-section"
        aria-labelledby="khayt-context-title"
      >
        <div className="khayt-context-intro">
          <span className="khayt-eyebrow">
            {t("داخل المنتج", "IN CONTEXT")}
          </span>
          <h2 id="khayt-context-title">
            {t(
              "حضور واضح، ومساحة لعملك",
              "A presence, with room for your work",
            )}
          </h2>
          <p>
            {t(
              "الاسم واللون يعرّفان المساعد. الحركة توضّح حالته، وأنت تتحكّم بالخطوة التالية.",
              "The name and color identify the agent. Motion explains its state. You control the next step.",
            )}
          </p>
          <SiteLink
            route={{ kind: "screen", slug: "invoices" }}
            navigate={navigate}
          >
            {t("افتح شاشة الفواتير", "Open the Invoices screen")}
          </SiteLink>
        </div>
        <div className="khayt-agent-panel">
          <div className="khayt-panel-heading">
            <Khayt state={state} color={color} animated={!paused} size={56} />
            <div>
              <span>{t("مساعد ذكي", "AI agent")}</span>
              <h3>{t("وكيل التحصيل", "Collections agent")}</h3>
            </div>
            <span className="khayt-panel-status">
              {labels[language][state]}
            </span>
          </div>
          <div className="khayt-panel-content">
            <p className="khayt-panel-description">
              {descriptions[language][state]}
            </p>
            <div
              className="khayt-draft"
              data-active={state === "working" || state === "thinking"}
            >
              <span className="khayt-eyebrow">
                {t("مسودة تذكير", "REMINDER DRAFT")}
              </span>
              <p>
                {t(
                  "مرحبًا فريق مدار، نود تذكيركم بالفاتورة المستحقة. يسعدنا مساعدتكم إذا احتجتم أي تفاصيل لإتمام السداد.",
                  "Hello Madar team, a friendly reminder about your outstanding invoice. We’re happy to help if you need any details to complete the payment.",
                )}
              </p>
            </div>
            <div className="khayt-panel-actions">
              <Button
                variant="secondary"
                aria-disabled={state !== "waiting"}
                onClick={() => {
                  if (state === "waiting") select("done");
                }}
              >
                <CheckIcon size={16} aria-hidden />
                {t("إنهاء المراجعة التجريبية", "Finish preview review")}
              </Button>
              <span>
                {t("معاينة، دون إرسال", "Preview only · nothing is sent")}
              </span>
            </div>
          </div>
        </div>
      </section>
      <span className="sr-only" role="status">
        {announcement
          ? `${labels[language][announcement]}. ${descriptions[language][announcement]}`
          : ""}
      </span>
    </div>
  );
}
