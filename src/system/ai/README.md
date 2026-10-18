# Use Tiraz in an application

Tiraz is an Arabic-first, source-owned React dashboard library with **sixty-eight**
component families: Button, Tabs, Switch, DropdownMenu, Sheet, Toast, Field, Input, Select, Table, DataTable, Badge, Checkbox, RadioGroup, Textarea, Avatar, AvatarGroup, Tooltip, Modal, EmptyState, Alert, Skeleton, Progress, Spinner, Card, Accordion, Breadcrumbs, Pagination, LineChart, AreaChart, BarChart, DonutChart, Sidebar, TagInput, FilterBar, InputCopy, FileDropzone, ColorPicker, Slider, OTPInput, DatePicker, Steps, Timeline, TaskRows, NotificationList, FileTree, LoadingState, ThinkingIndicator, ThinkingState, ToolCall, ToolChips, CodeBlock, Markdown, StreamingText, ChatThread, ChatComposer, PromptBar, ImageResult, Sources / InlineCitation InsightCards, SelectionActions, ContextMeter, ModelSelector, AskUserQuestions, ApprovalCard, ApprovalFlow, Terminal and ChatApp.
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

Paired light/dark accent presets are `sage`, `blue`, `plum`, `clay`, `lime`,
`amber`, `teal`, `cyan`, `indigo`, `rose`, `slate` and the monochrome `ink`. Set `config.accent` to
one of these keys; controls and focus tokens follow the active theme.

`config.numerals` chooses the digits for Arabic text: `"arab"` (Arabic-Indic
٠١٢, the default) or `"latn"` (Western 012). Every component that formats a
number or date follows it, including under an explicit `locale="ar"`; English
always uses Western digits. IBM Plex Sans Arabic's Arabic-Indic digits are
proportional and the font has no tabular figures, so they do not align in
tables or counters; choose `"latn"` when alignment matters or the product
uses Western digits. Format application figures with
`new Intl.NumberFormat(numberLocale(useSystem().config, language))` so they
match. Digits typed into supplied copy are not converted. Label callbacks such
as `labels.position(current, total)`, `labels.maximum(count)` or
`overflowLabel(count)` receive raw numbers; format visible text the same way.

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

AvatarGroup composes members with stable unique id, name and optional src/fallback. Supply a group label and translated overflowLabel(count). The +N indicator is static and follows config.numerals; hidden member names remain available. [OverlayExamples](examples/OverlayExamples.tsx) contains a team, a Tooltip details toggle and one Modal display preview. Select and menu actions change/reset that preview; no values are persisted.

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

Progress requires a visible accessible label. Finite value clamps to 0–100; missing, null, NaN and infinity select indeterminate mode with no aria-valuenow or value text. showValue defaults false. locale defaults from provider direction (rtl=ar/ltr=en); explicitly set locale if language differs from direction. Arabic digits follow config.numerals. Visible/accessible percentage rounds to an integer while aria-valuenow retains the clamped numeric value. Do not invent totals, steps or completion callbacks.

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
and controls displayed digits independently of translated labels; Arabic digits
follow config.numerals.

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
after rtl, en after ltr; ar digits follow config.numerals and other locales
format as supplied. numberFormat accepts Intl options.

`legend` defaults false; when shown, `interactiveLegend` defaults true and uses
native buttons with aria-pressed. Set it false for static labels. Every series
may be hidden: an explicit message is shown, while the optional `dataTable`
disclosure retains all original values. Removing interactive legend controls restores all series; saved hidden keys apply again when controls return. Missing, undefined, nonfinite and
nonnumeric values are never converted to zero. Line/Area preserve gaps; isolated
points remain visible. Donut draws positive finite values only; table retains
zero/missing/negative values. Empty data and all-zero donuts have explicit states.

Default colors use the system accent followed by the sage, blue, plum and clay
categorical colors, omitting the selected accent from those fallbacks when present.
Colors resolve before legend filtering. Reuse the same series ordering across charts,
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
static/decorative; numeric counts follow config.numerals and strings render as
supplied. Put essential count meaning in aria-label. All native attributes
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
locale=ar/en defaults from direction and controls Gregorian localized display;
Arabic digits in the trigger, calendar and year menu follow config.numerals.
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
defaults from direction and controls numbers/default status text (Arabic digits
follow config.numerals); supply a complete
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

