import { useSelectPortal } from "./useSelectPortal";
import * as Select from "@radix-ui/react-select";
import { useId } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useGlide } from "./useGlide";
import { useSystem, usePortalDestination } from "./useSystem";
export interface ModelOption {
  id: string;
  name: string;
  provider?: string;
  description?: string;
  tags?: readonly string[];
  context?: string;
  price?: string;
  disabled?: boolean;
}
export interface ModelSelectorProps {
  models: readonly ModelOption[];
  value: string;
  onValueChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  /** The word beside a model that cannot be chosen; «غير متاح» or "Unavailable" by default. */
  labels?: { unavailable?: string };
  className?: string;
}
/** Controlled choice only. All availability, capability and pricing data is supplied. */
export function ModelSelector({
  models,
  value,
  onValueChange,
  label,
  placeholder,
  disabled = false,
  size = "sm",
  labels,
  className = "",
}: ModelSelectorProps) {
  const { config } = useSystem(),
    container = usePortalDestination(),
    ar = config.direction === "rtl";
  const unavailable = labels?.unavailable ?? (ar ? "غير متاح" : "Unavailable");
  const portal = useSelectPortal(container);
  const descriptionId = useId();
  const glide = useGlide();
  const selected = models.find((model) => model.id === value);
  const groups = Array.from(
    new Set(models.map((model) => model.provider ?? "")),
  );
  return (
    <Select.Root
      open={portal.open}
      onOpenChange={portal.onOpenChange}
      dir={config.direction}
      value={value}
      onValueChange={(id) => {
        if (
          id !== value &&
          models.some((model) => model.id === id && !model.disabled)
        )
          onValueChange(id);
      }}
      disabled={disabled || models.length === 0}
    >
      <Select.Trigger
        aria-label={label ?? (ar ? "النموذج" : "Model")}
        className={`tz-model-trigger ${className}`}
        data-size={size}
      >
        <Select.Value
          placeholder={placeholder ?? (ar ? "اختيار نموذج" : "Choose model")}
        >
          {selected ? (
            <>
              <span className="tz-model-mark" aria-hidden="true">
                {Array.from((selected.provider || selected.name).trim())[0]}
              </span>
              <bdi>{selected.name}</bdi>
            </>
          ) : (
            <span>{placeholder ?? (ar ? "اختيار نموذج" : "Choose model")}</span>
          )}
        </Select.Value>
        <Select.Icon asChild>
          <ChevronDown size={14} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      {portal.container && (
        <Select.Portal container={portal.container}>
          <Select.Content
            position="popper"
            sideOffset={5}
            collisionPadding={8}
            className="tz-model-popup"
            dir={config.direction}
          >
            <Select.ScrollUpButton className="tz-select-scroll">
              <ChevronUp size={14} aria-hidden="true" />
            </Select.ScrollUpButton>
            <Select.Viewport ref={glide} className="tz-model-viewport">
              {groups.map((group) => (
                <Select.Group key={group}>
                  {group && (
                    <Select.Label className="tz-model-group" dir="auto">
                      {group}
                    </Select.Label>
                  )}
                  {models
                    .filter((model) => (model.provider ?? "") === group)
                    .map((model) => (
                      <Select.Item
                        key={model.id}
                        value={model.id}
                        textValue={model.name}
                        aria-describedby={`${descriptionId}-${encodeURIComponent(model.id)}`}
                        disabled={model.disabled}
                        className="tz-model-option"
                      >
                        <span className="tz-model-mark" aria-hidden="true">
                          {Array.from((model.provider || model.name).trim())[0]}
                        </span>
                        <span className="tz-model-copy">
                          <span className="tz-model-name">
                            <Select.ItemText>
                              <bdi>{model.name}</bdi>
                            </Select.ItemText>
                            {model.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="tz-model-tag"
                                dir="auto"
                              >
                                {tag}
                              </span>
                            ))}
                          </span>
                          {model.description && (
                            <small dir="auto">{model.description}</small>
                          )}
                          {model.disabled && <small>{unavailable}</small>}
                        </span>
                        {(model.context || model.price) && (
                          <span className="tz-model-meta">
                            <bdi>{model.context}</bdi>
                            <bdi>{model.price}</bdi>
                          </span>
                        )}
                        <span
                          className="tz-visually-hidden"
                          id={`${descriptionId}-${encodeURIComponent(model.id)}`}
                        >
                          {[
                            model.tags?.join(", "),
                            model.description,
                            model.context,
                            model.price,
                            model.disabled ? unavailable : null,
                          ]
                            .filter(Boolean)
                            .join(". ")}
                        </span>
                        <Select.ItemIndicator className="tz-model-check">
                          <Check size={14} aria-hidden="true" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                </Select.Group>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="tz-select-scroll">
              <ChevronDown size={14} aria-hidden="true" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      )}
    </Select.Root>
  );
}
