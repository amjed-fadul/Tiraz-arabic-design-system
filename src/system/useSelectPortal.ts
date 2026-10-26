import { useLayoutEffect, useState } from "react";

/** Radix registers selected labels and native form options from closed Content.
 * Keep that inert subtree while a destination is pending, without opening a
 * focus scope, hiding siblings, or falling back to document.body. */
export function useSelectPortal(container: HTMLElement | null) {
  const [requestedOpen, onOpenChange] = useState(false);
  const [detached, setDetached] = useState<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    setDetached(document.createElement("div"));
  }, []);
  return {
    open: !!container && requestedOpen,
    onOpenChange,
    container: container ?? detached,
  };
}
