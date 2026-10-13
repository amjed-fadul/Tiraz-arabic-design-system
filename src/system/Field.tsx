import { mergeDescriptionIds } from "./control-associations";
import { useId } from "react";
import type { ReactNode } from "react";

/** Explicit association contract for exactly one Input, Select or Textarea. */
export interface FieldControlProps {
  id: string;
  "aria-labelledby": string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
}
export interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  children: (control: FieldControlProps) => ReactNode;
}
export function Field({
  label,
  helper,
  error,
  required,
  id,
  className = "",
  "aria-describedby": describedBy,
  children,
}: FieldProps) {
  const uid = useId();
  const controlId = id ?? `tz-field-${uid}`;
  const labelId = `${controlId}-label`,
    helperId = `${controlId}-help`,
    errorId = `${controlId}-error`;
  return (
    <div className={`tz-field ${className}`}>
      <label id={labelId} htmlFor={controlId} className="tz-field-label">
        <bdi>{label}</bdi>
        {required && (
          <span aria-hidden="true" className="tz-field-required">
            {" "}
            *
          </span>
        )}
      </label>
      {children({
        id: controlId,
        "aria-labelledby": labelId,
        "aria-describedby": mergeDescriptionIds(
          describedBy,
          helper ? helperId : undefined,
          error ? errorId : undefined,
        ),
        "aria-invalid": error ? true : undefined,
        required,
      })}
      {helper && (
        <p id={helperId} className="tz-field-help" dir="auto">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} className="tz-field-error" dir="auto">
          {error}
        </p>
      )}
    </div>
  );
}
