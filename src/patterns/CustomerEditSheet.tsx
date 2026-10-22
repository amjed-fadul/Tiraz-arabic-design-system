import { useState } from "react";
import { Button, Sheet } from "../system";
import { Inline, Stack, TextField } from "./primitives";
import { useAsyncAction } from "./useAsyncAction";
import type { ActionContext } from "./useAsyncAction";

export interface CustomerData {
  id: string;
  name: string;
  email: string;
}
export interface CustomerEditLabels {
  edit: string;
  title: string;
  description: string;
  close: string;
  name: string;
  email: string;
  save: string;
  saving: string;
  cancel: string;
  error: string;
}
export interface CustomerEditSheetProps {
  customer: CustomerData;
  labels: CustomerEditLabels;
  /** Resolve only after persistence succeeds. Reject to retain the current draft. */
  onSave: (customer: CustomerData, context: ActionContext) => Promise<void>;
}
export function CustomerEditSheet(props: CustomerEditSheetProps) {
  return <CustomerEditor key={props.customer.id} {...props} />;
}
function CustomerEditor({ customer, labels, onSave }: CustomerEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(customer);
  const action = useAsyncAction();
  function changeOpen(next: boolean) {
    action.cancel();
    if (next) setDraft({ ...customer });
    setOpen(next);
  }
  return (
    <Sheet
      open={open}
      onOpenChange={changeOpen}
      trigger={<Button variant="secondary">{labels.edit}</Button>}
      title={labels.title}
      description={labels.description}
      closeLabel={labels.close}
    >
      <form
        aria-busy={action.busy}
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(
            (context) => onSave({ ...draft }, context),
            () => setOpen(false),
          );
        }}
      >
        <Stack>
          <TextField
            label={labels.name}
            autoComplete="name"
            required
            value={draft.name}
            disabled={action.busy}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
          <TextField
            label={labels.email}
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            value={draft.email}
            disabled={action.busy}
            onChange={(event) =>
              setDraft({ ...draft, email: event.target.value })
            }
          />
          {action.state === "error" && (
            <p role="alert" className="tz-pattern-error">
              {labels.error}
            </p>
          )}
          <Inline>
            <Button type="submit" state={action.busy ? "loading" : "idle"}>
              {action.busy ? labels.saving : labels.save}
            </Button>
            <Button variant="secondary" onClick={() => changeOpen(false)}>
              {labels.cancel}
            </Button>
          </Inline>
        </Stack>
      </form>
    </Sheet>
  );
}
