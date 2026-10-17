import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useImperativeHandle,
} from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "./Button";
import { useSystem } from "./useSystem";

export type ChatEntryState = "idle" | "submitting" | "streaming";
export type ChatEntryLabels = {
  send?: string;
  stop?: string;
  failure?: string;
};
export type ChatComposerProps = Omit<
  ComponentPropsWithRef<"textarea">,
  "value" | "defaultValue" | "onChange" | "onSubmit" | "children" | "rows"
> & {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void | Promise<void>;
  state?: ChatEntryState;
  onStop?: () => void;
  label?: string;
  labels?: ChatEntryLabels;
};
/** Shared editing/submission behavior. No draft, transport or execution ownership. */
export function PromptEntry({
  value,
  onValueChange,
  onSubmit,
  state = "idle",
  onStop,
  label,
  labels,
  disabled = false,
  readOnly = false,
  placeholder,
  ref,
  id,
  className = "",
  style,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  compact = false,
  renderSuggestions,
  ...props
}: ChatComposerProps & {
  compact?: boolean;
  renderSuggestions?: (busy: boolean) => ReactNode;
}) {
  const ar = useSystem().config.direction === "rtl";
  const input = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const composing = useRef(false),
    lock = useRef(false),
    generation = useRef(0);
  const [pending, setPending] = useState(false),
    [failedDraft, setFailedDraft] = useState<string | null>(null);
  const failed = failedDraft === value;
  const statusId = useId();
  useLayoutEffect(() => {
    const node = input.current!;
    const resize = () => {
      node.style.height = "auto";
      node.style.height = `${node.scrollHeight}px`;
    };
    resize();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            if (node.clientWidth !== width) {
              width = node.clientWidth;
              resize();
            }
          });
    let width = node.clientWidth;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [value]);
  useLayoutEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const busy = pending || state !== "idle";
  async function submit() {
    if (
      disabled ||
      readOnly ||
      composing.current ||
      lock.current ||
      state !== "idle" ||
      !value.trim()
    )
      return;
    lock.current = true;
    setPending(true);
    setFailedDraft(null);
    const run = generation.current;
    try {
      await onSubmit(value);
    } catch {
      if (run === generation.current) setFailedDraft(value);
    } finally {
      if (run === generation.current) {
        lock.current = false;
        setPending(false);
      }
    }
  }
  const stop = state === "streaming" && onStop;
  return (
    <div
      className={`tz-chat-entry ${compact ? "tz-prompt-bar" : "tz-chat-composer"} ${className}`}
      style={style}
      data-state={state}
      data-disabled={disabled || undefined}
    >
      <div className="tz-chat-entry-surface">
        <textarea
          {...props}
          id={id}
          ref={input}
          value={value}
          rows={1}
          disabled={disabled}
          readOnly={readOnly}
          dir={props.dir ?? "auto"}
          aria-label={
            label ?? props["aria-label"] ?? (ar ? "رسالتك" : "Your message")
          }
          aria-describedby={
            [props["aria-describedby"], failed ? statusId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          placeholder={placeholder ?? (ar ? "اكتب رسالة…" : "Write a message…")}
          onChange={(event) => onValueChange(event.target.value)}
          onCompositionStart={(event) => {
            composing.current = true;
            onCompositionStart?.(event);
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            onCompositionEnd?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (
              !event.defaultPrevented &&
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229 &&
              !composing.current
            ) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          size="sm"
          iconOnly
          aria-label={
            stop
              ? (labels?.stop ?? (ar ? "إيقاف التوليد" : "Stop generating"))
              : (labels?.send ?? (ar ? "إرسال" : "Send"))
          }
          disabled={disabled || (!stop && (readOnly || busy || !value.trim()))}
          onMouseDown={(event) => {
            if (document.activeElement === input.current)
              event.preventDefault();
          }}
          onClick={() => {
            if (stop) onStop?.();
            else void submit();
          }}
        >
          {stop ? (
            <Square size={14} fill="currentColor" aria-hidden="true" />
          ) : (
            <ArrowUp size={18} aria-hidden="true" />
          )}
        </Button>
      </div>
      <span
        id={statusId}
        role="status"
        className={failed ? "tz-chat-entry-error" : "tz-visually-hidden"}
      >
        {failed
          ? (labels?.failure ??
            (ar
              ? "تعذّر الإرسال. المسودة محفوظة؛ حاول مرة أخرى."
              : "Could not send. Your draft is kept; try again."))
          : ""}
      </span>
      {renderSuggestions?.(busy)}
    </div>
  );
}
