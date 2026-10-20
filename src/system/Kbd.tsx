import { applePlatform } from "./useShortcuts";

/**
 * A key hint inside the control it triggers. Keys read left to right in both
 * directions; Enter's arrow still mirrors in Arabic. Hidden from assistive
 * technology: the control names its shortcut in its description.
 */
export function Kbd({ keys }: { keys: readonly string[] }) {
  const apple = applePlatform();
  return (
    <kbd className="tz-kbd" dir="ltr" aria-hidden="true">
      {keys.map((key, index) =>
        key === "Enter" ? (
          <span key={index} className="tz-mirror-rtl">
            ↵
          </span>
        ) : (
          <span key={index}>
            {key === "Mod"
              ? apple
                ? "⌘"
                : "Ctrl"
              : key === "Escape"
                ? "Esc"
                : key}
          </span>
        ),
      )}
    </kbd>
  );
}
