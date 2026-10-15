# Compose and validate

## Before JSX

- Identify the user's task, information to show, primary action and outcome.
  Map each need to the thirty-eight registry families. Prefer an inline task and a
  clear primary Button; reserve Sheets for focused modal detail/editing.
- Use Tabs for related views, Switch for a boolean preference, DropdownMenu
  for contextual commands, and Toast for transient outcomes. These are not
  navigation links, chart or date picker APIs. Use Table for native tabular content.
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

## DataTable v1

Use Table for simple tabular content or full native cell composition. Use
DataTable when local data needs text sorting and pagination (10 rows by default).
Supply typed columns (`id`, `header`, `cell`, optional `sortValue` and `rowHeader`),
`data`, stable unique `getRowId`, `caption`, `locale`, translated `labels`, and
`emptyContent`. Sorting uses Intl.Collator with numeric ordering and base
sensitivity; equal values retain their input order. Do not mutate records or
use array positions as IDs. DataTable owns one internal sort/page state; there
are no controlled modes or server data framework. Changing sort resets page one.

The application filters before passing data. Change `resetKey` when search or
filters change, even if the count stays equal. A shrinking result clamps the
page permanently. `pageSize` is a positive integer (default 10); fractions are
floored, values below one clamp to one, nonfinite values use ten.
`labels` contains previous/next/pagination strings and sortAscending(header),
sortDescending(header), resultCount(from,to,total) text functions.

Use application-owned emptyContent to distinguish zero source records from
filtered-out results. For loading/error, pass empty data and useful persistent
content; loading=true announces busy and disables pagination. Retry belongs to
the host. The example's explicit presets do not fetch data or randomly fail.

Keep filters, records, validation and create/details Sheets in the application.
Creating records must preserve active filters; a newly saved customer may be
filtered out. Reuse CreateCustomer's validated flow with an optional initial
list and render callback, keeping its synchronous duplicate-save guard, draft
discard and trigger restoration. CustomerDataTable demonstrates a menu-to-Sheet
transition and restores the originating row action after closing details.
Use bdi for names and bdi dir=ltr for emails. Keep source data in memory.
There is no selection, bulk action, editing, deletion, virtualization or sticky
column API. No extra dependency is required.

## Small native controls

Badge displays meaningful status text using neutral (default), success, error or info; meaning must remain readable without color. Keep it noninteractive. It has no automatic announcement, dismissal, size or variant API.

Checkbox requires label and supports helper/error, invalid and native checked/defaultChecked, onChange, required, disabled, name/value, form and HTMLInputElement ref. Read event.currentTarget.checked in onChange. It reuses Field associations internally; className/style/ref stay on input. Error marks invalid without validating. No indeterminate or DataTable selection capability.

RadioGroup requires label, name and options (unique nonempty stable value, string label, optional disabled). Use a distinct shared name for each independent group; native radios enforce one choice. Fieldset/legend provides the group name; helper/error/external aria-describedby describe group and inputs. disabled disables the whole fieldset, options may be independently disabled, required forwards to inputs and form associates each input externally. Ref targets HTMLFieldSetElement. Use value/onValueChange for controlled mode or defaultValue for native uncontrolled selection. Do not add a custom keyboard handler or selection-card behavior.

Textarea mirrors Input's optional label/helper/error convenience mode and separate Field composition mode. Do not combine those modes. Without label, supply a native label or accessible name. Native rows (default 3), name/form, value/defaultValue, editing/selection events, disabled, readOnly, className/style and HTMLTextAreaElement ref remain on the textarea. Resize vertically; no automatic growth or character counter.

All three native controls preserve uncontrolled form submission/reset and cancellation of reset. Native reset does not emit change callbacks. Controlled modes require caller state updates and application onReset to restore controlled values. Keep validation rules/messages/focus in the application. Use [FeedbackForm](examples/FeedbackForm.tsx) for a small combined example; its Check form action validates required notes and reports the result. It demonstrates a persistent associated error, first-invalid focus and native reset. It does not save values or add a service or customer workflow.

