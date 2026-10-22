import { useEffect, useRef, useState } from "react";

export interface AgentHandoffProps {
  language?: "ar" | "en";
  animated?: boolean;
  interactive?: boolean;
  className?: string;
}

const prompt = "Review this month's feedback.";
const styles = `
.agent-handoff { inline-size: 100%; color: var(--text); font-family: var(--font); }
.agent-handoff .agent-handoff-art { position: relative; aspect-ratio: 3 / 2; container-type: inline-size; isolation: isolate; }
.agent-handoff .agent-handoff-prompt { position: absolute; inset-block-start: 13%; inset-inline: 10%; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-paper); background: linear-gradient(160deg, var(--surface), var(--surface-well)); box-shadow: var(--shadow-paper), 0 var(--space-5) var(--space-8) color-mix(in srgb, var(--text) 6%, transparent); z-index: 2; direction: ltr; }
.agent-handoff .agent-handoff-prompt-copy { min-inline-size: 0; flex: 1; font-size: var(--text-label); line-height: var(--leading-meta); text-align: start; white-space: nowrap; }
.agent-handoff .agent-handoff-send { display: grid; place-items: center; flex: none; inline-size: var(--space-8); block-size: var(--space-8); border-radius: var(--radius-control); background: var(--text); color: var(--surface); box-shadow: var(--shadow-control); transition: transform var(--motion-press) var(--ease-out), background var(--motion-state) var(--ease-out); }
.agent-handoff .agent-handoff-send svg { inline-size: var(--space-4); block-size: var(--space-4); }
.agent-handoff[data-phase="typing"] .agent-handoff-prompt-copy { animation: agent-handoff-type calc(var(--motion-word) * 29) steps(29, end) both; }
.agent-handoff[data-phase="sent"] .agent-handoff-send { transform: scale(var(--press-scale)); background: var(--ai); }
.agent-handoff .agent-handoff-routes { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; overflow: visible; fill: none; stroke: var(--border-strong); stroke-width: 1.2; }
.agent-handoff .agent-handoff-route-signal { stroke: var(--ai); stroke-width: 1.8; stroke-dasharray: 0.12 1; stroke-dashoffset: 1.12; opacity: 0; }
.agent-handoff[data-phase="routing"] .agent-handoff-route-signal { opacity: 1; animation: agent-handoff-route calc(var(--motion-panel) * 3) var(--ease-in-out) both; }
.agent-handoff .agent-handoff-team { position: absolute; inset-block-start: 48%; inset-inline: 7%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); }
.agent-handoff .agent-handoff-role { position: relative; display: flex; flex-direction: column; align-items: center; padding: var(--space-4) var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-paper); background: linear-gradient(160deg, var(--surface), var(--surface-well)); box-shadow: var(--shadow-paper), 0 var(--space-3) var(--space-6) color-mix(in srgb, var(--text) 5%, transparent); transition: transform var(--motion-panel) var(--ease-out), border-color var(--motion-state) var(--ease-out); }
.agent-handoff .agent-handoff-role::before { content: ""; position: absolute; z-index: -1; inset: var(--space-1) var(--space-1) calc(var(--space-1) * -1); border: 1px solid var(--border); border-radius: inherit; background: var(--surface-subtle); transform: rotate(-3deg); }
.agent-handoff .agent-handoff-role[data-working="true"] { border-color: color-mix(in srgb, var(--ai) 45%, var(--border)); transform: translateY(calc(var(--space-1) * -1)); }
.agent-handoff .agent-handoff-seal { position: relative; display: grid; place-items: center; inline-size: var(--space-10); block-size: var(--space-10); margin-block-end: var(--space-2); border-radius: var(--radius-control); color: var(--text-secondary); background: var(--surface-tray); border: 1px solid var(--border); box-shadow: inset 0 1px 0 var(--surface), var(--shadow-control); }
.agent-handoff .agent-handoff-seal > svg { inline-size: var(--space-6); block-size: var(--space-6); }
.agent-handoff .agent-handoff-role[data-working="true"] .agent-handoff-seal { color: var(--ai); background: var(--ai-soft); }
.agent-handoff .agent-handoff-tick { position: absolute; inset-block-start: calc(var(--space-1) * -1); inset-inline-end: calc(var(--space-1) * -1); display: grid; place-items: center; inline-size: var(--space-4); block-size: var(--space-4); border-radius: 50%; color: var(--surface); background: var(--success); border: 2px solid var(--surface); opacity: 0; transform: scale(.65); transition: opacity var(--motion-state) var(--ease-out), transform var(--motion-panel) var(--ease-out); }
.agent-handoff .agent-handoff-tick svg { inline-size: 100%; block-size: 100%; }
.agent-handoff .agent-handoff-role[data-complete="true"] .agent-handoff-tick { opacity: 1; transform: scale(1); }
.agent-handoff .agent-handoff-name { font-size: var(--text-label); font-weight: var(--weight-medium); line-height: var(--leading-meta); }
.agent-handoff .agent-handoff-status { font-size: var(--text-micro); color: var(--text-muted); line-height: var(--leading-meta); text-align: center; min-block-size: 1.6em; }
.agent-handoff .agent-handoff-result { position: absolute; inset-block-start: 87%; inset-inline: 15%; display: flex; align-items: center; justify-content: center; gap: var(--space-2); font-size: var(--text-meta); color: var(--text-secondary); opacity: 0; transform: translateY(var(--space-1)); transition: opacity var(--motion-panel) var(--ease-out), transform var(--motion-panel) var(--ease-out); }
.agent-handoff .agent-handoff-result svg { inline-size: var(--space-4); block-size: var(--space-4); color: var(--success); flex: none; }
.agent-handoff[data-phase="done"] .agent-handoff-result { opacity: 1; transform: none; }
@keyframes agent-handoff-type { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } }
@keyframes agent-handoff-route { to { stroke-dashoffset: 0; } }
@container (max-width: 380px) {
  .agent-handoff .agent-handoff-prompt { inset-inline: 6%; padding: var(--space-2); gap: var(--space-2); }
  .agent-handoff .agent-handoff-prompt-copy { font-size: var(--text-micro); }
  .agent-handoff .agent-handoff-team { inset-inline: 4%; gap: var(--space-2); }
  .agent-handoff .agent-handoff-role { padding: var(--space-2) var(--space-1); }
  .agent-handoff .agent-handoff-seal { inline-size: var(--space-8); block-size: var(--space-8); margin-block-end: var(--space-1); }
  .agent-handoff .agent-handoff-name { font-size: var(--text-micro); }
  .agent-handoff .agent-handoff-status { display: none; }
  .agent-handoff .agent-handoff-result { font-size: var(--text-micro); inset-block-start: 91%; }
}
@media (prefers-reduced-motion: reduce) {
  .agent-handoff .agent-handoff-prompt-copy, .agent-handoff .agent-handoff-route-signal { animation: none; }
}
`;

