import type { ComponentId } from "./catalog";
import type { PlaygroundModel, ProgressModel } from "./model";

// Replay describes the actual rendered section, not just the component family.
const staticPlaygrounds: ComponentId[] = [
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