[TimelineExamples](examples/TimelineExamples.tsx) uses fictional in-memory data,
Dubai-localized fixed dates and a «Log a call» action that appends a real event
at the click time. Data lasts only while mounted. Neither component
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
direction and config.numerals. appearance defaults to capsules; list connects rows with subtle separators.

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
ToolCall details individual tool operations; ToolChips summarizes supplied activity.

NotificationList takes items and label, optional onMarkRead(id), onMarkAllRead(),
labels and emptyState. Items require id, string title, timestamp and read;
description, dateTime, avatar, icon and action are optional. Avatar takes precedence
over a decorative icon. Supply a valid HTML date/time to render time; the host
formats timestamp in its locale/time zone. Count derives from supplied items,
including after application filtering. labels translates unread/read/markRead/
markAllRead; defaults and count digits follow direction and config.numerals. Opening an action never
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

## AI activity feedback

LoadingState uses a compact 3×3 pixel grid with `variant="drive" | "dots" | "orbit"`
(default drive), a shimmering label and optional description. Drive/Dots use a
brightness wave; Orbit travels around the perimeter with a dim center. Optional
`elapsedMs` is a finite host-supplied duration, not a library clock. Negative values
clamp to zero; nonfinite values hide the timer. Digits follow provider direction.
Elapsed text and all decorative animation are excluded from announcements.
`indicator="spinner"` remains the compatibility value for the pixel grid;
`indicator="skeleton"` retains the placeholder.
Use Spinner alone for general loading beside existing text, or Skeleton for the
shape of future content. The host owns aria-busy on its actual loading region.

ThinkingIndicator pairs an 18px circle/infinity morph with a shimmering whole word.
`label` is the stable accessible activity summary. Supply optional `words` for
cosmetic whole-word rotation, or omit it for a single label. Blank/empty arrays
fall back to label. `textOnly` removes the glyph. All words share one measured
layout width; Arabic strings remain connected and are never split into letters.
Equivalent arrays on parent updates do not restart rotation. Changed words start
at the first word; the interval clears on change, reduced motion and unmount.
Word transitions do not announce or represent execution progress.

ThinkingState uses a compact four-point activity glyph, the supplied current
summary and a chevron. While `active`, the summary shimmers; when the host sets
active=false, the supplied `label` becomes the plain completed summary. Children
hold brief user-facing activity steps, never private model reasoning. Use native
`ol`/`li` with the example's `tz-thinking-steps` composition if useful; no step engine
or execution log is generated. Use TaskRows for multiple independently tracked tasks.

All three default to `announcement="polite"`; use off when another region owns the
announcement. Only meaningful host label/description changes update live text.
Rotating words, glyph frames and elapsed ticks never change the live region.
Test actual screen-reader speech in the host application.

ThinkingState uses expanded/onExpandedChange for controlled disclosure, or optional
defaultExpanded (false) for internal state. The trigger stays available during
activity. Closed details stay mounted, hidden/aria-hidden and inert immediately,
while visual exit motion finishes. Controlled collapse returns panel focus to its
persistent trigger, even if the host replaces the focused child; deliberate
outside focus stays outside. Detail actions belong inside children.

Native attributes/ref/className/style target div (LoadingState/ThinkingState) or
span (ThinkingIndicator). Shared tokens, direction, typography and themes apply.
Provider AND OS reduced motion stop CSS shimmer, word transitions/rotation and
SVG morphing, leaving a still glyph and stable first word. Disclosure is immediate.
The general-purpose Spinner is unchanged. No animation dependency is added.

See [standalone examples and a live trace](examples/AIFeedbackExamples.tsx).
The trace plays once on mount (reading → matching → summary ready), owns its
elapsed clock and steps, cancels its timers on unmount and replay, and shows the
final summary under reduced motion. Library cosmetic rotation never drives
execution. No real AI/network activity is implied.

## Tool activity

