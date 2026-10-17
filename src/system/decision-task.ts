import { useLayoutEffect, useRef, useState } from "react";
/** Instance-scoped UI task. Hosts must also honor the signal and validate identity. */
export function useDecisionTask() {
  const [state, setState] = useState<
    "idle" | "submitting" | "accepted" | "failed"
  >("idle");
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const restore = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
      active.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    if (state === "failed" && restore.current) {
      const doc = restore.current.ownerDocument;
      if (
        doc.activeElement === doc.body ||
        doc.activeElement === restore.current
      )
        restore.current.focus();
    }
  }, [state]);
  async function run(
    callback: (signal: AbortSignal) => void | Promise<void>,
    accepted?: () => void,
  ) {
    if (active.current || state === "accepted") return;
    const controller = new AbortController();
    active.current = controller;
    restore.current = document.activeElement as HTMLElement | null;
    setState("submitting");
    try {
      await callback(controller.signal);
      if (!mounted.current || controller.signal.aborted) return;
      setState("accepted");
      accepted?.();
    } catch {
      if (mounted.current && !controller.signal.aborted) {
        active.current = null;
        setState("failed");
      }
    } finally {
      if (active.current === controller && controller.signal.aborted)
        active.current = null;
    }
  }
  return { state, run };
}
