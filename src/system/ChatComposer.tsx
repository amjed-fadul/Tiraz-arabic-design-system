import { PromptEntry } from "./PromptEntry";
import type { ChatComposerProps } from "./PromptEntry";
export type {
  ChatComposerProps,
  ChatEntryState,
  ChatEntryLabels,
} from "./PromptEntry";
/** Multiline controlled entry. Enter submits; Shift+Enter edits; host clears on acceptance. */
export function ChatComposer(props: ChatComposerProps) {
  return <PromptEntry {...props} />;
}
