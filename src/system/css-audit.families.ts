// The component families whose rules in components.css must pass the Woven CSS
// audit (css-audit.ts). Each key names a family and each value lists the class
// prefixes that make up its rules: ".tz-button" covers ".tz-button" and
// ".tz-button-label", never ".tz-buttons". A family is added here in the commit
// that migrates its CSS, and css-audit.test.ts audits it on every run from then
// on. Until a family is listed, its CSS is not held to the audit. Every prefix
// must name at least one rule, so a misspelled one fails instead of auditing
// nothing.
export const wovenFamilies: Record<string, readonly string[]> = {
  "status-icon": [".tz-status-icon"],
  "remove-button": [".tz-remove-button"],
  "demo-frame": [".tz-demo"],
  button: [".tz-button"],
  field: [".tz-field"],
  input: [".tz-input"],
  textarea: [".tz-textarea"],
  select: [".tz-select"],
  // .tz-choice-input is the box that Checkbox and RadioGroup share.
  checkbox: [".tz-checkbox", ".tz-choice"],
  "radio-group": [".tz-radio", ".tz-choice"],
  switch: [".tz-switch"],
  slider: [".tz-slider"],
  "otp-input": [".tz-otp"],
  // .tz-entry-feedback is the feedback line that five entry families share.
  "date-picker": [".tz-datepicker", ".tz-date", ".tz-entry"],
  // .tz-tag also covers FilterBar's chips.
  "tag-input": [".tz-tag", ".tz-entry"],
  "color-picker": [".tz-color", ".tz-entry"],
  "input-copy": [".tz-input-copy", ".tz-entry"],
  // .tz-file covers the dropzone's own rules and the tree's.
  "file-dropzone": [".tz-file", ".tz-selected-files", ".tz-entry"],
  "file-tree": [".tz-file-tree"],
  card: [".tz-card"],
  // .tz-icon-button is the close button that Modal, Sheet and Toast share.
  modal: [".tz-modal", ".tz-icon-button"],
  sheet: [".tz-sheet", ".tz-icon-button"],
  toast: [".tz-toast", ".tz-icon-button"],
  // .tz-kbd is the menu's shortcut hint.
  "dropdown-menu": [".tz-menu", ".tz-kbd"],
  tooltip: [".tz-tooltip"],
  alert: [".tz-alert"],
  badge: [".tz-badge"],
  "empty-state": [".tz-empty", ".tz-illustration"],
  accordion: [".tz-accordion"],
  // .tz-avatar also covers AvatarGroup's .tz-avatar-group and its overflow.
  avatar: [".tz-avatar"],
  sidebar: [".tz-sidebar"],
  tabs: [".tz-tabs", ".tz-tab"],
  breadcrumbs: [".tz-breadcrumbs", ".tz-breadcrumb"],
  pagination: [".tz-pagination"],
  steps: [".tz-steps", ".tz-step"],
  table: [".tz-table"],
  // .tz-table also covers DataTable's sort button, .tz-table-sort.
  "data-table": [".tz-data", ".tz-table"],
  timeline: [".tz-timeline"],
  "filter-bar": [".tz-filter"],
  // .tz-row and .tz-unread are the notification rows' title, meta, actions
  // and unread dot.
  "notification-list": [".tz-notification", ".tz-row", ".tz-unread"],
  skeleton: [".tz-skeleton"],
  progress: [".tz-progress"],
  // .tz-spinner is the turning arc, which Button's loading state shares.
  spinner: [".tz-loading-spinner", ".tz-spinner"],
  tick: [".tz-tick"],
  // .tz-chart covers the Line, Area, Bar and Donut charts' shared frame.
  charts: [".tz-chart"],
  // .tz-loading also covers the spinner's .tz-loading-spinner, and .tz-pixel
  // is the pixel grid LoadingState draws.
  "loading-state": [".tz-loading", ".tz-pixel"],
  // .tz-thinking covers ThinkingIndicator and ThinkingState.
  thinking: [".tz-thinking"],
  "streaming-text": [".tz-streaming", ".tz-stream"],
  markdown: [".tz-markdown"],
  "code-block": [".tz-code"],
  terminal: [".tz-terminal"],
  // .tz-tool covers ToolCall and ToolChips.
  tools: [".tz-tool"],
  // .tz-agent is each task row of TaskRows, and covers Agent task too.
  "task-rows": [".tz-task", ".tz-agent"],
  // Agent task; .tz-agent-task is TaskRows' row class (Decision 5).
  "agent-task": [".tz-agent-run"],
  // .tz-chat covers ChatThread, the composer that ChatComposer, PromptEntry
  // and PromptBar share, and ChatApp.
  chat: [".tz-chat"],
  // .tz-prompt is PromptBar's wrapper, bar and suggestions.
  "prompt-bar": [".tz-prompt"],
  // The decision families share .tz-decision (status, note, actions, icon,
  // facts, history) and .tz-question (the progress strip and key hint).
  "ask-user-questions": [".tz-ask", ".tz-question", ".tz-decision"],
  "approval-card": [".tz-approval", ".tz-decision"],
  "approval-flow": [".tz-approval", ".tz-decision", ".tz-question"],
  "selection-actions": [".tz-selection"],
  // .tz-context also covers the AIContextExamples layout.
  "context-meter": [".tz-context"],
  "model-selector": [".tz-model"],
  "image-result": [".tz-image"],
  // .tz-source is each row of the list, never .tz-sources.
  sources: [".tz-sources", ".tz-source"],
  // .tz-inline is the citation chip and .tz-citation its popup.
  "inline-citation": [".tz-inline", ".tz-citation"],
  "insight-cards": [".tz-insight", ".tz-insights"],
  // .tz-ai is the shared AI shimmer and the AIResultsExamples layout.
  ai: [".tz-ai"],
  // The shared parts of the AI patterns.
  "ai-mark": [".tz-ai-mark"],
  "status-pill": [".tz-status-pill"],
  thread: [".tz-thread"],
  tray: [".tz-tray"],
  countdown: [".tz-countdown"],
  "decision-bar": [".tz-decision-bar"],
  // The answer parts and the two patterns of Plan 4 Task 4.
  "thinking-panel": [".tz-thinking-panel"],
  "source-chip": [".tz-source-chip"],
  "feedback-bar": [".tz-feedback-bar"],
  "follow-ups": [".tz-follow-ups"],
  "cited-answer": [".tz-cited-answer"],
  "change-summary": [".tz-change-summary"],
  // Ask your data, of Plan 5 Task 3.
  "data-answer": [".tz-data-answer"],
  // Decision inbox, of Plan 5 Task 4. .tz-decision also holds it to the
  // decision families' audits.
  "decision-inbox": [".tz-decision-inbox"],
  // Start a task of Plan 4 Task 5.
  "task-starter": [".tz-task-starter"],
  // Suggested edits and its InlineDiff, of Plan 4 Task 6. .tz-inline also
  // holds .tz-inline-diff to the inline-citation family's audit.
  "suggested-edits": [".tz-suggested-edits"],
  "inline-diff": [".tz-inline-diff"],
  // Image generation and its WeaveCanvas, of Plan 4 Task 7. .tz-image also
  // holds .tz-image-generation to the image-result family's audit.
  "weave-canvas": [".tz-weave"],
  "image-generation": [".tz-image-generation"],
  // Draft for review, of Plan 5 Task 5.
  "draft-review": [".tz-draft-review"],
  // Assistant controls, of Plan 5 Task 6.
  "assistant-controls": [".tz-assistant-controls"],
};