ToolCall records one host-supplied operation: pending, running, completed or failed,
with a readable label, monospace tool name and optional formatted duration. Pass
strings for preformatted input/output/error or React nodes for application-rendered
results. JSON.stringify belongs to the host; never pass a plain object as a node.
ToolCall owns only optional disclosure state (expanded/defaultExpanded and
onExpandedChange). onRetry is a host callback, outside the disclosure button,
shown on failure; focus moves to disclosure before retry.

ToolChips takes a named list of items (stable id, label, state, optional count).
Informational items are spans. onActivate creates a button; connect it to real
behavior before supplying controls/expanded. No built-in details are implied.
Use ToolCall for operation details, ToolChips for compact summaries, TaskRows for
broader tasks, and ThinkingState for a brief application-owned activity summary.
No tool execution, network, permissions, orchestration, execution timers or
private model reasoning is supplied. Only meaningful ToolCall label/state changes
are announced; use announcement="off" when another host region owns announcements.

The portable ai/examples/ToolActivityExamples.tsx includes static states, rendered
output and a run that plays once on mount: read → save → failed, which the user
retries with ToolCall's own Try again; a chip opens and focuses its call. Replay
and unmount cancel stale timers; reduced motion starts at the final state. The
fictional data contains no secrets and performs no tool operation.

## AI response content

CodeBlock, Markdown and StreamingText live under **AI patterns**. Use the
[portable content examples](examples/AIContentExamples.tsx), and install the two
runtime dependencies in the consuming application (a source-only copy has no
repository package.json):

```sh
npm install react-markdown@10.1.0 remark-gfm@4.0.1
```

`react-markdown` supplies the maintained CommonMark parser and React rendering;
`remark-gfm` adds tables, strikethrough, task lists and autolinks. This keeps one
parser and one necessary dialect plugin, with no custom Markdown parser,
highlighting framework or animation dependency. No user-supplied plugins/renderers
are exposed. Preserve their transitive dependencies through your package manager.

CodeBlock takes `code`, optional `language`, `label` and `labels` (copy/copied/failure,
the shared InputCopyLabels type). It copies the original string including leading,
trailing, tab and newline whitespace. Success uses a check icon and a polite hidden
status; failure stays visible with manual selection guidance. Clipboard access
requires a secure context and browser permission; errors never imply success.
Its pre is a named, focusable internal scroll region, bounded to 20rem in height.
Controls follow interface direction while code remains LTR. Small lexical
highlighting supports js/javascript/jsx, ts/typescript/tsx, json, py/python and
sh/shell/bash. Unknown languages remain plain text. It is read-only and never
executes, edits or downloads source.

Markdown takes the complete current `text` string. Native headings, paragraphs,
nested ordered/unordered lists, links, quotes, emphasis, inline code, fenced code
through CodeBlock and keyboard-scrollable Table all use shared tokens. Arabic
shaping follows the provider; code is isolated LTR. Raw HTML is discarded with
`skipHtml`. Do not add `rehype-raw` or bypass `defaultUrlTransform`: unsafe
javascript/data/vbscript/file protocols are rejected for links and images;
rejected links become text and images retain alt text. The parser allows http,
https, irc, ircs, mailto, xmpp and relative URLs. Safe-protocol destinations can
still be untrusted: the host owns origin policy, content/size limits, image
resource loading and destination trust. This is presentation, with no embeds,
execution or application-specific rendering framework.

StreamingText takes `text` and explicit `state="streaming" | "completed"`.
It renders the host's current text immediately. Plain words briefly resolve from
blur with stable word spans and a trailing cursor; completion stops decoration
and removes the cursor. Optional `markdown` composes the same Markdown renderer.
Unfinished fences and partial syntax are provisional and reparse each host update;
there is no cached final parse or second typing queue. Stable renderer identities
retain settled nodes and code copy focus. Selection inside syntax that changes
structure can move; do not remount the whole response by keying it on text.
System and OS reduced motion disable decoration and show all updates immediately.