const phases = [
  "typing",
  "sent",
  "routing",
  "research",
  "analysis",
  "review",
  "done",
] as const;
type Phase = (typeof phases)[number];

function duration(value: string) {
  return (
    Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000) || 0
  );
}

export function AgentHandoff({
  language = "ar",
  animated = false,
  className = "",
}: AgentHandoffProps) {
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("done");
  useEffect(() => {
    const element = root.current;
    if (!element || !animated) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tokens = getComputedStyle(element);
    const panel = duration(tokens.getPropertyValue("--motion-panel"));
    const word = duration(tokens.getPropertyValue("--motion-word"));
    if (reduced.matches || !panel || !word) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      timers.forEach(clearTimeout);
      setPhase("done");
    };
    const schedule: [Phase, number][] = [
      ["typing", 0],
      ["sent", word * prompt.length],
      ["routing", word * prompt.length + panel],
      ["research", word * prompt.length + panel * 4],
      ["analysis", word * prompt.length + panel * 7],
      ["review", word * prompt.length + panel * 10],
      ["done", word * prompt.length + panel * 13],
    ];
    for (const [next, delay] of schedule)
      timers.push(setTimeout(() => setPhase(next), delay));
    const stopIfReduced = () => {
      if (
        reduced.matches ||
        !duration(getComputedStyle(element).getPropertyValue("--motion-panel"))
      )
        finish();
    };
    const observer = new MutationObserver(stopIfReduced);
    const provider = element.closest(".tiraz-system");
    if (provider)
      observer.observe(provider, {
        attributes: true,
        attributeFilter: ["data-reduced-motion", "data-modality"],
      });
    const visibility = () => {
      if (document.hidden) finish();
    };
    reduced.addEventListener("change", stopIfReduced);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      reduced.removeEventListener("change", stopIfReduced);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [animated]);
  const active = animated ? phase : "done";
  const step = phases.indexOf(active);
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  return (
    <div
      ref={root}
      className={`agent-handoff ${className}`}
      dir={language === "ar" ? "rtl" : "ltr"}
      data-illustration="agent-handoff"
      data-animated={animated}
      data-phase={active}
    >
      <style href="tiraz-agent-handoff" precedence="illustrations">
        {styles}
      </style>
      <div className="agent-handoff-art" aria-hidden="true">
        <div className="agent-handoff-prompt" lang="en">
          <span className="agent-handoff-prompt-copy">{prompt}</span>
          <span className="agent-handoff-send">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5m-6 6 6-6 6 6" />
            </svg>
          </span>
        </div>
        <svg
          className="agent-handoff-routes"
          viewBox="0 0 600 400"
          preserveAspectRatio="none"
        >
          {[
            "M300 120V146Q300 162 284 162H144Q128 162 128 178V195",
            "M300 120V195",
            "M300 120V146Q300 162 316 162H456Q472 162 472 178V195",
          ].map((path) => (
            <g key={path}>
              <path d={path} />
              <path
                className="agent-handoff-route-signal"
                d={path}
                pathLength="1"
              />
            </g>
          ))}
        </svg>
        <div className="agent-handoff-team">
          {[
            [
              t("الباحث", "Researcher"),
              t("المصادر جاهزة", "Sources ready"),
              "M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4 10 6 6",
            ],
            [
              t("المحلّل", "Analyst"),
              t("الأنماط محددة", "Patterns found"),
              "M5 19V11m7 8V5m7 14V8M3 21h18",
            ],
            [
              t("المراجع", "Reviewer"),
              t("الملخّص جاهز", "Summary ready"),
              "M9 3H5v18h14V3h-4M9 2h6v4H9zM8 13l3 3 5-6",
            ],
          ].map(([name, status, icon], index) => {
            const working = step === index + 3;
            const complete = step > index + 3;
            return (
              <div
                key={name}
                className="agent-handoff-role"
                data-working={working}
                data-complete={complete}
              >
                <div className="agent-handoff-seal">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={icon} />
                  </svg>
                  <span className="agent-handoff-tick">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m4 8 3 3 5-6" />
                    </svg>
                  </span>
                </div>
                <span className="agent-handoff-name">{name}</span>
                <span className="agent-handoff-status">
                  {complete
                    ? status
                    : working
                      ? t("جارٍ العمل", "Working")
                      : t("بانتظار المهمة", "Standing by")}
                </span>
              </div>
            );
          })}
        </div>
        <div className="agent-handoff-result">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
          {t("ملخّص واحد، بجهد الفريق", "One brief. A team behind it.")}
        </div>
      </div>
    </div>
  );
}
