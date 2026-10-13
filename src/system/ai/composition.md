# Compose and validate

## Before JSX

- Identify the user's task, information to show, primary action and outcome.
  Map each need to the ten registry families. Prefer an inline task and a
  clear primary Button; reserve Sheets for focused modal detail/editing.
- Use Tabs for related views, Switch for a boolean preference, DropdownMenu
  for contextual commands, and Toast for transient outcomes. These are not
  navigation links, Alert, chart or date picker APIs. Use Table for native tabular content.
  For an unavailable request, name the gap and propose a concrete alternative:
  for example, an application-owned native date input styled with shared
  tokens. Do not import an invented `DatePicker`,
  silently add a family, or describe ordinary HTML as a Tiraz component.

## Content and configuration

- Start with useful Arabic copy and compact defaults. Use IBM Plex Sans Arabic
  and the shared title/heading/body/meta tokens for clear hierarchy. Animate
  whole labels; never split Arabic into independently animated characters or
  insert letter spacing that breaks shaping. Labels are caller-owned.
- Coordinate `lang` on a host ancestor **above SystemProvider** (or the document)
  and `SystemConfig.direction`: Arabic/RTL,
  English/LTR. Changing direction does not translate copy; changing copy does
  not set direction. A `lang` only on `<main>` misses sibling portal/Toast
  content; SystemProvider has no `lang` prop. Use `<bdi dir="ltr">INV-42</bdi>` (or equivalent isolation)
  for Latin identifiers within Arabic, keeping punctuation correctly ordered.
- Use logical CSS (`padding-inline`, `margin-block`, `inset-inline-end`, etc.)
  and shared spacing, radius, typography, surface/text/border/action tokens.
  Inspect `tokens.css`; do not introduce arbitrary colors or dimensions for
  the library controls. Theme/accent settings propagate through the provider.
  Let content columns shrink with `minmax(0, 1fr)` and `min-inline-size: 0`;
  contain long tables/code in scrolling wrappers rather than overflowing the page.
- Keep success/error/destructive meanings distinct from accent colors. Honor
  both the application reduced-motion setting and OS preference; false in
  config cannot force motion when the OS asks for reduction.
- Keep persistent configuration separate from transient action state. Button
  `state` is supplied by the application: await the real operation, show its
  result and return to the intended state. Clear any application timers on
  unmount; use error handling. Tiraz does not save data or simulate requests.

## Interaction contracts

- Read required and conditional props in the registry before composition.
  Icon-only Button needs a meaningful `aria-label`; Sheet needs title,
  description and closeLabel; Tabs needs label and valid enabled values.
- Controlled `value`, `checked` or `open` requires its change callback to update
  caller state. Use documented defaults for uncontrolled mode; wrappers do
  not invent `defaultOpen` or forward every Radix Root prop.
- Give overlay triggers accessible names and preserve injected Radix props/ref.
  Keep nested menus in Sheet's descendant scope; do not move them to body or
  replace keyboard/focus handlers. Test navigation during opening motion as
  well as after settling, genuine pointer hover, scrolling and Escape/Tab.
- Put ToastProvider inside the intended SystemProvider. Invoke useToast from
  below ToastProvider; otherwise it throws. At most three active notices are
  shown. Hover/focus pauses expiry; essential errors must also remain available
  in persistent, associated application text. Avoid immediately removing the
  trigger that should receive restored focus. An active Toast is a Radix
  dismissable layer: Escape can close it before an open Sheet even when focus
  is in the Sheet. Verify one layer at a time and check actual dismissal/DOM
  removal and focus restoration; do not assume the first Escape closes the Sheet.

## Validate the rendered application

1. Type-check real imports, props, examples and callback arguments. Ensure CSS
   and local font files load; inspect the scope of provider and portal nodes.
2. Exercise the primary action with success/error paths and rapid repetition.
   Verify transient feedback does not overwrite shared configuration.
3. Inspect Arabic/RTL and English/LTR, light/dark, compact/standard density,
   typography/radius/accent changes, narrow/short viewports and reduced motion.
   Check readable shaping, isolated identifiers, wrapping and internal scroll.
