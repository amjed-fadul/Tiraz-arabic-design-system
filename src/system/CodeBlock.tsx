import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./Button";
import type { InputCopyLabels } from "./InputCopy";
import { useSystem } from "./useSystem";
import { highlightCode } from "./code-highlight";
export type CodeBlockProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  code: string;
  language?: string;
  /** Visible header and scroll-region name; defaults to language or Text. */
  label?: string;
  labels?: InputCopyLabels;
};
/** Read-only source. Clipboard receives the original string, never rendered text. */
export function CodeBlock({
  code,
  language = "text",
  label,
  labels,
  className = "",
  ...props
}: CodeBlockProps) {
  const ar = useSystem().config.direction === "rtl";
  const [feedback, setFeedback] = useState({
    code,
    result: "idle",
    busy: false,
  });
  if (feedback.code !== code)
    setFeedback({ code, result: "idle", busy: false });
  const lifecycle = useRef({
    generation: 0,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  });
  useLayoutEffect(() => {
    const session = lifecycle.current;
    session.generation++;
    return () => {
      session.generation++;
      clearTimeout(session.timer);
    };
  }, [code]);
  async function copy() {
    if (feedback.busy) return;
    const session = lifecycle.current;
    const current = ++session.generation;
    clearTimeout(session.timer);
    setFeedback({ code, result: "idle", busy: true });
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      if (current !== session.generation) return;
      setFeedback({ code, result: "success", busy: false });
      session.timer = setTimeout(() => {
        if (current === session.generation)
          setFeedback({ code, result: "idle", busy: false });
      }, 2000);
    } catch {
      if (current === session.generation)
        setFeedback({ code, result: "failure", busy: false });
    }
  }
  const title =
    label ?? (language === "text" ? (ar ? "نص" : "Text") : language);
  return (
    <div {...props} className={`tz-code-block ${className}`}>
      <div className="tz-code-header">
        <bdi>{title}</bdi>
        <Button
          variant="ghost"
          iconOnly
          aria-label={labels?.copy ?? (ar ? "نسخ الشيفرة" : "Copy code")}
          aria-disabled={feedback.busy || undefined}
          onClick={copy}
        >
          {feedback.result === "success" ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
        </Button>
      </div>
      <pre
        dir="ltr"
        role="region"
        aria-label={`${ar ? "الشيفرة" : "Code"}: ${title}`}
        tabIndex={0}
      >
        <code>{highlightCode(code, language)}</code>
      </pre>
      <span
        role="status"
        className={
          feedback.result === "failure"
            ? "tz-entry-feedback"
            : "tz-visually-hidden"
        }
        data-error={feedback.result === "failure" || undefined}
      >
        {feedback.result === "success"
          ? (labels?.copied ?? (ar ? "تم النسخ." : "Copied."))
          : feedback.result === "failure"
            ? (labels?.failure ??
              (ar
                ? "تعذّر النسخ. حدّد الشيفرة وانسخها يدويًا."
                : "Could not copy. Select the code and copy it manually."))
            : ""}
      </span>
    </div>
  );
}
