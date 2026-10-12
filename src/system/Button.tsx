import { Check, LoaderCircle, AlertCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
export type ButtonState = "idle" | "loading" | "success" | "error";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  variant?: ButtonVariant;
  state?: ButtonState;
  size?: "sm" | "md";
};
export type ButtonProps = Base &
  (
    | { iconOnly: true; "aria-label": string }
    | { iconOnly?: false; "aria-label"?: string }
  );
export function Button({
  variant = "primary",
  state = "idle",
  size = "sm",
  disabled,
  className = "",
  children,
  iconOnly = false,
  type = "button",
  ...props
}: ButtonProps) {
  const StateIcon =
    state === "loading"
      ? LoaderCircle
      : state === "success"
        ? Check
        : AlertCircle;
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || state === "loading"}
      aria-busy={state === "loading" || undefined}
      data-state={state}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      className={`tz-button ${className}`}
    >
      {state !== "idle" && (
        <StateIcon
          aria-hidden="true"
          className={state === "loading" ? "tz-spinner" : ""}
          size={16}
        />
      )}
      {(!iconOnly || state === "idle") && (
        <span className="tz-button-label" key={state}>
          {children}
        </span>
      )}
    </button>
  );
}
