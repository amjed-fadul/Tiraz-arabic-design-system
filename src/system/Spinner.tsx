import { LoaderCircle } from "lucide-react";
export type SpinnerProps = { size?: "sm" | "md" } & (
  { decorative?: false; label: string } | { decorative: true; label?: never }
);
export function Spinner({
  size = "sm",
  decorative = false,
  label,
}: SpinnerProps) {
  return (
    <span
      className="tz-loading-spinner"
      data-size={size}
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
