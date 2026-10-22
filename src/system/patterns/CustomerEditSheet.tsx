import { useId, useState } from "react";
import { Button } from "../Button";
import { Input } from "../Input";
import { Sheet } from "../Sheet";
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
  saved: string;
  cancel: string;
  error: string;
}
export interface CustomerEditSheetProps {
  customer: CustomerData;
  labels: CustomerEditLabels;
  /** Resolve after persistence succeeds; reject to retain the draft. */
  onSave: (customer: CustomerData, context: ActionContext) => Promise<void>;
}
export function CustomerEditSheet(props: CustomerEditSheetProps) {
  return <CustomerEditor key={props.customer.id} {...props} />;
}
function CustomerEditor({ customer, labels, onSave }: CustomerEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(customer);
  const action = useAsyncAction();
  const errorId = useId();
  function changeOpen(next: boolean) {
    action.cancel();
    if (next) setDraft({ ...customer });
    setOpen(next);
  }
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
      <Sheet
        open={open}
        onOpenChange={changeOpen}
        trigger={<Button variant="secondary">{labels.edit}</Button>}
        title={labels.title}
        description={labels.description}
        closeLabel={labels.close}
      >
        <form
          className="tz-pattern-stack"
          aria-busy={action.busy}
          onSubmit={(event) => {
            event.preventDefault();
            void action.run(
              (context) => onSave({ ...draft }, context),
              () => setOpen(false),
            );
          }}
        >
          <Input
            label={labels.name}
            autoComplete="name"
            required
            value={draft.name}
            disabled={action.busy}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
          <Input
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
          {failed && (
            <p id={errorId} className="tz-pattern-error">
              {labels.error}
            </p>
          )}
          <div className="tz-pattern-actions">
            <Button
              type="submit"
              state={action.busy ? "loading" : "idle"}
              aria-describedby={failed ? errorId : undefined}
            >
              {action.busy ? labels.saving : labels.save}
            </Button>
            <Button variant="secondary" onClick={() => changeOpen(false)}>
              {labels.cancel}
            </Button>
          </div>
        </form>
      </Sheet>
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
