import { useId } from "react";
import type { ReactNode, RefObject } from "react";
import { Button } from "./Button";
import type { ButtonVariant } from "./Button";
import { Kbd } from "./Kbd";
import { applePlatform, useShortcuts } from "./useShortcuts";
import type { Shortcut } from "./useShortcuts";
import { useSystem } from "./useSystem";

export interface DecisionAction {
  id: string;
  label: ReactNode;
  /** Secondary by default; at most one primary per pattern. */
  tone?: ButtonVariant;
  shortcut?: Shortcut;
  loading?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

const keys: Record<Shortcut, readonly string[]> = {
  Escape: ["Escape"],
  "Mod+Enter": ["Mod", "Enter"],
};

/**
 * The person's options on the tray (spec sections 9 and 11): in the given
 * order with the primary last, each real shortcut hinted inside its button and
 * named in its accessible description. Shortcuts work only while focus is
 * inside `scope`, and only while their action is neither disabled nor loading.
 */
export function DecisionBar({
  actions,
  scope,
  contentKey,
  className = "",
}: {
  actions: readonly DecisionAction[];
  scope: RefObject<HTMLElement | null>;
  contentKey?: string;
  className?: string;
}) {
  const { config } = useSystem(),
    uid = useId();
  const ordered = [
    ...actions.filter((action) => action.tone !== "primary"),
    ...actions.filter((action) => action.tone === "primary"),
  ];
  useShortcuts(
    scope,
    actions.flatMap((action) =>
      action.shortcut
        ? [
            {
              key: action.shortcut,
              run: action.onSelect,
              enabled: !action.disabled && !action.loading,
            },
          ]
        : [],
    ),
    contentKey,
  );
  const description = (shortcut: Shortcut) =>
    `${config.direction === "rtl" ? "اختصار لوحة المفاتيح" : "Keyboard shortcut"}: ${
      shortcut === "Escape"
        ? "Esc"
        : `${applePlatform() ? "Cmd" : "Ctrl"}+Enter`
    }`;
  return (
    <div className={`tz-decision-bar ${className}`}>
      {ordered.map((action, index) => (
        <Button
          key={action.id}
          variant={action.tone ?? "secondary"}
          state={action.loading ? "loading" : "idle"}
          disabled={action.disabled}
          aria-describedby={action.shortcut ? `${uid}-${index}` : undefined}
          onClick={() => action.onSelect()}
        >
          {action.label}
          {action.shortcut && <Kbd keys={keys[action.shortcut]} />}
        </Button>
      ))}
      {/* Hidden, yet read as each button's description. */}
      {ordered.map(
        (action, index) =>
          action.shortcut && (
            <span key={action.id} id={`${uid}-${index}`} hidden>
              {description(action.shortcut)}
            </span>
          ),
      )}
    </div>
  );
}
