# Use Tiraz in an application

Tiraz is an Arabic-first, source-owned React dashboard library with **forty-six**
component families: Button, Tabs, Switch, DropdownMenu, Sheet, Toast, Field, Input, Select, Table, DataTable, Badge, Checkbox, RadioGroup, Textarea, Avatar, AvatarGroup, Tooltip, Modal, EmptyState, Alert, Skeleton, Progress, Spinner, Card, Accordion, Breadcrumbs, Pagination, LineChart, AreaChart, BarChart, DonutChart, Sidebar, TagInput, FilterBar, InputCopy, FileDropzone, ColorPicker, Slider, OTPInput, DatePicker, Steps, Timeline, TaskRows, NotificationList and FileTree.
Toast is an imperative hook/provider family, not an exported `Toast` component.
Input is the normal starting point for text entry; use optional label/helper/error
props for a complete labeled control. Field remains a public lower-level composition
helper and is documented under Input rather than a standalone navigation page.

1. Locate the directory containing `index.ts`, `config.ts`, `tokens.css`,
   `components.css` and `ai/`. Call that directory **source root**. In a full
   checkout it is usually `src/system`; a copied library may live anywhere.
   If it is missing, report the gap and request its location instead of
   inventing an import or installing a different library.
2. Read [registry.json](registry.json) for the relevant family and support
   APIs, then inspect the named source and exported types. Every registry path
   is relative to the source root, **not** the application or checkout root.
   The minimal workbench inspector is not a complete API reference.
3. Follow [composition.md](composition.md), map the user's task to available
   components, and connect events to application behavior. Preserve the supplied
   component props and shared settings unless the task requires changing them.
4. Adapt [the compiling usage example](examples/usage.tsx) to the host app.
   Its imports are relative to this bundle; generated workbench snippets use
   `./system` only as an example. Adjust all imports/CSS paths to the located
   source root. Validate the actual rendered result with the checklist below.

## Copy and setup

Copy the **whole source-root directory**, keeping `ai/`, its JSON/Markdown and
`ai/examples/` and `ai/assets/` (including binary portraits, provenance and license); tests (`*.test.*`) may be excluded. Do not copy only the barrel
or strip documentation from the bundle. No workbench files, root README or
root AGENTS.md are required to consume it. A host agent entry file may point
at the copied `ai/README.md`.

Use the existing project toolchain. The current checkout uses React/React DOM
19, TypeScript and Vite. Use React 19 for the verified ref-as-prop forwarding
through Button/Switch and Radix triggers; earlier React versions are not
verified. Consumer projects need compatible React compilation,
`lucide-react` and Radix packages for direction, tabs, switch, dropdown-menu,
dialog, toast, select, popper and accordion (verified with @radix-ui/react-select 2.4.1). Read the checkout's package/lock files when available;
otherwise inspect imports and resolve compatible dependencies in the host.
No Tiraz installer, CLI, backend or MCP service is needed.

Load the library's `tokens.css` and `components.css` once. Load local IBM Plex
Sans Arabic at weights 400, 500 and 600 (the example imports the corresponding
`@fontsource/ibm-plex-sans-arabic` CSS). Inspect the host font entry; a source
copy does not include `src/main.tsx`. Verify font files load in the browser.
For TypeScript CSS imports, use the host bundler’s declarations (for example,
`vite/client` in Vite), rather than inventing a library API to solve a host
configuration error.

Wrap the interface in `SystemProvider`; configure with
`{ ...defaultConfig, ...overrides }`, not an incomplete config object. Put
`ToastProvider` inside it, and call `useToast` in a descendant. Keep the
provider around overlays so their tokens and direction remain scoped. Set
`lang` on a host ancestor above SystemProvider (or on the document), so sibling
portal and Toast content also inherit the chosen language; setting it only
on `<main>` is insufficient. SystemProvider does not accept a `lang` prop.

The source/type contract wins if metadata drifts. State the discrepancy and
validate against the real implementation; do not silently invent capabilities.

The connected [Create customer example](examples/CreateCustomer.tsx) composes Field/Input/Select/Table with Sheet/Button/Toast. It belongs to the host application and is not a barrel export. Its data lives only while mounted.

Table is a small native HTML foundation. Use [the populated/empty example](examples/TableExample.tsx) for composition; its data stays in the application. Table is not a DataTable or data-grid engine.

