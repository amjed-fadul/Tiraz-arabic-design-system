import { useState } from "react";
/** True once `value` first differs from its value on mount, so motion that
 * marks a change never plays on first render. */
export function useChanged<T>(value: T) {
  const [initial] = useState(value);
  const [changed, setChanged] = useState(false);
  if (!changed && !Object.is(value, initial)) setChanged(true);
  return changed;
}
