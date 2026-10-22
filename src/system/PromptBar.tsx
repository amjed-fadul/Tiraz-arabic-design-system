import type { ReactNode } from "react";
import { PromptEntry } from "./PromptEntry";
import type { ChatComposerProps } from "./PromptEntry";
import { Button } from "./Button";
import { useSystem } from "./useSystem";
/** A suggestion is its label, or a record with the prompt it stands for. */
type Suggestion =
  string | { id: string; label: string; prompt?: string; icon?: ReactNode };
export type PromptBarProps = Omit<ChatComposerProps, "compact"> &
  (
    | {
        suggestions: Suggestion[];
        /** Receives the suggestion's `prompt`, or its label without one. */
        onSuggestionSelect: (suggestion: string) => void;
      }
    | { suggestions?: never; onSuggestionSelect?: never }
  );
/** The tray chips under a prompt entry; Start a task shares them. */
export function PromptSuggestions({
  items,
  label,
  disabled,
  onSelect,
}: {
  items: readonly Suggestion[];
  label: string;
  disabled?: boolean;
  onSelect: (suggestion: Exclude<Suggestion, string>) => void;
}) {
  return (
    <ul className="tz-prompt-suggestions" aria-label={label}>
      {items.map((item) => {
        const suggestion =
          typeof item === "string" ? { id: item, label: item } : item;
        return (
          <li key={suggestion.id}>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onSelect(suggestion)}
            >
              {"icon" in suggestion && suggestion.icon && (
                <span aria-hidden="true">{suggestion.icon}</span>
              )}
              {suggestion.label}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
/** Compact prompt entry for starting a task; suggestion behavior belongs to the host. */
export function PromptBar({
  suggestions,
  onSuggestionSelect,
  ...props
}: PromptBarProps) {
  const ar = useSystem().config.direction === "rtl";
  return (
    <div className="tz-prompt-entry">
      <PromptEntry
        {...props}
        compact
        label={props.label ?? props["aria-label"] ?? (ar ? "طلبك" : "Prompt")}
        placeholder={
          props.placeholder ??
          (ar ? "بمَ يمكنني مساعدتك؟" : "What can I help with?")
        }
        renderSuggestions={(busy) =>
          suggestions &&
          !props.value && (
            <PromptSuggestions
              items={suggestions}
              label={ar ? "طلبات مقترحة" : "Suggested prompts"}
              disabled={props.disabled || props.readOnly || busy}
              onSelect={(suggestion) =>
                onSuggestionSelect(suggestion.prompt ?? suggestion.label)
              }
            />
          )
        }
      />
    </div>
  );
}
