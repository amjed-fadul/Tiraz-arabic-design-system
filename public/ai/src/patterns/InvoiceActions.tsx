import type { ReactNode } from "react";
import { Button, DropdownMenu, Sheet } from "../system";
import { Inline, Stack } from "./primitives";
import { useAsyncAction } from "./useAsyncAction";
import type { ActionContext } from "./useAsyncAction";

export interface InvoiceData {
  id: string;
  /** Supply locale-formatted values; direction never implies a date/currency locale. */
  fields: { id: string; label: string; value: ReactNode }[];
}
export interface InvoiceAction {
  id: string;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
}
export interface InvoiceActionLabels {
  actions: string;
  details: string;
  title: string;
  description: string;
  close: string;
  working: string;
  cancel: string;
  success: string;
  error: string;
}
export interface InvoiceActionsProps {
  invoice: InvoiceData;
  actions: InvoiceAction[];
  labels: InvoiceActionLabels;
  onAction: (
    actionId: string,
    invoice: InvoiceData,
    context: ActionContext,
  ) => Promise<void>;
}
export function InvoiceActions(props: InvoiceActionsProps) {
  return <InvoiceActionControls key={props.invoice.id} {...props} />;
}
function InvoiceActionControls({
  invoice,
  actions,
  labels,
  onAction,
}: InvoiceActionsProps) {
  const action = useAsyncAction();
  return (
    <Stack>
      <Inline>
        <Sheet
          trigger={<Button variant="secondary">{labels.details}</Button>}
          title={labels.title}
          description={labels.description}
          closeLabel={labels.close}
        >
          <dl className="tz-invoice-details">
            {invoice.fields.map((field) => (
              <div key={field.id}>
                <dt>{field.label}</dt>
                <dd>
                  <bdi>{field.value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </Sheet>
        <DropdownMenu
          trigger={
            <Button
              variant="secondary"
              disabled={actions.length === 0}
              state={action.busy ? "loading" : "idle"}
            >
              {action.busy ? labels.working : labels.actions}
            </Button>
          }
          items={actions.map((item) => ({
            ...item,
            disabled: item.disabled || action.busy,
            onSelect: () => {
              void action.run((context) => onAction(item.id, invoice, context));
            },
          }))}
        />
        {action.busy && (
          <Button variant="ghost" onClick={action.cancel}>
            {labels.cancel}
          </Button>
        )}
      </Inline>
      {action.state === "error" && (
        <p role="alert" className="tz-pattern-error">
          {labels.error}
        </p>
      )}
      {action.state === "success" && (
        <p role="status" className="tz-pattern-success">
          {labels.success}
        </p>
      )}
    </Stack>
  );
}