4. Use keyboard only: names, visible focus, Tabs arrows, Switch Space, menu
   ArrowDown/Home/End/Enter/typeahead, nested overlays, Escape/Tab dismissal and
   focus restoration. Move the pointer after keyboard navigation; repeat Toast
   dismissal/expiry. Check modal focus stays within its Sheet.
5. Inspect accessible names, roles, descriptions and announcements, including
   representative screen-reader checks where available. Automated type, DOM,
   axe or browser assertions are evidence, not a guarantee of accessibility.
6. Report verified behavior, unavailable capabilities and untested conditions
   honestly. Keep source-copy checks independent of workbench entry files.

## Form foundation

Start text entry with Input: `<Input label="Name" helper="As shown on the invoice" error={error} required name="name" />`. Input reuses Field internally when label is supplied; helper/error accompany labeled mode. An error message marks invalid but does not execute validation. Without label, use a native label or ARIA for standalone Input. Ref, native attributes/events/form behavior, className/style and external description IDs remain on the actual input. Do not combine convenience label/helper/error with field. Field remains a lower-level composition helper: `<Field label="Status">{field => <Select field={field} options={options} />}</Field>`. Existing Field + Input composition remains supported. Field never clones arbitrary children or performs validation. Supply rules, errors and focus management in application code. Input/Select merge external aria-describedby IDs; field owns the control ID. Native required/invalid state is forwarded, but error display does not mean Tiraz validated anything.

Input supports text/email/password/search/tel/url, default text/sm; use its native events, value/defaultValue, form/name/autocomplete and React 19 input ref. Uncontrolled native reset works; controlled Input requires host onReset to restore its value. Select accepts options with unique nonempty value, string label and optional disabled. Empty value shows placeholder. Controlled Select must update value on onValueChange, including successful reset callbacks. Tiraz defers reset until event dispatch completes; cancelling onReset or onResetCapture preserves value and emits no reset callback, including external form associations. While Select stays mounted, reset follows its currently associated form even if that form appears later or is replaced under the same ID. Replacement preserves selection; resetting a former form has no effect. Radix's hidden native select handles FormData/required. Static checkValidity does not move focus. For interactive reporting/submission, actual native focus redirects to the visible trigger. An ancestor onInvalid/onInvalidCapture can preventDefault and focus an error summary; Tiraz respects that ownership. App validation supplies persistent associated messages and focuses the first invalid control.

Select uses Radix Select rather than DropdownMenu. Scope its portal to the nearest provider/Sheet, constrain available height and preserve internal scroll and keyboard/typeahead/focus behavior. Do not move it to body. Opening fades only, preserving stationary-pointer hit targets. Honor both reduced-motion sources. Search and multi-select are future scope.

The CreateCustomer example is application code: required name, optional validated email, single status, semantic Table, synchronous save guard and Toast. Discard drafts on all dismissals, verify a clean reopen and keep the trigger mounted for focus restoration. State exists only while mounted, with no backend persistence.

## Table foundation

Compose Table with TableHeader, TableBody, TableRow, TableHead and TableCell.
Table renders a native table inside a keyboard-focusable horizontal scroll container.
Use caption for a visible native table name, or aria-label/aria-labelledby when no
caption is supplied. The scroll region inherits this name; containerProps exposes
separate native div attributes/ref. Table's attributes, className/style and ref stay
on the table. Preserve the container's default tabIndex=0 for keyboard scrolling.
TableHead defaults to scope="col"; use scope="row" for row headers. Native colSpan
and headers work. Use stable unique data IDs as React row keys. Render empty text
as a cell spanning the columns; Table never manufactures data or empty messages.
Shared density/text scale/theme/direction apply through SystemProvider. Cells wrap;
a 32rem table minimum gives columns space and stays inside its scrolling container.
Use bdi for mixed Arabic/English names and bdi dir="ltr" for email addresses.
There is no sorting, filtering, pagination, selection, editing, virtualization or
sticky-column API. Keep the connected CreateCustomer flow on the Sheet page.
