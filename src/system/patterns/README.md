# Business patterns

These three patterns connect current Tiraz controls to caller-owned records and
persistence. They own the open panel, draft and pending feedback for one action.
They never save on mount or invent a backend. Import them from the main system
entry, and load its usual `tokens.css` and `components.css` once; the latter
includes `patterns/patterns.css`. They use the nearest `SystemProvider` for
direction, theme and portal placement.

The [compiling example](examples/BusinessPatternsExample.tsx) supplies every label
in Arabic and English, edits local data, and demonstrates cancellable saves. Mount
it inside a provider with the matching direction. Its delay starts only after an
action; changes disappear on reload. Replace its `localSave` with real persistence.

| Export               | Required props                                                         | Optional props                       |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| `CustomerEditSheet`  | `customer`, `labels`, `onSave(customer, context)`                      | —                                    |
| `PreferenceSettings` | `value`, `items`, `labels`, `onSave(value, context)`                   | —                                    |
| `InvoiceActions`     | `invoice`, `actions`, `labels`, `onAction(actionId, invoice, context)` | `actionsInDetails` (default `false`) |

Each callback returns `Promise<void>`. The exported `ActionContext` is
`{ signal: AbortSignal }`. Resolve after persistence succeeds; reject on failure.
The component retains the draft or action so the person can retry and shows the
caller-supplied error text, never the rejected error's private details.

## CustomerEditSheet

`CustomerData` contains `id`, `name` and `email`, all strings. The Sheet opens from
its own edit button, starts a fresh draft from `customer` on every open, and closes
after an accepted save. The name and email use current labeled `Input` controls,
native required validation, and email validation. Email keeps LTR text direction.

`CustomerEditLabels` requires `edit`, `title`, `description`, `close`, `name`,
`email`, `save`, `saving`, `saved`, `cancel` and `error`. Use specific title and
description text for the customer being edited. Update the caller's customer after
the save. A different `customer.id` starts a new editor and aborts outstanding work.

## PreferenceSettings

`value` is `Record<string, boolean>` containing persisted values. Each
`PreferenceItem` has a stable `id`, a `label`, and optional `description` and
`disabled`. Missing values display as false. A save passes the complete draft,
including existing keys that are not visible as items. Cancel restores the current
persisted `value`.

`PreferenceLabels` requires `title`, `save`, `saving`, `cancel`, `saved` and
`error`. Equivalent value objects preserve the draft. Changed persisted values
replace it, including accepted values returned by the caller's save. Use a React
`key` for the account or entity when replacing the settings owner, so its pending
save and draft are invalidated. Supply a fresh value object when saved data changes.

## InvoiceActions

`InvoiceData` contains a stable `id` and `fields`. Each field has `id`, `label`
and `value: ReactNode`. Format dates and money in the caller's locale; the pattern
keeps supplied formatting and isolates mixed-direction values with `bdi`.

`InvoiceAction` contains `id`, `label` and optional `disabled`. A destructive action
must also provide `destructive: true` and a `confirmation` with `title`,
`description`, `confirm`, `cancel` and `close`, all translated strings. Explain
the specific invoice and consequence in this confirmation. Selecting the menu
item opens the current Tiraz `Modal`; only its confirm button calls `onAction`.
Escape and Cancel record no action, and focus returns to the menu button.
Withdrawing, disabling, or changing the confirmation closes it without executing.
Equivalent action objects preserve an open confirmation.

```tsx
const actions: InvoiceAction[] = [
  {
    id: "void",
    label: "إلغاء الفاتورة",
    destructive: true,
    confirmation: {
      title: "إلغاء الفاتورة INV-42؟",
      description: "ستُلغى الفاتورة بقيمة ٤٢٠٫٠٠ د.إ. ولا يمكن التراجع.",
      confirm: "تأكيد الإلغاء",
      cancel: "الاحتفاظ بالفاتورة",
      close: "إغلاق التأكيد",
    },
  },
];
```

`InvoiceActionLabels` requires `actions`, `details`, `title`, `description`,
`close`, `working`, `cancel`, `success` and `error`. `actionsInDetails` exposes the
same operation and feedback inside the details Sheet. Closing that Sheet cancels
outstanding work, including work started outside it. A changed `invoice.id`
invalidates the previous invoice's operation and confirmation.

## Persistence, cancellation and accessibility

Use the signal in the actual request and check it before updating caller state:

```tsx
async function save(customer: CustomerData, { signal }: ActionContext) {
  const response = await fetch(
    `/api/customers/${encodeURIComponent(customer.id)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(customer),
      signal,
    },
  );
  if (!response.ok) throw new Error("Save failed");
  signal.throwIfAborted();
  setCustomer(customer);
}
```

Cancellation aborts the signal and ignores late settlements immediately. Unmount
also aborts. This cannot undo a write already accepted by a server: the host owns
authorization, persistence, request identity, and any compensating action.

Repeated clicks or native form submissions cannot start duplicate pending work.
Busy buttons remain focusable with `aria-disabled` and `aria-busy`. Cancellation
returns focus before removing an invoice Cancel button. Errors stay visibly beside
the action and describe its retry button. Each pattern owns one polite, atomic live
region, empty on mount; state transitions update it without duplicating alerts or
announcing the full invoice/customer. Native form validation remains the browser's.

Public supporting types are `CustomerData`, `CustomerEditLabels`,
`CustomerEditSheetProps`, `PreferenceItem`, `PreferenceLabels`,
`PreferenceSettingsProps`, `InvoiceData`, `InvoiceAction`,
`InvoiceActionConfirmation`, `InvoiceActionLabels`, `InvoiceActionsProps` and
`ActionContext`. Layout helpers and the async hook are internal.
