# Business patterns

Import from the installed manifest's `patternsEntry` and load its `styles`. The source-owned patterns compose Tiraz components and a small set of layout/text-field helpers; they do not import the workbench. Place them inside SystemProvider. All visible copy is supplied by the caller, so language can be independent of direction. See `src/patterns/index.ts` for exported prop/label types, and the component source for the full contract.

| Pattern            | Use                                                     | State ownership                                                                                                                |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| CustomerEditSheet  | Edit a customer's name and email without leaving a page | Caller owns saved `customer`; pattern owns open state, draft, pending/error. Update saved customer after persistence succeeds. |
| PreferenceSettings | Edit and save multiple boolean preferences              | Caller owns persisted `value`; pattern owns draft and feedback. Update `value` after saving.                                   |
| InvoiceActions     | View invoice details and run supplied actions           | Caller provides formatted fields and action definitions; pattern owns detail visibility and pending/error feedback.            |

All persistence callbacks return `Promise<void>` and receive `{ signal: AbortSignal }`. Pass that signal through to fetch or your data client where supported. Pending state blocks duplicate submissions. Failed saves retain the draft for retry. Cancel clears pending state and ignores late completions; unmount aborts in-flight work. Cancellation cannot undo a server write that has already completed. Your data layer remains responsible for authorization, idempotency, reconciliation and persistence.

Customer editing opens from the current caller data each time; cancel discards unsaved changes on reopening. Preference cancel resets to the latest persisted value. A changed persisted preference snapshot synchronizes the draft; it does not cancel an active save. The caller must reconcile concurrent remote updates. Use stable, unique item/action/field IDs. Fields for invoice details accept caller-formatted ReactNode values, so choose Intl locales, currencies and dates explicitly. Isolate IDs and email addresses with `bdi`/`dir="ltr"`; do not infer locale from direction.

```tsx
const [customer, setCustomer] = useState({
  id: "cust-1",
  name: "نور",
  email: "noor@example.com",
});
<CustomerEditSheet
  customer={customer}
  labels={{
    edit: "تعديل العميل",
    title: "بيانات العميل",
    description: "عدّل البيانات ثم احفظها.",
    close: "إغلاق",
    name: "الاسم",
    email: "البريد الإلكتروني",
    save: "حفظ",
    saving: "جارٍ الحفظ",
    cancel: "إلغاء",
    error: "تعذّر الحفظ. حاول مرة أخرى.",
  }}
  onSave={async (draft, { signal }) => {
    await saveCustomer(draft, { signal }); // application-owned persistence
    setCustomer(draft);
  }}
/>;
```

`TextField` associates a required label and optional description/error with its input. Native input props, style and className target the input; a ref prop is not exposed. `Stack` and `Inline` are semantic-token layout helpers accepting normal div attributes. These helpers are deliberately small; they do not claim a complete form, validation or layout framework.

## Invoice actions and nested menus

Use `InvoiceActions` with `actionsInDetails={true}` when the details Sheet must contain its own contextual action menu. This optional prop defaults to `false`. The toolbar and the menu inside the Sheet share one pending/error/success state and one duplicate-submit guard. Disabled actions stay disabled in both menus. Feedback and the cancel action are visible inside the Sheet while it is open; closing it moves feedback back to the toolbar. Closing the Sheet alone does not cancel work; use the supplied cancel control, or unmount the pattern to abort.

```tsx
<InvoiceActions
  invoice={formattedInvoice}
  actions={invoiceActions}
  labels={translatedInvoiceLabels}
  actionsInDetails
  onAction={async (actionId, invoice, { signal }) => {
    await persistInvoiceAction(actionId, invoice.id, { signal });
    signal.throwIfAborted();
    updateSavedInvoice(actionId);
  }}
/>
```

The pattern owns pending/error/cancellation state. The callback owns persistence and updating the application's saved record. When callbacks perform additional work after awaiting a service, check the signal before updating saved state or showing a toast, especially if the service does not honor AbortSignal.

Prefer the public pattern exports for these workflows. `useAsyncAction` is an internal implementation module, not an exported application contract. Do not copy its lifecycle or import it by an internal file path to recreate a supported pattern. For a missing capability, describe the limitation; use public primitives for the application composition when necessary.
