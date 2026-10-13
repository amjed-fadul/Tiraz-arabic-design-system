import { useId } from "react";
import type { ComponentPropsWithRef } from "react";
import { mergeDescriptionIds } from "./control-associations";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export type RadioGroupProps = Omit<
  ComponentPropsWithRef<"fieldset">,
  "children" | "name" | "defaultValue"
> & {
  label: string;
  name: string;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  helper?: string;
  error?: string;
  required?: boolean;
};
/** Native one-choice group. Options need unique stable values and useful labels. */
export function RadioGroup({
  label,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  helper,
  error,
  required,
  id,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: RadioGroupProps) {
  const uid = useId(),
    groupId = id ?? `tz-radio-${uid}`;
  const description = mergeDescriptionIds(
    helper ? `${groupId}-help` : undefined,
    error ? `${groupId}-error` : undefined,
    describedBy,
  );
  return (
    <fieldset
      {...props}
      id={groupId}
      aria-describedby={description}
      aria-invalid={error ? true : props["aria-invalid"]}
      className={`tz-radio-group ${className}`}
    >
      <legend className="tz-field-label">
        <bdi>{label}</bdi>
        {required && (
          <span aria-hidden="true" className="tz-field-required">
            {" "}
            *
          </span>
        )}
      </legend>
      <div className="tz-radio-options">
        {options.map((option) => (
          <label key={option.value} className="tz-radio-option">
            <input
              type="radio"
              className="tz-choice-input tz-radio"
              name={name}
              value={option.value}
              form={props.form}
              disabled={option.disabled}
              required={required}
              checked={value === undefined ? undefined : value === option.value}
              defaultChecked={
                value === undefined ? defaultValue === option.value : undefined
              }
              aria-describedby={description}
              aria-invalid={error ? true : props["aria-invalid"]}
              onChange={(event) => {
                if (event.currentTarget.checked)
                  onValueChange?.(event.currentTarget.value);
              }}
            />
            <bdi>{option.label}</bdi>
          </label>
        ))}
      </div>
      {helper && (
        <p id={`${groupId}-help`} className="tz-field-help" dir="auto">
          {helper}
        </p>
      )}
      {error && (
        <p id={`${groupId}-error`} className="tz-field-error" dir="auto">
          {error}
        </p>
      )}
    </fieldset>
  );
}
