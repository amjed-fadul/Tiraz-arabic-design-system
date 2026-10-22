import { useRef, useState } from "react";
import type { ComponentPropsWithRef, CSSProperties } from "react";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
import { associateControl } from "./control-associations";
import { useEntryReset } from "./useEntryReset";
export type SliderProps = Omit<
  ComponentPropsWithRef<"input">,
  | "value"
  | "defaultValue"
  | "min"
  | "max"
  | "step"
  | "type"
  | "children"
  | "size"
  | "readOnly"
> & {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  formatValue?: (value: number) => string;
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
/** Native single range. Snap to a min-based step, round decimal noise, never exceed max. */
export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  formatValue,
  label,
  helper,
  error,
  field,
  invalid,
  className = "",
  ref,
  onChange,
  ...props
}: SliderProps) {
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max)
    ? Math.max(lower, max)
    : Math.max(lower, 100);
  const increment = Number.isFinite(step) && step > 0 ? step : 1;
  function normalize(input: number) {
    const bounded = Math.min(
      upper,
      Math.max(lower, Number.isFinite(input) ? input : lower),
    );
    const count = Math.min(
      Math.round((bounded - lower) / increment),
      Math.floor((upper - lower) / increment + 1e-10),
    );
    return Math.min(
      upper,
      Math.max(lower, Number((lower + count * increment).toPrecision(15))),
    );
  }
  const initial = useRef(defaultValue ?? (lower + upper) / 2);
  const [local, setLocal] = useState(defaultValue ?? (lower + upper) / 2);
  const current = normalize(value ?? local);
  const inputRef = useRef<HTMLInputElement>(null);
  useEntryReset(inputRef, () => {
    if (value === undefined) setLocal(initial.current);
    if (inputRef.current)
      inputRef.current.value = String(normalize(value ?? initial.current));
  });
  const display = formatValue?.(current);
  const control = (association = field) => (
    <div className="tz-slider-row">
      <input
        {...props}
        {...associateControl(association, props, invalid)}
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") return ref(node);
          if (ref) ref.current = node;
        }}
        className={`tz-slider ${className}`}
        style={
          {
            ...props.style,
            "--slider-fill": `${upper > lower ? ((current - lower) / (upper - lower)) * 100 : 0}%`,
          } as CSSProperties
        }
        type="range"
        min={lower}
        max={upper}
        step={increment}
        value={current}
        aria-valuetext={display ?? props["aria-valuetext"]}
        onChange={(event) => {
          onChange?.(event);
          if (event.defaultPrevented) return;
          const next = normalize(event.currentTarget.valueAsNumber);
          if (value === undefined) setLocal(next);
          if (next !== current) onValueChange?.(next);
        }}
      />
      {display !== undefined && (
        <span className="tz-slider-value" aria-hidden="true">
          <bdi>{display}</bdi>
        </span>
      )}
    </div>
  );
  return label !== undefined ? (
    <Field label={label} helper={helper} error={error} id={props.id}>
      {control}
    </Field>
  ) : (
    control()
  );
}
