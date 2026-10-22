import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./first-visit-hint.css";

/** A quiet, dismissible annotation beside its original control. */
export function FirstVisitHint({
  language,
  label,
  actionLabel = label,
  dismissLabel,
  className = "",
  onOpen,
  onDismiss,
  onReturnFocus,
}: {
  language: "ar" | "en";
  label: string;
  actionLabel?: string;
  dismissLabel: string;
  className?: string;
  onOpen: () => void;
  onDismiss: () => void;
  onReturnFocus?: () => void;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const ar = language === "ar";
  const dismiss = useCallback(() => {
    const ownsFocus = root.current?.contains(document.activeElement);
    onDismiss();
    if (ownsFocus) onReturnFocus?.();
  }, [onDismiss, onReturnFocus]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) dismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  return (
    <span
      ref={root}
      className={`first-visit-hint ${className}`}
      lang={language}
      dir={ar ? "rtl" : "ltr"}
    >
      <span className="first-visit-hint-note">
        <button
          type="button"
          className="first-visit-hint-action"
          aria-label={actionLabel}
          onClick={() => {
            onDismiss();
            onOpen();
          }}
        >
          {label}
        </button>
        <button
          type="button"
          className="first-visit-hint-dismiss"
          aria-label={dismissLabel}
          onClick={dismiss}
        >
          <X size={13} aria-hidden="true" />
        </button>
      </span>
      <svg
        className="first-visit-hint-arrow"
        viewBox="0 0 88 64"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 6C36 1 74 13 64 32C57 47 33 48 36 36C39 24 64 36 70 57M57 49L70 57L74 42" />
      </svg>
    </span>
  );
}
