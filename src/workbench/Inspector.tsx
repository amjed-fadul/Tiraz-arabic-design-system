import { agentSwatches } from "../mascot/agent-swatches";
import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Button,
  ColorPicker,
  Input,
  Select,
  Switch,
  Textarea,
} from "../system";
import type { ComponentId } from "./catalog";
import { commonFields, optionNames } from "./fields";
import type { WorkbenchField } from "./fields";
import { localize, label } from "./i18n";
import type { Language } from "./i18n";
import { validateCollection } from "./model";
import type { PlaygroundModel, TabRecord } from "./model";
import { Segmented } from "./Segmented";
interface Props {
  component: ComponentId;
  /** The page's name, for the section's heading. */
  name: string;
  model: PlaygroundModel;
  language: Language;
  onPatch: (patch: Record<string, unknown>) => void;
  onReset: () => void;
}
function CollectionEditor({
  field,
  value,
  language,
  onChange,
}: {
  field: WorkbenchField;
  value: unknown;
  language: Language;
  onChange: (value: unknown) => void;
}) {
  const uid = useId(),
    source = JSON.stringify(value, null, 2),
    [savedSource, setSavedSource] = useState(source),
    [draft, setDraft] = useState(source),
    [error, setError] = useState(false);
  // Refresh a changed model without remounting the focused Apply button.
  if (savedSource !== source) {
    setSavedSource(source);
    setDraft(source);
    setError(false);
  }
  function apply() {
    try {
      const parsed: unknown = JSON.parse(draft);
      if (
        !validateCollection(
          field.key === "options" ? "select" : "dropdown",
          parsed,
        )
      )
        throw Error();
      onChange(parsed);
      setError(false);
    } catch {
      setError(true);
    }
  }
  return (
    <div className="settings-field collection-field">
      <label htmlFor={uid}>{localize(field.title, language)}</label>
      <Textarea
        id={uid}
        rows={4}
        dir="ltr"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        invalid={error}
        aria-describedby={error ? `${uid}-error` : undefined}
      />
      <Button variant="ghost" className="settings-action" onClick={apply}>
        {label("apply", language)}
      </Button>
      {error && (
        <p id={`${uid}-error`} role="alert" className="tz-field-error">
          {label("invalid", language)}
        </p>
      )}
    </div>
  );
}
function Control({
  field,
  model,
  component,
  language,
  onPatch,
}: {
  field: WorkbenchField;
  model: PlaygroundModel;
  component: ComponentId;
  language: Language;
  onPatch: Props["onPatch"];
}) {
  const uid = useId(),
    record = model as unknown as Record<string, unknown>;
  const value =
    component === "button" && field.key === "state" && record.disabled
      ? "disabled"
      : record[field.key];
  const caption = localize(field.title, language);
  function patch(next: unknown) {
    if (component === "button" && field.key === "state")
      onPatch({
        state: next === "disabled" ? "idle" : next,
        disabled: next === "disabled",
      });
    else onPatch({ [field.key]: next });
  }
  if (field.kind === "color")
    return (
      <ColorPicker
        label={caption}
        value={String(value)}
        onValueChange={patch}
        swatches={agentSwatches(language === "ar")}
        announcement="off"
      />
    );
  if (field.kind === "collection")
    return (
      <CollectionEditor
        field={field}
        value={value}
        language={language}
        onChange={patch}
      />
    );
  if (field.kind === "boolean")
    return (
      <Switch
        label={caption}
        checked={Boolean(value)}
        onCheckedChange={patch}
      />
    );
  if (field.kind === "select") {
    let values = field.options ?? [];
    if (component === "button" && field.key === "state")
      values = [...values, "disabled"];
    if (component === "tabs" && field.key === "value")
      values = (record.items as TabRecord[])
        .filter((item) => !item.disabled)
        .map((item) => item.value);
    const options = values.map((option) => ({
      value: option,
      text:
        (field.key === "value"
          ? (record.items as TabRecord[]).find((item) => item.value === option)
              ?.label
          : optionNames[option] && localize(optionNames[option], language)) ??
        option,
    }));
    // Up to three options fit a segmented control; more take the Select.
    return options.length <= 3 ? (
      <Segmented
        label={caption}
        options={options}
        value={String(value)}
        onChange={patch}
      />
    ) : (
      <div className="settings-field">
        <label htmlFor={uid}>{caption}</label>
        <Select
          id={uid}
          options={options.map((option) => ({
            value: option.value,
            label: option.text,
          }))}
          value={String(value)}
          onValueChange={patch}
        />
      </div>
    );
  }
  if (field.kind === "number")
    return (
      <div className="settings-field">
        <label htmlFor={uid}>{caption}</label>
        {/* Tiraz Input is text entry; preserve native number/step semantics. */}
        <input
          id={uid}
          className="tz-input"
          data-size="sm"
          dir="auto"
          type="number"
          min={field.min}
          max={field.max}
          value={String(value ?? "")}
          onChange={(e) => {
            if (!e.target.value) return;
            const n = Number(e.target.value);
            if (Number.isFinite(n))
              patch(
                Math.max(
                  field.min ?? -Infinity,
                  Math.min(field.max ?? Infinity, n),
                ),
              );
          }}
        />
      </div>
    );
  return (
    <div className="settings-field">
      <label htmlFor={uid}>{caption}</label>
      <Input
        id={uid}
        dir="auto"
        value={String(value ?? "")}
        onChange={(e) => patch(e.target.value)}
      />
    </div>
  );
}
/** The page's properties: its own section, hidden on a page with none. */
export function Inspector({
  component,
  name,
  model,
  language,
  onPatch,
  onReset,
}: Props) {
  const id = useId();
  const [resetRevision, setResetRevision] = useState(0);
  const shown = commonFields[component].filter(
    (field) =>
      !(
        field.key === "agentColor" &&
        (model as unknown as { agentAppearance?: string }).agentAppearance !==
          "mascot"
      ) &&
      !(
        component === "avatar" &&
        field.key === "src" &&
        (model as unknown as { appearance: string }).appearance !== "photo"
      ) &&
      !(
        component === "progress" &&
        field.key === "value" &&
        (model as unknown as { indeterminate: boolean }).indeterminate
      ),
  );
  if (shown.length === 0) return null;
  return (
    <section className="settings-section" aria-labelledby={id}>
      <div className="settings-section-head">
        <h3 id={id}>
          {language === "ar" ? `خصائص ${name}` : `${name} properties`}
        </h3>
        <Button
          variant="ghost"
          className="settings-action"
          aria-label={label("resetPlayground", language)}
          onClick={() => {
            setResetRevision((revision) => revision + 1);
            onReset();
          }}
        >
          <RotateCcw size={14} aria-hidden="true" />
          {label("reset", language)}
        </Button>
      </div>
      {shown.map((field) => (
        <Control
          key={`${field.key}-${resetRevision}`}
          field={field}
          model={model}
          component={component}
          language={language}
          onPatch={onPatch}
        />
      ))}
    </section>
  );
}
