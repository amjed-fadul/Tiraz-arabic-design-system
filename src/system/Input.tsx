import type { ComponentPropsWithRef } from "react";
import { associateControl } from "./control-associations";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
export type InputType =
  "text" | "email" | "password" | "search" | "tel" | "url";
export type InputProps = Omit<
  ComponentPropsWithRef<"input">,
  "size" | "type" | "children"
> & {
  type?: InputType;
  size?: "sm" | "md";
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
/** Native text-entry input. React 19 ref-as-prop targets HTMLInputElement. */
export function Input({
  label,
  helper,
  error,
  type = "text",
  size = "sm",
  invalid,
  field,
  className = "",
  ...props
}: InputProps) {
  const input = (control = field) => (
    <input
      {...props}
      {...associateControl(control, props, invalid)}
      type={type}
      data-size={size}
      className={`tz-input ${className}`}
    />
  );
  return label !== undefined ? (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={props.required}
      id={props.id}
    >
      {input}
    </Field>
  ) : (
    input()
  );
}
