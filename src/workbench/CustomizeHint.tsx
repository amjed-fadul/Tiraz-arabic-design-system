import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { X } from "lucide-react";
import type { Language } from "./i18n";
import "./customize-hint.css";

/** Render alongside the original trigger inside .customize-hint-anchor. */
export function CustomizeHint({
  language,
  onOpen,
  onDismiss,
  triggerRef,
}: {
  language: Language;
  onOpen: () => void;
  onDismiss: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const ar = language === "ar";
  const dismiss = useCallback(() => {
    const ownsFocus = root.current?.contains(document.activeElement);
    onDismiss();
    if (ownsFocus) triggerRef?.current?.focus();
  }, [onDismiss, triggerRef]);

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
      className="customize-hint"
      lang={language}
      dir={ar ? "rtl" : "ltr"}
    >
      <span className="customize-hint-note">
        <button
          type="button"
          className="customize-hint-action"
          aria-label={ar ? "خصّص من هنا" : "Click me to customize the preview"}
          onClick={() => {
            onDismiss();
            onOpen();
          }}
        >
          {ar ? "خصّص من هنا" : "Click me"}
        </button>
        <button
          type="button"
          className="customize-hint-dismiss"
          aria-label={ar ? "إخفاء تلميح التخصيص" : "Dismiss customize hint"}
          onClick={dismiss}
        >
          <X size={13} aria-hidden="true" />
        </button>
      </span>
      <svg
        className="customize-hint-arrow"
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
