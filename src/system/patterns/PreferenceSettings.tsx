import { useId, useState } from "react";
import { Button } from "../Button";
import { Switch } from "../Switch";
import { useAsyncAction } from "./useAsyncAction";
import type { ActionContext } from "./useAsyncAction";

export interface PreferenceItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
export interface PreferenceLabels {
  title: string;
  save: string;
  saving: string;
  cancel: string;
  saved: string;
  error: string;
}
export interface PreferenceSettingsProps {
  /** Caller-owned persisted values. Use a React key when changing the account or entity. */
  value: Record<string, boolean>;
  items: PreferenceItem[];
  labels: PreferenceLabels;
  onSave: (
    value: Record<string, boolean>,
    context: ActionContext,
  ) => Promise<void>;
}
export function PreferenceSettings({
  value,
  items,
  labels,
  onSave,
}: PreferenceSettingsProps) {
  const [edit, setEdit] = useState(() => ({
    saved: value,
    draft: { ...value },
  }));
  const action = useAsyncAction();
  const heading = useId(),
    errorId = useId();
  // Equivalent parent objects do not erase edits. A persisted update during a
  // successful callback also keeps that operation's receipt.
  if (
    Object.keys(edit.saved).length !== Object.keys(value).length ||
    Object.keys(value).some((key) => edit.saved[key] !== value[key])
  ) {
    setEdit({ saved: value, draft: { ...value } });
  }
  const { draft } = edit;
  const failed = action.state === "error";
  const announcement = action.busy
    ? labels.saving
    : failed
      ? labels.error
      : action.state === "success"
        ? labels.saved
        : "";
  return (
    <div className="tz-business-pattern">
      <form
        className="tz-pattern-stack"
        aria-labelledby={heading}
        aria-busy={action.busy}
        onSubmit={(event) => {
          event.preventDefault();
          void action.run((context) => onSave({ ...draft }, context));
        }}
      >
        <h2 id={heading} className="tz-pattern-heading">
          {labels.title}
        </h2>
        {items.map((item) => (
          <Switch
            key={item.id}
            label={item.label}
            description={item.description}
            disabled={action.busy || item.disabled}
            checked={draft[item.id] ?? false}
            onCheckedChange={(checked) => {
              action.cancel();
              setEdit({
                saved: value,
                draft: { ...draft, [item.id]: checked },
              });
            }}
          />
        ))}
        {failed && (
          <p id={errorId} className="tz-pattern-error">
            {labels.error}
          </p>
        )}
        {action.state === "success" && (
          <p className="tz-pattern-success">{labels.saved}</p>
        )}
        <div className="tz-pattern-actions">
          <Button
            type="submit"
            state={action.busy ? "loading" : "idle"}
            aria-describedby={failed ? errorId : undefined}
          >
            {action.busy ? labels.saving : labels.save}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              action.cancel();
              setEdit({ saved: value, draft: { ...value } });
            }}
          >
            {labels.cancel}
          </Button>
        </div>
      </form>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tz-visually-hidden"
      >
        {announcement}
      </span>
    </div>
  );
}
