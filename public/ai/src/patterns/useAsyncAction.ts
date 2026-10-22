import { useCallback, useEffect, useRef, useState } from "react";

export interface ActionContext {
  /** Cooperatively abort work on cancellation/unmount; late results are ignored. */
  signal: AbortSignal;
}

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
