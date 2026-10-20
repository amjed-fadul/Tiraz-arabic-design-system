import { LoaderCircle } from "lucide-react";
export type SpinnerProps = {
  size?: "sm" | "md";
  /** "ai" paints the arc in the AI color, for work the assistant is doing. */
  tone?: "neutral" | "ai";
} & (
  { decorative?: false; label: string } | { decorative: true; label?: never }
);
export function Spinner({
  size = "sm",
  tone = "neutral",
  decorative = false,
  label,
}: SpinnerProps) {
  return (
    <span
      className="tz-loading-spinner"
      data-size={size}
      data-tone={tone}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      <LoaderCircle
        className="tz-spinner"
        aria-hidden="true"
        focusable="false"
      />
    </span>
  );
}
