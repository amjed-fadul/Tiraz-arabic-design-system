import { useId } from "react";
import { RotateCcw, ChevronDown } from "lucide-react";
import { Switch } from "../system";
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
              aria-label={t("طي تخصيص المكونات", "Collapse system settings")}
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
        <select
          id={`${uid}-accent`}
          value={config.accent}
          onChange={(e) =>
            set("accent", e.target.value as AppearanceSettings["accent"])
          }
        >
          {["sage", "blue", "plum", "clay"].map((value) => (
            <option key={value} value={value}>
              {localize(optionNames[value], language)}
            </option>
          ))}
        </select>
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