The response body is not a live region. `statusLabel` overrides one concise
localized state announcement; `announcement="off"` delegates announcements to the
host. Never announce every character. The host owns transport, buffering, errors,
limits and cancellation. On cancellation keep received text, set completed and
supply a cancelled statusLabel. No model connection, execution timer, token count
or transport belongs in the component. The bundled demo alone uses fixed chunks
and timers. The StreamingText playground and documentation example each start
one local sample automatically on entry and after language/mode changes. Their shared demo
frame owns the same border, surface and padding; the workbench adds no second
frame. Local provenance is retained in accessible group naming and this guidance,
without a repeated visible footer. Both demos use a compact Default/Markdown
header with named, icon-only Copy prompt and Play/Replay controls. All documentation
playgrounds and example sections share this frame, with 24px padding on desktop
and 16px on narrow screens. Static displays have only Copy prompt; interactive
examples also offer replay/reset. Workbench copies include current settings,
source examples and dependency instructions. Replaying a non-streaming playground
restores its initial component props; shared appearance settings are retained.
The standalone StreamingDemo starts explicitly by default. Runs invalidate timers
on replay, configuration changes and unmount. The host still owns cancellation
and should keep received text if a real stream is cancelled. The local demo has
no stop control and makes no AI/network request. Plain demo chunks
arrive every 160ms, overlapping a gentle 360ms reveal with less blur; no movement
is applied to Arabic glyphs or existing content. The component still owns no timer.

## Chat foundations

[ChatExamples](examples/ChatExamples.tsx) contains a static thread and one portable
application-owned conversation, using fixed local chunks only after explicit
submission. No model, service, upload, permission system, history or persistence.
ChatThread renders messages with unique stable `id`, `role` (user/assistant),
`content` (ReactNode), optional `identity`, `avatar` and `actions`. Compose Markdown
for static rich content, StreamingText for host-updated text and ThinkingIndicator
for activity. Supply decorative Avatar when identity is already adjacent. Keep
received text and keyed action controls mounted. Partial Markdown reinterpretation
can replace affected nodes; selection within changing syntax is not guaranteed.

ChatThread is a named, keyboard-scrollable region. Set its bounded height in the
host layout. `followOutput` defaults false (host owns scrolling); when enabled,
it follows only within 48px of the bottom, pauses while selecting thread text,
and never scrolls the window. Reading older content disables following until the
reader returns near the bottom. Do not put the response in a live region. Use one
concise status announcement for start, stop, failure or completion.

ChatComposer and PromptBar require controlled `value`, `onValueChange` and
`onSubmit(text)` (void or Promise<void>). Enter submits; Shift+Enter inserts a
newline. Composition start/end, native isComposing and keyCode 229 guard IME
submission, including clicking Send during composition. Whitespace-only drafts
are blocked, but valid text is passed **unchanged**, including whitespace. The
host accepts and clears by updating value; neither component clears internally.
Throw/reject on failure: the draft and focus stay, localized failure feedback is
shown, and retry is available. A pending promise prevents duplicate sends; also
set `state` to submitting/streaming for host execution. Keep these callbacks stable
in purpose and let the application own cancellation and transport.

Drafts remain editable while busy, but sending is blocked. `state="streaming"`
shows a Stop action only with `onStop`. `disabled` disables editing/actions;
`readOnly` prevents editing/sending. Provide translated `label`, `placeholder`,
`labels.send`, `labels.stop` and `labels.failure` when language differs from
provider direction. `ref` targets the textarea; className/style target the entry
wrapper. Other supported native textarea attributes are forwarded. Send stays
upward in RTL; bubbles align to inline-end. Entry direction defaults to the
SystemProvider direction: an empty, Arabic, English or mixed-script draft starts
on the right in RTL and on the left in LTR. Native `dir` can explicitly override
this, including opting into `auto`. Message content retains auto direction and
Arabic shaping. No per-letter animation is introduced by entry components.

ChatComposer is multiline conversation entry, bounded to 160px before internal
scrolling. PromptBar is compact task/start entry, bounded to 80px, reusing the same
engine. PromptBar optionally takes `suggestions` with required
`onSuggestionSelect(text)`; the host must explicitly populate or submit. No implicit
suggestion send, queue, ArrowUp history or Tab completion is implemented. Do not
invent decorative model, tool, attachment or microphone controls.

