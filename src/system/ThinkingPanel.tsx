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
  /** The header once stopped, around the time it ran: «أُوقف بعد ٦ث». `elapsed`
   * is empty when the host gives no time, and then it is the bare word. */
  stopped: (elapsed: string) => string;
  /** The header once failed, the same way: «تعثّر بعد ٦ث». */
  failed: (elapsed: string) => string;
  /** Before the sources the search covered: «بحث في». */
  searched: string;
  /** The sources past the chips shown, `count` in the reader's digits: «+٢». */
  more: (count: string) => string;
  /** Said after «+٢» in the button's name, so it reads «+٢ عرض كل المصادر». */
  showAll: string;
  /** The same button once every source shows. */
  showFewer: string;
  /** The steps list's name. */
  steps: string;
  /** Each step's hidden state word, beside its icon. */
  stepStates: Record<"pending" | "running" | "completed", string>;
}
export interface ThinkingPanelProps {
  /** A stopped or failed search reads «أُوقف بعد ٦ث» or «تعثّر بعد ٦ث», and its
   * thread stays still instead of closing into the line that means done. */
  status: "running" | "completed" | "stopped" | "failed";
  /** Seconds, shown in the header while running; never announced. */
  elapsed?: number;
  /** The sources found so far; the first three show as chips, and a button
   * reveals the rest. */
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
    panelId = `${uid}-panel`,
    chipsId = `${uid}-chips`;
  const copy: ThinkingPanelLabels = {
    ...thinkingPanelCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const [local, setLocal] = useState(status === "running"),
    [all, setAll] = useState(false);
  const expanded = open ?? local;
  const { triggerRef, panelProps } = useDisclosure(expanded);
  // The finished label fades in only once the status changed, never on mount.
  const changed = useChanged(status);
  // Chips present on mount are settled; later ones arrive.
  const arrivals = useArrivals(sources.map((source) => source.id));
  const running = status === "running";
  const time = elapsed === undefined ? "" : formatElapsed(elapsed, config);
  // How the search stands, around the time it took. The sentence announced is
  // the same without the time.
  const labelFor = (took: string) => {
    if (status === "running") return copy.thinking;
    if (status === "completed") return took ? copy.thought(took) : copy.done;
    return copy[status](took);
  };
  const label = labelFor(time);
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
          {labelFor("")}
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
                <ul
                  id={chipsId}
                  role="list"
                  className="tz-thinking-panel-chips"
                >
                  {(all ? sources : sources.slice(0, shown)).map(
                    (source, index) => (
                      <li
                        key={source.id}
                        // Only the first chips fade in as they arrive; the rest
                        // wait behind the button, and showing them is no arrival.
                        data-fresh={
                          (index < shown && arrivals.fresh(source.id)) ||
                          undefined
                        }
                        onAnimationEnd={(event) => {
                          if (event.target === event.currentTarget)
                            arrivals.settle(source.id);
                        }}
                      >
                        <SourceChip source={source} />
                      </li>
                    ),
                  )}
                </ul>
                {sources.length > shown && (
                  // The name starts with what shows («+٤»), then says what it does.
                  <button
                    type="button"
                    className="tz-thinking-panel-more"
                    aria-expanded={all}
                    aria-controls={chipsId}
                    onClick={() => setAll(!all)}
                  >
                    {all ? (
                      copy.showFewer
                    ) : (
                      <>
                        <bdi dir="ltr">
                          {copy.more(digits.format(sources.length - shown))}
                        </bdi>{" "}
                        <span className="tz-visually-hidden">
                          {copy.showAll}
                        </span>
                      </>
                    )}
                  </button>
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
            {/* A stopped or failed search keeps the running thread; the
                stylesheet holds it still. */}
            <Thread state={status === "completed" ? "completed" : "running"} />
          </div>
        </div>
      </div>
    </div>
  );
}
