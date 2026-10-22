import { useId, useState } from "react";
import { Button, Switch } from "../system";
import { Inline, Stack } from "./primitives";
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
  /** Persisted values owned by the caller. Update after onSave succeeds. */
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
  const heading = useId();
  // Equivalent objects from a parent render must not erase edits. Updating
  // persisted values during onSave must also preserve its success feedback.
  if (
    Object.keys(edit.saved).length !== Object.keys(value).length ||
    Object.keys(value).some((key) => edit.saved[key] !== value[key])
  ) {
    setEdit({ saved: value, draft: { ...value } });
  }
  const { draft } = edit;
  return (
    <form
      className="tz-preferences"
      aria-labelledby={heading}
      aria-busy={action.busy}
      onSubmit={(event) => {
        event.preventDefault();
        void action.run((context) => onSave({ ...draft }, context));
      }}
    >
      <Stack>
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
        {action.state === "error" && (
          <p role="alert" className="tz-pattern-error">
            {labels.error}
          </p>
        )}
        {action.state === "success" && (
          <p role="status" className="tz-pattern-success">
            {labels.saved}
          </p>
        )}
        <Inline>
          <Button type="submit" state={action.busy ? "loading" : "idle"}>
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
        </Inline>
      </Stack>
    </form>
  );
}
