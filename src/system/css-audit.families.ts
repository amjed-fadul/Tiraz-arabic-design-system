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
};
