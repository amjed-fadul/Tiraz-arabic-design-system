import type { ComponentId } from "./catalog";

export const guidance: Record<
  ComponentId,
  {
    exportName: string;
    props: string[];
    useFor: string;
    avoidFor: string;
    rules: string[];
    parts: Record<string, string>;
    relatedTypes: string[];
  }
> = {
  button: {
    exportName: "Button",
    props: [
      "variant",
      "state",
      "size",
      "iconOnly",
      "aria-label",
      "disabled",
      "type",
      "children",
      "onClick",
      "className",
    ],
    useFor: "Trigger an action in the current workflow.",
    avoidFor: "Navigation requiring an anchor or router link.",
    rules: [
      "iconOnly=true requires a meaningful aria-label.",
      "Loading disables repeated clicks and exposes aria-busy. The application owns async work and state transitions.",
      "Use type=submit for form submission; the default is button.",
      "Native button attributes are supported; no asChild prop is exposed.",
    ],
    parts: {
      root: "button; className and native attributes target this element",
      label: "internal span; state icons are managed by the component",
    },
    relatedTypes: ["ButtonProps", "ButtonState", "ButtonVariant"],
  },
  tabs: {
    exportName: "Tabs",
    props: [
      "items",
      "label",
      "value",
      "defaultValue",
      "onValueChange",
      "variant",
      "className",
    ],
    useFor: "Switch between related panels within one context.",
    avoidFor: "Site navigation or unrelated routed pages.",
    rules: [
      "Provide a descriptive label for the tab list and unique item values.",
      "Controlled value requires onValueChange to update application state; otherwise use defaultValue.",
      "Item label and content accept ReactNode. The workbench's string editor and collection limit are not runtime API restrictions.",
      "Direction comes from SystemProvider; preserve keyboard navigation.",
    ],
    parts: {
      root: "className targets Tabs root",
      list: "managed tablist and active indicator",
      panel: "content supplied through items",
    },
    relatedTypes: ["TabsProps", "TabItem"],
  },
  switch: {
    exportName: "Switch",
    props: [
      "label",
      "description",
      "checked",
      "defaultChecked",
      "onCheckedChange",
      "disabled",
      "required",
      "name",
      "value",
      "id",
      "className",
      "style",
      "ref",
    ],
    useFor: "A labeled on/off preference.",
    avoidFor: "Choosing among multiple mutually exclusive options.",
    rules: [
      "label is required and linked to the control. description is combined with caller aria-describedby.",
      "Choose controlled checked/onCheckedChange or uncontrolled defaultChecked.",
      "Native Radix Switch.Root props are inherited except children and asChild; the wrapper owns Thumb markup.",
      "className targets the label wrapper; style, ref and native attributes target the control.",
    ],
    parts: {
      wrapper: "label and control layout; className target",
      control: "Radix root; style/ref/native attributes target",
      thumb: "managed internally",
    },
    relatedTypes: ["SwitchProps"],
  },
  dropdown: {
    exportName: "DropdownMenu",
    props: ["trigger", "items", "align", "open", "onOpenChange"],
    useFor: "Contextual actions for a record or page.",
    avoidFor: "Form value selection; use a suitable select control instead.",
    rules: [
      "trigger is one ReactElement capable of receiving Radix trigger props; use Tiraz Button.",
      "Items have unique IDs, string labels and application onSelect callbacks. Disabled actions cannot run.",
      "Controlled open requires onOpenChange. Uncontrolled opening is managed internally.",
      "No children, className, side or ref prop is exposed. align uses logical start/end.",
      "Reuse the provider portal context, including menus nested in Sheet.",
    ],
    parts: {
      trigger: "caller element",
      menu: "managed non-modal portal",
      item: "configured through MenuItem",
    },
    relatedTypes: ["DropdownMenuProps", "MenuItem"],
  },
  sheet: {
    exportName: "Sheet",
    props: [
      "trigger",
      "title",
      "description",
      "closeLabel",
      "children",
      "footer",
      "open",
      "onOpenChange",
      "side",
    ],
    useFor: "Details or editing without leaving the current page.",
    avoidFor: "A small contextual action menu or a navigation destination.",
    rules: [
      "title, description and closeLabel are required accessible copy.",
      "side accepts physical left/right; omitted means right in RTL and left in LTR.",
      "trigger is one ReactElement; use Tiraz Button. Content and footer accept ReactNode.",
      "For asynchronous forms, close only after successful save and retain input on failure.",
      "Escape/backdrop/close restore focus. Nested overlays inherit the Sheet container.",
      "SheetClose is the public dismissal helper for footer buttons.",
    ],
    parts: {
      trigger: "caller element",
      overlay: "managed backdrop",
      content: "modal dialog with nested portal context",
      footer: "caller ReactNode",
    },
    relatedTypes: ["SheetProps"],
  },
  toast: {
    exportName: "ToastProvider",
    props: ["children", "label", "closeLabel"],
    useFor: "Brief success, error or information feedback after an action.",
    avoidFor:
      "The only presentation of a persistent form error or information requiring a decision.",
    rules: [
      "Wrap callers in ToastProvider inside SystemProvider; invoke useToast within that provider.",
      "Supply translated provider label and closeLabel; toast() accepts ToastMessage.",
      "At most three active entries are retained. Default duration is 5000 ms; hover/focus pauses expiry.",
      "Events and business state belong to the application. No string-evaluated callbacks.",
    ],
    parts: {
      provider: "notification lifecycle",
      viewport: "scoped notification region",
      message: "title, optional description, tone and duration",
    },
    relatedTypes: ["ToastMessage"],
  },
};
