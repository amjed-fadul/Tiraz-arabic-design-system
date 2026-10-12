import * as Primitive from "@radix-ui/react-switch";
import { useId } from "react";
import type { ComponentProps } from "react";
export interface SwitchProps extends Omit<
  ComponentProps<typeof Primitive.Root>,
  "children" | "asChild"
> {
  label: string;
  description?: string;
}
export function Switch({
  label,
  description,
  id,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: SwitchProps) {
  const uid = useId();
  const controlId = id ?? uid;
  return (
    <div
      className={`tz-switch-field ${className}`}
      data-disabled={props.disabled || undefined}
    >
      <div className="tz-switch-copy">
        <label htmlFor={controlId}>{label}</label>
        {description && <p id={`${controlId}-description`}>{description}</p>}
      </div>
      <Primitive.Root
        {...props}
        id={controlId}
        aria-describedby={
          [describedBy, description ? `${controlId}-description` : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className="tz-switch"
      >
        <Primitive.Thumb className="tz-switch-thumb" />
      </Primitive.Root>
    </div>
  );
}