The example app appends one user and one stable assistant message, updates that
assistant in place, guards duplicate sends, keeps composer focus, and invalidates
its timer generation on stop/locale change/unmount. Stop retains received text.
The thread plays one opening exchange on mount, then stays interactive.
Documentation Replay remounts and invalidates the old example. StreamingText
announcements are off. These are in-memory checks, not physical mobile/OS IME or
screen-reader validation.

## Images, sources and findings

ImageResult, Sources / InlineCitation and InsightCards live under **AI patterns**.
Use [the connected bilingual examples](examples/AIResultsExamples.tsx). Their
content is fictional (see [assets/results](assets/results/README.md)); no
retrieval or image generation occurs.

`ImageResult` requires meaningful `alt`; `src`, `caption` and `metadata` are supplied
by the host. `state` defaults to `loaded`, but the image is shown only after the
browser loads it. `loading` retains a Skeleton frame; browser failure, explicit
`error` or a missing URL shows readable fallback including alt. Replace `src` or
change host state to reset the resource; retrying the same failed URL may remount
with a host key. Loading, failure and recovery retain `aspectRatio` (`landscape`
3:2 default, `square` 1:1, `portrait` 2:3), use contain sizing, and never distort or
crop the supplied image. Landscape max width is 640px; portrait 320px; native
figure style/className can adapt the outer width. `onRetry` adds a retry button;
`action={label,onClick}` appears only after load. `labels` translates loading,
error and retry. The host owns image rights, trusted URL/access/lifetime, caching,
resource limits and any real use action. There is no upload, generation, asset
manager, viewer or download subsystem. Compose a native group for candidates;
keep selection in the application.

`SourceReference` has required stable `id`, explicit stable `number`, `title`, and
optional `href`, `description`, `metadata`. IDs must be unique and numbers must be
positive unique integers within an answer. Assign them once in the host; never
use current array positions to renumber after reorder/filter. Pass the same
source records into `Sources items` and `InlineCitation source`, so every citation
has actual supplied evidence. Sources starts collapsed (`defaultExpanded=false`),
with one compact summary and expandable rows. Empty input is honest text. Summary,
empty and unavailable wording can be translated with `SourcesLabels`.

`InlineCitation` defaults to `mode="disclosure"`: a superscript button activated
by click/Enter/Space opens source details and an optional native Open link.
Deliberate activation keeps interactive-popup focus predictable; it does not open
on hover/focus. Escape closes the popup and restores the trigger; Tab follows
normal popup focus order. `mode="link"` uses a native link, preserving middle click,
modifier click, context menu and keyboard navigation. Without an accepted
`href`, link mode is static text with an unavailable accessible description;
disclosure still shows the supplied reference honestly. Labels support source
number/title, open and unavailable wording. Popovers use the **installed**
`@radix-ui/react-popover@1.3.1`; source consumers must install it and preserve the
Radix overrides above. Portals stay within the nearest provider, Sheet or Modal.

Source destinations allow **HTTP, HTTPS, relative paths and fragments only**.
Other schemes (including javascript, data, file and mailto), protocol-relative
network URLs, controls/embedded whitespace, backslashes, malformed URLs and URLs
with credentials are rejected. No href is emitted for rejected/missing destinations.
External hostnames remain application-trusted input; protocol filtering is not a
credibility or destination safety rating. The host owns reference trust, evidence,
authorization and navigation. There is no retrieval engine or invented citation.

`InsightCards items` contains stable `id`, concise `title`, optional `details`
(ReactNode), optional Badge `label`/`tone`, and optional connected
`action={label,onClick}`. It shows one finding at a time; previous/next and a
position preserve selection by ID through reorder, and select the first remaining
item if the selected finding is removed. Empty/single sets have no paging buttons.
Boundary controls use aria-disabled and ignore unavailable activation, retaining
keyboard focus when the first/last finding is reached.
`labels` translates title, previous, next, position and empty text. A Card groups
supporting detail, which may compose an existing chart. Keep supporting content
brief. Tones default neutral; use semantic colors only when actual supplied data
justifies the label. Host owns findings, evidence and action execution; no insight
generation or generic card-builder API.

