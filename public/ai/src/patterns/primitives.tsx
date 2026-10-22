import { useId } from "react";
import type { HTMLAttributes, InputHTMLAttributes } from "react";

export type LayoutProps = HTMLAttributes<HTMLDivElement>;
export function Stack({ className = "", ...props }: LayoutProps) {
  return <div {...props} className={`tz-stack ${className}`} />;
}
export function Inline({ className = "", ...props }: LayoutProps) {
  return <div {...props} className={`tz-inline ${className}`} />;
}
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}
/** className and native input props target the input; copy is associated by ID. */
export function TextField({
  label,
  description,
  error,
  id,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: TextFieldProps) {
  const uid = useId();
  const controlId = id ?? uid;
  return (
    <div className="tz-field">
      <label htmlFor={controlId}>{label}</label>
      <input
        {...props}
        id={controlId}
        className={`tz-input ${className}`}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={
          [
            describedBy,
            description ? `${controlId}-description` : undefined,
            error ? `${controlId}-error` : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {description && (
        <p id={`${controlId}-description`} className="tz-field-description">
          {description}
        </p>
      )}
      {error && (
        <p id={`${controlId}-error`} className="tz-pattern-error">
          {error}
        </p>
      )}
    </div>
  );
}
