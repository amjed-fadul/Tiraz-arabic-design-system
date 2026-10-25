import { useId } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { Check, RotateCcw } from "lucide-react";
import {
  accentColors,
  Button,
  ColorPicker,
  numberLocale,
  Slider,
  Switch,
} from "../system";
import type { Accent, SystemConfig } from "../system";
import type { AppearanceSettings } from "./storage";
import type { Language } from "./i18n";
import { label, localize } from "./i18n";
import { optionNames } from "./fields";
import type { BrandColors } from "./theme-customization";
import { Segmented } from "./Segmented";
interface Props {
  config: SystemConfig;
  language: Language;
  onChange: (settings: AppearanceSettings) => void;
  onReset: () => void;
  colors: BrandColors;
  onColorsChange: (colors: BrandColors) => void;
}
const accents = Object.keys(accentColors) as Accent[];
/** The system settings: the panel's second section. */
export function Appearance({
  config,
  language,
  onChange,
  onReset,
  colors,
  onColorsChange,
}: Props) {
  const uid = useId();
  function set<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) {
    const { theme: _theme, direction: _direction, ...settings } = config;
    if (key === "accent") onColorsChange({});
    onChange({ ...settings, [key]: value });
  }
  // The swatches are one radio group: the arrow keys move the choice, and in
  // Arabic the next swatch is the one to the left.
  function moveAccent(event: KeyboardEvent<HTMLButtonElement>) {
    const rtl = config.direction === "rtl";
    const step =
      event.key === "ArrowDown" ||
      event.key === (rtl ? "ArrowLeft" : "ArrowRight")
        ? 1
        : event.key === "ArrowUp" ||
            event.key === (rtl ? "ArrowRight" : "ArrowLeft")
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const next =
      accents[
        (accents.indexOf(config.accent) + step + accents.length) %
          accents.length
      ];
    set("accent", next);
    event.currentTarget.parentElement
      ?.querySelector<HTMLElement>(`[data-accent="${next}"]`)
      ?.focus();
  }
  // In the page's digits.
  const radius = `${new Intl.NumberFormat(numberLocale(config, language)).format(config.radius)} ${label("pixels", language)}`;
  return (
    <section className="settings-section" aria-labelledby={`${uid}-heading`}>
      <div className="settings-section-head">
        <h3 id={`${uid}-heading`}>{label("systemSettings", language)}</h3>
        <Button
          variant="ghost"
          className="settings-action"
          aria-label={label("resetSystem", language)}
          onClick={onReset}
        >
          <RotateCcw size={14} aria-hidden="true" />
          {label("reset", language)}
        </Button>
      </div>
      <div className="settings-field">
        <div className="settings-row">
          <span id={`${uid}-accent`}>{label("accent", language)}</span>
          <span className="settings-value">
            {colors[config.theme]
              ? language === "ar"
                ? "مخصّص"
                : "Custom"
              : localize(optionNames[config.accent], language)}
          </span>
        </div>
        <div
          className="accent-swatches"
          role="radiogroup"
          aria-labelledby={`${uid}-accent`}
        >
          {accents.map((accent) => {
            const name = localize(optionNames[accent], language);
            const checked = accent === config.accent && !colors[config.theme];
            return (
              <button
                key={accent}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={name}
                title={name}
                tabIndex={accent === config.accent ? 0 : -1}
                data-accent={accent}
                style={
                  {
                    "--swatch": accentColors[accent][config.theme],
                  } as CSSProperties
                }
                onClick={() => set("accent", accent)}
                onKeyDown={moveAccent}
              >
                {checked && (
                  <Check size={14} strokeWidth={3} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <ColorPicker
        label={
          language === "ar"
            ? config.theme === "light"
              ? "لون العلامة · الوضع الفاتح"
              : "لون العلامة · الوضع الداكن"
            : `Brand color · ${config.theme} mode`
        }
        helper={
          language === "ar"
            ? "يتكيّف لون النص تلقائيًا. بدّل المظهر لضبط لون الوضع الآخر."
            : "Text color adjusts automatically. Switch appearance to set the other mode."
        }
        value={
          colors[config.theme] ?? accentColors[config.accent][config.theme]
        }
        onValueChange={(value) =>
          onColorsChange({ ...colors, [config.theme]: value })
        }
        swatches={[]}
        announcement="off"
      />
      <Segmented
        label={label("typography", language)}
        value={config.typography ?? "standard"}
        onChange={(value) =>
          set("typography", value as AppearanceSettings["typography"])
        }
        options={[
          { value: "standard", text: label("normalText", language) },
          { value: "large", text: label("largeText", language) },
        ]}
      />
      <Segmented
        label={label("numerals", language)}
        value={config.numerals ?? "arab"}
        onChange={(value) =>
          set("numerals", value as AppearanceSettings["numerals"])
        }
        options={[
          {
            value: "arab",
            text: "١٢٣",
            name: label("arabicNumerals", language),
          },
          {
            value: "latn",
            text: "123",
            name: label("westernNumerals", language),
          },
        ]}
      />
      <Segmented
        label={label("density", language)}
        value={config.density}
        onChange={(value) =>
          set("density", value as AppearanceSettings["density"])
        }
        options={[
          { value: "compact", text: label("compact", language) },
          { value: "standard", text: label("standard", language) },
        ]}
      />
      <div className="settings-field">
        <div className="settings-row">
          <label htmlFor={`${uid}-radius`}>{label("corners", language)}</label>
          <span className="settings-value">{radius}</span>
        </div>
        <Slider
          id={`${uid}-radius`}
          min={0}
          max={16}
          step={2}
          value={config.radius}
          onValueChange={(value) => set("radius", value)}
          aria-valuetext={radius}
        />
      </div>
      <Switch
        label={label("motion", language)}
        checked={config.reducedMotion}
        onCheckedChange={(value) => set("reducedMotion", value)}
      />
    </section>
  );
}
