import { Check, LoaderCircle, AlertCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { useChanged } from "./useChanged";
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
  // Labels and state glyphs animate only after the first state change, never
  // on first render.
  const changed = useChanged(state);
  const loading = state === "loading";
  const StateIcon = loading
    ? LoaderCircle
    : state === "success"
      ? Check
      : AlertCircle;
  return (
    <button
      {...props}
      type={type}
      // Loading keeps the button focusable, so focus never drops to the page
      // mid-action; it is inert instead, and its clicks are swallowed.
      disabled={disabled && !loading}
      aria-disabled={loading || props["aria-disabled"]}
      aria-busy={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : props.onClick}
      data-state={state}
      data-changed={changed || undefined}
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
        <span
          className="tz-button-label"
          key={state}
          data-changed={changed || undefined}
        >
          {children}
        </span>
      )}
    </button>
  );
}
