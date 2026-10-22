import type { RefObject } from "react";
import { FirstVisitHint } from "../first-visit/FirstVisitHint";
import type { Language } from "./i18n";
import "./customize-hint.css";

/** Render alongside the original trigger inside .customize-hint-anchor. */
export function CustomizeHint({
  language,
  triggerRef,
  ...props
}: {
  language: Language;
  onOpen: () => void;
  onDismiss: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
  const ar = language === "ar";
  return (
    <FirstVisitHint
      {...props}
      onReturnFocus={() => triggerRef?.current?.focus()}
      language={language}
      className="customize-hint"
      label={ar ? "خصّص من هنا" : "Click me"}
      actionLabel={ar ? "خصّص من هنا" : "Click me to customize the preview"}
      dismissLabel={ar ? "إخفاء تلميح التخصيص" : "Dismiss customize hint"}
    />
  );
}
