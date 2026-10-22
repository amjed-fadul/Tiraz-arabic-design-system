import type { CSSProperties } from "react";
export interface SkeletonProps {
  shape?: "text" | "rectangle" | "circle";
  style?: CSSProperties;
  className?: string;
}
export function Skeleton({
  shape = "text",
  style,
  className = "",
}: SkeletonProps) {
  return (
    <span
      className={`tz-skeleton ${className}`}
      data-shape={shape}
      style={style}
      aria-hidden="true"
    />
  );
}
