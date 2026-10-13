import { useState } from "react";
import type { ComponentPropsWithRef } from "react";
export interface AvatarProps extends Omit<
  ComponentPropsWithRef<"span">,
  "children" | "role" | "aria-label"
> {
  name: string;
  src?: string;
  fallback?: string;
  size?: "sm" | "md";
  decorative?: boolean;
}
function Portrait({ src, fallback }: { src: string; fallback: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );
  return (
    <>
      {status !== "loaded" && <bdi aria-hidden="true">{fallback}</bdi>}
      {status !== "failed" && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          hidden={status !== "loaded"}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("failed")}
        />
      )}
    </>
  );
}
export function Avatar({
  name,
  src,
  fallback,
  size = "sm",
  decorative = false,
  className = "",
  ...props
}: AvatarProps) {
  const initials =
    fallback ??
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase();
  return (
    <span
      {...props}
      className={`tz-avatar ${className}`}
      data-size={size}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      {src ? (
        <Portrait key={src} src={src} fallback={initials} />
      ) : (
        <bdi aria-hidden="true">{initials}</bdi>
      )}
    </span>
  );
}