DataTable adds client-side text sorting and pagination to Table. Use
[the connected customer example](examples/CustomerDataTable.tsx) for search,
status filtering, create/Toast and row-specific details Sheets. These are
application behaviors, not a general grid API. Explicit populated/loading/empty/
no-results/error presets demonstrate states without fake services.

Badge is static status text, not an action or live region; neutral is the default and success/error/info reuse semantic tokens. CustomerDataTable uses Badge for readable customer statuses.

Use Checkbox for an independent form value, RadioGroup for one choice with native fieldset/legend and a stable shared name, and Textarea for multiline text. [The small preferences form](examples/FeedbackForm.tsx) combines all three with application-owned validation. Its Check form action checks required notes and reports the validation result; native reset restores the controls. These examples are host application code, not barrel exports.

Use Avatar with name and an explicit fallback for deliberate Arabic initials. Its internal image/fallback is decorative; the outer span announces name once. Set decorative when equivalent adjacent text supplies that name. No remote image is required: [AvatarExamples](examples/AvatarExamples.tsx) uses bundled local JPEG portraits with provenance and licensing in ai/assets.

AvatarGroup composes members with stable unique id, name and optional src/fallback. Supply a group label and translated overflowLabel(count). The +N indicator is static; hidden member names remain available. [OverlayExamples](examples/OverlayExamples.tsx) contains a team, a Tooltip details toggle and one Modal display preview. Select and menu actions change/reset that preview; no values are persisted.

Tooltip accepts a focusable trigger and short string content. It preserves refs, handlers, names and external description IDs; hover waits 500ms, keyboard focus opens immediately, Escape dismisses it before a surrounding dialog. Use the already installed @radix-ui/react-popper positioning primitive (verified 1.4.0); source consumers need it explicitly along with the dependencies above. It portals into the nearest SystemProvider/Sheet/Modal.

Modal uses the same installed Radix Dialog as Sheet, with required trigger, title, description, closeLabel and children; footer and initialFocusRef are optional. Omit open for internal state, or update controlled open in onOpenChange. There is no defaultOpen. Use Radix Dialog.Close asChild for footer dismissal in either mode. Keep its trigger mounted. Nested non-dialog overlays stay scoped inside content. Use one centered dialog; no stack or global manager.

EmptyState requires title; description, illustration and action are optional. Custom illustration content is decorative and must contain no focusable controls. NoRecordsIllustration, NoSearchResultsIllustration and GettingStartedIllustration are original text-free token-based SVG exports. [EmptyStateExamples](examples/EmptyStateExamples.tsx) shows all three and an application action that reveals a small guide with a working Back action. Omit illustration for text-only content. EmptyState performs no data operation.

### Shared Radix overlay infrastructure

Source-only copies do not carry the repository package.json. For the verified Dialog 1.3.0, DropdownMenu 2.2.0, Toast 1.3.0 and Select 2.4.1 graph, preserve these npm overrides in the **host application's** package.json (or the host package manager's equivalent resolutions), then reinstall with the host toolchain:

```json
{
  "overrides": {
    "@radix-ui/react-dismissable-layer": "1.2.1",
    "@radix-ui/react-focus-scope": "1.3.1"
  }
}
```

These patches are already used by Select. Without a single resolved copy of each primitive, Radix layers maintain separate contexts: Escape in Select can dismiss its surrounding dialog too. Inspect the installed graph (`npm ls @radix-ui/react-dismissable-layer @radix-ui/react-focus-scope` for npm); verify nested Select Escape closes only Select, restores its trigger, then a second Escape closes Sheet/Modal. The required source dependencies include @radix-ui/react-popper 1.4.0 for Tooltip. Do not strip this dependency guidance when copying ai/.

## Inline feedback and loading

Use [FeedbackExamples](examples/FeedbackExamples.tsx) for explicit local states and application-owned actions. Alert requires title; optional description, action and neutral/success/error/info tone. `announcement="off"` is the static default; `polite` uses status for routine updates and `assertive` uses alert for urgent updates only. Semantic tones do not follow accent. The application owns dismissal; do not invent an internal queue or dismissal API.

Skeleton is always decorative/aria-hidden. Its shape is text (default), rectangle or circle; style/className provide native sizing. The host supplies aria-busy and one loading announcement. Spinner requires label unless decorative=true; adjacent text owns the announcement in decorative mode. It has sm/md sizes and no Button integration API. Both loading animations stop for application or OS reduced motion, with a static indicator retained.

