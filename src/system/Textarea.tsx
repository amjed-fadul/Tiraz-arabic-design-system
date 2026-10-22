import type { ComponentPropsWithRef } from "react";
import { associateControl } from "./control-associations";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";

export type TextareaProps = Omit<
  ComponentPropsWithRef<"textarea">,
  "children"
> & {
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
/** Native multiline editing; React 19 ref-as-prop targets HTMLTextAreaElement. */
export function Textarea({
  label,
  helper,
  error,
  invalid,
  field,
  rows = 3,
  className = "",
  ...props
}: TextareaProps) {
  const textarea = (control = field) => (
    <textarea
      {...props}
      {...associateControl(control, props, invalid)}
      rows={rows}
      className={`tz-textarea ${className}`}
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
      {textarea}
    </Field>
  ) : (
    textarea()
  );
}
