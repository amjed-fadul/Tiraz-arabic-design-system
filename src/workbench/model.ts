import { defaultConfig } from "../system/config";
import type { ButtonState, ButtonVariant, SystemConfig } from "../system";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
import { words } from "./i18n";
import { nativeRules } from "./native-attributes";
export type NativeValue = string | number | boolean | string[];
export type NativeAttributes = Record<string, NativeValue>;
export type DemoIcon = "none" | "plus" | "download" | "settings";
interface NativeModel {
  id: string;
  className: string;
  attributes: NativeAttributes;
  stylePreset: "none" | "wide";
}
interface Stateful {
  mode: "controlled" | "uncontrolled";
}
export interface ButtonModel extends NativeModel {
  children: string;
  variant: ButtonVariant;
  size: "sm" | "md";
  state: ButtonState;
  disabled: boolean;
  iconOnly: boolean;
  ariaLabel: string;
  icon: DemoIcon;
  type: "button" | "submit" | "reset";
  action: "simulate" | "log";
  outcome: "success" | "error";
}
export interface TabRecord {
  value: string;
  label: string;
  content: string;
  disabled?: boolean;
}
export interface TabsModel extends Stateful {
  label: string;
  value: string;
  items: TabRecord[];
  variant: "underline" | "segment";
  className: string;
}
export interface SwitchModel extends NativeModel, Stateful {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  required: boolean;
  name: string;
  value: string;
  type: "button" | "submit" | "reset";
}
export interface MenuRecord {
  id: string;
  label: string;
  icon?: DemoIcon;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
}
interface TriggerModel {
  triggerLabel: string;
  triggerVariant: ButtonVariant;
  triggerSize: "sm" | "md";
}
export interface MenuModel extends Stateful, TriggerModel {
  items: MenuRecord[];
  align: "start" | "end";
  open: boolean;
}
export interface SheetModel extends Stateful, TriggerModel {
  title: string;
  description: string;
  closeLabel: string;
  children: string;
  footer: boolean;
  footerLabel: string;
  open: boolean;
  side: "auto" | "left" | "right";
}
export interface ToastModel {
  triggerLabel: string;
  title: string;
  description: string;
  tone: "success" | "error" | "info";
  duration: number;
  providerLabel: string;
  closeLabel: string;
}
export interface FieldModel {
  label: string;
  helper: string;
  error: string;
  required: boolean;
}
export interface InputModel extends FieldModel, Stateful {
  value: string;
  placeholder: string;
  size: "sm" | "md";
  type: "text" | "email" | "password" | "search" | "tel" | "url";
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  name: string;
}
export interface SelectModel extends FieldModel, Stateful {
  value: string;
  placeholder: string;
  size: "sm" | "md";
  disabled: boolean;
  invalid: boolean;
  name: string;
  options: { value: string; label: string; disabled?: boolean }[];
}
export interface Playgrounds {
  button: ButtonModel;
  tabs: TabsModel;
  switch: SwitchModel;
  dropdown: MenuModel;
  sheet: SheetModel;
  toast: ToastModel;
  field: FieldModel;
  input: InputModel;
  select: SelectModel;
}
export type PlaygroundModel = Playgrounds[ComponentId];
const native: NativeModel = {
  id: "",
  className: "",
  attributes: {},
  stylePreset: "none",
};
export function defaultPlaygrounds(language: Language): Playgrounds {
  const t = words(language);
  const trigger: TriggerModel = {
    triggerLabel: t("الإجراءات", "Actions"),
    triggerVariant: "secondary",
    triggerSize: "sm",
  };
  return {
    field: {
      label: t("اسم العميل", "Customer name"),
      helper: t("كما يظهر في الفاتورة", "As shown on the invoice"),
      error: "",
      required: true,
    },
    input: {
      label: t("اسم العميل", "Customer name"),
      helper: "",
      error: "",
      required: false,
      value: "",
      placeholder: t("مثل: شركة مدار", "e.g. Madar Technology"),
      mode: "controlled",
      size: "sm",
      type: "text",
      disabled: false,
      readOnly: false,
      invalid: false,
      name: "customerName",
    },
    select: {
      label: t("الحالة", "Status"),
      helper: "",
      error: "",
      required: false,
      value: "",
      placeholder: t("اختر الحالة", "Choose status"),
      mode: "controlled",
      size: "sm",
      disabled: false,
      invalid: false,
      name: "status",
      options: [
        { value: "active", label: t("نشط", "Active") },
        { value: "paused", label: t("متوقف", "Paused") },
        { value: "archived", label: t("مؤرشف", "Archived"), disabled: true },
      ],
    },
    button: {
      ...native,
      children: t("حفظ الفاتورة", "Save invoice"),
      variant: "primary",
      size: "sm",
      state: "idle",
      disabled: false,
      iconOnly: false,
      ariaLabel: "",
      icon: "none",
      type: "button",
      action: "simulate",
      outcome: "success",
    },
    tabs: {
      mode: "controlled",
      label: t("تفاصيل العميل", "Customer details"),
      value: "overview",
      variant: "underline",
      className: "",
      items: [
        {
          value: "overview",
          label: t("نظرة عامة", "Overview"),
          content: t(
            "شركة مدار للتقنية · عميل نشط",
            "Madar Technology · Active customer",
          ),
        },
        {
          value: "invoices",
          label: t("الفواتير", "Invoices"),
          content: t(
            "٣ فواتير · آخر تحديث اليوم",
            "3 invoices · Updated today",
          ),
        },
        {
          value: "activity",
          label: t("سجل النشاط", "Activity"),
          content: t("تم تحديث معلومات العميل", "Customer information updated"),
        },
        {
          value: "archive",
          label: t("الأرشيف", "Archive"),
          content: "",
          disabled: true,
        },
      ],
    },
    switch: {
      ...native,
      mode: "controlled",
      label: t("إشعارات البريد", "Email notifications"),
      description: t(
        "تحديثات الفواتير والمدفوعات",
        "Invoice and payment updates",
      ),
      checked: true,
      disabled: false,
      required: false,
      name: "notifications",
      value: "on",
      type: "button",
    },
    dropdown: {
      ...trigger,
      mode: "controlled",
      open: false,
      align: "start",
      items: [
        {
          id: "edit",
          label: t("تعديل الفاتورة", "Edit invoice"),
          icon: "settings",
          shortcut: "E",
        },
        { id: "copy", label: t("نسخ رقم الفاتورة", "Copy invoice ID") },
        {
          id: "archive",
          label: t("أرشفة الفاتورة", "Archive invoice"),
          disabled: true,
        },
        {
          id: "delete",
          label: t("حذف الفاتورة", "Delete invoice"),
          destructive: true,
          separatorBefore: true,
        },
      ],
    },
    sheet: {
      ...trigger,
      triggerLabel: t("عرض تفاصيل العميل", "View customer details"),
      mode: "controlled",
      open: false,
      title: t("تفاصيل العميل", "Customer details"),
      description: t(
        "معلومات الحساب والتواصل",
        "Account and contact information",
      ),
      closeLabel: t("إغلاق اللوحة", "Close panel"),
      children: t(
        "شركة مدار للتقنية · هذه بيانات تجريبية.",
        "Madar Technology · Example customer data.",
      ),
      footer: true,
      footerLabel: t("إغلاق", "Close"),
      side: "auto",
    },
    toast: {
      triggerLabel: t("عرض التنبيه", "Show toast"),
      title: t("تم حفظ الفاتورة", "Invoice saved"),
      description: t(
        "الفاتورة جاهزة للمشاركة مع العميل.",
        "The invoice is ready to share with your customer.",
      ),
      tone: "success",
      duration: 5000,
      providerLabel: t("التنبيهات", "Notifications"),
      closeLabel: t("إغلاق التنبيه", "Dismiss notification"),
    },
  };
}
export function previewConfig(
  config: SystemConfig,
  _props: PlaygroundModel,
): SystemConfig {
  return config;
}
export function translateDefaults(
  state: Playgrounds,
  from: Language,
  to: Language,
): Playgrounds {
  const before = defaultPlaygrounds(from),
    after = defaultPlaygrounds(to);
  const next = structuredClone(state);
  for (const key of Object.keys(next) as ComponentId[]) {
    const source = before[key] as unknown as Record<string, unknown>,
      target = after[key] as unknown as Record<string, unknown>,
      record = next[key] as unknown as Record<string, unknown>;
    for (const field of Object.keys(record))
      if (JSON.stringify(record[field]) === JSON.stringify(source[field]))
        record[field] = target[field];
  }
  return next;
}
export function nativeAttributes(
  value: unknown,
  component?: ComponentId,
): NativeAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([key, item]) => {
      if (
        component === "switch" &&
        ["name", "value", "defaultChecked"].includes(key)
      )
        return false;
      if (/^data-[a-z][\w-]*$/.test(key))
        return (
          typeof item === "string" ||
          typeof item === "boolean" ||
          (typeof item === "number" && Number.isFinite(item))
        );
      const rule = nativeRules[key];
      if (!rule) return false;
      if (typeof item === "string")
        return rule.string === true || rule.strings?.includes(item) === true;
      if (typeof item === "number")
        return rule.number === true && Number.isFinite(item);
      if (typeof item === "boolean") return rule.boolean === true;
      return (
        rule.stringArray === true &&
        Array.isArray(item) &&
        item.every((entry) => typeof entry === "string")
      );
    }),
  );
}
export function validateCollection(
  component: "tabs" | "dropdown" | "select",
  value: unknown,
): boolean {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12)
    return false;
  const identifiers = new Set<string>();
  const valid = value.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const allowed =
      component === "select"
        ? ["value", "label", "disabled"]
        : component === "tabs"
          ? ["value", "label", "content", "disabled"]
          : [
              "id",
              "label",
              "icon",
              "shortcut",
              "disabled",
              "destructive",
              "separatorBefore",
            ];
    if (Object.keys(item).some((key) => !allowed.includes(key))) return false;
    const id = component === "dropdown" ? item.id : item.value;
    if (
      typeof id !== "string" ||
      !id.trim() ||
      identifiers.has(id) ||
      typeof item.label !== "string" ||
      !item.label.trim()
    )
      return false;
    identifiers.add(id);
    if (item.disabled !== undefined && typeof item.disabled !== "boolean")
      return false;
    if (component === "select") return true;
    if (component === "tabs") return typeof item.content === "string";
    return (
      (item.icon === undefined ||
        ["none", "plus", "download", "settings"].includes(item.icon)) &&
      (item.shortcut === undefined || typeof item.shortcut === "string") &&
      ["destructive", "separatorBefore"].every(
        (key) => item[key] === undefined || typeof item[key] === "boolean",
      )
    );
  });
  return (
    valid && (component === "dropdown" || value.some((item) => !item.disabled))
  );
}
export function normalizePlaygrounds(
  value: unknown,
  language: Language,
): Playgrounds {
  const result = defaultPlaygrounds(language);
  if (!value || typeof value !== "object" || Array.isArray(value))
    return result;
  for (const component of Object.keys(result) as ComponentId[]) {
    const saved = (value as Record<string, unknown>)[component];
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) continue;
    const defaults = result[component] as unknown as Record<string, unknown>;
    for (const [key, item] of Object.entries(saved)) {
      if (!(key in defaults)) continue;
      if (key === "items" || key === "options") {
        if (
          validateCollection(
            component === "select"
              ? "select"
              : component === "tabs"
                ? "tabs"
                : "dropdown",
            item,
          )
        )
          defaults[key] = item;
        continue;
      }
      if (key === "attributes") {
        defaults[key] = nativeAttributes(item, component);
        continue;
      }
      if (
        typeof item === typeof defaults[key] &&
        ["string", "boolean", "number"].includes(typeof item)
      )
        defaults[key] = item;
    }
    const r = defaults;
    const enums: Record<string, string[]> = {
      mode: ["controlled", "uncontrolled"],
      variant:
        component === "tabs"
          ? ["underline", "segment"]
          : ["primary", "secondary", "ghost", "destructive"],
      size: ["sm", "md"],
      state: ["idle", "loading", "success", "error"],
      icon: ["none", "plus", "download", "settings"],
      type:
        component === "input"
          ? ["text", "email", "password", "search", "tel", "url"]
          : ["button", "submit", "reset"],
      action: ["simulate", "log"],
      outcome: ["success", "error"],
      stylePreset: ["none", "wide"],
      triggerVariant: ["primary", "secondary", "ghost", "destructive"],
      triggerSize: ["sm", "md"],
      align: ["start", "end"],
      side: ["auto", "left", "right"],
      tone: ["success", "error", "info"],
    };
    const original = defaultPlaygrounds(language)[
      component
    ] as unknown as Record<string, unknown>;
    for (const [key, allowed] of Object.entries(enums))
      if (key in r && !allowed.includes(r[key] as string))
        r[key] = original[key];
    if (
      component === "toast" &&
      (!Number.isFinite(r.duration) ||
        Number(r.duration) < 1000 ||
        Number(r.duration) > 60000)
    )
      r.duration = 5000;
    if (
      component === "select" &&
      r.value !== "" &&
      !(r.options as SelectModel["options"]).some(
        (option) => option.value === r.value && !option.disabled,
      )
    )
      r.value = "";
    if (component === "tabs") {
      const items = r.items as TabRecord[];
      if (!items.some((item) => item.value === r.value && !item.disabled))
        r.value = items.find((item) => !item.disabled)!.value;
    }
  }
  return result;
}
export const compactDefaults = {
  ...defaultConfig,
  density: "compact" as const,
};