Progress requires a visible accessible label. Finite value clamps to 0–100; missing, null, NaN and infinity select indeterminate mode with no aria-valuenow or value text. showValue defaults false. locale defaults from provider direction (rtl=ar/ltr=en); explicitly set locale if language differs from direction. Arabic uses Arabic digits. Visible/accessible percentage rounds to an integer while aria-valuenow retains the clamped numeric value. Do not invent totals, steps or completion callbacks.

## Bundled Avatar photos

Avatar's src API and loading/failure/source-change fallback are unchanged. The documentation offers initials/photo plus an optional image URL; a blank photo URL selects [sara.jpg](assets/sara.jpg). Group examples mix Sara/Omar photos with initials. These are fictional AI-generated samples, bundled under the project MIT license; see [provenance](assets/README.md) and [license](assets/LICENSE.txt). They identify no real people.

Copy ai/assets with the library and preserve local asset imports in generated examples. A consumer needs image-module declarations/bundling (for Vite, vite/client), not a remote service. Custom URLs are application-owned; documentation neither uploads nor stores images. Test loading, errors, source replacement/removal and single accessible naming.

## Structure and navigation

Use [StructureExamples](examples/StructureExamples.tsx) for four small connected
examples. Card groups content with CardHeader, CardTitle (native h3),
CardDescription (p), CardContent and CardFooter. Every part preserves native
attributes/ref. Title, description, header and footer are optional through
composition; use native headings when another level fits the page. Compose
application actions inside header/footer. Card is a surface, never an interactive
control; do not invent a clickable-card or variant API.

Accordion uses @radix-ui/react-accordion (see package/lock for the verified version).
It reveals one section below persistent headings; Tabs switches related views.
Supply items with unique nonempty stable value, label, content and optional
disabled. Keep label free of nested controls. value/onValueChange controls it;
defaultValue initializes internal state and omission starts closed. Empty string
means none open. collapsible defaults false; headingLevel defaults 3 (2–6).
Radix owns ArrowUp/Down, Home/End and Enter/Space and button/panel associations.
Closed panels become inert and aria-hidden immediately while visual exit motion finishes. No multi-open or nested configuration. Application and OS reduced motion both win.

Breadcrumbs requires items and a translated label for its nav landmark. Items
have label and optional href; ancestors with href are native links, and the final
item is always current-page text with aria-current=page. An ancestor without href
is static text. Caller supplies real destinations; the example targets real local
sections using useId. Separators are decorative and mirror in RTL; content wraps.
No routing or overflow menu is supplied.

Pagination requires page, totalPages, onPageChange and labels with navigation,
previous, next and page(number) names. It is controlled; update caller state in
onPageChange. Finite values floor, total clamps to 1–MAX_SAFE_INTEGER and page
clamps to 1–normalized total; nonfinite inputs become 1. Zero total displays one
inert page. Normalization never emits a callback during rendering. Clicking the
current number emits none. At most seven number/ellipsis slots; ellipses are
noninteractive. disabled disables all Buttons. locale=ar/en defaults from direction
and controls displayed digits independently of translated labels.

The caller owns fetching, filtering, page size, reset and content selection. The
example slices a bounded local list (one guide note per page, at most 20 pages).
That limit is for the example, not the component. DataTable keeps its existing
internal sorting, reset/clamping, busy state and connected actions unchanged.

## Charts

Use [ChartExamples](examples/ChartExamples.tsx) for single/multiple series, missing,
zero, single point and long-label samples, plus a connected application-owned
analytics Card. Its Select changes real in-memory rows and totals. All data is
explicitly sample data; no backend or persistence is implied.

Install `recharts@3.10.1` and `react-is` matching the host React version (verified
with React/React DOM/react-is 19.3.0). Recharts supports React 19 through its peer
contract; no Tremor or shadcn kit is imported. All rendering comes from Recharts.
Use LineChart, AreaChart and BarChart with `data` rows (`category` plus numeric
series keys), `series` (`key`, `label`, optional CSS `color`), required `label`
and `summary`. DonutChart takes `data` with unique `key`, `label`, `value` and
optional `color`. Keep keys stable and never use reserved `category` as a series
key. Data remains in caller order, including in RTL. Use ISO date strings with
`categoryFormat="date"`; display uses UTC, month/day. Include the year/range in
summary when relevant. `locale` is independent of direction and defaults to ar
after rtl, en after ltr; numberFormat accepts Intl options.

