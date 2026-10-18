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
const staticExamples: ComponentId[] = [
  "selection-actions",
  "context-meter",
  "model-selector",
  "sources",
  "insight-cards",
  "chat-composer",
  "prompt-bar",
  "code-block",
  "markdown",
  "badge",
  "avatar",
  "avatar-group",
  "empty-state",
  "card",
  "table",
  "input-copy",
  "breadcrumbs",
  "accordion",
  "pagination",
  "tooltip",
  "modal",
  "data-table",
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
// The playground already stages these live; a second stage would only repeat it.
const playgroundOnly: ComponentId[] = [
  "card",
  "accordion",
  "breadcrumbs",
  "pagination",
  "tooltip",
  "modal",
  "data-table",
];
export function hasExamples(component: ComponentId) {
  return !playgroundOnly.includes(component);
}
