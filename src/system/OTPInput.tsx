import { useEffect, useRef, useState } from "react";
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
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
    direction: "none",
  });
  const pointerAnchor = useRef<number | null>(null);
  function syncSelection() {
    const input = inputRef.current;
    if (!input) return;
    const next = {
      start: input.selectionStart ?? 0,
      end: input.selectionEnd ?? 0,
      direction: input.selectionDirection ?? "none",
    };
    setSelection((previous) =>
      previous.start === next.start &&
      previous.end === next.end &&
      previous.direction === next.direction
        ? previous
        : next,
    );
  }
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const update = () => {
      if (input.ownerDocument.activeElement === input) syncSelection();
    };
    input.ownerDocument.addEventListener("selectionchange", update);
    input.addEventListener("selectionchange", update);
    return () => {
      input.ownerDocument.removeEventListener("selectionchange", update);
      input.removeEventListener("selectionchange", update);
    };
  }, []);
  const start = Math.min(selection.start, current.length),
    end = Math.min(selection.end, current.length);
  const selected = start !== end;
  const endpoint = selected
    ? selection.direction === "backward"
      ? start
      : end - 1
    : start;
  const active =
    focused && !props.disabled ? Math.min(count - 1, endpoint) : -1;
  function positionAt(clientX: number) {
    const box = inputRef.current?.getBoundingClientRect();
    if (!box?.width) return;
    return Math.max(
      0,
      Math.min(
        current.length,
        Math.floor((clientX - box.left) / (box.width / count)),
      ),
    );
  }
  function moveSelection(anchor: number, position: number) {
    inputRef.current?.setSelectionRange(
      Math.min(anchor, position),
      Math.max(anchor, position),
      position < anchor ? "backward" : "forward",
    );
    syncSelection();
  }
  useEntryReset(inputRef, () => {
    if (value === undefined) setLocal(initial.current);
    if (inputRef.current)
      inputRef.current.value = normalize(value ?? initial.current);
    syncSelection();
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
          <span
            key={i}
            className="tz-otp-slot"
            data-active={i === active || undefined}
            data-selected={(focused && i >= start && i < end) || undefined}
            data-filled={!!current[i] || undefined}
            data-caret={
              (i === active && !selected && !props.readOnly) || undefined
            }
            data-after={start === count || undefined}
          >
            <span className="tz-otp-digit">{current[i] ?? ""}</span>
          </span>
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
        onFocus={(event) => {
          props.onFocus?.(event);
          setFocused(true);
          syncSelection();
        }}
        onBlur={(event) => {
          props.onBlur?.(event);
          setFocused(false);
          pointerAnchor.current = null;
        }}
        onSelect={(event) => {
          props.onSelect?.(event);
          syncSelection();
        }}
        onKeyUp={(event) => {
          props.onKeyUp?.(event);
          syncSelection();
        }}
        onPointerDown={(event) => {
          props.onPointerDown?.(event);
          if (event.defaultPrevented || props.disabled || event.button !== 0)
            return;
          const position = positionAt(event.clientX);
          if (position === undefined) return;
          event.preventDefault();
          const input = event.currentTarget;
          const anchor = event.shiftKey
            ? ((input.selectionDirection === "backward"
                ? input.selectionEnd
                : input.selectionStart) ?? position)
            : position;
          input.focus();
          pointerAnchor.current = anchor;
          moveSelection(anchor, position);
          input.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          props.onPointerMove?.(event);
          if (
            event.defaultPrevented ||
            props.disabled ||
            pointerAnchor.current === null
          )
            return;
          const position = positionAt(event.clientX);
          if (position !== undefined)
            moveSelection(pointerAnchor.current, position);
        }}
        onPointerUp={(event) => {
          props.onPointerUp?.(event);
          pointerAnchor.current = null;
        }}
        onPointerCancel={(event) => {
          props.onPointerCancel?.(event);
          pointerAnchor.current = null;
        }}
        onLostPointerCapture={(event) => {
          props.onLostPointerCapture?.(event);
          pointerAnchor.current = null;
        }}
        onDoubleClick={(event) => {
          props.onDoubleClick?.(event);
          if (!event.defaultPrevented && !props.disabled) {
            event.currentTarget.select();
            syncSelection();
          }
        }}
        onChange={(event) => {
          if (props.readOnly || props.disabled) return;
          const raw = event.currentTarget.value;
          const caret = event.currentTarget.selectionStart;
          const next = normalize(raw);
          if (next !== raw) event.currentTarget.value = next;
          if (next !== raw && caret !== null) {
            const position = normalize(raw.slice(0, caret)).length;
            event.currentTarget.setSelectionRange(position, position);
          }
          onChange?.(event);
          if (event.defaultPrevented) {
            event.currentTarget.value = current;
            syncSelection();
            return;
          }
          if (value === undefined) setLocal(next);
          if (next !== current) onValueChange?.(next);
          syncSelection();
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