## Avatars, tooltips, centered dialogs and empty content

Use Avatar(name, src?, fallback?, size?) with sm by default. Supply meaningful name and deliberate Arabic fallback; fallback remains during loading/failure and resets when src changes. Internal portrait/initials are hidden from AT so name is announced once. Use decorative beside equivalent text. AvatarGroup uses members in reading order with unique stable ids, label and translated overflowLabel(count); its noninteractive +N includes the remaining names for AT. Limits floor/clamp to at least one, default four for nonfinite values; groups wrap within narrow containers.

Tooltip trigger must forward ref, native events and ARIA to a focusable element. Do not replace its accessible name with tooltip content or put essential instructions only in a tooltip. content is a short string, never a button/link/form. Hover delays 500ms, focus is immediate, Escape dismisses without losing trigger focus. The tooltip can be hovered and portals into the surrounding provider/overlay. Preserve descriptions already supplied on the trigger. Positioning/collision uses @radix-ui/react-popper 1.4.0.

Modal requires title, description and translated closeLabel; trigger/children and optional footer mirror Sheet. initialFocusRef may select a focusable descendant; otherwise Radix chooses its first focusable element. Controlled open requires onOpenChange to update it; omit open for internal usage. There is no defaultOpen. For either mode, a footer may use @radix-ui/react-dialog Close asChild with Button. Tab stays contained, Escape/outside dismiss and the mounted trigger receives focus again. Menus/Select/Tooltip must retain the nearest Modal container; test dismissal of each layer before the dialog. Do not add stacked/nested dialog examples or a manager.

EmptyState(title, description?, illustration?, action?) leaves content and actions to the application. Omit illustration, use one exported geometric SVG or supply a custom decorative node. The slot is aria-hidden; never place interactive controls there. Text conveys meaning, action conveys its actual result. Use the three original exports NoRecordsIllustration, NoSearchResultsIllustration and GettingStartedIllustration with tokens in either theme. [EmptyStateExamples](examples/EmptyStateExamples.tsx) reveals a guide and returns with Back; it does not create a customer, persist values or pretend to call a service.

