import {
  ToolCallExample,
  ToolChipsExample,
} from "../system/ai/examples/ToolActivityExamples";
import {
  LoadingStateExample,
  ThinkingIndicatorExample,
  ThinkingStateExample,
} from "../system/ai/examples/AIFeedbackExamples";
import { FileTreeExample } from "../system/ai/examples/FileTreeExamples";
import { TaskRowsExample } from "../system/ai/examples/TaskRowsExamples";
import { NotificationListExample } from "../system/ai/examples/NotificationListExamples";
import { StepsExample } from "../system/ai/examples/StepsExamples";
import { TimelineExample } from "../system/ai/examples/TimelineExamples";
import type { Playgrounds } from "./model";
import { SliderExample } from "../system/ai/examples/SliderExamples";
import { OTPInputExample } from "../system/ai/examples/OTPInputExamples";
import { DatePickerExample } from "../system/ai/examples/DatePickerExamples";
import { FileDropzoneExample } from "../system/ai/examples/FileDropzoneExamples";
import { ColorPickerExample } from "../system/ai/examples/ColorPickerExamples";
import type { FileDropzoneModel, ColorPickerModel } from "./model";
import { TagInputExample } from "../system/ai/examples/TagInputExamples";
import { FilterBarExample } from "../system/ai/examples/FilterBarExamples";
import { InputCopyExample } from "../system/ai/examples/InputCopyExamples";
import type { TagInputModel, FilterBarModel, InputCopyModel } from "./model";
import { SidebarExample } from "../system/ai/examples/SidebarExamples";
import type { SidebarModel } from "./model";
import { lazy, Suspense } from "react";
import type { ChartKind } from "../system/ai/examples/ChartExamples";
import type { ChartModel } from "./model";
import {
  CardExample,
  AccordionExample,
  BreadcrumbsExample,
  PaginationExample,
} from "../system/ai/examples/StructureExamples";
import type {
  CardModel,
  AccordionModel,
  BreadcrumbsModel,
  PaginationModel,
} from "./model";
import { saraPortrait } from "../system/ai/examples/portraits";
import {
  Alert,
  Skeleton,
  Progress,
  Spinner,
  Avatar,
  EmptyState,
  GettingStartedIllustration,
  NoRecordsIllustration,
  NoSearchResultsIllustration,
} from "../system";
import {
  TeamExample,
  TooltipExample,
  ModalExample,
} from "../system/ai/examples/OverlayExamples";
import type {
  AlertModel,
  SkeletonModel,
  ProgressModel,
  SpinnerModel,
  AvatarModel,
  AvatarGroupModel,
  TooltipModel,
  ModalModel,
  EmptyStateModel,
} from "./model";
import { CustomerDataTable } from "../system/ai/examples/CustomerDataTable";
import type { DataTableModel } from "./model";
import { TableExample } from "../system/ai/examples/TableExample";
import { Plus, Download, Settings2 } from "lucide-react";
import { Close as SheetClose } from "@radix-ui/react-dialog";
import {
  Badge,
  Checkbox,
  RadioGroup,
  Textarea,
  Field,
  Input,
  Select,
  Button,
  Tabs,
  Switch,
  DropdownMenu,
  Sheet,
  ToastProvider,
  useToast,
} from "../system";
import type {
  BadgeModel,
  CheckboxModel,
  RadioGroupModel,
  TextareaModel,
  FieldModel,
  InputModel,
  SelectModel,
  ButtonModel,
  MenuModel,
  PlaygroundModel,
  SheetModel,
  SwitchModel,
  TabsModel,
  ToastModel,
  TableModel,
} from "./model";
import { nativeAttributes } from "./model";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
import { words } from "./i18n";
import type { ButtonProps, ButtonState } from "../system";
const ChartExample = lazy(() =>
  import("../system/ai/examples/ChartExamples").then((module) => ({
    default: module.ChartExample,
  })),
);
interface Props {
  component: ComponentId;
  model: PlaygroundModel;
  language: Language;
  onPatch: (patch: Record<string, unknown>) => void;
  onEvent: (name: string, value?: unknown) => void;
  onButtonAction: () => void;
  buttonState?: ButtonState;
}
export function ContentIcon({ icon }: { icon: string }) {
  const Icon =
    icon === "plus"
      ? Plus
      : icon === "download"
        ? Download
        : icon === "settings"
          ? Settings2
          : null;
  return Icon ? <Icon size={16} aria-hidden="true" /> : null;
}
function ToastPlayground({
  model,
  onEvent,
}: {
  model: ToastModel;
  onEvent: Props["onEvent"];
}) {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        toast({
          title: model.title,
          description: model.description,
          tone: model.tone,
          duration: model.duration,
        });
        onEvent("toast", { tone: model.tone, duration: model.duration });
      }}
    >
      {model.triggerLabel}
    </Button>
  );
}
export function Playground({
  component,
  model,
  language,
  onPatch,
  onEvent,
  onButtonAction,
  buttonState,
}: Props) {
  const t = words(language);
  if (component === "loading-state")
    return (
      <LoadingStateExample
        language={language}
        {...(model as Playgrounds["loading-state"])}
      />
    );
  if (component === "thinking-indicator")
    return (
      <ThinkingIndicatorExample
        language={language}
        {...(model as Playgrounds["thinking-indicator"])}
      />
    );
  if (component === "tool-call")
    return (
      <ToolCallExample
        key={JSON.stringify(model)}
        language={language}
        {...(model as Playgrounds["tool-call"])}
      />
    );
  if (component === "tool-chips")
    return (
      <ToolChipsExample
        language={language}
        {...(model as Playgrounds["tool-chips"])}
      />
    );
  if (component === "thinking-state")
    return (
      <ThinkingStateExample
        language={language}
        {...(model as Playgrounds["thinking-state"])}
      />
    );
  if (component === "file-tree")
    return (
      <FileTreeExample
        key={(model as Playgrounds["file-tree"]).mode}
        language={language}
        {...(model as Playgrounds["file-tree"])}
      />
    );
  if (component === "task-rows")
    return (
      <TaskRowsExample
        language={language}
        {...(model as Playgrounds["task-rows"])}
      />
    );
  if (component === "notification-list")
    return (
      <NotificationListExample
        language={language}
        {...(model as Playgrounds["notification-list"])}
      />
    );
  if (component === "steps")
    return (
      <StepsExample language={language} {...(model as Playgrounds["steps"])} />
    );
  if (component === "timeline")
    return (
      <TimelineExample
        language={language}
        {...(model as Playgrounds["timeline"])}
      />
    );
  if (component === "slider")
    return (
      <SliderExample
        language={language}
        {...(model as Playgrounds["slider"])}
      />
    );
  if (component === "otp-input")
    return (
      <OTPInputExample
        language={language}
        {...(model as Playgrounds["otp-input"])}
      />
    );
  if (component === "date-picker")
    return (
      <DatePickerExample
        language={language}
        {...(model as Playgrounds["date-picker"])}
      />
    );
  if (component === "file-dropzone")
    return (
      <FileDropzoneExample
        language={language}
        {...(model as FileDropzoneModel)}
      />
    );
  if (component === "color-picker")
    return (
      <ColorPickerExample
        language={language}
        {...(model as ColorPickerModel)}
      />
    );
  if (component === "tag-input")
    return (
      <TagInputExample language={language} {...(model as TagInputModel)} />
    );
  if (component === "filter-bar")
    return (
      <FilterBarExample language={language} {...(model as FilterBarModel)} />
    );
  if (component === "input-copy")
    return (
      <InputCopyExample language={language} {...(model as InputCopyModel)} />
    );
  if (component === "sidebar") {
    const p = model as SidebarModel;
    return (
      <SidebarExample
        key={`${p.mode}-${p.grouped}-${p.nested}-${p.footer}-${p.longLabels}`}
        language={language}
        idPrefix="sidebar-preview"
        {...p}
        collapsed={p.mode === "controlled" ? p.collapsed : undefined}
        defaultCollapsed={p.collapsed}
        onCollapsedChange={(value) => {
          if (p.mode === "controlled") onPatch({ collapsed: value });
          onEvent("collapse", value);
        }}
      />
    );
  }
  if (component.endsWith("-chart"))
    return (
      <Suspense
        fallback={<p role="status">{t("جارٍ عرض الرسم…", "Loading chart…")}</p>}
      >
        <ChartExample
          language={language}
          kind={component.replace("-chart", "") as ChartKind}
          {...(model as ChartModel)}
        />
      </Suspense>
    );
  if (component === "card")
    return <CardExample language={language} {...(model as CardModel)} />;
  if (component === "accordion") {
    const p = model as AccordionModel;
    return (
      <AccordionExample
        key={p.mode}
        language={language}
        controlled={p.mode === "controlled"}
        collapsible={p.collapsible}
      />
    );
  }
  if (component === "breadcrumbs")
    return (
      <BreadcrumbsExample
        language={language}
        {...(model as BreadcrumbsModel)}
      />
    );
  if (component === "pagination") {
    const p = model as PaginationModel;
    return (
      <PaginationExample
        language={language}
        {...p}
        onPageChange={(page) => {
          onPatch({ page });
          onEvent("onPageChange", page);
        }}
      />
    );
  }
  if (component === "alert") return <Alert {...(model as AlertModel)} />;
  if (component === "skeleton")
    return <Skeleton {...(model as SkeletonModel)} />;
  if (component === "progress") {
    const { indeterminate, ...p } = model as ProgressModel;
    return (
      <Progress
        {...p}
        value={indeterminate ? null : p.value}
        locale={language}
      />
    );
  }
  if (component === "spinner") {
    const p = model as SpinnerModel;
    return p.decorative ? (
      <div role="status" className="tz-preferences-actions">
        <Spinner decorative size={p.size} />
        <span>{p.label}</span>
      </div>
    ) : (
      <Spinner label={p.label} size={p.size} />
    );
  }
  if (component === "avatar") {
    const { appearance, src, ...p } = model as AvatarModel;
    return (
      <Avatar
        {...p}
        src={appearance === "photo" ? src.trim() || saraPortrait : undefined}
      />
    );
  }
  if (component === "avatar-group")
    return (
      <TeamExample
        language={language}
        {...(model as AvatarGroupModel)}
        photos={(model as AvatarGroupModel).appearance === "mixed"}
      />
    );
  if (component === "tooltip")
    return (
      <TooltipExample
        language={language}
        content={(model as TooltipModel).content}
      />
    );
  if (component === "modal") {
    const p = model as ModalModel;
    return (
      <ModalExample
        language={language}
        title={p.title}
        description={p.description}
        footer={p.footer}
        controlled={p.mode === "controlled"}
      />
    );
  }
  if (component === "empty-state") {
    const p = model as EmptyStateModel;
    return (
      <EmptyState
        title={p.title}
        description={p.description}
        illustration={
          p.illustration === "none" ? undefined : p.illustration ===
            "no-results" ? (
            <NoSearchResultsIllustration />
          ) : p.illustration === "getting-started" ? (
            <GettingStartedIllustration />
          ) : (
            <NoRecordsIllustration />
          )
        }
      />
    );
  }
  if (component === "badge") {
    const p = model as BadgeModel;
    return <Badge tone={p.tone}>{p.children}</Badge>;
  }
  if (component === "checkbox") {
    const p = model as CheckboxModel;
    return (
      <div className="playground-form">
        <Checkbox
          label={p.label}
          helper={p.helper}
          error={p.error}
          required={p.required}
          disabled={p.disabled}
          name={p.name}
          value={p.value}
          checked={p.mode === "controlled" ? p.checked : undefined}
          defaultChecked={p.mode === "uncontrolled" ? p.checked : undefined}
          onChange={(e) => {
            onPatch({ checked: e.currentTarget.checked });
            onEvent("onChange", e.currentTarget.checked);
          }}
        />
      </div>
    );
  }
  if (component === "radio-group") {
    const p = model as RadioGroupModel;
    return (
      <div className="playground-form">
        <RadioGroup
          label={p.label}
          helper={p.helper}
          error={p.error}
          required={p.required}
          disabled={p.disabled}
          name={p.name}
          options={p.options}
          value={p.mode === "controlled" ? p.value : undefined}
          defaultValue={p.mode === "uncontrolled" ? p.value : undefined}
          onValueChange={(value) => {
            onPatch({ value });
            onEvent("onValueChange", value);
          }}
        />
      </div>
    );
  }
  if (component === "textarea") {
    const p = model as TextareaModel;
    return (
      <div className="playground-form">
        <Textarea
          label={p.label}
          helper={p.helper}
          error={p.error}
          required={p.required}
          disabled={p.disabled}
          readOnly={p.readOnly}
          name={p.name}
          rows={p.rows}
          placeholder={p.placeholder}
          value={p.mode === "controlled" ? p.value : undefined}
          defaultValue={p.mode === "uncontrolled" ? p.value : undefined}
          onChange={(e) => {
            onPatch({ value: e.currentTarget.value });
            onEvent("onChange", e.currentTarget.value);
          }}
        />
      </div>
    );
  }
  if (component === "data-table") {
    const p = model as DataTableModel;
    return (
      <ToastProvider
        label={t("تنبيهات العملاء", "Customer notifications")}
        closeLabel={t("إغلاق التنبيه", "Dismiss notification")}
      >
        <CustomerDataTable
          key={p.preset}
          language={language}
          caption={p.caption}
          preset={p.preset}
        />
      </ToastProvider>
    );
  }
  if (component === "table") {
    const p = model as TableModel;
    return (
      <TableExample
        language={language}
        caption={p.caption}
        empty={p.preset === "empty"}
      />
    );
  }
  if (component === "field") {
    const p = model as FieldModel;
    return (
      <div className="playground-form">
        <Field {...p}>
          {(field) => (
            <Input
              field={field}
              placeholder={t("اسم العميل", "Customer name")}
            />
          )}
        </Field>
      </div>
    );
  }
  if (component === "input") {
    const p = model as InputModel;
    return (
      <div className="playground-form">
        <Input
          label={p.label}
          helper={p.helper}
          error={p.error}
          required={p.required}
          type={p.type}
          readOnly={p.readOnly}
          placeholder={p.placeholder}
          size={p.size}
          disabled={p.disabled}
          name={p.name}
          value={p.mode === "controlled" ? p.value : undefined}
          defaultValue={p.mode === "uncontrolled" ? p.value : undefined}
          onChange={(event) => {
            onPatch({ value: event.currentTarget.value });
            onEvent("onChange", event.currentTarget.value);
          }}
        />
      </div>
    );
  }
  if (component === "select") {
    const p = model as SelectModel;
    return (
      <div className="playground-form">
        <Field
          label={p.label}
          helper={p.helper}
          error={p.error}
          required={p.required}
        >
          {(field) => (
            <Select
              field={field}
              options={p.options}
              placeholder={p.placeholder}
              size={p.size}
              disabled={p.disabled}
              invalid={p.invalid}
              name={p.name}
              value={p.mode === "controlled" ? p.value : undefined}
              defaultValue={p.value}
              onValueChange={(value) => {
                onPatch({ value });
                onEvent("onValueChange", value);
              }}
            />
          )}
        </Field>
      </div>
    );
  }
  if (component === "button") {
    const p = model as ButtonModel;
    const native = nativeAttributes(p.attributes, component);
    const accessibleName =
      p.ariaLabel ||
      (typeof native["aria-label"] === "string" ? native["aria-label"] : "");
    const base: Omit<ButtonProps, "iconOnly" | "aria-label"> = {
      ...nativeAttributes(p.attributes, component),
      id: p.id || undefined,
      className: p.className,
      style: p.stylePreset === "wide" ? { minInlineSize: 180 } : undefined,
      variant: p.variant,
      size: p.size,
      state: buttonState ?? p.state,
      disabled: p.disabled,
      type: p.type,
      onClick: onButtonAction,
    };
    const buttonProps: ButtonProps = {
      ...base,
      ...(p.iconOnly
        ? {
            iconOnly: true as const,
            "aria-label":
              accessibleName || p.children || t("زر الإجراء", "Action button"),
          }
        : {
            iconOnly: false as const,
            "aria-label": accessibleName || undefined,
          }),
    };
    return (
      <Button {...buttonProps}>
        <ContentIcon icon={p.icon} />
        {p.iconOnly ? (
          p.icon === "none" ? (
            <span aria-hidden="true">+</span>
          ) : null
        ) : (
          <bdi dir="auto">{p.children}</bdi>
        )}
      </Button>
    );
  }
  if (component === "tabs") {
    const p = model as TabsModel;
    return (
      <div className="playground-tabs">
        <Tabs
          label={p.label}
          variant={p.variant}
          className={p.className}
          value={p.mode === "controlled" ? p.value : undefined}
          defaultValue={p.value}
          items={p.items.map((item) => ({
            ...item,
            content: (
              <div className="tab-demo-content">
                <p dir="auto">{item.content}</p>
              </div>
            ),
          }))}
          onValueChange={(value) => {
            onPatch({ value });
            onEvent("onValueChange", value);
          }}
        />
      </div>
    );
  }
  if (component === "switch") {
    const p = model as SwitchModel;
    return (
      <div className="playground-switch">
        <Switch
          {...nativeAttributes(p.attributes, component)}
          id={p.id || undefined}
          className={p.className}
          style={p.stylePreset === "wide" ? { minInlineSize: 180 } : undefined}
          label={p.label}
          description={p.description}
          checked={p.mode === "controlled" ? p.checked : undefined}
          defaultChecked={p.checked}
          disabled={p.disabled}
          required={p.required}
          type={p.type}
          name={p.name}
          value={p.value}
          onCheckedChange={(checked) => {
            onPatch({ checked });
            onEvent("onCheckedChange", checked);
          }}
        />
      </div>
    );
  }
  if (component === "dropdown") {
    const p = model as MenuModel;
    return (
      <DropdownMenu
        trigger={
          <Button variant={p.triggerVariant} size={p.triggerSize}>
            {p.triggerLabel}
          </Button>
        }
        align={p.align}
        open={p.mode === "controlled" ? p.open : undefined}
        onOpenChange={(open) => {
          onPatch({ open });
          onEvent("onOpenChange", open);
        }}
        items={p.items.map((item) => ({
          ...item,
          icon: <ContentIcon icon={item.icon ?? "none"} />,
          onSelect: () => onEvent("onSelect", item.id),
        }))}
      />
    );
  }
  if (component === "sheet") {
    const p = model as SheetModel;
    return (
      <Sheet
        trigger={
          <Button variant={p.triggerVariant} size={p.triggerSize}>
            {p.triggerLabel}
          </Button>
        }
        title={p.title}
        description={p.description}
        closeLabel={p.closeLabel}
        open={p.mode === "controlled" ? p.open : undefined}
        onOpenChange={(open) => {
          onPatch({ open });
          onEvent("onOpenChange", open);
        }}
        side={p.side === "auto" ? undefined : p.side}
        footer={
          p.footer ? (
            <SheetClose asChild>
              <Button>{p.footerLabel}</Button>
            </SheetClose>
          ) : undefined
        }
      >
        <p dir="auto">{p.children}</p>
        <dl className="example-details">
          <div>
            <dt>{t("البريد الإلكتروني", "Email")}</dt>
            <dd>
              <bdi dir="ltr">hello@madar.example</bdi>
            </dd>
          </div>
          <div>
            <dt>{t("الموقع الإلكتروني", "Website")}</dt>
            <dd>
              <bdi dir="ltr">https://madar.example</bdi>
            </dd>
          </div>
        </dl>
      </Sheet>
    );
  }
  const p = model as ToastModel;
  return (
    <ToastProvider label={p.providerLabel} closeLabel={p.closeLabel}>
      <ToastPlayground model={p} onEvent={onEvent} />
    </ToastProvider>
  );
}