`legend` defaults false; when shown, `interactiveLegend` defaults true and uses
native buttons with aria-pressed. Set it false for static labels. Every series
may be hidden: an explicit message is shown, while the optional `dataTable`
disclosure retains all original values. Removing interactive legend controls restores all series; saved hidden keys apply again when controls return. Missing, undefined, nonfinite and
nonnumeric values are never converted to zero. Line/Area preserve gaps; isolated
points remain visible. Donut draws positive finite values only; table retains
zero/missing/negative values. Empty data and all-zero donuts have explicit states.

Default colors use the system accent followed by the other three paired accents,
resolved before legend filtering. Reuse the same series ordering across charts,
or set explicit colors such as `var(--action)` and `var(--chart-plum)` for stable
comparison. Supply deliberate colors beyond four series. Tooltips, plots and
legends consume the same resolved colors. `grid` is Cartesian only and defaults
true. height defaults 240px and clamps to at least 180px; density changes chrome,
not plot size. Global tokens update in place. No Recharts entrance/update or
position animation runs; subtle CSS emphasis respects OS and system motion.

The named region and Recharts plot reference a visible concise summary supplied
by the app. Tab to the plot, then use arrows for Recharts tooltip navigation.
Tooltip content has a polite live region, but screen-reader announcements were
not manually verified. VoiceOver needs QuickNav off according to Recharts' own
accessibility guidance. Never rely on hover for essential information; provide
an adequate summary and enable the semantic data table for exact values. Do not
claim automated scans establish screen-reader support or full conformance.

## Sidebar

Use [SidebarExamples](examples/SidebarExamples.tsx) for expanded/rail, grouped,
nested and footer navigation, with working local notes and an account details
action. Sidebar is a native aside; SidebarHeader/Footer are slots, SidebarContent
is a named nav that scrolls within the host's bounded height. Position the root at
inline-start in your layout (right in Arabic, left in English). Compact defaults
consume existing tokens and IBM Plex Sans Arabic; no additional dependency.

Use SidebarGroup(heading?) and SidebarItem(label, icon, href, active?, count?) for
native destinations. SidebarAction is a native button for commands. Count is
static/decorative; put essential count meaning in aria-label. All native attributes
and React 19 refs survive. SidebarLabel hides branding/account text in the rail
and makes it inert; keep essential actions outside it. SidebarToggle requires
translated collapseLabel and expandLabel. collapsed/onCollapsedChange controls
the root; otherwise defaultCollapsed initializes internal state once (false).

SidebarDisclosure(label, icon, children) supports one level. open/onOpenChange
controls it or defaultOpen initializes internal state. Supply activeChild when a
child is current. Activating a rail parent requests root expansion and opens its
children; controlled roots/disclosures must update both state callbacks. Hidden
children are not keyboard-focusable. External collapse moves child focus to its
visible parent; hidden slot text moves focus to a toggle or visible item. Existing
Tooltip labels and accessible names remain on rail items. Width/text transitions
respect system and OS reduced motion.

Reuse navigation content in the existing Sheet on mobile. Keep its trigger
mounted and destination headings focusable with tabIndex=-1. Hand destination
focus after Sheet restores its trigger; Escape/outside dismissal restores that
trigger. Sidebar supplies no overlay, router, permissions, workspace service or
application shell. Test long text/counts, short-height scrolling, keyboard focus,
RTL/LTR, both themes and reduced motion in the actual host layout.

The local SidebarExample uses stable `idPrefix` note URLs and follows native hash
history/reloads. Its default is `tiraz-sidebar`; supply distinct stable prefixes
when mounting multiple examples. Keep modified clicks native; apply same-page
selection/dismissal/focus only for unmodified primary clicks.

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

## Tags, filter controls and copying

[TagInputExamples](examples/TagInputExamples.tsx),
[FilterBarExamples](examples/FilterBarExamples.tsx) and
[InputCopyExamples](examples/InputCopyExamples.tsx) contain working
local form, library-filter and copy examples. These store no backend data.

TagInput accepts controlled `value: string[]` / `onValueChange` or an internal
array initialized once from `defaultValue`. Enter adds a trimmed nonempty value;
exact case-sensitive duplicates give feedback. IME Enter does not add. Empty
Backspace removes the last tag; each remove button focuses the draft input.
Paste remains native text, with no splitting, suggestions or autocomplete.
`maxTags` is an optional finite nonnegative integer cap (floored/clamped;
nonfinite means no cap); caller arrays remain authoritative. At capacity the
input remains editable and removal remains available. Disabled/readOnly prevent
addition/removal. `labels` translates remove(tag), duplicate and maximum(count);
defaults follow direction, so provide labels if language differs from direction.

