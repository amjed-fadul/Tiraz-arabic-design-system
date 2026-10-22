import { useState } from "react";
import type { ReactNode } from "react";
/** A changing count rolls in from the direction it moved: up from below,
 * down from above. First render is static. Purely visual. */
export function Tick({
  value,
  children,
}: {
  value: string | number;
  children?: ReactNode;
}) {
  const [seen, setSeen] = useState({ value, dir: "up", changed: false });
  if (!Object.is(seen.value, value)) {
    const down =
      typeof value === "number" &&
      typeof seen.value === "number" &&
      value < seen.value;
    setSeen({ value, dir: down ? "down" : "up", changed: true });
  }
  return (
    <span
      key={String(value)}
      className="tz-tick"
      data-changed={seen.changed || undefined}
      data-dir={seen.dir}
    >
      {children ?? value}
    </span>
  );
}
