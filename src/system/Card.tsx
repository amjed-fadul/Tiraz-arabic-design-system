import type { ComponentPropsWithRef } from "react";

export type CardProps = ComponentPropsWithRef<"div">;
/** A noninteractive surface. Compose native headings, content and application actions. */
export function Card({ className = "", ...props }: CardProps) {
  return <div {...props} className={`tz-card ${className}`} />;
}
export function CardHeader({
  className = "",
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div {...props} className={`tz-card-header ${className}`} />;
}
/** Native h3; use a native heading in CardHeader when the page needs another level. */
export function CardTitle({
  className = "",
  ...props
}: ComponentPropsWithRef<"h3">) {
  return <h3 {...props} className={`tz-card-title ${className}`} />;
}
export function CardDescription({
  className = "",
  ...props
}: ComponentPropsWithRef<"p">) {
  return <p {...props} className={`tz-card-description ${className}`} />;
}
export function CardContent({
  className = "",
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div {...props} className={`tz-card-content ${className}`} />;
}
export function CardFooter({
  className = "",
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div {...props} className={`tz-card-footer ${className}`} />;
}
