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
};
