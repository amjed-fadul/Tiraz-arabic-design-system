import { useSyncExternalStore } from "react";

type Modality = "pointer" | "keyboard";

// The keys that move through or act on an interface (Woven spec, section 15),
// plus any single letter or digit in any script, for typeahead. Modifier keys
// alone never count, so Shift-click stays pointer; Shift+Tab counts as Tab.
const navigationKeys = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  " ",
  "Escape",
  "Home",
  "End",
]);
const letterOrDigit = /^[\p{L}\p{N}]$/u;
// Arabic layouts report the lam-alef key as the two-letter key «لا». Named
// keys ("Shift", "Fn", "F1") are all ASCII, so a key of up to two non-ASCII
// letters is a character key, not a named one.
const shortNonAsciiLetters = /^(?=\P{ASCII}{1,2}$)\p{L}+$/u;

function isNavigation(key: string | undefined) {
  // Chrome's autofill sends keydown events that carry no key.
  return (
    key !== undefined &&
    (navigationKeys.has(key) ||
      letterOrDigit.test(key) ||
      shortNonAsciiLetters.test(key))
  );
}

// One store for every provider root. The first subscriber attaches the
// document listeners and the last one removes them, so nested providers share
// one pair and an unmounted tree leaves none behind.
let modality: Modality = "pointer";
const subscribers = new Set<() => void>();

function change(next: Modality) {
  if (next === modality) return;
  modality = next;
  for (const notify of subscribers) notify();
}
function onKeyDown(event: KeyboardEvent) {
  if (isNavigation(event.key)) change("keyboard");
}
function onPointerDown() {
  change("pointer");
}

function subscribe(notify: () => void) {
  // Each subscription is its own entry, so the set's size is the subscriber
  // count even if one callback subscribes twice.
  const subscriber = () => notify();
  subscribers.add(subscriber);
  if (subscribers.size === 1) {
    // Capture phase, so the modality switches before any component's handler
    // runs, even one that stops the event.
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
  }
  return () => {
    if (!subscribers.delete(subscriber) || subscribers.size > 0) return;
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("pointerdown", onPointerDown, true);
    modality = "pointer";
  };
}

const snapshot = () => modality;
const serverSnapshot = (): Modality => "pointer";

/** Internal: the input the user is on, shared by every provider root. */
export function useInputModality(): Modality {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
