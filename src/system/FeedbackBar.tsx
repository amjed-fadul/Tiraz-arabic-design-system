import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "./Button";
import { feedbackBarCopy } from "./cited-answer-copy";
import { useChanged } from "./useChanged";
import { useSystem } from "./useSystem";

export type FeedbackReason =
  "inaccurate" | "wrong-source" | "too-long" | "outdated";
/** Every built-in string the bar shows; `labels` overrides any of them. */
export interface FeedbackBarLabels {
  /** The bar's name. */
  group: string;
  copy: string;
  /** The word that shows beside the buttons for two seconds after a copy. */
  copied: string;
  regenerate: string;
  helpful: string;
  notHelpful: string;
  /** The reasons' name, shown once the answer is rated not helpful. */
  reasons: string;
  reason: Record<FeedbackReason, string>;
}
export interface FeedbackBarProps {
  feedback?: "up" | "down" | null;
  /** The reason picked for a "down"; without it the bar keeps its own. */
  reason?: FeedbackReason;
  /** `value` is null when the person takes their rating back; a reason comes
   * only with "down". */
  onFeedbackChange?: (
    value: "up" | "down" | null,
    reason?: FeedbackReason,
  ) => void;
  /** The host copies the answer; «نُسخت» shows once its promise resolves. */
  onCopy?: () => void | Promise<void>;
  onRegenerate?: () => void;
  labels?: Partial<FeedbackBarLabels>;
}

const reasons: readonly FeedbackReason[] = [
  "inaccurate",
  "wrong-source",
  "too-long",
  "outdated",
];

/**
 * What the person can do with a finished answer (spec section 11): copy it,
 * ask for another, and rate it helpful or not helpful, the latter with a
 * reason. Each button shows only when its handler exists, and the ratings are
 * toggles. The bar has no status of its own, so the owner pattern keeps the one
 * live region. «نُسخت» is a polite span with no role, always rendered so the
 * buttons never shift under the pointer; for two seconds after a copy it turns
 * visible, and the copy button keeps its name.
 */
export function FeedbackBar({
  feedback,
  reason,
  onFeedbackChange,
  onCopy,
  onRegenerate,
  labels,
}: FeedbackBarProps) {
  const { config } = useSystem();
  const copy: FeedbackBarLabels = {
    ...feedbackBarCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const [local, setLocal] = useState<"up" | "down" | null>(null),
    [picked, setPicked] = useState<FeedbackReason>(),
    [copied, setCopied] = useState(false);
  const value = feedback === undefined ? local : feedback,
    chosen = reason ?? picked;
  // The reasons open only after a change of rating, never on mount.
  const changed = useChanged(value);
  // A copy settles once; a result that arrives after unmount is dropped.
  const session = useRef({
    generation: 0,
    busy: false,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  });
  useEffect(() => {
    const current = session.current;
    return () => {
      current.generation++;
      clearTimeout(current.timer);
    };
  }, []);
  async function copyAnswer() {
    const current = session.current;
    if (current.busy || !onCopy) return;
    current.busy = true;
    const generation = ++current.generation;
    clearTimeout(current.timer);
    setCopied(false);
    try {
      await onCopy();
      if (generation !== current.generation) return;
      current.busy = false;
      setCopied(true);
      current.timer = setTimeout(() => {
        if (generation === current.generation) setCopied(false);
      }, 2000);
    } catch {
      if (generation === current.generation) current.busy = false;
    }
  }
  function rate(next: "up" | "down") {
    const rating = value === next ? null : next;
    if (feedback === undefined) setLocal(rating);
    setPicked(undefined);
    onFeedbackChange?.(rating);
  }
  function pick(why: FeedbackReason) {
    setPicked(why);
    onFeedbackChange?.("down", why);
  }
  return (
    <div
      role="group"
      aria-label={copy.group}
      className="tz-feedback-bar"
      data-changed={changed || undefined}
    >
      <div className="tz-feedback-bar-actions">
        {onCopy && (
          <Button
            variant="ghost"
            iconOnly
            aria-label={copy.copy}
            onClick={() => void copyAnswer()}
          >
            {copied ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
          </Button>
        )}
        {onRegenerate && (
          <Button
            variant="ghost"
            iconOnly
            aria-label={copy.regenerate}
            onClick={() => onRegenerate()}
          >
            <RefreshCw size={16} aria-hidden="true" />
          </Button>
        )}
        {onFeedbackChange && (
          <>
            <Button
              variant="ghost"
              iconOnly
              aria-label={copy.helpful}
              aria-pressed={value === "up"}
              onClick={() => rate("up")}
            >
              <ThumbsUp size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              iconOnly
              aria-label={copy.notHelpful}
              aria-pressed={value === "down"}
              onClick={() => rate("down")}
            >
              <ThumbsDown size={16} aria-hidden="true" />
            </Button>
          </>
        )}
        {onCopy && (
          <span aria-live="polite" aria-atomic="true">
            <span
              className="tz-feedback-bar-copied"
              style={{ visibility: copied ? "visible" : "hidden" }}
            >
              {copy.copied}
            </span>
          </span>
        )}
      </div>
      {onFeedbackChange && value === "down" && (
        <div
          role="group"
          aria-label={copy.reasons}
          className="tz-feedback-bar-reasons"
        >
          {reasons.map((item) => (
            <button
              key={item}
              type="button"
              className="tz-feedback-bar-reason"
              aria-pressed={chosen === item}
              onClick={() => pick(item)}
            >
              {copy.reason[item]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
