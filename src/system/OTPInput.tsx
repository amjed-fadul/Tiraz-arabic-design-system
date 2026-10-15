import { useRef, useState } from "react";
import type { ComponentPropsWithRef, CSSProperties } from "react";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
import { associateControl } from "./control-associations";
import { useEntryReset } from "./useEntryReset";
export type OTPInputProps = Omit<
  ComponentPropsWithRef<"input">,
  | "value"
  | "defaultValue"
  | "type"
  | "children"
  | "size"
  | "maxLength"
  | "minLength"
  | "pattern"
  | "autoComplete"
  | "inputMode"
  | "dir"
> & {
  value?: string;
  defaultValue?: string;
  length?: number;
  onValueChange?: (value: string) => void;
  invalid?: boolean;
} & (
    | { label: string; helper?: string; error?: string; field?: never }
    | {
        label?: never;
        helper?: never;
        error?: never;
        field?: FieldControlProps;
      }
  );
/** A single selectable native input; slots are decorative. No completion side effect. */
export function OTPInput({
  value,
  defaultValue = "",
  length = 6,
  onValueChange,
  label,
  helper,
  error,
  field,
  invalid,
  className = "",
  ref,
  onChange,
  ...props
}: OTPInputProps) {
  const count = Number.isFinite(length)
    ? Math.max(1, Math.min(12, Math.floor(length)))
    : 6;
  function normalize(text: string) {
    return text
      .replace(/[٠-٩۰-۹]/g, (char) =>
        String(char.charCodeAt(0) - (char <= "٩" ? 0x660 : 0x6f0)),
      )
      .replace(/[^0-9]/g, "")
      .slice(0, count);
  }
  const initial = useRef(defaultValue);
  const [local, setLocal] = useState(defaultValue);
  const current = normalize(value ?? local);
  const inputRef = useRef<HTMLInputElement>(null);
  useEntryReset(inputRef, () => {
    if (value === undefined) setLocal(initial.current);
    if (inputRef.current)
      inputRef.current.value = normalize(value ?? initial.current);
  });
  const control = (association = field) => (
    <div
      className="tz-otp"
      dir="ltr"
      style={{ "--otp-length": count } as CSSProperties}
      data-disabled={props.disabled || undefined}
    >
      <span className="tz-otp-slots" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} />
        ))}
      </span>
      <input
        {...props}
        {...associateControl(association, props, invalid)}
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") return ref(node);
          if (ref) ref.current = node;
        }}
        className={`tz-otp-input ${className}`}
        type="text"
        dir="ltr"
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern={`[0-9]{${count}}`}
        value={current}
        onChange={(event) => {
          if (props.readOnly || props.disabled) return;
          const raw = event.currentTarget.value;
          const caret = event.currentTarget.selectionStart;
          const next = normalize(raw);
          event.currentTarget.value = next;
          if (caret !== null) {
            const position = normalize(raw.slice(0, caret)).length;
            event.currentTarget.setSelectionRange(position, position);
          }
          onChange?.(event);
          if (event.defaultPrevented) {
            event.currentTarget.value = current;
            return;
          }
          if (value === undefined) setLocal(next);
          if (next !== current) onValueChange?.(next);
        }}
      />
    </div>
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
