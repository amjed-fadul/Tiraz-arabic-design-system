import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Keep Radix's eager reset request from bypassing application cancellation. */
export function useSelectValue(
  value: string | undefined,
  defaultValue: string,
  onValueChange: ((value: string) => void) | undefined,
  formId: string | undefined,
) {
  const [localValue, setLocalValue] = useState(value ?? defaultValue);
  const initialValue = useRef(value ?? defaultValue);
  const [scope, setScope] = useState<HTMLSpanElement | null>(null);
  const resetEvent = useRef<Event | null>(null);
  const resetTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(
    () => () => {
      for (const timer of resetTimers.current) clearTimeout(timer);
      resetTimers.current.clear();
      resetEvent.current = null;
    },
    [],
  );
  const currentValue = value ?? localValue;
  const latest = useRef({
    currentValue,
    controlled: value !== undefined,
    onValueChange,
  });
  useLayoutEffect(() => {
    latest.current = {
      currentValue,
      controlled: value !== undefined,
      onValueChange,
    };
  });
  const commitValue = useCallback((next: string) => {
    const current = latest.current;
    if (next === current.currentValue) return;
    if (!current.controlled) {
      latest.current = { ...current, currentValue: next };
      setLocalValue(next);
    }
    current.onValueChange?.(next);
  }, []);
  const changeValue = useCallback(
    (next: string) => {
      // Radix's target-phase reset listener runs before a React onReset handler.
      // Root stays controlled, so this discarded request cannot mutate its UI.
      if (!resetEvent.current) commitValue(next);
    },
    [commitValue],
  );
  useEffect(() => {
    if (!scope) return;
    const form = scope?.querySelector<HTMLSelectElement>("select")?.form;
    const onReset = (event: Event) => {
      const resetForm = event.target;
      const currentForm =
        scope.querySelector<HTMLSelectElement>("select")?.form;
      if (
        (resetForm !== currentForm && resetForm !== form) ||
        resetEvent.current === event
      )
        return;
      resetEvent.current = event;
      // A microtask can run between native listeners for a trusted reset click.
      // The next task observes cancellation from both React event phases.
      const timer = setTimeout(() => {
        resetTimers.current.delete(timer);
        if (resetEvent.current === event) resetEvent.current = null;
        if (
          !event.defaultPrevented &&
          scope?.isConnected &&
          scope.querySelector<HTMLSelectElement>("select")?.form === resetForm
        )
          commitValue(initialValue.current);
      }, 0);
      resetTimers.current.add(timer);
    };
    // Resolve association at dispatch, including forms inserted/replaced without
    // rerendering Select. Keep a capture listener on Radix's last bound form too:
    // a detached former form cannot reach the document, but can call Radix reset.
    scope.ownerDocument.addEventListener("reset", onReset, true);
    form?.addEventListener("reset", onReset, true);
    return () => {
      scope.ownerDocument.removeEventListener("reset", onReset, true);
      form?.removeEventListener("reset", onReset, true);
    };
    // Radix rebinds its reset listener when its controlled value changes.
  }, [scope, formId, currentValue, commitValue]);
  return { value: currentValue, onValueChange: changeValue, setScope };
}
