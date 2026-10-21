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
import { useChanged } from "./useChanged";

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
  /**
   * Controls on a row under the text area: `start`, a flexible space, `end`,
   * and send last. Without `tools` send sits beside the text area.
   */
  tools?: { start?: ReactNode; end?: ReactNode };
  /** The bounded entry that PromptBar draws: one line, growing to a limit. */
  compact?: boolean;
  /** "plain" drops the floating shadow, for an entry inside another surface. */
  appearance?: "card" | "plain";
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
  appearance = "card",
  tools,
  renderSuggestions,
  ...props
}: ChatComposerProps & {
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
  // Send and stop trade places with a glyph pop, never on first render.
  const morphed = useChanged(Boolean(stop));
  const send = (
    <Button
      className="tz-chat-entry-send"
      size="sm"
      iconOnly
      // A host that says it is submitting sees the send button at work.
      state={state === "submitting" ? "loading" : "idle"}
      data-morph={morphed || undefined}
      aria-label={
        stop
          ? (labels?.stop ?? (ar ? "إيقاف الرد" : "Stop generating"))
          : (labels?.send ?? (ar ? "إرسال" : "Send"))
      }
      disabled={disabled || (!stop && (readOnly || busy || !value.trim()))}
      onMouseDown={(event) => {
        if (document.activeElement === input.current) event.preventDefault();
      }}
      onClick={() => {
        if (stop) onStop?.();
        else {
          // Send is disabled while busy, which would drop focus to the page,
          // so a keyboard send leaves it in the text area, as a click does.
          input.current?.focus();
          void submit();
        }
      }}
    >
      {stop ? (
        <Square size={14} fill="currentColor" aria-hidden="true" />
      ) : (
        <ArrowUp size={18} aria-hidden="true" />
      )}
    </Button>
  );
  return (
    <div
      className={`tz-chat-entry ${compact ? "tz-prompt-bar" : "tz-chat-composer"} ${className}`}
      style={style}
      data-state={state}
      data-appearance={appearance}
      data-disabled={disabled || undefined}
    >
      <div
        className="tz-chat-entry-surface"
        data-tools={tools ? "" : undefined}
      >
        <textarea
          {...props}
          id={id}
          ref={input}
          value={value}
          rows={1}
          disabled={disabled}
          readOnly={readOnly}
          dir={props.dir ?? (ar ? "rtl" : "ltr")}
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
        {tools ? (
          <div className="tz-chat-entry-tools">
            {tools.start}
            <span className="tz-chat-entry-space" />
            {tools.end}
            {send}
          </div>
        ) : (
          send
        )}
      </div>
      <span
        id={statusId}
        role="status"
        className={failed ? "tz-chat-entry-error" : "tz-visually-hidden"}
      >
        {failed
          ? (labels?.failure ??
            (ar
              ? "تعذّر الإرسال. مسودتك محفوظة، حاول مرة أخرى."
              : "Could not send. Your draft is kept; try again."))
          : ""}
      </span>
      {renderSuggestions?.(busy)}
    </div>
  );
}
