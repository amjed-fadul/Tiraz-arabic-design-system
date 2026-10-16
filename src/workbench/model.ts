import type { TaskRowsExampleProps } from "../system/ai/examples/TaskRowsExamples";
import type { NotificationListExampleProps } from "../system/ai/examples/NotificationListExamples";
import type { SliderExampleProps } from "../system/ai/examples/SliderExamples";
import type { OTPInputExampleProps } from "../system/ai/examples/OTPInputExamples";
import type { DatePickerExampleProps } from "../system/ai/examples/DatePickerExamples";
import { defaultConfig } from "../system/config";
import type { ButtonState, ButtonVariant, SystemConfig } from "../system";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
import { words } from "./i18n";
import { nativeRules } from "./native-attributes";
export interface FileDropzoneModel {
  label: string;
  helper: string;
  error: string;
  multiple: boolean;
  accept: string;
  maxFileSize: number;
  maxFiles: number;
  disabled: boolean;
  mode: "controlled" | "uncontrolled";
}
export interface ColorPickerModel {
  label: string;
  helper: string;
  error: string;
  disabled: boolean;
  showSwatches: boolean;
  mode: "controlled" | "uncontrolled";
}
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
export interface TableModel {
  caption: string;
  preset: "populated" | "empty";
}
export interface DataTableModel {
  caption: string;
  preset: "populated" | "loading" | "empty" | "no-results" | "error";
}
export interface BadgeModel {
  children: string;
  tone: "neutral" | "success" | "error" | "info";
}
export interface CheckboxModel extends FieldModel, Stateful {
  checked: boolean;
  disabled: boolean;
  name: string;
  value: string;
}
export interface RadioGroupModel extends FieldModel, Stateful {
  value: string;
  disabled: boolean;
  name: string;
  options: { value: string; label: string; disabled?: boolean }[];
}
export interface TextareaModel extends FieldModel, Stateful {
  value: string;
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  name: string;
  rows: number;
}
export interface AvatarModel {
  appearance: "initials" | "photo";
  src: string;
  name: string;
  fallback: string;
  size: "sm" | "md";
}
export interface AvatarGroupModel {
  appearance: "initials" | "mixed";
  maxVisible: number;
  size: "sm" | "md";
}
export interface TooltipModel {
  content: string;
}
export interface ModalModel {
  title: string;
  description: string;
  footer: boolean;
  mode: "controlled" | "uncontrolled";
}
export interface EmptyStateModel {
  title: string;
  description: string;
  illustration: "no-records" | "no-results" | "getting-started" | "none";
}
export interface AlertModel {
  title: string;
  description: string;
  tone: "neutral" | "success" | "error" | "info";
}
export interface SkeletonModel {
  shape: "text" | "rectangle" | "circle";
}
export interface ProgressModel {
  label: string;
  value: number;
  indeterminate: boolean;
  showValue: boolean;
}
export interface SpinnerModel {
  label: string;
  size: "sm" | "md";
  decorative: boolean;
}
export interface CardModel {
  title: string;
  description: string;
  actions: boolean;
}
export interface AccordionModel {
  mode: "controlled" | "uncontrolled";
  collapsible: boolean;
}
export interface BreadcrumbsModel {
  label: string;
  current: string;
}
export interface PaginationModel {
  page: number;
  totalPages: number;
}
export interface ChartModel {
  sample: "single" | "multi" | "gaps" | "point" | "zero" | "empty" | "long";
  legend: boolean;
  grid: boolean;
}
export interface SidebarModel {
  collapsed: boolean;
  grouped: boolean;
  nested: boolean;
  footer: boolean;
  mode: "controlled" | "uncontrolled";
  longLabels: boolean;
}
export interface TagInputModel {
  label: string;
  helper: string;
  error: string;
  placeholder: string;
  maxTags: number;
  disabled: boolean;
  readOnly: boolean;
  mode: "controlled" | "uncontrolled";
}
export interface InputCopyModel {
  label: string;
  value: string;
  helper: string;
  error: string;
  disabled: boolean;
}
export interface FilterBarModel {
  initialQuery: string;
  initialKind: "all" | "guide" | "note";
  clearAll: boolean;
}
export interface Playgrounds {
  "loading-state": {
    label: string;
    indicator: "spinner" | "skeleton";
    description: boolean;
    variant: "drive" | "dots" | "orbit";
    elapsed: boolean;
  };
  "thinking-indicator": { label: string; words: boolean; textOnly: boolean };
  "thinking-state": { active: boolean; defaultExpanded: boolean };
  "tool-call": { defaultExpanded: boolean; longContent: boolean };
  "tool-chips": { counts: boolean };
  "file-tree": {
    mode: "controlled" | "uncontrolled";
    metadata: boolean;
    empty: boolean;
  };
  "task-rows": Required<Omit<TaskRowsExampleProps, "language">>;
  "notification-list": Required<Omit<NotificationListExampleProps, "language">>;
  steps: {
    orientation: "horizontal" | "vertical";
    currentState: "upcoming" | "current" | "completed" | "error";
  };
  timeline: {
    descriptions: boolean;
    icons: boolean;
    actions: boolean;
    empty: boolean;
    longContent: boolean;
  };
  slider: Required<Omit<SliderExampleProps, "language">>;
  "otp-input": Required<Omit<OTPInputExampleProps, "language">>;
  "date-picker": Required<Omit<DatePickerExampleProps, "language">>;
  "file-dropzone": FileDropzoneModel;
  "color-picker": ColorPickerModel;
  "tag-input": TagInputModel;
  "input-copy": InputCopyModel;
  "filter-bar": FilterBarModel;
  sidebar: SidebarModel;
  "line-chart": ChartModel;
  "area-chart": ChartModel;
  "bar-chart": ChartModel;
  "donut-chart": ChartModel;
  card: CardModel;
  accordion: AccordionModel;
  breadcrumbs: BreadcrumbsModel;
  pagination: PaginationModel;
  alert: AlertModel;
  skeleton: SkeletonModel;
  progress: ProgressModel;
  spinner: SpinnerModel;
  avatar: AvatarModel;
  "avatar-group": AvatarGroupModel;
  tooltip: TooltipModel;
  modal: ModalModel;
  "empty-state": EmptyStateModel;
  badge: BadgeModel;
  checkbox: CheckboxModel;
  "radio-group": RadioGroupModel;
  textarea: TextareaModel;
  "data-table": DataTableModel;
  table: TableModel;
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
    "loading-state": {
      label: t("جارٍ تحميل الملاحظات", "Loading notes"),
      indicator: "spinner",
      variant: "drive",
      elapsed: true,
      description: false,
    },
    "thinking-indicator": {
      label: t("جارٍ إعداد الرد", "Preparing reply"),
      words: true,
      textOnly: false,
    },
    "thinking-state": { active: true, defaultExpanded: false },
    "tool-call": { defaultExpanded: false, longContent: false },
    "tool-chips": { counts: true },
    "file-tree": { mode: "uncontrolled", metadata: true, empty: false },
    "task-rows": {
      appearance: "capsules",
      mode: "uncontrolled",
      empty: false,
      longContent: false,
    },
    "notification-list": {
      empty: false,
      longContent: false,
      avatars: true,
      readControls: true,
    },
    steps: { orientation: "horizontal", currentState: "current" },
    timeline: {
      descriptions: true,
      icons: true,
      actions: true,
      empty: false,
      longContent: false,
    },
    slider: {
      label: t("قيمة محلية", "Local amount"),
      helper: t(
        "اسحب أو استخدم الأسهم وHome وEnd.",
        "Drag or use arrows, Home and End.",
      ),
      error: "",
      min: 0,
      max: 100,
      step: 1,
      disabled: false,
      showValue: true,
      mode: "controlled",
    },
    "otp-input": {
      label: t("رمز تجريبي", "Sample code"),
      helper: t(
        "أرقام عربية أو إنجليزية؛ دون تحقق.",
        "Arabic or ASCII digits; no verification.",
      ),
      error: "",
      length: 6,
      disabled: false,
      readOnly: false,
      mode: "controlled",
    },
    "date-picker": {
      label: t("موعد محلي", "Local date"),
      helper: t(
        "تاريخ ميلادي واحد؛ Escape للإغلاق.",
        "One Gregorian date; Escape to close.",
      ),
      error: "",
      min: "",
      max: "",
      disabled: false,
      mode: "controlled",
    },
    "file-dropzone": {
      label: t("ملفات المراجعة", "Review files"),
      helper: t(
        "اختر ملفات ضمن قيود النوع والحجم والعدد المحددة لهذا المثال.",
        "Choose files within this example's configured type, size and count limits.",
      ),
      error: "",
      multiple: true,
      accept: ".pdf,.txt,image/*",
      maxFileSize: 5242880,
      maxFiles: 3,
      disabled: false,
      mode: "controlled",
    },
    "color-picker": {
      label: t("لون العيّنة", "Sample color"),
      helper: t(
        "صيغة #RGB أو #RRGGBB، دون شفافية.",
        "Use #RGB or #RRGGBB, without transparency.",
      ),
      error: "",
      disabled: false,
      showSwatches: true,
      mode: "controlled",
    },
    "tag-input": {
      label: t("وسوم الملاحظات", "Note tags"),
      helper: t(
        "Enter يضيف وسمًا. النص غير المؤكد لا يُرسل.",
        "Enter adds a tag. Uncommitted text is not submitted.",
      ),
      error: "",
      placeholder: t("أضف وسمًا…", "Add a tag…"),
      maxTags: 5,
      disabled: false,
      readOnly: false,
      mode: "controlled",
    },
    "input-copy": {
      label: t("مسار المصدر", "Source path"),
      value: "src/system/TagInput.tsx",
      helper: t(
        "حدّد النص أو انسخ القيمة كاملة.",
        "Select the text or copy the full value.",
      ),
      error: "",
      disabled: false,
    },
    "filter-bar": { initialQuery: "", initialKind: "all", clearAll: true },
    sidebar: {
      collapsed: false,
      grouped: true,
      nested: true,
      footer: true,
      mode: "controlled",
      longLabels: false,
    },
    "line-chart": { sample: "multi", legend: true, grid: true },
    "area-chart": { sample: "multi", legend: true, grid: true },
    "bar-chart": { sample: "multi", legend: true, grid: true },
    "donut-chart": { sample: "multi", legend: true, grid: false },
    card: {
      title: t("دليل القراءة", "Reading guide"),
      description: t(
        "ملاحظات قصيرة لتنسيق المحتوى.",
        "Short notes for arranging content.",
      ),
      actions: true,
    },
    accordion: { mode: "controlled", collapsible: true },
    breadcrumbs: {
      label: t("مسار الصفحة", "Page path"),
      current: t("القراءة", "Reading"),
    },
    pagination: { page: 1, totalPages: 12 },
    alert: {
      title: t("المعاينة جاهزة", "Preview ready"),
      description: t(
        "هذه رسالة ثابتة داخل الصفحة.",
        "This is persistent feedback within the page.",
      ),
      tone: "info",
    },
    skeleton: { shape: "text" },
    progress: {
      label: t("تجهيز التقرير", "Preparing report"),
      value: 64,
      indeterminate: false,
      showValue: true,
    },
    spinner: {
      label: t("جارٍ التحميل", "Loading"),
      size: "sm",
      decorative: false,
    },
    avatar: {
      appearance: "initials",
      src: "",
      name: t("سارة علي", "Sara Ali"),
      fallback: t("س ع", "SA"),
      size: "sm",
    },
    "avatar-group": { maxVisible: 3, size: "sm", appearance: "mixed" },
    tooltip: {
      content: t(
        "عرض معلومات إضافية في هذه المعاينة.",
        "Show extra information in this preview.",
      ),
    },
    modal: {
      title: t("خيارات العرض", "Display options"),
      description: t(
        "اختر تخطيطًا لهذه المعاينة فقط.",
        "Choose a layout for this preview only.",
      ),
      footer: true,
      mode: "controlled",
    },
    "empty-state": {
      title: t("لا توجد سجلات بعد", "No records yet"),
      description: t(
        "ستظهر سجلاتك هنا عند إضافتها.",
        "Your records will appear here when added.",
      ),
      illustration: "no-records",
    },
    badge: { children: t("نشط", "Active"), tone: "neutral" },
    checkbox: {
      label: t("تلقي التحديثات", "Receive updates"),
      helper: t("تحديثات الحساب الاختيارية", "Optional account updates"),
      error: "",
      required: false,
      checked: false,
      disabled: false,
      name: "updates",
      value: "yes",
      mode: "controlled",
    },
    "radio-group": {
      label: t("وتيرة التحديثات", "Update frequency"),
      helper: "",
      error: "",
      required: false,
      disabled: false,
      name: "frequency",
      value: "weekly",
      mode: "controlled",
      options: [
        { value: "weekly", label: t("أسبوعيًا", "Weekly") },
        { value: "monthly", label: t("شهريًا", "Monthly") },
        {
          value: "daily",
          label: t("يوميًا · غير متاح", "Daily · unavailable"),
          disabled: true,
        },
      ],
    },
    textarea: {
      label: t("ملاحظات", "Notes"),
      helper: "",
      error: "",
      required: false,
      value: "",
      placeholder: t("أضف تفاصيل مفيدة", "Add useful details"),
      disabled: false,
      readOnly: false,
      name: "notes",
      rows: 3,
      mode: "controlled",
    },
    "data-table": { caption: t("العملاء", "Customers"), preset: "populated" },
    table: { caption: t("العملاء", "Customers"), preset: "populated" },
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
            component === "select" || component === "radio-group"
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
    if (component === "file-dropzone") {
      const p = result[component];
      // Old default copy promised fixed constraints even after settings changed.
      if (
        [
          "PDF أو نص أو صور · حتى ٥ ميغابايت لكل ملف · ٣ ملفات كحد أقصى.",
          "PDF, text or images · up to 5 MB each · maximum 3 files.",
        ].includes(p.helper)
      )
        p.helper = defaultPlaygrounds(language)[component].helper;
      p.maxFiles = Number.isFinite(p.maxFiles)
        ? Math.max(0, Math.min(20, Math.floor(p.maxFiles)))
        : 3;
      p.maxFileSize = Number.isFinite(p.maxFileSize)
        ? Math.max(0, p.maxFileSize)
        : 5242880;
    }
    if (component === "tag-input") {
      const p = result[component];
      p.maxTags = Number.isFinite(p.maxTags)
        ? Math.max(0, Math.min(20, Math.floor(p.maxTags)))
        : 5;
    }
    if (
      component === "filter-bar" &&
      !["all", "guide", "note"].includes(result[component].initialKind)
    )
      result[component].initialKind = "all";
    // Carry the old invalid preset into the single error control.
    if (
      component === "input" &&
      (saved as Record<string, unknown>).invalid === true &&
      !defaults.error
    )
      defaults.error = words(language)(
        "راجع القيمة المدخلة.",
        "Check the entered value.",
      );
    const r = defaults;
    const enums: Record<string, string[]> = {
      orientation: ["horizontal", "vertical"],
      currentState: ["upcoming", "current", "completed", "error"],
      sample: ["single", "multi", "gaps", "point", "zero", "empty", "long"],
      preset:
        component === "data-table"
          ? ["populated", "loading", "empty", "no-results", "error"]
          : ["populated", "empty"],
      appearance:
        component === "task-rows"
          ? ["capsules", "list"]
          : component === "avatar"
            ? ["initials", "photo"]
            : ["initials", "mixed"],
      shape: ["text", "rectangle", "circle"],
      illustration: ["no-records", "no-results", "getting-started", "none"],
      mode: ["controlled", "uncontrolled"],
      variant:
        component === "loading-state"
          ? ["drive", "dots", "orbit"]
          : component === "tabs"
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
      tone: ["badge", "alert"].includes(component)
        ? ["neutral", "success", "error", "info"]
        : ["success", "error", "info"],
    };
    const original = defaultPlaygrounds(language)[
      component
    ] as unknown as Record<string, unknown>;
    for (const [key, allowed] of Object.entries(enums))
      if (key in r && !allowed.includes(r[key] as string))
        r[key] = original[key];
    if (component === "pagination") {
      r.totalPages = Number.isFinite(r.totalPages)
        ? Math.min(20, Math.max(1, Math.floor(Number(r.totalPages))))
        : 12;
      r.page = Number.isFinite(r.page)
        ? Math.max(
            1,
            Math.min(Number(r.totalPages), Math.floor(Number(r.page))),
          )
        : 1;
    }
    if (component === "progress")
      r.value = Number.isFinite(r.value)
        ? Math.max(0, Math.min(100, Number(r.value)))
        : 64;
    if (component === "avatar-group")
      r.maxVisible = Number.isFinite(r.maxVisible)
        ? Math.max(1, Math.min(5, Math.floor(Number(r.maxVisible))))
        : 3;
    if (
      component === "textarea" &&
      (!Number.isInteger(r.rows) || Number(r.rows) < 1 || Number(r.rows) > 12)
    )
      r.rows = 3;
    if (
      component === "toast" &&
      (!Number.isFinite(r.duration) ||
        Number(r.duration) < 1000 ||
        Number(r.duration) > 60000)
    )
      r.duration = 5000;
    if (
      (component === "select" || component === "radio-group") &&
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