**Asset copying:** preserve the whole `ai/assets/results/` directory: three original
SVG illustrations, `menu-audit.txt`, `menu-brief.txt` and provenance README. Keep
`ai/assets/LICENSE.txt`. Examples import SVGs and text `?url&no-inline` references locally.
Vite consumers need `vite/client`; other bundlers must support those URL imports
or copy the assets to their public directory and adjust imports/URLs to real files.
No network image service or asset pipeline is required. Source-only examples
compile after relocating the whole system folder; generated examples rewrite
asset imports to `./system/ai/assets/results/`. See the [asset instructions](assets/results/README.md).

The examples deliberately use `?url&no-inline` for sample SVGs and source
documents. Keep the no-inline directive: default production asset inlining would
turn a small source document into a rejected `data:` destination. Other bundlers
must emit real file URLs (or use copied public files), retaining UTF-8 encoding
for the bilingual documents.

ImageResult loading uses a quiet image placeholder, soft shimmer and the existing
Progress primitive. Set `progress={42}` for an actual application-supplied
percentage; omit it or use null when progress is unknown. Finite values clamp
to 0–100; nonfinite values remain indeterminate. A percentage of 100 does not
automatically finish loading: the host state and actual image load still govern
readiness. Updating progress does not reload the image. The example plays a
supplied progress sequence once on mount; it measures no network request or
image generation. Percentages use the provider's Arabic/English locale and
numerals.

## Selection, context and model controls

Use [AIContextExamples](examples/AIContextExamples.tsx) for a connected local
ChatThread/ChatComposer example. Its models, capacities, usage and prices are
explicit samples. Changing the model updates a real stable local ID; sending
adds only a local user message. No provider is contacted. Draft editing remains
ordinary textarea editing; Use in draft appends selected reply text to the
existing draft. Copy reports success or failure; Quote appends a local quotation.

SelectionActions wraps one explicitly named content region with `children`,
`label` and `actions` ({id, label, onSelect(text), optional icon/disabled}). Only
text wholly inside that region qualifies, including mixed Arabic/English text.
The region is keyboard focusable; select with the browser and press Alt+Enter to
focus the action row. Arrow keys and Tab navigate; Escape dismisses and returns
focus to the region when invoked from the row. No selection or focus is captured
on mount. Native copying remains available. Buttons preserve the selected text
before invoking callbacks; the host can deliberately move focus afterward.
First two actions are shown; More reveals remaining actions in the same row.
Scroll or viewport resize dismisses; clearing/changing selection updates the row.
Unmount removes all instance listeners. Radix Popper anchors to the Range and
bounds/flips the row at viewport edges, within the nearest provider/dialog.

Input, textarea, select, contenteditable, links, buttons, summary and ARIA interactive controls, pre/code, nested scopes
and `data-selection-actions-exclude` descendants are excluded, including ranges
crossing them. One DOM Range only. Shadow DOM, iframes and custom canvas editors
are unsupported. It never executes AI, replaces text, estimates tokens or creates
a global selection manager. Host action callbacks own asynchronous errors.

ContextMeter accepts optional used/capacity numbers, estimated, details
({id,label,value}), metadata, label, unit, locale and className. Values must be
finite and nonnegative: missing/invalid values stay unavailable; zero remains
zero. Zero capacity has no percentage. Over-capacity text retains the real value
and excess percentage while the decorative ring clamps at full. The trigger's
accessible name reports full values and statuses; visible status text supplements
color. Estimated values are explicitly labeled. Details use the existing Popover
(click/Enter/Space; Escape restores focus). Details are supplied independently;
the component does not infer parts, cost, limits, truncation or host behavior.
A supplied locale pins the Intl locale for every figure; otherwise digits follow
direction and config.numerals.

