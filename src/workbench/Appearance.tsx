import { useId, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { RotateCcw, ChevronDown, ChevronUp, Check } from "lucide-react";
import { accentColors, Switch, useSystem } from "../system";
import type { SystemConfig } from "../system";
import type { AppearanceSettings } from "./storage";
import type { Language } from "./i18n";
import { label, localize, words } from "./i18n";
import { optionNames } from "./fields";
import { CopyControl } from "./CopyControl";
interface Props {
  config: SystemConfig;
  language: Language;
  onChange: (settings: AppearanceSettings) => void;
  onReset: () => void;
  onCollapse?: () => void;
}
export function Appearance({
  config,
  language,
  onChange,
  onReset,
  onCollapse,
}: Props) {
  const uid = useId(),
    t = words(language);
  const { container } = useSystem();
  const accentTrigger = useRef<HTMLButtonElement>(null);
  const [accentContainer, setAccentContainer] = useState<HTMLElement | null>(
    null,
  );
  function set<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) {
    const { theme: _theme, direction: _direction, ...settings } = config;
    onChange({ ...settings, [key]: value });
  }
  return (
    <section className="appearance-content">
      <div className="settings-heading">
        <h2>{label("customize", language)}</h2>
        <div className="settings-actions">
          <CopyControl
            text={JSON.stringify(config, null, 2)}
            caption={label("copyConfig", language)}
            language={language}
            iconOnly
          />
          <button
            type="button"
            className="doc-icon-button"
            title={label("resetSystem", language)}
            aria-label={label("resetSystem", language)}
            onClick={onReset}
          >
            <RotateCcw size={13} />
          </button>
          {onCollapse && (
            <button
              type="button"
              className="doc-icon-button"
              aria-label={t("طيّ تخصيص المكوّنات", "Collapse system settings")}
              aria-expanded={true}
              onClick={onCollapse}
            >
              <ChevronDown size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="setting-field">
        <label htmlFor={`${uid}-accent`}>{label("accent", language)}</label>
        <Select.Root
          dir={config.direction}
          value={config.accent}
          onValueChange={(value) =>
            set("accent", value as AppearanceSettings["accent"])
          }
          onOpenChange={(open) => {
            if (open)
              setAccentContainer(
                accentTrigger.current?.closest<HTMLElement>(".docs-drawer") ??
                  container,
              );
          }}
        >
          <Select.Trigger
            id={`${uid}-accent`}
            ref={accentTrigger}
            className="accent-trigger"
          >
            <Select.Value />
            <Select.Icon asChild>
              <ChevronDown size={12} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal container={accentContainer ?? container}>
            <Select.Content
              className="tz-select-popup accent-popup"
              position="popper"
              sideOffset={4}
              collisionPadding={12}
              dir={config.direction}
            >
              <Select.ScrollUpButton className="accent-scroll">
                <ChevronUp size={12} />
              </Select.ScrollUpButton>
              <Select.Viewport className="accent-options">
                {(
                  Object.keys(accentColors) as AppearanceSettings["accent"][]
                ).map((value) => (
                  <Select.Item
                    key={value}
                    value={value}
                    textValue={localize(optionNames[value], language)}
                    className="tz-select-option accent-option"
                  >
                    <Select.ItemText>
                      <span className="accent-value">
                        <span
                          className="accent-swatch"
                          aria-hidden="true"
                          style={{
                            backgroundColor: accentColors[value][config.theme],
                          }}
                        />
                        <span>{localize(optionNames[value], language)}</span>
                      </span>
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={12} aria-hidden="true" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
              <Select.ScrollDownButton className="accent-scroll">
                <ChevronDown size={12} />
              </Select.ScrollDownButton>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
      <div className="setting-field">
        <label htmlFor={`${uid}-typography`}>
          {label("typography", language)}
        </label>
        <select
          id={`${uid}-typography`}
          value={config.typography ?? "standard"}
          onChange={(e) =>
            set(
              "typography",
              e.target.value as AppearanceSettings["typography"],
            )
          }
        >
          <option value="standard">{label("normalText", language)}</option>
          <option value="large">{label("largeText", language)}</option>
        </select>
      </div>
      <div className="setting-field">
        <label htmlFor={`${uid}-numerals`}>{label("numerals", language)}</label>
        <select
          id={`${uid}-numerals`}
          value={config.numerals ?? "arab"}
          onChange={(e) =>
            set("numerals", e.target.value as AppearanceSettings["numerals"])
          }
        >
          <option value="arab">{label("arabicNumerals", language)}</option>
          <option value="latn">{label("westernNumerals", language)}</option>
        </select>
      </div>
      <div className="setting-field">
        <label htmlFor={`${uid}-density`}>{label("density", language)}</label>
        <select
          id={`${uid}-density`}
          value={config.density}
          onChange={(e) =>
            set("density", e.target.value as AppearanceSettings["density"])
          }
        >
          <option value="compact">{label("compact", language)}</option>
          <option value="standard">{label("standard", language)}</option>
        </select>
      </div>
      <div className="setting-field">
        <label htmlFor={`${uid}-radius`}>{label("corners", language)}</label>
        <div className="radius-control">
          <input
            id={`${uid}-radius`}
            type="range"
            min={0}
            max={16}
            step={2}
            value={config.radius}
            onChange={(e) => set("radius", Number(e.target.value))}
          />
          <output htmlFor={`${uid}-radius`} dir="ltr">
            {config.radius}px
          </output>
        </div>
      </div>
      <div className="setting-field motion-setting">
        <Switch
          label={label("motion", language)}
          checked={config.reducedMotion}
          onCheckedChange={(value) => set("reducedMotion", value)}
        />
      </div>
    </section>
  );
}
