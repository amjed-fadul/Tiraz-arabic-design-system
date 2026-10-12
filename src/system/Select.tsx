import * as Primitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ComponentPropsWithRef } from "react";
import { associateControl } from "./control-associations";
import type { FieldControlProps } from "./Field";
import { useSystem } from "./useSystem";
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export type SelectProps = Omit<
  ComponentPropsWithRef<"button">,
  "children" | "value" | "defaultValue" | "onChange" | "type"
> & {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  size?: "sm" | "md";
  invalid?: boolean;
  field?: FieldControlProps;
};
export function Select({
  options,
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  name,
  form,
  autoComplete,
  disabled,
  required,
  size = "sm",
  invalid,
  field,
  className = "",
  ...props
}: SelectProps) {
  const { container, config } = useSystem();
  const invalidFocusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (invalidFocusTimer.current !== null)
        clearTimeout(invalidFocusTimer.current);
    },
    [],
  );
  const associations = associateControl(field, { ...props, required }, invalid);
  return (
    <span
      className="tz-select"
      onInvalidCapture={(event) => {
        // Radix's hidden select participates in native validation. Preserve
        // form order: later invalid controls must not steal the first one's focus.
        event.preventDefault();
        const native = event.target as HTMLSelectElement;
        const firstInvalid = Array.from(native.form?.elements ?? []).find(
          (element) =>
            "willValidate" in element &&
            (element as HTMLInputElement).willValidate &&
            !(element as HTMLInputElement).validity.valid,
        );
        if (firstInvalid === native) {
          const trigger =
            event.currentTarget.querySelector<HTMLButtonElement>(
              ".tz-select-trigger",
            );
          // Native validation may focus a later uncancelled input after all
          // invalid events. Restore the first Select after that native phase.
          if (invalidFocusTimer.current !== null)
            clearTimeout(invalidFocusTimer.current);
          invalidFocusTimer.current = setTimeout(() => {
            invalidFocusTimer.current = null;
            if (
              trigger?.isConnected &&
              !trigger.disabled &&
              !native.validity.valid
            )
              trigger.focus();
          }, 0);
        }
      }}
    >
      <Primitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        form={form}
        autoComplete={autoComplete}
        disabled={disabled}
        required={associations.required}
        dir={config.direction}
      >
        <Primitive.Trigger
          {...props}
          {...associations}
          form={form}
          data-size={size}
          className={`tz-select-trigger ${className}`}
        >
          <Primitive.Value placeholder={placeholder} />
          <Primitive.Icon asChild>
            <ChevronDown size={16} aria-hidden="true" />
          </Primitive.Icon>
        </Primitive.Trigger>
        <Primitive.Portal container={container}>
          <Primitive.Content
            className="tz-select-popup"
            position="popper"
            sideOffset={5}
            collisionPadding={12}
            dir={config.direction}
          >
            <Primitive.ScrollUpButton className="tz-select-scroll">
              <ChevronUp size={14} aria-hidden="true" />
            </Primitive.ScrollUpButton>
            <Primitive.Viewport className="tz-select-viewport">
              {options.map((option) => (
                <Primitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  textValue={option.label}
                  className="tz-select-option"
                >
                  <Primitive.ItemText>
                    <bdi>{option.label}</bdi>
                  </Primitive.ItemText>
                  <Primitive.ItemIndicator className="tz-select-indicator">
                    <Check size={14} aria-hidden="true" />
                  </Primitive.ItemIndicator>
                </Primitive.Item>
              ))}
            </Primitive.Viewport>
            <Primitive.ScrollDownButton className="tz-select-scroll">
              <ChevronDown size={14} aria-hidden="true" />
            </Primitive.ScrollDownButton>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </span>
  );
}
