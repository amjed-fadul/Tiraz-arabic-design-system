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
    const form = scope?.querySelector<HTMLSelectElement>("select")?.form;
    if (!form) return;
    const onReset = (event: Event) => {
      resetEvent.current = event;
      // A microtask can run between native listeners for a trusted reset click.
      // The next task observes cancellation from both React event phases.
      const timer = setTimeout(() => {
        resetTimers.current.delete(timer);
        if (resetEvent.current === event) resetEvent.current = null;
        if (
          !event.defaultPrevented &&
          scope?.isConnected &&
          scope.querySelector<HTMLSelectElement>("select")?.form === form
        )
          commitValue(initialValue.current);
      }, 0);
      resetTimers.current.add(timer);
    };
    // Capture at the associated form before Radix's native target listener;
    // association is read from the real bridge, including external form IDs.
    form.addEventListener("reset", onReset, true);
    return () => form.removeEventListener("reset", onReset, true);
  }, [scope, formId, commitValue]);
  return { value: currentValue, onValueChange: changeValue, setScope };
}