TagInput shares Input's mutually exclusive label/helper/error convenience mode
and separate `Field` / `field` composition. Without either, supply a native or
ARIA name. External descriptions merge; ref, className/style and editing events
belong to the draft input. `onChange` observes draft editing; `onValueChange`
reports array additions/removals. Preventing default in onKeyDown cancels built-in
key behavior. No required-tag/native validation API; application owns validation.
`name` submits one hidden entry per committed tag (use FormData.getAll); the
uncommitted draft is omitted. Disabled entries are omitted, read-only entries
submit. Native uncanceled reset restores initial uncontrolled defaultValue without
onValueChange; controlled arrays need application onReset. Both modes clear draft
and feedback after uncanceled reset, including external `form` association.
When the draft is focused, its rounded container supplies the native-style focus
ring; the draft has no second outline/shadow. Tag-remove buttons keep their own
keyboard rings. An invalid border and focus ring remain visible together.

FilterBar is a named group (`label`) containing `search` and `children` ReactNode
slots. Compose existing Input, Select and Button using their own props. Supply
`filters` entries with unique stable id, label, removeLabel and onRemove; optional
onClearAll/clearLabel appears only when active entries exist. The application owns
values, filtering, counts and pagination reset. `disabled` affects removal/Clear
only; disable composed controls separately. Native div attributes/ref remain.
Controls/chips wrap. Removal focuses the next chip, available control or group;
Clear all focuses a control/group. No engine, router, persistence or new keyboard
model. Dashboard customers reuse this composition with the original connected
search/status/filter reset, sorting, pagination and hidden-new-customer reveal.

InputCopy requires a string value and uses the same Field convenience/composition
contract as Input. Native attributes/ref and selection remain on a read-only
input; copy writes the full underlying string, including visually hidden text.
The real copy button sits inside the input boundary at logical end (right in LTR,
left in RTL), with reserved input padding and its own keyboard focus indicator.
`labels` translates copy, copied and failure (defaults follow direction). After
clipboard writing resolves, the icon becomes a check for two seconds and a
visually hidden polite status announces success. No visible success text or row. Pending copying keeps button focus, marks the
control busy and prevents repeated activation. Rejection/unavailable clipboard gives persistent manual-copy guidance;
the value remains selectable. Value replacement/unmount invalidates pending
feedback and clears timers. Disabled disables input/copy. Clipboard capability
and permission belong to the browser; there is no execCommand fallback or
permission manager. No native onChange/defaultValue/readOnly/type API.

## Files and opaque colors

Use [FileDropzoneExamples](examples/FileDropzoneExamples.tsx) for local selection/removal and an honest report of selected names. `value: File[]` / `onValueChange` controls it, or `defaultValue` initializes once. `multiple` appends; single mode replaces with the first valid file. `accept` supports comma-separated extensions, MIME types and MIME wildcards. Browse/drop share checks; `maxFileSize` is bytes, `maxFiles` is a count. Finite counts floor/clamp to zero; finite size clamps to zero; nonfinite limits mean no cap. Partial rejection retains valid files; total rejection preserves the prior list. Same exact name/size/type/lastModified means a duplicate, ignored with feedback both within/across selections. Removing it permits reselection. The picker clears its native FileList after each browse, including rejected files, so selecting the same file again triggers a change.

FileDropzone uses Input's label/helper/error or separate Field contract. Native attributes/ref/events target the hidden native file input; accessible Browse/removal use native buttons and removal focuses Browse. `labels` translates browse/drop/remove(file)/rejected(file,reason); reason is type|size|count|duplicate. No name/required API: construct application FormData by appending the selected File array, **not** the cleared native input. Native `onChange` sees the raw browsing FileList before clearing; `onValueChange` reports validated selections/removals and never reset. Uncontrolled uncanceled form reset restores initial defaultValue and clears feedback; controlled arrays need application onReset. External form association is supported. Client type/size checks are convenience checks, with unreliable MIME metadata; validate on the server. Actual upload, progress, storage and server validation belong to the application. No networking, image preview or directory upload pipeline.

