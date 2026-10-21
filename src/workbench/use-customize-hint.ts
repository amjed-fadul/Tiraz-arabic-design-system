import { useCallback, useState } from "react";

const STORAGE_KEY = "tiraz.customize-hint.v1";

function hasDismissedHint() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "seen";
  } catch {
    return false;
  }
}

/** Keep this hook in the workbench so changing component pages retains dismissal. */
export function useCustomizeHint(enabled: boolean) {
  const [dismissed, setDismissed] = useState(hasDismissedHint);
  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "seen");
    } catch {
      // The hint stays dismissed in this workbench when storage is unavailable.
    }
  }, []);

  return { visible: enabled && !dismissed, dismiss };
}
