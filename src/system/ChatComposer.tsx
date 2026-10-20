import { PromptEntry } from "./PromptEntry";
import type { ChatComposerProps } from "./PromptEntry";
export type {
  ChatComposerProps,
  ChatEntryState,
  ChatEntryLabels,
} from "./PromptEntry";
/**
 * Multiline controlled entry. Enter submits; Shift+Enter edits; host clears on
 * acceptance. `tools` puts the host's controls on a row under the text area,
 * and `appearance="plain"` drops the floating shadow for an entry that sits
 * inside another surface.
 */
export function ChatComposer(props: ChatComposerProps) {
  return <PromptEntry {...props} />;
}
