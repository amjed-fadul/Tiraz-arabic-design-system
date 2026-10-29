import { useId, useState } from "react";
import { Bot, Check, ChevronDown } from "lucide-react";
import { AttachedPanel } from "./AttachedPanel";
import type { PanelBehavior } from "./AttachedPanel";
import { Khayt } from "../../mascot/Khayt";
import { agentSwatches } from "../../mascot/agent-swatches";
import { agentDefinitions } from "./agent-data";
import { agentPhase } from "./useDemoRun";
import type { DemoRun } from "./useDemoRun";

export function AgentActivity({
  index,
  run,
  ar,
  open,
  onClose,
  ...behavior
}: {
  index: number;
  run: DemoRun | null;
  ar: boolean;
  open: boolean;
  onClose: () => void;
} & PanelBehavior) {
  const [expanded, setExpanded] = useState(false);
  const details = useId();
  const definition = agentDefinitions[index],
    phase = agentPhase(run, index),
    l = ar ? 1 : 0;
  const statuses = {
    ready: ["Ready", "جاهز"],
    queued: ["Queued", "بانتظار"],
    running: ["Working", "يعمل"],
    done: ["Done", "مكتمل"],
    stopped: ["Stopped", "متوقف"],
  };
  const action =
    phase.status === "done"
      ? definition.outcome[l]
      : phase.status === "ready"
        ? definition.purpose[l]
        : phase.status === "queued"
          ? ar
            ? "بانتظار السياق"
            : "Waiting for context"
          : definition.actions[Math.min(phase.step, 4)][l];
  return (
    <AttachedPanel
      id={`agent-${index}`}
      title={`${ar ? "وكيل" : "Agent"} ${index + 1}`}
      label={definition.name[l]}
      icon={<Bot size={12} />}
      open={open}
      onClose={onClose}
      closeLabel={`${ar ? "إغلاق" : "Close"} ${definition.name[l]}`}
      className="ac-agent-shell"
      state={phase.status}
      {...behavior}
      ar={ar}
    >
      <button
        className="ac-agent-body"
        aria-expanded={expanded}
        aria-controls={details}
        aria-label={`${definition.name[l]}: ${action}. ${ar ? "تفاصيل المهمة" : "Task details"}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="ac-agent-role-mark" aria-hidden="true">
          <Khayt
            size={32}
            color={agentSwatches(ar)[[3, 2, 0][index]].value}
            state={
              phase.status === "running"
                ? "working"
                : phase.status === "done"
                  ? "done"
                  : phase.status === "queued"
                    ? "waiting"
                    : "idle"
            }
            animated={phase.status === "running"}
          />
        </span>
        <span className="ac-agent-copy">
          <strong>{definition.name[l]}</strong>
          <span>{action}</span>
        </span>
        <span className="ac-agent-state">
          {phase.status === "running" ? (
            <>
              <i aria-hidden="true" />
              {`0:${String(Math.floor(phase.elapsed / 1000)).padStart(2, "0")}`}
            </>
          ) : (
            statuses[phase.status][l]
          )}
        </span>
        <span
          className="ac-agent-progress"
          role="progressbar"
          aria-label={`${definition.name[l]} ${ar ? "تقدم المعاينة" : "demo progress"}`}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={phase.step}
          aria-valuetext={
            ar
              ? `${phase.step} من 5 خطوات توضيحية`
              : `${phase.step} of 5 demo steps`
          }
        >
          {Array.from({ length: 10 }, (_, i) => (
            <i
              key={i}
              data-complete={i < phase.step * 2}
              data-current={i === phase.step * 2 && phase.status === "running"}
            />
          ))}
        </span>
        <ChevronDown
          className="ac-agent-disclosure"
          size={10}
          aria-hidden="true"
        />
      </button>
      <ol
        id={details}
        className="ac-agent-details"
        hidden={!expanded}
        aria-label={ar ? "مراحل المهمة" : "Task stages"}
      >
        {definition.actions.map((step, i) => (
          <li
            key={step[0]}
            data-complete={i < phase.step}
            aria-current={
              i === phase.step && phase.status === "running"
                ? "step"
                : undefined
            }
          >
            {i < phase.step ? (
              <Check size={10} aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{i + 1}</span>
            )}
            {step[l]}
          </li>
        ))}
      </ol>
    </AttachedPanel>
  );
}
