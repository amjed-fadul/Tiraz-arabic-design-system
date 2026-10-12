import { Plus, Download, Settings2 } from "lucide-react";
import { Close as SheetClose } from "@radix-ui/react-dialog";
import {
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
} from "./model";
import { nativeAttributes } from "./model";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
import { words } from "./i18n";
import type { ButtonProps, ButtonState } from "../system";
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
  if (component === "input" || component === "select") {
    const p = model as InputModel | SelectModel;
    const control = (field: import("../system").FieldControlProps) =>
      component === "input" ? (
        <Input
          field={field}
          type={(p as InputModel).type}
          readOnly={(p as InputModel).readOnly}
          placeholder={p.placeholder}
          size={p.size}
          disabled={p.disabled}
          invalid={p.invalid}
          name={p.name}
          value={p.mode === "controlled" ? p.value : undefined}
          defaultValue={p.mode === "uncontrolled" ? p.value : undefined}
          onChange={(event) => {
            onPatch({ value: event.currentTarget.value });
            onEvent("onChange", event.currentTarget.value);
          }}
        />
      ) : (
        <Select
          field={field}
          options={(p as SelectModel).options}
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
      );
    return (
      <div className="playground-form">
        <Field
          label={p.label}
          helper={p.helper}
          error={p.error}
          required={p.required}
        >
          {control}
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
