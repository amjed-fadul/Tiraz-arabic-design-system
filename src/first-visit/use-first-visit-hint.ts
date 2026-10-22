import { useCallback, useState } from "react";

/** Each guide has its own fixed key; opening a control counts as learning it. */
export function useFirstVisitHint(storageKey: string, enabled: boolean) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "seen";
    } catch {
      return false;
    }
  });
  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "seen");
    } catch {
      /* Keep dismissal in memory when storage is unavailable. */
    }
  }, [storageKey]);
  return { visible: enabled && !dismissed, dismiss };
}
