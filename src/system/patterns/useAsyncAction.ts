import { useCallback, useEffect, useRef, useState } from "react";

export interface ActionContext {
  /** Honor cancellation and check before committing caller state. UI cancellation cannot undo persistence. */
  signal: AbortSignal;
}

/** An operation begins only in an event handler, never on mount. */
export function useAsyncAction() {
  const current = useRef<AbortController | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const cancel = useCallback(() => {
    const previous = current.current;
    current.current = null;
    previous?.abort();
    setState("idle");
  }, []);
  useEffect(
    () => () => {
      const previous = current.current;
      current.current = null;
      previous?.abort();
    },
    [],
  );

  async function run(
    operation: (context: ActionContext) => Promise<void>,
    onSuccess?: () => void,
  ) {
    // A ref also blocks repeated native submits before React renders loading.
    if (current.current) return;
    const controller = new AbortController();
    current.current = controller;
    setState("loading");
    try {
      await operation({ signal: controller.signal });
      if (current.current !== controller) return;
      current.current = null;
      setState("success");
      onSuccess?.();
    } catch {
      if (current.current !== controller) return;
      current.current = null;
      setState("error");
    }
  }
  return { state, busy: state === "loading", run, cancel };
}
