import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Switch } from "../system";
import type { ComponentId } from "./catalog";
import { commonFields, optionNames } from "./fields";
import type { Field } from "./fields";
import { localize, label } from "./i18n";
import type { Language } from "./i18n";
import { validateCollection } from "./model";
import type { PlaygroundModel, TabRecord } from "./model";
interface Props {
  component: ComponentId;
  model: PlaygroundModel;
  language: Language;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onPatch: (patch: Record<string, unknown>) => void;
  onReset: () => void;
}
function CollectionEditor({
  field,
  value,
  language,
  onChange,
}: {
  field: Field;
  value: unknown;
  language: Language;
  onChange: (value: unknown) => void;
}) {
  const uid = useId(),
    [draft, setDraft] = useState(JSON.stringify(value, null, 2)),
    [error, setError] = useState(false);
  function apply() {
    try {
      const parsed: unknown = JSON.parse(draft);
      if (!validateCollection("dropdown", parsed)) throw Error();
      onChange(parsed);
      setError(false);
    } catch {
      setError(true);
    }
  }
  return (
    <div className="inspector-field collection-field">
      <label htmlFor={uid}>{localize(field.title, language)}</label>
      <textarea
        id={uid}
        rows={4}
        dir="ltr"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
      />
      <button type="button" className="doc-button" onClick={apply}>
        {label("apply", language)}
      </button>
      {error && (
        <p role="alert" className="field-error">
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
  field: Field;
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
  if (field.kind === "collection")
    return (
      <CollectionEditor
        key={JSON.stringify(value)}
        field={field}
        value={value}
        language={language}
        onChange={patch}
      />
    );
  if (field.kind === "boolean")
    return (
      <div className="inspector-field boolean-field">
        <Switch
          label={caption}
          checked={Boolean(value)}
          onCheckedChange={patch}
        />
      </div>
    );
  let options = field.options ?? [];
  if (component === "button" && field.key === "state")
    options = [...options, "disabled"];
  if (component === "tabs" && field.key === "value")
    options = (record.items as TabRecord[])
      .filter((item) => !item.disabled)
      .map((item) => item.value);
  return (
    <div className="inspector-field">
      <label htmlFor={uid}>{caption}</label>
      {field.kind === "select" ? (
        <select
          id={uid}
          value={String(value)}
          onChange={(e) => patch(e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {field.key === "value"
                ? (record.items as TabRecord[]).find(
                    (item) => item.value === option,
                  )?.label
                : optionNames[option]
                  ? localize(optionNames[option], language)
                  : option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={uid}
          dir="auto"
          type={field.kind === "number" ? "number" : "text"}
          min={field.min}
          max={field.max}
          value={String(value ?? "")}
          onChange={(e) => {
            if (field.kind === "number") {
              if (!e.target.value) return;
              const n = Number(e.target.value);
              if (Number.isFinite(n))
                patch(
                  Math.max(
                    field.min ?? -Infinity,
                    Math.min(field.max ?? Infinity, n),
                  ),
                );
            } else patch(e.target.value);
          }}
        />
      )}
    </div>
  );
}
export function Inspector({
  component,
  model,
  language,
  open,
  onOpenChange,
  onPatch,
  onReset,
}: Props) {
  return (
    <details
      className="playground-inspector"
      open={open}
      onToggle={(e) => onOpenChange(e.currentTarget.open)}
    >
      <summary>{label("properties", language)}</summary>
      <div className="inspector-scroll">
        <div className="inspector-scope">
          <p>{label("previewOnly", language)}</p>
          <button
            type="button"
            className="doc-icon-button"
            title={label("resetPlayground", language)}
            aria-label={label("resetPlayground", language)}
            onClick={onReset}
          >
            <RotateCcw size={13} />
          </button>
        </div>
        {commonFields[component].map((field) => (
          <Control
            key={field.key}
            field={field}
            model={model}
            component={component}
            language={language}
            onPatch={onPatch}
          />
        ))}
      </div>
    </details>
  );
}
