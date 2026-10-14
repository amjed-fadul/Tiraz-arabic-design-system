import { useId, useRef, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { Check } from "lucide-react";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
import { associateControl, mergeDescriptionIds } from "./control-associations";
import { useSystem } from "./useSystem";
import { useEntryReset } from "./useEntryReset";
export interface ColorSwatch {
  label: string;
  value: string;
}
export interface ColorPickerLabels {
  chooser?: string;
  swatches?: string;
  invalid?: string;
}
export type ColorPickerProps = Omit<
  ComponentPropsWithRef<"input">,
  "value" | "defaultValue" | "type" | "children" | "size" | "readOnly"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  swatches?: ColorSwatch[];
  labels?: ColorPickerLabels;
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
function normalize(value: string) {
  const hex = value.trim();
  if (/^#[\da-f]{6}$/i.test(hex)) return hex.toUpperCase();
  if (/^#[\da-f]{3}$/i.test(hex))
    return (
      "#" +
      [...hex.slice(1)]
        .map((c) => c + c)
        .join("")
        .toUpperCase()
    );
  return null;
}
/** Opaque RGB only. Draft text commits on Enter/blur; name submits the committed color. */
export function ColorPicker({
  value,
  defaultValue = "#316746",
  onValueChange,
  swatches,
  labels,
  label,
  helper,
  error,
  field,
  invalid,
  name,
  form,
  disabled,
  ref,
  className = "",
  onChange,
  onBlur,
  onKeyDown,
  ...props
}: ColorPickerProps) {
  const ar = useSystem().config.direction === "rtl";
  const [initial] = useState(() => normalize(defaultValue) ?? "#316746");
  const [local, setLocal] = useState(initial);
  const selected =
    value === undefined ? local : (normalize(value) ?? "#316746");
  const [editing, setEditing] = useState({ selected, draft: selected });
  const draft = editing.selected === selected ? editing.draft : selected;
  const [feedback, setFeedback] = useState("");
  if (editing.selected !== selected) {
    setEditing({ selected, draft: selected });
    if (feedback) setFeedback("");
  }
  const inputRef = useRef<HTMLInputElement | null>(null);
  const statusId = `tz-color-status-${useId()}`;
  const chooserId = `tz-color-chooser-${useId()}`;
  const options = swatches ?? [
    { label: ar ? "أخضر" : "Green", value: "#316746" },
    { label: ar ? "أزرق" : "Blue", value: "#355C87" },
    { label: ar ? "برقوقي" : "Plum", value: "#805475" },
    { label: ar ? "طيني" : "Clay", value: "#AE6747" },
  ];
  useEntryReset(inputRef, () => {
    if (value === undefined) setLocal(initial);
    setEditing({
      selected: value === undefined ? initial : selected,
      draft: value === undefined ? initial : selected,
    });
    setFeedback("");
  });
  function commit(text: string) {
    if (disabled || inputRef.current?.matches(":disabled")) return;
    const next = normalize(text);
    if (!next) {
      setFeedback(
        labels?.invalid ??
          (ar
            ? "أدخل لونًا بصيغة #RGB أو #RRGGBB، دون شفافية."
            : "Enter a color as #RGB or #RRGGBB, without transparency."),
      );
      return;
    }
    if (value === undefined) setLocal(next);
    setEditing({
      selected: value === undefined ? next : selected,
      draft: value === undefined ? next : selected,
    });
    setFeedback("");
    if (next !== selected) onValueChange?.(next);
  }
  const control = (association = field) => {
    const associations = associateControl(
      association,
      props,
      invalid || !!feedback,
    );
    const describedBy = mergeDescriptionIds(
      associations["aria-describedby"],
      feedback ? statusId : undefined,
    );
    return (
      <div className="tz-color-picker" data-disabled={disabled || undefined}>
        <div
          className="tz-color-entry"
          data-invalid={associations["aria-invalid"] || undefined}
        >
          <span id={chooserId} className="tz-visually-hidden">
            {props["aria-label"]}{" "}
            {labels?.chooser ?? (ar ? "اختيار لون" : "Choose color")}
          </span>
          <input
            aria-labelledby={mergeDescriptionIds(
              associations["aria-labelledby"],
              chooserId,
            )}
            type="color"
            form={form}
            className="tz-color-native"
            value={selected.toLowerCase()}
            disabled={disabled}
            aria-label={labels?.chooser ?? (ar ? "اختيار لون" : "Choose color")}
            aria-describedby={describedBy}
            onChange={(event) => commit(event.currentTarget.value)}
          />
          <input
            {...props}
            {...associations}
            aria-describedby={describedBy}
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") return ref(node);
              if (ref) ref.current = node;
            }}
            type="text"
            form={form}
            disabled={disabled}
            dir="ltr"
            spellCheck={false}
            autoComplete="off"
            className={`tz-color-hex ${className}`}
            value={draft}
            onChange={(event) => {
              setEditing({ selected, draft: event.currentTarget.value });
              setFeedback("");
              onChange?.(event);
            }}
            onBlur={(event) => {
              onBlur?.(event);
              if (!event.defaultPrevented) commit(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (
                event.defaultPrevented ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              )
                return;
              if (event.key === "Enter") {
                event.preventDefault();
                commit(event.currentTarget.value);
              }
            }}
          />
        </div>
        {options.length > 0 && (
          <div
            className="tz-color-swatches"
            role="group"
            aria-label={
              labels?.swatches ?? (ar ? "ألوان جاهزة" : "Preset colors")
            }
          >
            {options.map((swatch, index) => {
              const color = normalize(swatch.value);
              if (!color) return null;
              const active = color === selected;
              return (
                <button
                  type="button"
                  key={`${index}-${color}`}
                  className="tz-color-swatch"
                  style={{ backgroundColor: color }}
                  aria-label={swatch.label}
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => commit(color)}
                >
                  {active && (
                    <span className="tz-color-check">
                      <Check size={12} aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {name && (
          <input
            type="hidden"
            name={name}
            form={form}
            value={selected}
            disabled={disabled}
          />
        )}
        <span
          id={statusId}
          role="status"
          className="tz-entry-feedback"
          data-error={!!feedback || undefined}
        >
          {feedback}
        </span>
      </div>
    );
  };
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
