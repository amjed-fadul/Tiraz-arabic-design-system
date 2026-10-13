import type { ComponentPropsWithRef } from "react";
import { associateControl } from "./control-associations";
import { Field } from "./Field";

export type CheckboxProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "size" | "children"
> & {
  label: string;
  helper?: string;
  error?: string;
  invalid?: boolean;
};
/** Native checkbox; ref, attributes and onChange target the input. */
export function Checkbox({
  label,
  helper,
  error,
  invalid,
  className = "",
  ...props
}: CheckboxProps) {
  return (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={props.required}
      id={props.id}
      className="tz-checkbox-field"
    >
      {(field) => (
        <input
          {...props}
          {...associateControl(field, props, invalid)}
          type="checkbox"
          className={`tz-choice-input tz-checkbox ${className}`}
        />
      )}
    </Field>
  );
}
