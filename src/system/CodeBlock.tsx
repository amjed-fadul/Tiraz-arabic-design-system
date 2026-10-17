import { useExactCopy } from "./useExactCopy";
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
  const feedback = useExactCopy(code);
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
          onClick={feedback.copy}
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
