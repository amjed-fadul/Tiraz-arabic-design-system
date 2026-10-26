import { useSelectPortal } from "./useSelectPortal";
import * as Primitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useSelectValue } from "./useSelectValue";
import type { ComponentPropsWithRef } from "react";
import { associateControl } from "./control-associations";
import type { FieldControlProps } from "./Field";
import { useGlide } from "./useGlide";
import { useSystem, usePortalDestination } from "./useSystem";
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
  const { config } = useSystem();
  const container = usePortalDestination();
  const portal = useSelectPortal(container);
  const glide = useGlide();
  const {
    value: selectedValue,
    onValueChange: changeValue,
    setScope,
  } = useSelectValue(value, defaultValue, onValueChange, form);
  const associations = associateControl(field, { ...props, required }, invalid);
  return (
    <span
      className="tz-select"
      ref={setScope}
      onFocusCapture={(event) => {
        const native = event.currentTarget.querySelector("select");
        // Static validation never focuses the bridge; cancelled invalid events
        // never reach native focus. Follow the browser's actual focus decision,
        // preserving application focus if an earlier handler moved it elsewhere.
        if (
          native &&
          event.target === native &&
          native === native.ownerDocument.activeElement
        ) {
          event.currentTarget
            .querySelector<HTMLButtonElement>(".tz-select-trigger")
            ?.focus();
        }
      }}
    >
      <Primitive.Root
        open={portal.open}
        onOpenChange={portal.onOpenChange}
        value={selectedValue}
        onValueChange={changeValue}
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
        {portal.container && (
          <Primitive.Portal container={portal.container}>
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
              <Primitive.Viewport ref={glide} className="tz-select-viewport">
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
        )}
      </Primitive.Root>
    </span>
  );
}
