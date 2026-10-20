import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AIMark } from "./AIMark";
import { SourceChip } from "./SourceChip";
import type { SourceReference } from "./Sources";
import { StatusIcon } from "./StatusIcon";
import { Thread } from "./Thread";
import { thinkingPanelCopy } from "./cited-answer-copy";
import { numberLocale } from "./config";
import { formatElapsed } from "./format";
import { useArrivals } from "./useArrivals";
import { useChanged } from "./useChanged";
import { useDisclosure } from "./useDisclosure";
import { useSystem } from "./useSystem";

/** Every built-in string the panel shows; `labels` overrides any of them. */
export interface ThinkingPanelLabels {
  /** The header while running, and the one sentence announced for it. */
  thinking: string;
  /** The header once done, around the time it took: «فكّر لمدة ٦ث». */
  thought: (elapsed: string) => string;
  /** The header once done when the host gives no time. */
  done: string;
  /** Before the sources the search covered: «بحث في». */
  searched: string;
  /** The sources past the chips shown, `count` in the reader's digits: «+٢». */
  more: (count: string) => string;
  /** The steps list's name. */
  steps: string;
  /** Each step's hidden state word, beside its icon. */
  stepStates: Record<"pending" | "running" | "completed", string>;
}
export interface ThinkingPanelProps {
  status: "running" | "completed";
  /** Seconds, shown in the header while running; never announced. */
  elapsed?: number;
  /** The sources found so far; the first three show as chips. */
  sources?: readonly SourceReference[];
  steps?: readonly {
    id: string;
    label: string;
    state: "pending" | "running" | "completed";
  }[];
  /** Controls the disclosure; pair it with `onOpenChange`. It starts open
   * while running and closed once done. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels?: Partial<ThinkingPanelLabels>;
  announcement?: "polite" | "off";
}

const shown = 3;

/**
 * The evidence while an answer is prepared (spec section 11): one line with the
 * AI mark, the label, the time and a chevron, and under it what was searched,
 * the steps and the thread. It folds to «فكّر لمدة ٦ث». Like ThinkingIndicator
 * it announces one stable label, never the time or a rotating word.
 */
export function ThinkingPanel({
  status,
  elapsed,
  sources = [],
  steps = [],
  open,
  onOpenChange,
  labels,
  announcement = "polite",
}: ThinkingPanelProps) {
  const { config } = useSystem(),
    uid = useId(),
    panelId = `${uid}-panel`;
  const copy: ThinkingPanelLabels = {
    ...thinkingPanelCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const [local, setLocal] = useState(status === "running");
  const expanded = open ?? local;
  const { triggerRef, panelProps } = useDisclosure(expanded);
  // The finished label fades in only once the status changed, never on mount.
  const changed = useChanged(status);
  // Chips present on mount are settled; later ones arrive.
  const arrivals = useArrivals(sources.map((source) => source.id));
  const running = status === "running";
  const time = elapsed === undefined ? "" : formatElapsed(elapsed, config);
  const label = running ? copy.thinking : time ? copy.thought(time) : copy.done;
  const digits = new Intl.NumberFormat(numberLocale(config));
  return (
    <div
      className="tz-thinking-panel"
      data-status={status}
      data-expanded={expanded}
      data-changed={changed || undefined}
      data-zone="evidence"
    >
      {announcement === "polite" && (
        <span
          className="tz-visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {running ? copy.thinking : copy.done}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="tz-thinking-panel-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => {
          if (open === undefined) setLocal(!expanded);
          onOpenChange?.(!expanded);
        }}
      >
        <AIMark size="xs" working={running} />
        <bdi
          key={status}
          className={running ? "tz-ai-shimmer" : "tz-thinking-panel-done"}
        >
          {label}
        </bdi>
        {running && time && (
          <span
            className="tz-thinking-panel-elapsed"
            data-minutes={(elapsed ?? 0) >= 60 || undefined}
            aria-hidden="true"
          >
            {time}
          </span>
        )}
        <ChevronDown className="tz-thinking-panel-chevron" aria-hidden="true" />
      </button>
      <div {...panelProps} id={panelId} className="tz-thinking-panel-panel">
        <div className="tz-thinking-panel-clip">
          <div className="tz-thinking-panel-body">
            {sources.length > 0 && (
              <div className="tz-thinking-panel-sources">
                <span>{copy.searched}</span>
                <ul role="list" className="tz-thinking-panel-chips">
                  {sources.slice(0, shown).map((source) => (
                    <li
                      key={source.id}
                      data-fresh={arrivals.fresh(source.id) || undefined}
                      onAnimationEnd={(event) => {
                        if (event.target === event.currentTarget)
                          arrivals.settle(source.id);
                      }}
                    >
                      <SourceChip source={source} />
                    </li>
                  ))}
                </ul>
                {sources.length > shown && (
                  <bdi dir="ltr" className="tz-thinking-panel-more">
                    {copy.more(digits.format(sources.length - shown))}
                  </bdi>
                )}
              </div>
            )}
            {steps.length > 0 && (
              <ol className="tz-thinking-panel-steps" aria-label={copy.steps}>
                {steps.map((step) => (
                  <li key={step.id} data-state={step.state}>
                    <StatusIcon state={step.state} tone="ai" />
                    <span
                      className={
                        step.state === "running" ? "tz-ai-shimmer" : undefined
                      }
                    >
                      {step.label}
                    </span>
                    <span className="tz-visually-hidden">
                      {copy.stepStates[step.state]}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <Thread state={running ? "running" : "completed"} />
          </div>
        </div>
      </div>
    </div>
  );
}
