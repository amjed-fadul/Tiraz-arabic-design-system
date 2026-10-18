import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { X } from "lucide-react";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
import { associateControl, mergeDescriptionIds } from "./control-associations";
import { useSystem } from "./useSystem";
import { useArrivals } from "./useArrivals";

export interface TagInputLabels {
  remove?: (tag: string) => string;
  duplicate?: string;
  maximum?: (count: number) => string;
}
export type TagInputProps = Omit<
  ComponentPropsWithRef<"input">,
  "value" | "defaultValue" | "type" | "children" | "size" | "required"
> & {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  maxTags?: number;
  size?: "sm" | "md";
  invalid?: boolean;
  labels?: TagInputLabels;
} & (
    | { label: string; helper?: string; error?: string; field?: never }
    | {
        label?: never;
        helper?: never;
        error?: never;
        field?: FieldControlProps;
      }
  );
/** String-array entry. Ref and native editing attributes target the draft input. */
export function TagInput({
  value,
  defaultValue = [],
  onValueChange,
  maxTags,
  labels,
  label,
  helper,
  error,
  field,
  size = "sm",
  invalid,
  name,
  form,
  disabled,
  readOnly,
  ref,
  className = "",
  onChange,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: TagInputProps) {
  const { config } = useSystem();
  const ar = config.direction === "rtl";
  const [local, setLocal] = useState(defaultValue);
  const initial = useRef(defaultValue);
  const tags = value ?? local;
  const arrivals = useArrivals(tags);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composing = useRef(false);
  const statusId = `tz-tags-status-${useId()}`;
  const limit =
    maxTags !== undefined && Number.isFinite(maxTags)
      ? Math.max(0, Math.floor(maxTags))
      : undefined;
  const latest = useRef({ controlled: value !== undefined });
  useLayoutEffect(() => {
    latest.current = { controlled: value !== undefined };
  }, [value]);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      if (event.target !== input.form) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (
          event.defaultPrevented ||
          !input.isConnected ||
          event.target !== input.form
        )
          return;
        if (!latest.current.controlled) setLocal(initial.current);
        setDraft("");
        setFeedback("");
      }, 0);
      timers.add(timer);
    };
    input.ownerDocument.addEventListener("reset", reset, true);
    return () => {
      input.ownerDocument.removeEventListener("reset", reset, true);
      for (const timer of timers) clearTimeout(timer);
    };
  }, [form]);
  function commit(next: string[]) {
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
    setFeedback("");
  }
  function remove(index: number) {
    if (disabled || readOnly) return;
    inputRef.current?.focus();
    commit(tags.filter((_, i) => i !== index));
  }
  function add() {
    const tag = draft.trim();
    if (!tag) return;
    if (tags.includes(tag)) {
      setFeedback(
        labels?.duplicate ??
          (ar ? "أُضيف هذا الوسم بالفعل." : "This tag is already added."),
      );
      return;
    }
    if (limit !== undefined && tags.length >= limit) {
      setFeedback(
        labels?.maximum?.(limit) ??
          (ar
            ? `الحد الأقصى ${limit} من الوسوم. احذف وسمًا لإضافة آخر.`
            : `Maximum of ${limit} tags. Remove a tag to add another.`),
      );
      return;
    }
    commit([...tags, tag]);
    setDraft("");
  }
  const control = (association = field) => {
    const associations = associateControl(association, props, invalid);
    return (
      <>
        <div
          className="tz-tag-input"
          data-size={size}
          data-disabled={disabled || undefined}
          data-invalid={associations["aria-invalid"] || undefined}
        >
          {tags.map((tag, index) => (
            <span
              className="tz-tag"
              key={`${index}-${tag}`}
              data-fresh={arrivals.fresh(tag) || undefined}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) arrivals.settle(tag);
              }}
            >
              <bdi>{tag}</bdi>
              <button
                type="button"
                className="tz-tag-remove"
                disabled={disabled || readOnly}
                aria-label={
                  labels?.remove?.(tag) ?? (ar ? `حذف ${tag}` : `Remove ${tag}`)
                }
                onClick={() => remove(index)}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            {...props}
            {...associations}
            required={undefined}
            aria-describedby={mergeDescriptionIds(
              associations["aria-describedby"],
              feedback ? statusId : undefined,
            )}
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") return ref(node);
              if (ref) ref.current = node;
            }}
            type="text"
            form={form}
            disabled={disabled}
            readOnly={readOnly}
            className={`tz-tag-draft ${className}`}
            value={draft}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              setFeedback("");
              onChange?.(event);
            }}
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
                event.defaultPrevented ||
                composing.current ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              )
                return;
              if (event.key === "Enter") {
                event.preventDefault();
                if (!disabled && !readOnly) add();
              }
              if (
                event.key === "Backspace" &&
                !draft &&
                tags.length &&
                !disabled &&
                !readOnly
              ) {
                event.preventDefault();
                remove(tags.length - 1);
              }
            }}
          />
        </div>
        {name &&
          tags.map((tag, index) => (
            <input
              key={index}
              type="hidden"
              name={name}
              form={form}
              value={tag}
              disabled={disabled}
            />
          ))}
        <span id={statusId} role="status" className="tz-entry-feedback">
          {feedback}
        </span>
      </>
    );
  };
  return label !== undefined ? (
    <Field label={label} helper={helper} error={error} id={props.id}>
      {control}
    </Field>
  ) : (
    control()
  );
}
