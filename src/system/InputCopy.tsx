import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { Check, Copy } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
import { mergeDescriptionIds } from "./control-associations";
import { useSystem } from "./useSystem";
export interface InputCopyLabels {
  copy?: string;
  copied?: string;
  failure?: string;
}
export type InputCopyProps = Omit<
  ComponentPropsWithRef<"input">,
  | "value"
  | "defaultValue"
  | "type"
  | "children"
  | "size"
  | "readOnly"
  | "onChange"
> & {
  value: string;
  size?: "sm" | "md";
  invalid?: boolean;
  labels?: InputCopyLabels;
} & (
    | { label: string; helper?: string; error?: string; field?: never }
    | {
        label?: never;
        helper?: never;
        error?: never;
        field?: FieldControlProps;
      }
  );
/** Read-only selectable text; no clipboard fallback or synthetic success. */
export function InputCopy({
  value,
  labels,
  label,
  helper,
  error,
  field,
  size = "sm",
  invalid,
  className = "",
  ...props
}: InputCopyProps) {
  const ar = useSystem().config.direction === "rtl";
  const statusId = `tz-copy-status-${useId()}`;
  const [feedback, setFeedback] = useState<{
    value: string;
    result: "idle" | "success" | "failure";
    busy: boolean;
  }>({ value, result: "idle", busy: false });
  // Reset our own view immediately when its source changes; the input/ref stays mounted.
  if (feedback.value !== value)
    setFeedback({ value, result: "idle", busy: false });
  const { result, busy } =
    feedback.value === value ? feedback : { result: "idle", busy: false };
  const generation = useRef({ value: 0 });
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useLayoutEffect(() => {
    const pending = timers.current;
    const counter = generation.current;
    counter.value++;
    for (const timer of pending) clearTimeout(timer);
    pending.clear();
    return () => {
      counter.value++;
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
    };
  }, [value]);
  async function copy() {
    const request = ++generation.current.value;
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
    setFeedback({ value, result: "idle", busy: true });
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      if (request !== generation.current.value) return;
      setFeedback({ value, result: "success", busy: false });
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        if (request === generation.current.value)
          setFeedback({ value, result: "idle", busy: false });
      }, 2000);
      timers.current.add(timer);
    } catch {
      if (request !== generation.current.value) return;
      setFeedback({ value, result: "failure", busy: false });
    }
  }
  const text =
    result === "success"
      ? (labels?.copied ?? (ar ? "تم النسخ." : "Copied."))
      : result === "failure"
        ? (labels?.failure ??
          (ar
            ? "تعذّر النسخ. حدّد القيمة وانسخها يدويًا."
            : "Could not copy. Select the value and copy it manually."))
        : "";
  const control = (association = field) => (
    <>
      <div className="tz-input-copy">
        <Input
          {...props}
          field={association}
          size={size}
          invalid={invalid}
          aria-describedby={mergeDescriptionIds(
            props["aria-describedby"],
            text ? statusId : undefined,
          )}
          value={value}
          readOnly
          className={className}
        />
        <Button
          variant="ghost"
          size={size}
          iconOnly
          aria-label={
            labels?.copy ??
            (ar
              ? `نسخ${label ? ` ${label}` : " القيمة"}`
              : `Copy${label ? ` ${label}` : " value"}`)
          }
          disabled={props.disabled || busy}
          aria-busy={busy || undefined}
          onClick={copy}
        >
          {result === "success" ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
        </Button>
      </div>
      <span
        id={statusId}
        role="status"
        className="tz-entry-feedback"
        data-error={result === "failure" || undefined}
      >
        {text}
      </span>
    </>
  );
  return label !== undefined ? (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={props.required}
      id={props.id}
    >
      {control}
    </Field>
  ) : (
    control()
  );
}
