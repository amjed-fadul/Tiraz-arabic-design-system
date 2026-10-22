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
const ARABIC_LETTER = /\p{Script=Arabic}/u;
/** Two initials. An Arabic family name skips its article («العتيبي» → «ع»),
 * and Arabic letters are kept apart with a zero-width non-joiner so the pair
 * never fuses into one connected word. */
function initialsOf(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part, index) => {
      const word =
        index > 0 && part.startsWith("ال") && Array.from(part).length > 3
          ? part.slice(2)
          : part;
      return Array.from(word)[0];
    });
  const joiner = letters.every((letter) => ARABIC_LETTER.test(letter))
    ? "\u200c"
    : "";
  return letters.join(joiner).toLocaleUpperCase();
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
  const initials = fallback ?? initialsOf(name);
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
