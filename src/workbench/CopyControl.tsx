import { useEffect, useId, useRef } from "react";
import { Copy } from "lucide-react";
import { Button } from "../system/Button";
import { Tooltip } from "../system/Tooltip";
import { useExactCopy } from "../system/useExactCopy";
import type { Language } from "./i18n";
import { label } from "./i18n";
import "./copy-control.css";
export type CopyFeedback = "idle" | "success" | "failure";
export function CopyControl({
  text,
  caption,
  language,
  iconOnly = false,
  announcement = "polite",
  inlineFeedback = true,
  onFeedbackChange,
}: {
  text: string;
  caption: string;
  language: Language;
  iconOnly?: boolean;
  announcement?: "polite" | "off";
  inlineFeedback?: boolean;
  onFeedbackChange?: (result: CopyFeedback) => void;
}) {
  const feedback = useExactCopy(text);
  const statusId = useId();
  const report = useRef(onFeedbackChange);
  useEffect(() => {
    report.current = onFeedbackChange;
  });
  useEffect(() => {
    report.current?.(feedback.result as CopyFeedback);
  }, [text, feedback.result]);
  const failed = feedback.result === "failure";
  const button = (
    <Button
      variant={iconOnly ? "ghost" : "secondary"}
      size="sm"
      iconOnly={iconOnly}
      aria-label={caption}
      aria-describedby={failed ? statusId : undefined}
      className={`copy-button${iconOnly ? " copy-icon" : ""}`}
      state={
        feedback.busy
          ? "loading"
          : feedback.result === "success"
            ? "success"
            : "idle"
      }
      title={iconOnly ? undefined : caption}
      data-copy-state={
        failed ? "failed" : feedback.result === "success" ? "copied" : "idle"
      }
      onClick={feedback.copy}
    >
      {iconOnly ? <Copy size={16} aria-hidden="true" /> : caption}
    </Button>
  );
  return (
    <span className="copy-control">
      {iconOnly ? <Tooltip trigger={button} content={caption} /> : button}
      <span
        id={statusId}
        role={announcement === "polite" ? "status" : undefined}
        className={
          inlineFeedback &&
          (failed || (!iconOnly && feedback.result === "success"))
            ? "copy-feedback"
            : "sr-only"
        }
        data-error={failed || undefined}
      >
        {failed
          ? label("failed", language)
          : feedback.result === "success"
            ? label("copied", language)
            : ""}
      </span>
    </span>
  );
}