ModelSelector requires models, controlled value and onValueChange(id). Every
model needs a unique nonempty stable id and name; provider, description, tags,
context, price and disabled are optional supplied display data. Update value in
the callback. Removing a selected ID shows the placeholder without selecting a
replacement or calling the host. A supplied selected disabled model remains the
current choice; disabled options remain visible and cannot be chosen. An empty
list disables the trigger. size defaults sm; md follows shared control tokens.
Radix Select provides grouping, typeahead, arrows, Home/End, disabled skipping,
selected state, viewport collision handling and Escape restoration. No connection,
API keys or current provider claims are embedded in this family. Reuse the Radix
layer overrides above and preserve @radix-ui/react-select, react-popover and
react-popper dependencies when relocating the whole source bundle.

## Questions and one-time decisions

Use [AskUserQuestions](../AskUserQuestions.tsx) for application-supplied questions
with stable unique IDs. Supported types are single choice (`type: "choice"`, the
default), optional `allowOther` text, and `type: "text"` textarea questions. Choices
need unique stable `value`s; `other` is reserved. There is no multi-select,
branching, generated questionnaire or form engine. `required` defaults to true;
set false explicitly for optional questions. Keep `value: QuestionAnswers` in the
host and update it with `onValueChange`. Choices stay editable until accepted.
Next/Previous review drafts; Submit validates every required answer and focuses
the first incomplete question. Native radio arrows and scoped 1–9 select (ASCII,
Arabic-Indic or Eastern Arabic keys; choice numbers follow config.numerals); Enter
submits, Ctrl/Command+Enter submits from a textarea. It never auto-advances.
`onSubmit(answers, {signal})` receives actual choice IDs and text, excludes stale
question IDs, and guards duplicate submissions. Failure preserves the draft.

Use [ApprovalCard](../ApprovalCard.tsx) for a concrete proposed action. Supply
`request: {id, action, target, consequences, details?, approveLabel, rejectLabel}`.
Write specific labels, such as “Approve rename” and “Keep current title”.
Show critical parameters verbatim. Use a deliberate consequence-appropriate
confirmation in the host for irreversible actions; these compact inline cards
are suitable for reversible proposals. Rejection is safe and equally available;
there is no preselected decision, countdown, automatic approval or standing access.
Inline cards never steal initial focus; Escape inside an undecided card reports
rejection. They are named groups, not modal dialogs. Use the existing Modal if a
host requires a trapped dialog and place initial focus on its safe action.

`onDecision(request, "approved" | "rejected", {signal})` acknowledges the
**decision only**. Resolving it records approved/rejected; it does not mean that
an action executed or completed. Once decided, the card condenses to a one-line
receipt that keeps the action, its target and the outcome; a failed
acknowledgement keeps the full proposal visible. A failed acknowledgement restores the initiating button when focus has
not intentionally moved elsewhere. Buttons are guarded while submitting and
after acceptance. A controlled `value` is an `ApprovalRecord` (or null), bound to
both `requestId` and `approvalRequestKey(request)`; stale records are ignored.
For controlled cards publish an accepted record explicitly; null continues to
show the pending proposal and cannot trigger a duplicate callback.

[ApprovalFlow](../ApprovalFlow.tsx) composes a short application-owned sequence.
It shows position and accepted prior decisions, advances only after the host
accepts, and requires a fresh decision for every request. IDs must be unique and
stable across updates. Unchanged decisions survive append/reorder; changes to
ID, action, target, details, consequences or action labels invalidate the previous
record. Use optional `value` and `onValueChange` for controlled records; publish
the returned array in `onValueChange`. This is a UI composition, not a workflow
or authorization engine. Keep requests immutable.

All three cancel pending UI callbacks with AbortSignal on reset, replacement and
unmount, and ignore stale completions. `resetKey` starts a fresh local UI instance;
the host must also clear controlled drafts/records when resetting, or explicitly
reconcile them against a changed question schema. Changing request content
always creates a fresh card and aborts the old callback. Abort is cooperative:
it cannot retract effects that a host already performed.

The **host must validate request identity, authorization and execution
independently**, including at the time of execution. Check the exact approved
parameters/version, current user authority and current resource state. Do not
execute consequential actions in an acknowledgement callback. Respect the signal
before changing host state; cancel underlying work and reject aborted promises.
Never treat a UI record as proof of authorization. One-time approval grants no
ongoing permissions. This batch has no approve-all or permission management.