Use [ColorPickerExamples](examples/ColorPickerExamples.tsx) for a local colored sample, independent of the Tiraz system accent. `value` / `onValueChange` controls it, or `defaultValue` initializes once (default #316746). Supply valid opaque RGB strings: #RGB/#RRGGBB normalize to uppercase #RRGGBB on commit. Invalid value/defaultValue props fall back to #316746; invalid swatches are omitted. `swatches` entries have translated label and valid value; [] hides presets. Defaults are named Green/Blue/Plum/Clay. Selection has aria-pressed and a check mark; keyboard focus is distinct.

The HEX input preserves incomplete/invalid text until Enter/blur commits; invalid commits explain the accepted formats without changing selected color. Swatches/native chooser commit immediately and synchronize HEX. `onChange` observes HEX editing; `onValueChange` reports changed committed colors only. Ref/native attributes target the LTR HEX input. Use the same Field convenience/composition contract as Input. `labels` translates chooser/swatches/invalid; defaults follow direction. Native chooser appearance varies by browser. No transparency, hue/saturation canvas or eyedropper.

ColorPicker `name`/`form` submits one hidden committed #RRGGBB value, never the draft. Disabled controls omit it. Invalid-draft feedback does **not** itself block submission; caller-supplied native constraints (such as required/pattern on HEX) still apply and can block it. The application owns form validation. Native uncanceled reset restores initial uncontrolled defaultValue without callback and clears draft/feedback; controlled values require application onReset. Neither family persists data or modifies system accent configuration.

## Slider, OTPInput and DatePicker

Use [SliderExample](examples/SliderExamples.tsx) for a local adjustable number,
[OTPInputExample](examples/OTPInputExamples.tsx) for local completeness without
verification and [DatePickerExample](examples/DatePickerExamples.tsx) for a selected
date summary. They have no backend. Each supports controlled/uncontrolled examples
and explicit form reset. Inspect the source and registry for the complete API.

Slider is one native range with min/max/step (0/100/1). It clamps and snaps to
min-based steps, rounds decimal noise, and never exceeds the last reachable step.
formatValue optionally supplies a readout and aria-valuetext. Native pointer,
arrows and Home/End remain intact; horizontal arrows mirror in RTL. Native name
submits the numeric string, disabled omits it. No range or marks API.

OTPInput is one native text input with decorative slots. length defaults to 6,
floors/clamps to 1–12. Accept ASCII, Arabic-Indic and Eastern Arabic digits; public
values normalize to ASCII with leading zeros and partial values preserved. Strip
other characters and truncate extras. Native selection, paste and editing remain
available, including readOnly selection/copy. It stays LTR inside Arabic layouts.
autocomplete=one-time-code and inputMode=numeric are fixed; no verification,
autosubmit or focus movement occurs. Native pattern requires full length for form
validation (empty is allowed unless required); FormData still contains partial
text when read directly. Device SMS suggestions/autofill are not proven by
synthetic input events or desktop automation.

DatePicker is a single Gregorian YYYY-MM-DD (years 0001–9999), or empty string.
Never use new Date(iso) or toISOString to convert date-only values. It converts
local year/month/day fields, keeping the date unchanged across time zones.
locale=ar/en defaults from direction and controls Gregorian localized display.
Inclusive min/max disable dates and Today; invalid bounds are ignored. Invalid
value props show feedback and submit empty. A valid externally controlled date
outside bounds stays visible/submitted with feedback: the application must block
invalid submission. No manual text editor or partial date strings are supported.

The caption uses a native month select and an accessible year menu through DayPicker's
`captionLayout="dropdown"` and supported dropdown components. The year menu reuses
Radix Select, shows at most five rows (fewer when viewport space is limited), and
scrolls through the complete year choices. Arrow keys, Home/End and typeahead stay
with the primitive; Escape closes the year menu before the calendar. They navigate only:
selection, hidden submission value and onValueChange stay unchanged until a day
(or Today/Clear) is chosen. Month navigation crosses December/January logically;
DayPicker's `navLayout="around"` handles RTL icons without a second CSS flip.

`yearRange?: readonly [number, number]` configures the inclusive **direct year
choices**, not date validity. By default the dropdown shows the viewed year ±100
(clipped to 1–9999); it moves with navigation. The viewed year is always included,
even outside an explicit range. Example: `yearRange={[1900, 2100]}` gives a practical
application window while month arrows and calendar keyboard navigation can still
reach earlier/later years. Only min/max constrain navigation and selectable dates;
they also filter year options and disable unavailable month options. Use min/max
when the application needs real date bounds. Nonfinite, reversed or wholly
out-of-domain yearRange values use the default; fractional endpoints are truncated.
No valid dates are silently restricted by the dropdown window.

Install **@daypicker/react@10.0.2** and **@radix-ui/react-popover@1.3.1** and **@radix-ui/react-select@2.4.1** in source-copy
hosts. DayPicker supplies the maintained accessible calendar keyboard behavior and
Arabic/English labels; Radix supplies positioning, layer dismissal and trigger
focus restoration. Preserve the shared Radix overrides documented above. Tiraz's
components.css styles the calendar; do not add upstream default calendar CSS.
Portals use the nearest SystemProvider/Sheet/Modal container. Arrows, Home/End,
PageUp/Down, Enter/Space and Escape follow the primitives. The popup scrolls within
available viewport height; Escape closes it before a surrounding dialog.

All three use label/helper/error or separate Field composition, merge external
associations and forward ref/native attributes to the primary input or date
trigger. DatePicker name/form target its hidden date submission input; disabled
omits it. Hidden input does not provide required/pattern validation; the app owns
validation. Native input onChange is supported for Slider/OTP; onValueChange is
the normalized public value callback. Preventing onChange cancels the callback.
Uncontrolled uncanceled reset restores initial defaultValue without callback;
controlled reset requires application onReset. External/late form associations
and canceled resets follow useEntryReset. Do not add verification or persistence
claims to examples.

DatePicker preserves standalone native htmlFor/implicit label naming and describes
the selected date with aria-describedby. In Field/explicit ARIA modes, its name
includes the visible date or placeholder. No caller label DOM is mutated.

### OTP slot presentation and selection

OTPInput paints digits and a static caret once in an aria-hidden grid; one
transparent native text input remains the sole editor and accessible control.
Grid centering does not depend on font-width estimates or letter spacing.
Only the active slot has a focus outline. Other borders stay neutral, or retain
error styling independently. Native ranges have decorative selection shading.

Clicking a slot positions the real caret before that digit; clicks beyond a
partial code clamp to its end. Shift-click and pointer drag set the same native
selection range used by keyboard selection/copy/paste. Forward selections focus
the last selected slot; backward selections focus the first. A full code's end
caret remains in the final slot. Native input selection events keep the decoration
in sync with keyboard, pointer and programmatic selection changes. Read-only
selection/copy stays available; disabled controls receive no active indication.

## Process steps and event history

Steps is a named native ordered list for an application-owned process. Supply
stable unique nonempty item `id`, `label`, optional `description` and `status`
(upcoming/current/completed/error). Indicators include numbers, checks and error
symbols; accessible status text accompanies them. `orientation` defaults to
horizontal and narrow containers/screens become vertical. Horizontal order follows
the provider direction; no data is reversed. Long inline labels wrap below or
beside indicators without crossing connectors.

Only the first current status receives `aria-current="step"`. Optional `currentId`
overrides that selection, including a current error; an unmatched ID (or empty
string) marks no current step. Statuses stay application-owned. `locale=ar/en`
defaults from direction and controls numbers/default status text; supply a complete
`statusLabels` record for other wording. Labels/descriptions must contain no
interactive descendants.

Omit `onStepActivate` for static display. Supplying it creates real type=button
controls for **every** step and reports the stable ID, without advancing, updating
state or imposing eligibility rules. The application decides what activation means.
Use [StepsExamples](examples/StepsExamples.tsx) for static/vertical display,
optional activation and a three-step local Input/Button form. The form owns
validation, focuses invalid fields, preserves values on Back and reports only
local completion. It sends and saves nothing.

Timeline is a named native ordered list for events with stable unique nonempty
`id`, `title`, optional `description`, `timestamp` text, optional machine-readable
`dateTime`, decorative `icon` and application `content`. Keep events in the exact
order the application supplies; direction changes placement only. Format localized
dates in the application and pass valid HTML date/time strings to `dateTime` for
semantic time elements; timestamps without one are plain text. Isolate identifiers
with `<bdi dir="ltr">`. Icons carry no accessible meaning; put it in the title.
Compose content/actions with existing components. `emptyState` accepts application
content; the fallback text follows direction. There is no trailing connector.

[TimelineExamples](examples/TimelineExamples.tsx) uses clearly marked in-memory
sample data, Dubai-localized fixed sample dates and a button that appends a real
local event at the click time. Data lasts only while mounted. Neither component
fetches, sorts, groups, virtualizes or runs relative-time timers. Both preserve
native ordered-list attributes and refs. Copy these examples with the source
bundle; they import only React, existing lucide icons and the source-root index.

## Tasks and notifications

Use [TaskRowsExamples](examples/TaskRowsExamples.tsx) for expandable **agent-task
execution** rows, and [NotificationListExamples](examples/NotificationListExamples.tsx)
for local notifications. Both preserve supplied order and stable unique IDs.

TaskRows takes items and label. Each item requires id, string title, state
(pending/running/completed/failed) and content; summary is an optional short
string. Pending uses its supplied-order number, running a restrained decorative
Spinner, completed a check and failed an error glyph. State text uses the existing
Badge: neutral pending, info running, success completed and error failed. stateLabels translates all four states; defaults and number digits follow
direction. appearance defaults to capsules; list connects rows with subtle separators.

Disclosure buttons use native Enter/Space, aria-expanded and associated panels.
Content/actions belong inside the panel, outside the noninteractive title/summary
and disclosure button. Disclosure height/opacity animate using shared motion tokens;
reduced motion removes that transition. Whole task surfaces share hover feedback.
Closing panels become aria-hidden and inert immediately, including during visual
exit. The native hidden attribute remains set with a CSS grid override for exit
motion; it is not the sole accessibility boundary. Their content stays mounted to preserve application form values. Controlled collapse
returns focus from that panel to its persistent trigger, without stealing focus
from elsewhere. State updates retain IDs, order, expansion and focus.

Omit expandedIds for internal expansion, optionally initialized by
defaultExpandedIds (default []). Use expandedIds with onExpandedChange(ids) for
controlled expansion; the caller updates that array. Multiple rows may expand.
EmptyState can be supplied through emptyState. Native ul attributes/events/ref
are forwarded. Supply stable unique nonempty IDs; no automatic sorting or state
progression. This corrects the earlier checklist interpretation: there are no
completion callbacks/checkboxes, assignees or manual task controls.

The compiling example starts pending and has Run/Replay, an intentional local
failure, then an explicit local retry to completion. Its timers cancel on replay
and unmount; generation guards prevent earlier runs overwriting later ones. It
never claims real files, emails or backend tasks were processed. Another completed
sample shows illustrative contact/tax-ID matches and stale-record counts directly,
without a note-reveal button. A separate static example shows all four
application-supplied states in either appearance. No agent runtime, networking or
library timer is provided. The TaskRows documentation lives under AI patterns;
ToolCall and ToolChips are not implemented.

NotificationList takes items and label, optional onMarkRead(id), onMarkAllRead(),
labels and emptyState. Items require id, string title, timestamp and read;
description, dateTime, avatar, icon and action are optional. Avatar takes precedence
over a decorative icon. Supply a valid HTML date/time to render time; the host
formats timestamp in its locale/time zone. Count derives from supplied items,
including after application filtering. labels translates unread/read/markRead/
markAllRead; defaults and count digits follow direction. Opening an action never
marks read. Read controls remain mounted and aria-disabled after reading, keeping
focus in All; Mark all disables at zero. Native root attributes/ref target div,
which contains a named ul. Do not add row click handlers.

The notification example owns All/Unread filtering and meaningful local details.
When reading removes the focused control, it focuses the next remaining mark-read
control (previous when the removed row was last), then the selected filter if no
rows remain. Mark all hands focus to that filter. It distinguishes an empty source
from no unread results. Preserve this behavior when adapting filtering to a host.
No task engine, drag/reorder, scheduling, automatic sorting/dismissal, polling,
push permissions, backend or persistence is supplied. No new dependency is needed.

## FileTree

FileTree displays application-supplied files and folders with stable unique IDs; it never reads the filesystem. Use `ai/examples/FileTreeExamples.tsx` (relative to the source root) for a nested project and application-owned sample-string preview. Controlled or internal expansion and single selection are separate from roving keyboard focus. File click/Enter calls `onActivate(file)`; the host decides what opening means. The example preview follows file selection, including Space; arrow focus does not change it. Empty folders are end nodes. Horizontal arrows mirror in RTL; arrows, Home/End, typeahead and * navigate visible nodes. On removal, focus recovers to the nearest visible ancestor or same visible position, then the empty root, without reclaiming outside focus. Supply nonempty names, globally unique stable IDs, and noninteractive metadata/empty content. No upload, editing, search, drag/drop, virtualization, multi-selection or context menu is supplied.
