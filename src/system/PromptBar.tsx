import { PromptEntry } from "./PromptEntry";
import type { ChatComposerProps } from "./PromptEntry";
import { Button } from "./Button";
import { useSystem } from "./useSystem";
export type PromptBarProps = ChatComposerProps &
  (
    | {
        suggestions: string[];
        onSuggestionSelect: (suggestion: string) => void;
      }
    | { suggestions?: never; onSuggestionSelect?: never }
  );
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
        label={
          props.label ?? props["aria-label"] ?? (ar ? "الموجّه" : "Prompt")
        }
        placeholder={
          props.placeholder ??
          (ar ? "بمَ يمكنني مساعدتك؟" : "What can I help with?")
        }
        renderSuggestions={(busy) =>
          suggestions &&
          !props.value && (
            <ul
              className="tz-prompt-suggestions"
              aria-label={ar ? "موجّهات مقترحة" : "Suggested prompts"}
            >
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={props.disabled || props.readOnly || busy}
                    onClick={() => onSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </Button>
                </li>
              ))}
            </ul>
          )
        }
      />
    </div>
  );
}
