import { useId, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { Button } from "../Button";
import { DropdownMenu } from "../DropdownMenu";
import type { MenuItem } from "../DropdownMenu";
import { Modal } from "../Modal";
import { Sheet } from "../Sheet";
import { useAsyncAction } from "./useAsyncAction";
import type { ActionContext } from "./useAsyncAction";

export interface InvoiceData {
  id: string;
  /** Supply locale-formatted values; direction never implies a date/currency locale. */
  fields: { id: string; label: string; value: ReactNode }[];
}
export interface InvoiceActionConfirmation {
  title: string;
  description: string;
  confirm: string;
  cancel: string;
  close: string;
}
export type InvoiceAction = {
  id: string;
  label: string;
  disabled?: boolean;
} & (
  | { destructive: true; confirmation: InvoiceActionConfirmation }
  | { destructive?: false; confirmation?: never }
);
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
  /** Also make the shared actions available inside the details Sheet. */
  actionsInDetails?: boolean;
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
  actionsInDetails = false,
}: InvoiceActionsProps) {
  const action = useAsyncAction();
  const [open, setOpen] = useState(false);
  const errorId = useId();
  const failed = action.state === "error";
  const feedback = (
    <>
      {failed && (
        <p id={errorId} className="tz-pattern-error">
          {labels.error}
        </p>
      )}
      {action.state === "success" && (
        <p className="tz-pattern-success">{labels.success}</p>
      )}
    </>
  );
  const announcement = action.busy
    ? labels.working
    : failed
      ? labels.error
      : action.state === "success"
        ? labels.success
        : "";
  function controls() {
    return (
      <InvoiceControls
        actions={actions}
        labels={labels}
        busy={action.busy}
        describedBy={failed ? errorId : undefined}
        onCancel={action.cancel}
        onAction={(item) =>
          void action.run((context) => onAction(item.id, invoice, context))
        }
      />
    );
  }
  return (
    <div className="tz-business-pattern tz-pattern-stack">
      <div className="tz-pattern-actions">
        <Sheet
          open={open}
          onOpenChange={(next) => {
            if (!next) action.cancel();
            setOpen(next);
          }}
          trigger={<Button variant="secondary">{labels.details}</Button>}
          title={labels.title}
          description={labels.description}
          closeLabel={labels.close}
        >
          <div className="tz-pattern-stack">
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
            {actionsInDetails && (
              <>
                {controls()}
                {feedback}
              </>
            )}
          </div>
        </Sheet>
        {controls()}
      </div>
      {!(open && actionsInDetails) && feedback}
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

// Modal's trigger ref and DropdownMenu's trigger ref share the real menu button.
// Only a menu choice opens confirmation: Modal's automatic click handler and
// dialog ARIA props deliberately stop here, leaving the button's menu semantics.
function InvoiceMenuTrigger({
  ref,
  items,
  busy,
  label,
  describedBy,
}: {
  ref?: Ref<HTMLButtonElement>;
  items: MenuItem[];
  busy: boolean;
  label: string;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  if (open && busy) setOpen(false);
  return (
    <DropdownMenu
      open={open && !busy}
      onOpenChange={(next) => {
        if (!next || !busy) setOpen(next);
      }}
      trigger={
        <Button
          {...{ ref }}
          variant="secondary"
          disabled={items.length === 0}
          state={busy ? "loading" : "idle"}
          aria-describedby={describedBy}
        >
          {label}
        </Button>
      }
      items={items}
    />
  );
}

function InvoiceControls({
  actions,
  labels,
  busy,
  describedBy,
  onAction,
  onCancel,
}: {
  actions: InvoiceAction[];
  labels: InvoiceActionLabels;
  busy: boolean;
  describedBy?: string;
  onAction: (action: InvoiceAction) => void;
  onCancel: () => void;
}) {
  const [confirmation, setConfirmation] = useState<InvoiceAction | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const selected =
    confirmation &&
    actions.find(
      (item) =>
        item.id === confirmation.id &&
        item.label === confirmation.label &&
        !item.disabled &&
        item.destructive &&
        confirmationKey(item.confirmation) ===
          confirmationKey(confirmation.confirmation),
    );
  if (confirmation && !selected) setConfirmation(null);
  const words = confirmation?.confirmation;
  return (
    <div className="tz-pattern-actions" ref={row}>
      <Modal
        open={!!selected && !busy}
        onOpenChange={(next) => {
          if (!next) setConfirmation(null);
        }}
        initialFocusRef={cancel}
        title={words?.title ?? ""}
        description={words?.description ?? ""}
        closeLabel={words?.close ?? labels.close}
        trigger={
          <InvoiceMenuTrigger
            busy={busy}
            label={busy ? labels.working : labels.actions}
            describedBy={describedBy}
            items={actions.map((item) => ({
              ...item,
              disabled: item.disabled || busy,
              onSelect: () => {
                if (busy || item.disabled) return;
                if (item.destructive) setConfirmation(item);
                else onAction(item);
              },
            }))}
          />
        }
        footer={
          <>
            <Button
              {...{ ref: cancel }}
              variant="secondary"
              onClick={() => setConfirmation(null)}
            >
              {words?.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!selected || busy) return;
                setConfirmation(null);
                onAction(selected);
              }}
            >
              {words?.confirm}
            </Button>
          </>
        }
      >
        <></>
      </Modal>
      {busy && (
        <Button
          variant="ghost"
          onClick={(event) => {
            // Cancel disappears immediately. Preserve keyboard focus on this row's
            // real actions button, including inside a nested Sheet.
            if (
              event.currentTarget ===
              event.currentTarget.ownerDocument.activeElement
            )
              row.current?.querySelector<HTMLButtonElement>("button")?.focus();
            onCancel();
          }}
        >
          {labels.cancel}
        </Button>
      )}
    </div>
  );
}

function confirmationKey(words: InvoiceActionConfirmation | undefined) {
  return (
    words &&
    JSON.stringify([
      words.title,
      words.description,
      words.confirm,
      words.cancel,
      words.close,
    ])
  );
}
