import type { ComponentId } from "./catalog";
import type { PlaygroundModel, ProgressModel } from "./model";

// Replay describes the actual rendered section, not just the component family.
const staticPlaygrounds: ComponentId[] = [
  "selection-actions",
  "context-meter",
  "model-selector",
  "image-result",
  "sources",
  "insight-cards",
  "chat-thread",
  "code-block",
  "markdown",
  "badge",
  "avatar",
  "avatar-group",
  "empty-state",
  "alert",
  "card",
  "table",
  "input-copy",
  "breadcrumbs",
  "line-chart",
  "area-chart",
  "bar-chart",
  "donut-chart",
];
// Examples that only show a composition and have nothing to replay.
const staticExamples: ComponentId[] = [
  "context-meter",
  "model-selector",
  "chat-composer",
  "prompt-bar",
  "input-copy",
];
export function canReplayPlayground(
  component: ComponentId,
  model: PlaygroundModel,
) {
  if (component === "progress") return (model as ProgressModel).indeterminate;
  return !staticPlaygrounds.includes(component);
}
export function canReplayExamples(component: ComponentId) {
  return !staticExamples.includes(component);
}
// Examples appear only where they show what the playground cannot: a flow
// over time, a composition with other components, or an Arabic edge case.
// Every other page is the playground alone.
const withExamples: ComponentId[] = [
  "ask-user-questions",
  "approval-card",
  "approval-flow",
  "model-selector",
  "context-meter",
  "image-result",
  "chat-thread",
  "chat-composer",
  "prompt-bar",
  "tool-call",
  "tool-chips",
  "thinking-state",
  "steps",
  "input-copy",
  "line-chart",
  "donut-chart",
  "alert",
  "skeleton",
  "empty-state",
  "textarea",
  "sheet",
];
export function hasExamples(component: ComponentId) {
  return withExamples.includes(component);
}
