import { useLayoutEffect, useRef, useState } from "react";
/** Clipboard receives the supplied string; stale clipboard promises cannot update feedback. */
export function useExactCopy(text: string) {
  const [feedback, setFeedback] = useState({
    text,
    result: "idle",
    busy: false,
  });
  if (feedback.text !== text)
    setFeedback({ text, result: "idle", busy: false });
  const lifecycle = useRef({
    generation: 0,
    busy: false,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  });
  useLayoutEffect(() => {
    const session = lifecycle.current;
    session.generation++;
    session.busy = false;
    return () => {
      session.generation++;
      clearTimeout(session.timer);
    };
  }, [text]);
  async function copy() {
    const session = lifecycle.current;
    if (session.busy) return;
    session.busy = true;
    const current = ++session.generation;
    clearTimeout(session.timer);
    setFeedback({ text, result: "idle", busy: true });
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (current !== session.generation) return;
      session.busy = false;
      setFeedback({ text, result: "success", busy: false });
      session.timer = setTimeout(() => {
        if (current === session.generation)
          setFeedback({ text, result: "idle", busy: false });
      }, 2000);
    } catch {
      if (current === session.generation) {
        session.busy = false;
        setFeedback({ text, result: "failure", busy: false });
      }
    }
  }
  return { ...feedback, copy };
}
