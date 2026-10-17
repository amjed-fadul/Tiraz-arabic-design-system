import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, Terminal as TerminalIcon } from "lucide-react";
import { Button } from "./Button";
import type { InputCopyLabels } from "./InputCopy";
import { useExactCopy } from "./useExactCopy";
import { useSystem } from "./useSystem";
export interface TerminalProps {
  command?: string;
  output: string;
  state?: "running" | "completed" | "failed";
  exitCode?: number;
  /** Application-supplied display text, never measured by this component. */
  duration?: string;
  label?: string;
  labels?: InputCopyLabels;
  followOutput?: boolean;
  className?: string;
}
/** Read-only supplied text. No HTML, ANSI interpretation, execution or connection. */
export function Terminal({
  command,
  output,
  state = "completed",
  exitCode,
  duration,
  label,
  labels,
  followOutput = false,
  className = "",
}: TerminalProps) {
  const ar = useSystem().config.direction === "rtl";
  const title = label ?? (ar ? "المخرجات الطرفية" : "Terminal output");
  const text = command === undefined ? output : `${command}\n${output}`;
  const feedback = useExactCopy(text);
  const root = useRef<HTMLPreElement>(null),
    content = useRef<HTMLElement>(null),
    nearBottom = useRef(true);
  const follow = useCallback(() => {
    const node = root.current;
    if (!node || !followOutput || !nearBottom.current) return;
    const selection = node.ownerDocument.getSelection();
    if (
      selection &&
      !selection.isCollapsed &&
      Array.from({ length: selection.rangeCount }, (_, index) =>
        selection.getRangeAt(index),
      ).some((range) => range.intersectsNode(node))
    )
      return;
    node.scrollTop = node.scrollHeight;
  }, [followOutput]);
  useLayoutEffect(() => {
    follow();
  });
  useLayoutEffect(() => {
    if (!followOutput || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(follow);
    observer.observe(content.current!);
    return () => observer.disconnect();
  }, [followOutput, follow]);
  return (
    <div className={`tz-terminal ${className}`} data-state={state}>
      <div className="tz-terminal-header">
        <span className="tz-terminal-title">
          <TerminalIcon size={14} aria-hidden="true" />
          <bdi>{title}</bdi>
        </span>
        <span className="tz-terminal-meta">
          {duration && <bdi>{duration}</bdi>}
          <span className="tz-terminal-state">
            {state === "running"
              ? ar
                ? "جارٍ التشغيل"
                : "Running"
              : state === "failed"
                ? ar
                  ? "فشل"
                  : "Failed"
                : ar
                  ? "مكتمل"
                  : "Completed"}
          </span>
          {exitCode !== undefined && <bdi>exit {exitCode}</bdi>}
        </span>
        <Button
          variant="ghost"
          iconOnly
          aria-label={labels?.copy ?? (ar ? "نسخ المخرجات" : "Copy output")}
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
        ref={root}
        dir="ltr"
        role="region"
        aria-label={title}
        tabIndex={0}
        onScroll={(event) => {
          const node = event.currentTarget;
          nearBottom.current =
            node.scrollHeight - node.clientHeight - node.scrollTop <= 48;
        }}
      >
        <code ref={content}>
          {command !== undefined && (
            <>
              <span className="tz-terminal-command">{command}</span>
              {"\n"}
            </>
          )}
          <TerminalText text={output} />
        </code>
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
                ? "تعذّر النسخ. حدّد النص وانسخه يدويًا."
                : "Could not copy. Select the text and copy it manually."))
            : ""}
      </span>
    </div>
  );
}

/** appendData preserves native ranges inside the existing text node. Replacing
 * React text children would reset substring selections before follow() can run.
 * The static initial child also keeps server-rendered output readable. */
function TerminalText({ text }: { text: string }) {
  const [initial] = useState(text);
  const root = useRef<HTMLSpanElement>(null),
    previous = useRef(text);
  useLayoutEffect(() => {
    const node = root.current!;
    if (text === previous.current) return;
    if (text.startsWith(previous.current) && node.firstChild?.nodeType === 3) {
      (node.firstChild as Text).appendData(text.slice(previous.current.length));
    } else node.textContent = text;
    previous.current = text;
  }, [text]);
  return <span ref={root}>{initial}</span>;
}