[Compiling examples](examples/AIDecisionsExamples.tsx) include independent basic
examples and `AIDecisionsExample`: a question whose answer hands off to a
two-request ApprovalFlow. Host acknowledgements resolve after a short delay, and
unmount/replacement cancels their signal listeners. No data leaves memory, no
action executes, and approved is never labeled completed. Failure and retry are
covered by the component tests rather than a visible demo switch.
Use `SystemProvider` for Arabic/English direction, theme, accent, typography,
density and reduced motion. These patterns do not animate. Screen-reader speech
and physical-device behavior require host testing; automated checks alone do not
establish them.

## Terminal and ChatApp

`Terminal` is a read-only presentation of application-supplied `output` and an
optional `command`. `state` is `running`, `completed` (default), or `failed`;
`exitCode` and `duration` are optional supplied display values. Neither starts or
measures anything. Command/output always stay LTR and preserve whitespace. HTML
and escape sequences are rendered as literal text, with no HTML or ANSI parser.
It has no shell execution, emulator, process management, filesystem, WebSocket or
network connection. See `ai/examples/TerminalExamples.tsx`.

Copy writes exactly `command + "\n" + output`, or `output` alone if command is
undefined. No prompt prefix, trim, status or duration is included. Check-only
success is announced politely; failure stays visible and tells readers how to
copy manually. CodeBlock and Terminal share the same clipboard lifecycle guard.
Long output has a named focusable internal scroll region (20rem maximum); Tab
then arrows/PageUp/PageDown operate native scrolling. `followOutput` defaults off;
when enabled it follows only within 48px of the bottom, and pauses while a
noncollapsed selection intersects the output. Do not auto-focus or remount output
on every update. Selection preservation applies to append-only updates: replacing
selected text cannot preserve removed characters. Application chooses retention
limits; this is not a virtualized log viewer.

`ChatApp` is a composition shell. Required props: `conversations` (unique stable
`{id, title}` records), `activeConversationId` (`string | null`),
`onConversationSelect(id)`, `onNewConversation()`, `children`, and `composer`.
Optional `toolbar`, `brand`, `title`, `labels: ChatAppLabels`, and `className`
provide small explicit slots and labels. Pass ChatThread as children, ChatComposer
or PromptBar as composer and ModelSelector where appropriate. The host owns
messages, drafts, active conversation, model and execution state. ChatApp only
owns mobile navigation disclosure. It uses existing Sidebar and Sheet: at a
container width up to 640px, the rail becomes a menu trigger and Sheet. Selection
and new-conversation dismiss it; Escape/outside click/close restore trigger focus.
The shell has a bounded height; navigation and thread scroll independently. Set
its block-size in host CSS if embedding in a different viewport. Keep the existing
composer styling and provider-driven RTL caret direction.

`ai/examples/ChatAppExample.tsx` is an in-memory app with fictional content and
no real AI or tools. Assistant replies carry no name or avatar; only the user
speaks in bubbles. It reuses existing renderers/entries and the fixed local response
scheduler shared with `ChatExamples.tsx`. Sending clears only the accepted draft,
adds a user message and one stable assistant message, then updates that assistant
with fixed chunks. Each conversation keeps its own draft and model. Stop cancels
future chunks and keeps received text. Switching to a different conversation or
creating a new one cancels the previous response, retains its content and drafts,
and shows the selected/new conversation; selecting the current one keeps its run.
Locale change remounts the example and restores that locale's samples. Theme
changes preserve state. Unmount cancels timers. Generation guards and captured
conversation/message IDs prevent stale callbacks from crossing conversations.
Key entries and threads by conversation ID to isolate submission feedback and
scroll position. New conversation copies the selected model; model choice is
real local state, but every response is fixed.

The supplied build log in one assistant message demonstrates Terminal as tool
output without implying execution. No authentication, backend, persistent history,
model connection, application framework, uploads or additional families are added.
Copy all source and `ai/` together; `useLocalResponse.ts` is example-only support,
not a public execution API. Generated examples inline the same scheduler source; adjust CSS and `./system`
imports to the relocated library root.
