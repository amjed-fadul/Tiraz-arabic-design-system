// Serializable native ButtonHTMLAttributes, derived from the installed React types.
// Events/refs are functions or handles; managed/structured props use dedicated controls.
export interface NativeRule {
  string?: boolean;
  number?: boolean;
  boolean?: boolean;
  strings?: readonly string[];
  stringArray?: boolean;
}
export const nativeRules: Record<string, NativeRule> = {
  formAction: { string: true },
  form: {
    string: true,
  },
  formEncType: {
    string: true,
  },
  formMethod: {
    string: true,
  },
  formNoValidate: {
    boolean: true,
  },
  formTarget: {
    string: true,
  },
  name: {
    string: true,
  },
  value: {
    string: true,
    number: true,
    stringArray: true,
  },
  defaultChecked: {
    boolean: true,
  },
  defaultValue: {
    string: true,
    number: true,
    stringArray: true,
  },
  suppressContentEditableWarning: {
    boolean: true,
  },
  suppressHydrationWarning: {
    boolean: true,
  },
  accessKey: {
    string: true,
  },
  autoFocus: {
    boolean: true,
  },
  contentEditable: {
    boolean: true,
    strings: ["true", "false", "inherit", "plaintext-only"],
  },
  contextMenu: {
    string: true,
  },
  dir: {
    strings: ["rtl", "ltr", "auto"],
  },
  draggable: {
    boolean: true,
    strings: ["true", "false"],
  },
  enterKeyHint: {
    strings: ["enter", "done", "go", "next", "previous", "search", "send"],
  },
  hidden: {
    boolean: true,
  },
  lang: {
    string: true,
  },
  nonce: {
    string: true,
  },
  slot: {
    string: true,
  },
  spellCheck: {
    boolean: true,
    strings: ["true", "false"],
  },
  tabIndex: {
    number: true,
  },
  title: {
    string: true,
  },
  translate: {
    strings: ["yes", "no"],
  },
  radioGroup: {
    string: true,
  },
  about: {
    string: true,
  },
  content: {
    string: true,
  },
  datatype: {
    string: true,
  },
  prefix: {
    string: true,
  },
  property: {
    string: true,
  },
  rel: {
    string: true,
  },
  resource: {
    string: true,
  },
  rev: {
    string: true,
  },
  typeof: {
    string: true,
  },
  vocab: {
    string: true,
  },
  autoCorrect: {
    string: true,
  },
  autoSave: {
    string: true,
  },
  color: {
    string: true,
  },
  itemProp: {
    string: true,
  },
  itemScope: {
    boolean: true,
  },
  itemType: {
    string: true,
  },
  itemID: {
    string: true,
  },
  itemRef: {
    string: true,
  },
  results: {
    number: true,
  },
  security: {
    string: true,
  },
  unselectable: {
    strings: ["off", "on"],
  },
  popover: {
    strings: ["", "auto", "manual", "hint"],
  },
  popoverTargetAction: {
    strings: ["toggle", "show", "hide"],
  },
  popoverTarget: {
    string: true,
  },
  inert: {
    boolean: true,
  },
  inputMode: {
    strings: [
      "none",
      "search",
      "text",
      "tel",
      "url",
      "email",
      "numeric",
      "decimal",
    ],
  },
  is: {
    string: true,
  },
  exportparts: {
    string: true,
  },
  part: {
    string: true,
  },
  "aria-activedescendant": {
    string: true,
  },
  "aria-atomic": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-autocomplete": {
    strings: ["none", "list", "inline", "both"],
  },
  "aria-braillelabel": {
    string: true,
  },
  "aria-brailleroledescription": {
    string: true,
  },
  "aria-busy": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-checked": {
    boolean: true,
    strings: ["true", "false", "mixed"],
  },
  "aria-colcount": {
    number: true,
  },
  "aria-colindex": {
    number: true,
  },
  "aria-colindextext": {
    string: true,
  },
  "aria-colspan": {
    number: true,
  },
  "aria-controls": {
    string: true,
  },
  "aria-current": {
    boolean: true,
    strings: ["true", "false", "page", "step", "location", "date", "time"],
  },
  "aria-describedby": {
    string: true,
  },
  "aria-description": {
    string: true,
  },
  "aria-details": {
    string: true,
  },
  "aria-disabled": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-dropeffect": {
    strings: ["none", "link", "copy", "execute", "move", "popup"],
  },
  "aria-errormessage": {
    string: true,
  },
  "aria-expanded": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-flowto": {
    string: true,
  },
  "aria-grabbed": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-haspopup": {
    boolean: true,
    strings: ["true", "false", "dialog", "grid", "listbox", "menu", "tree"],
  },
  "aria-hidden": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-invalid": {
    boolean: true,
    strings: ["true", "false", "grammar", "spelling"],
  },
  "aria-keyshortcuts": {
    string: true,
  },
  "aria-label": {
    string: true,
  },
  "aria-labelledby": {
    string: true,
  },
  "aria-level": {
    number: true,
  },
  "aria-live": {
    strings: ["off", "assertive", "polite"],
  },
  "aria-modal": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-multiline": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-multiselectable": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-orientation": {
    strings: ["horizontal", "vertical"],
  },
  "aria-owns": {
    string: true,
  },
  "aria-placeholder": {
    string: true,
  },
  "aria-posinset": {
    number: true,
  },
  "aria-pressed": {
    boolean: true,
    strings: ["true", "false", "mixed"],
  },
  "aria-readonly": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-relevant": {
    strings: [
      "text",
      "additions",
      "additions removals",
      "additions text",
      "all",
      "removals",
      "removals additions",
      "removals text",
      "text additions",
      "text removals",
    ],
  },
  "aria-required": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-roledescription": {
    string: true,
  },
  "aria-rowcount": {
    number: true,
  },
  "aria-rowindex": {
    number: true,
  },
  "aria-rowindextext": {
    string: true,
  },
  "aria-rowspan": {
    number: true,
  },
  "aria-selected": {
    boolean: true,
    strings: ["true", "false"],
  },
  "aria-setsize": {
    number: true,
  },
  "aria-sort": {
    strings: ["none", "ascending", "descending", "other"],
  },
  "aria-valuemax": {
    number: true,
  },
  "aria-valuemin": {
    number: true,
  },
  "aria-valuenow": {
    number: true,
  },
  "aria-valuetext": {
    string: true,
  },
};