For nested Select/Menu in Sheet/Modal, use a single resolved Radix dismissable-layer and focus-scope module. The verified dependency graph needs the host overrides in [README.md](README.md#shared-radix-overlay-infrastructure), because source copies do not include root package.json. Test Select Escape as well as selection: one Escape closes Select and restores its trigger, the next closes the dialog. Merely putting portals inside a dialog does not unify duplicated primitive contexts.

## Persistent feedback and loading

Use Alert for inline persistent feedback; Toast for transient event feedback. Tone conveys meaning independently of accent. Static examples use announcement=off. Choose polite for routine live updates and assertive only for urgency; do not announce all error-colored content as urgent. Supply action ReactNode and own any dismissal in application state.

Use Skeleton to reserve simple text/rectangle/circle space, always hidden from assistive technology. The host sets aria-busy and provides a single loading status. Use Spinner with label for a standalone status; use decorative beside equivalent announced text. Reduced motion stops shimmer/pulse/rotation; text and static shapes keep loading understandable.

Progress is a named 0–100 bar: value=0 is real zero, value=100 is completion, finite out-of-range values clamp. Omit value or pass null for unknown progress; nonfinite values also omit numeric claims. Explicit locale handles language independently of direction. Updates and completion behavior belong to the host. Use explicit example states without timers or fake requests.

Avatar photo examples import bundled ai/assets/sara.jpg and omar.jpg. Copy those assets and their provenance/license alongside the source. Initials-only, custom URL and mixed groups are compositions of the existing src prop; they add no public appearance or upload API.

## Structure and navigation

- Card is a quiet surface. Compose CardHeader, optional CardTitle (h3) and
  CardDescription (p), CardContent and CardFooter. All retain native attributes,
  events and React 19 refs. Use native headings for the correct document outline.
  Place Buttons/links inside the header/footer; never add a clickable surface,
  role=button or a tab stop as a library pattern.
- Accordion reveals detail beneath headings; Tabs switches related views.
  Supply unique stable nonempty values and noninteractive label content. Start
  closed or use an enabled defaultValue; controlled value requires onValueChange
  updating the host. Empty string closes all. collapsible defaults false,
  headingLevel=3. Use the compatible Radix Accordion dependency; do not build a
  keyboard engine, nested arrangement or multi-open configuration. Verify disabled
  skipping, arrows/Home/End, Enter/Space and linked regions in both directions.
  Closed panels are immediately inert and aria-hidden during exit motion.
- Breadcrumbs names a native nav with caller-translated label. Supply label/href
  items with real destinations; final item is text with aria-current=page even if
  href was supplied. Missing ancestor href is static text. Decorative separators
  mirror in RTL. Allow wrapping and isolate mixed identifiers with bdi.
- Pagination is controlled navigation only. Supply page, totalPages,
  onPageChange and translated labels.navigation/previous/next/page(number).
  Normalize inputs in application state when the data requires it; the component
  only normalizes display and requested target pages, with no render callback.
  Finite values floor/clamp, nonfinite become 1; zero total displays one inert page.
  Locale controls digits separately from names. Boundaries and disabled prevent
  navigation; current number has aria-current and emits no change. Ellipses have
  no action. Keep content slicing, page size, filter/reset, loading/fetching and
  announcements in the application. DataTable has its own internal data lifecycle;
  do not wrap it with a second page state or invent a server data API.

[StructureExamples](examples/StructureExamples.tsx) demonstrates local note
reveal, disclosure, real anchor destinations and slicing a small list. It adds no
backend, saved state, fake service or customer workflow.

## Charts

Use Line/Area for trends, Bar for comparisons, Donut for positive parts of a whole.
Supply a visible summary and nonempty accessible label, and enable dataTable for
exact values. Keep ISO chronological rows in application order even in RTL.
Missing values remain gaps, never manufactured zeros. A summary explains the
meaning; tooltips add detail. Share ordered series definitions and explicit token
colors across comparable charts. Compose Card/Field/Select around charts; period
selection, data slicing and totals belong to the application. See ChartExamples.
No stacked plots, generic configuration, backend, saving or DataTable changes.

## Connected dashboard composition

Keep full-page example layout, navigation anchors, records and filters in the
host. One provider coordinates language/direction and theme across all controls
and portals. An overview can use a native definition list rather than a Card per
metric. Derive chart rows, channel totals and period metrics from one filtered
order dataset; count customers independently. Creating a customer adds no orders.

Preserve active customer filters when saving. If they hide the new record,
explain that persistently and provide a reveal action that selects that record
and resets DataTable's page, plus a clear-filters action to return to everyone.
Explicit loading/error previews should withhold unavailable numbers rather than
claim zero; an empty source dataset and no matching filter results need different
messages. Preview state belongs to the example, with no fake fetch or persistence.

For section links inside a navigation Sheet, hand focus to the destination after
Radix restores the mounted trigger (for example, from the trigger's focus event).
Scheduling destination focus immediately on click can race dialog dismissal.
Cancel/Escape still restores the trigger. Keep section targets focusable with
`tabIndex={-1}` and retain native links for real destinations.

## Sidebar navigation composition

Compose a host-bounded Sidebar at inline-start, with Header, named Content/nav,
and Footer. Group headings are optional. Item is a native anchor; Action and
Disclosure are native buttons. Supply real destinations and connected actions.
Use SidebarLabel for hideable slot text and Toggle for root collapse. Preserve
native attributes/refs and modifiers; never replace links with router-like buttons.
Caller owns active/activeChild and any destination focus. One level of children;
rail parent activation expands the root and reveals those children. Controlled
collapsed and open each need their change callback. Hidden content is inert,
focus moves to its visible parent/toggle, and labels use existing Tooltip.
Reuse this navigation inside Sheet on mobile, with mounted trigger and the
post-restoration destination focus handoff described above. No new overlay system.
See SidebarExamples for working local notes and account details.

Compose branding and account icon/avatar + SidebarLabel inside SidebarIdentity
(native div attributes/ref). SidebarHeader places identity and toggle on opposite
ends of a direction-aware row; the rail stacks centered logo then expand toggle.
Footer identity centers the actual avatar box. Rail headings/label spacing and
scrollbar width are removed while native navigation scrolling remains available.
The richer SidebarExample has seven top-level entries in two groups, three library
children and initially active Components. Documents/People/Notifications counts
come from local sample lists. Selection, recent activity, reminder clearing,
summary preferences and account details change real local content. These are
fictional library examples, not services or saved product data.

## Tags and list filters

Compose TagInput with a label/helper/error or exactly one external Field. Enter
commits trimmed strings; duplicates use exact case-sensitive matching. Keep IME,
selection and plain paste native. Ref/className/style target the draft input,
whose onChange is separate from array onValueChange. Submit committed arrays with
repeated name entries; use FormData.getAll. Draft is omitted, disabled omits values,
read-only submits. Uncontrolled reset restores initial tags without callback after
cancellation checks; reset controlled arrays in the host onReset. The container
owns draft focus styling; remove buttons retain distinct keyboard rings. Error
borders remain visible alongside focus. No native
required-tag validation or autocomplete. labels translates built-in feedback.

FilterBar is layout and removable active chips. Put existing Input in search and
Select/Button in children. Supply stable filter ids, label, removeLabel and
onRemove; optional onClearAll/clearLabel. Own all filtering, counts and page resets.
Disable composed controls yourself when disabling removal/Clear. Focus after
removal goes to the next chip, a control or the group. Preserve the dashboard's
customer reveal and clear behavior; no additional dashboard data model.

Compose InputCopy for a real value supplied by the application. Field naming and
native selection match Input; ref remains on the read-only input. Copy full value
with navigator.clipboard.writeText and report success only after resolution.
Keep the button inside the input at logical end with reserved text padding. Success
uses a temporary check icon and a visually hidden polite announcement, with no
visible success row or text. Keep the busy button focusable with aria-disabled and
guard repeated copying. Preserve the button keyboard ring and native input
selection. Translate copy/copied/failure with labels. On failure keep the selectable input;
never manufacture success or add execCommand. Replacing value or unmounting cancels
pending results/timers. [TagInputExamples](examples/TagInputExamples.tsx),
[FilterBarExamples](examples/FilterBarExamples.tsx) and
[InputCopyExamples](examples/InputCopyExamples.tsx)
show local form values, filtering three actual sample documents and copying real
source paths. Examples do not persist data or pretend to run services.

## Local files and colors

Use FileDropzone for local File[] selection. Wire onValueChange to application state, construct FormData from that array, and supply actual upload infrastructure separately. The native input clears for reliable reselection and has no name/required API. Type/size checks are convenience checks; server validation remains necessary. Multiple appends, single replaces, partial rejections preserve valid files, and exact name/size/type/lastModified duplicates give feedback. No previews or directories.

Use ColorPicker for opaque #RGB/#RRGGBB values; commit normalizes #RRGGBB. Keep incomplete text while editing, commit on Enter/blur, and retain selected color on invalid text. Named presets and native chooser synchronize the same value. name submits the committed hidden value; local error feedback does not block submission. Controlled parents update onValueChange and restore values onReset; uncontrolled reset restores initial defaults without callbacks. Use the compiling examples linked in README, preserve Field associations and LTR HEX, and keep the local sample independent from system accent.

For one bounded numeric value use Slider; use OTPInput for a fixed-length digit
code and DatePicker for a single Gregorian date. Their examples are local forms,
not services. Preserve code strings (including leading zeros) and date-only
YYYY-MM-DD strings; never serialize date-only values through UTC. Use their Field
label/helper/error associations, supply application validation and controlled
onReset handlers, and keep DatePicker inside the existing scoped overlay provider.
Read ai/README.md for required calendar/popover dependencies and Radix overrides.
