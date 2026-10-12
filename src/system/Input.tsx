import type { ComponentPropsWithRef } from "react";
import { associateControl } from "./control-associations";
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
  field?: FieldControlProps;
};
/** Native text-entry input. React 19 ref-as-prop targets HTMLInputElement. */
export function Input({
  type = "text",
  size = "sm",
  invalid,
  field,
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      {...associateControl(field, props, invalid)}
      type={type}
      data-size={size}
      className={`tz-input ${className}`}
    />
  );
}
