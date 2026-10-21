# Use Tiraz in an application

Tiraz is an Arabic-first, source-owned React dashboard library with **seventy-four**
component families: Button, Tabs, Switch, DropdownMenu, Sheet, Toast, Field, Input, Select, Table, DataTable, Badge, Checkbox, RadioGroup, Textarea, Avatar, AvatarGroup, Tooltip, Modal, EmptyState, Alert, Skeleton, Progress, Spinner, Card, Accordion, Breadcrumbs, Pagination, LineChart, AreaChart, BarChart, DonutChart, Sidebar, TagInput, FilterBar, InputCopy, FileDropzone, ColorPicker, Slider, OTPInput, DatePicker, Steps, Timeline, TaskRows, NotificationList, FileTree, LoadingState, ThinkingIndicator, ThinkingState, ToolCall, ToolChips, CodeBlock, Markdown, StreamingText, ChatThread, ChatComposer, PromptBar, ImageResult, Sources / InlineCitation, InsightCards, SelectionActions, ContextMeter, ModelSelector, AskUserQuestions, ApprovalCard, ApprovalFlow, TaskStarter, CitedAnswer, AgentTask, SuggestedEdits, ImageGeneration, ChangeSummary, Terminal and ChatApp.
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
3. Follow [composition.md](composition.md), map the user's task to a pattern
   (next section) or else to available components, and connect events to
   application behavior. Preserve the supplied component props and shared
   settings unless the task requires changing them.
4. Adapt [the compiling usage example](examples/usage.tsx) to the host app.
   Its imports are relative to this bundle; generated workbench snippets use
   `./system` only as an example. Adjust all imports/CSS paths to the located
   source root. Validate the actual rendered result with the checklist below.

## Start with a pattern

A pattern finishes one job, from its first state to the person's decision and the result. Patterns share one anatomy of up to five zones: a header that names the state once, what the assistant produced on paper, the evidence folded away, the person's options and the meta. Each uses the zones its job needs. Find the job below and use its pattern before composing parts. The host owns the state: pass the pattern's `status` and data, and handle the `on…` intents it reports. [composition.md](composition.md#patterns) holds the rules every pattern follows, and each pattern has Arabic and English words that `labels` overrides.

| The person needs to…                                             | Pattern · page id                                                                | Component          | Parts                                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| Start a request from the page they are on, with records attached | [Start a task](#start-a-task) · `task-starter`                                   | `TaskStarter`      | `chat-composer`, `prompt-bar`, `model-selector`, `context-meter`, `status-pill`, `tray`         |
| Get an answer and see where each claim came from                 | [Cited answer](#cited-answer) · `cited-answer`                                   | `CitedAnswer`      | `thinking-panel`, `streaming-text`, `markdown`, `sources`, `feedback-bar`, `follow-ups`, `tray` |
| Let an agent run a multi-step job and stay in control            | [Agent task](#agent-task) · `agent-task`                                         | `AgentTask`        | `ai-mark`, `status-pill`, `tray`, `countdown`, `status-icon`, `tool-call`, `approval-card`      |
| Answer the one to three things the agent cannot guess            | [Clarifying questions](#questions-and-one-time-decisions) · `ask-user-questions` | `AskUserQuestions` | `ai-mark`, `status-pill`, `tray`                                                                |
| Approve, reject or edit one specific action                      | [Approval request](#questions-and-one-time-decisions) · `approval-card`          | `ApprovalCard`     | `ai-mark`, `status-pill`, `tray`                                                                |
| Decide a short run of requests, one at a time                    | [Approval sequence](#questions-and-one-time-decisions) · `approval-flow`         | `ApprovalFlow`     | `approval-card`, `tray`                                                                         |
| Improve selected text with changes they accept or reject         | [Suggested edits](#suggested-edits) · `suggested-edits`                          | `SuggestedEdits`   | `selection-actions`, `inline-diff`, `ai-mark`, `tray`                                           |
| Make an image from a description and choose a version            | [Image generation](#image-generation) · `image-generation`                       | `ImageGeneration`  | `weave-canvas`, `image-result`, `ai-mark`, `status-pill`, `tray`                                |
| See what moved, why, and what to do next                         | [What changed](#what-changed) · `change-summary`                                 | `ChangeSummary`    | `ai-mark`, `status-pill`, `tray`, `sources`                                                     |
| Work through a whole conversation with the assistant (a screen)  | [Assistant workspace](#assistant-workspace) · `chat-app`                         | `ChatApp`          | `chat-thread`, with the patterns above as its messages                                          |

Parts are what patterns are built on. The registry gives every AI family a `kind`: `pattern` (the nine above), `screen` (ChatApp), `part` (the fifteen pieces that also work alone, such as SelectionActions, ChatComposer, ToolCall and Sources) or `content` (Terminal, CodeBlock, Markdown and LoadingState, which show supplied text). The pieces added with the patterns (AIMark, StatusPill, Tray, Countdown, StatusIcon, ThinkingPanel, FeedbackBar, FollowUps, InlineDiff and WeaveCanvas) are exported and listed under `support`. A pattern's `parts` names, by registry id, what it is built on: Start a task renders StatusPill and Tray, and builds on the entry that ChatComposer and PromptBar share, ModelSelector's options and ContextMeter's ring. A part's `usedBy` names the patterns that list it, so the two link both ways, and an empty `usedBy` means no pattern is built on that part. Use a part alone when the job is smaller than a pattern. When no pattern fits the job, compose parts, say so, and do not invent a pattern or an export.

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

Keep `:dir()` as written in the host's CSS pipeline. Every direction-bearing
detail uses `:dir(rtl)` (mirrored icons, popup origins, the switch, slider and
progress fills, the skeleton sweep, shimmers and the Sources fan), which Chrome
and Edge 120+, Firefox 49+ and Safari 16.4+ support. A CSS target below those (Vite's
default baseline is one) rewrites it to `:lang()`, which follows the page
language instead of its direction; raise the target (in Vite, `build.cssTarget`).

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

Badge is static status text, not an action or live region; neutral is the default, success/error/info reuse semantic tokens, `warning` takes the attention color and `ai` the AI color. Use `warning` only for something that needs the person, and `ai` only for what the assistant produced. CustomerDataTable uses Badge for readable customer statuses.

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

Use [FeedbackExamples](examples/FeedbackExamples.tsx) for explicit local states and application-owned actions. Alert requires title; optional description, action and a tone: neutral, success, error, info (the default), warning or ai, the Badge tones. `announcement="off"` is the static default; `polite` uses status for routine updates and `assertive` uses alert for urgent updates only. Semantic tones do not follow accent. Toast tones are success, error, info (the default) and warning. The application owns dismissal; do not invent an internal queue or dismissal API.

Skeleton is always decorative/aria-hidden. Its shape is text (default), rectangle or circle; style/className provide native sizing. The host supplies aria-busy and one loading announcement. Spinner requires label unless decorative=true; adjacent text owns the announcement in decorative mode. It has sm/md sizes, a `tone` of `neutral` (default) or `ai` (the arc in the AI color, for work the assistant is doing) and no Button integration API. Both loading animations stop for application or OS reduced motion, with a static indicator retained.

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
(pending/running/needs-you/completed/failed) and content; summary is an optional short
string. Each indicator is the shared StatusIcon: pending shows its supplied-order
number in a dashed ring, running a decorative arc in the AI color, needs-you a "!" on
an attention disc, completed a check on a success disc and failed a cross on a danger
disc. State text uses the existing Badge in the shared step words (لم تبدأ، قيد التنفيذ،
بانتظارك، مكتملة، تعثّرت / Not started, Running, Needs you, Done, Failed): neutral
pending, ai running, warning needs-you, success completed and error failed. The host
sets needs-you when the run waits for the person; opening a row never changes a state.
stateLabels (partial) replaces any of the five words and labels.empty the default empty
state's title; defaults and number digits follow direction and config.numerals.
appearance defaults to capsules; list connects rows with subtle separators; plain draws
no surface of its own, for a host's paper.

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

The compiling example plays its own run once: the drafting task fails once on a
timed-out CRM call, retries and completes, while the handoff stays pending. With a
`phase` ("running", "needs-you" or "completed") it holds that state instead, as the
documentation's state switcher and Replay do (in needs-you the handoff waits for
approval); reduced motion starts at the final state. Its timer clears on unmount,
and it never claims real files, emails or backend tasks were processed. Another completed sample shows
illustrative contact/tax-ID matches and stale-record counts directly. A separate
static example shows all five application-supplied states in either appearance. No
agent runtime, networking or library timer is provided. TaskRows lists tasks; for one
task's steps, tool details and approvals use [Agent task](#agent-task). The TaskRows
page is in the Parts section of the documentation navigation; ToolCall details
individual tool operations; ToolChips summarizes supplied activity.

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

## Start a task

`TaskStarter` starts any request from the page the person is on; [TaskStarterExamples](examples/TaskStarterExamples.tsx) plays the host. Required: `value`, `onValueChange` and `onSubmit(value, context)`, which may return a promise; a rejected one keeps the draft and shows the entry's failure line. The entry behaves like ChatComposer's: Enter submits, Shift+Enter adds a line, input-method composition never submits, a pending send blocks a second, and Backspace in an empty text area leaves the chips alone.

The host passes `context` (`ContextItem[]`: `id`, `label`, optional `kind` and `icon`), shown as chips that `onRemoveContext` removes. Attach and dictate buttons appear with `onAttach` and `onVoice`; both are intents, and nothing uploads or listens. With `mentionOptions` and `onAddContext(id)`, typing "@" at the start of the text or after a space, or pressing the @ button, opens a list of the records not yet attached whose names hold what follows the "@", matched the way Arabic is typed (so «@اكتوبر» finds «أكتوبر»). The text area stays focused as a combobox: arrow keys move, Enter chooses and Escape closes only the list. Without options, `onMention(query)` lets the host open its own picker. `modes` with `mode` and `onModeChange`, and `models` with `model` and `onModelChange`, fill the mode menu (radio items; `modeMenuOpen` with `onModeMenuOpenChange` controls it), and `contextUsage` (ContextMeter's props) adds a ring and a "context used" line. `suggestions` with `onSuggestion(id)` stay visible while the person types, and the host fills the draft; `recent` with `onOpenRecent` lists earlier tasks with a status pill and time. `greeting`, `title`, `disabled` with `disabledReason`, `headingLevel`, `labels` and `appearance` complete it.

States: empty, writing, choosing a mode, submitting (the text area is read-only and Send shows progress) and disabled. The pattern's one polite region speaks a record joining or leaving `context`, never the context it mounts with. Counts agree in Arabic («سجلّان مرفقان») and digits follow config.numerals. `appearance="plain"` is the composer inside a conversation. Its entry, ModelSelector and ContextMeter gained props for it; see Chat foundations and Selection, context and model controls.

## Cited answer

`CitedAnswer` answers a question and shows where each claim came from; [CitedAnswerExamples](examples/CitedAnswerExamples.tsx) plays the host. The host owns `status` (`thinking`, `writing`, `completed`, `failed` or `stopped`), the growing `content` (Markdown with `[n]` markers), the `sources` it cites and every time. `sources` are `SourceReference`s whose `number` matches the markers; a marker with no source stays as written, so supply every source the text cites. `thinking={{ elapsed, searched, steps }}` adds the thinking panel (`elapsed` in seconds, the sources found so far, and steps that are `pending`, `running` or `completed`). It is open while thinking and folds when writing starts, unless the host controls it with `thinkingOpen` and `onThinkingOpenChange`. Update `elapsed` at most once a second.

Each marker becomes a numbered InlineCitation chip in `mode="preview"`: hover or focus shows the source's title and description in a tooltip that carries no link, and Enter or a click opens the source when its destination is safe. Links in the answer follow the same rule (`links="strict"`: http, https, relative and fragment targets only). Words that arrive settle in whole, never per letter, and a stopped or failed answer keeps what arrived. The footer shows the sources' count and the `duration`, which open the full source list, and the person's options by status: Stop (`onStop`) while thinking or writing, Try again (`onRetry`) when failed, Regenerate (`onRegenerate`) when stopped, and when completed the follow-ups (`followUps` with `onFollowUp(id)`) and the rating bar (copy through `onCopy`, regenerate, and helpful or not helpful through `feedback` and `onFeedbackChange(value, reason?)`; a not-helpful rating asks for one of four reasons). `error` is the text beside a failed answer. Each button appears only when its handler exists.

The panel and the streamed words are silent, and the bar announces only its copied word after a copy; the pattern's one polite region says each change of status once, and not the status it mounts in. Use a ChatThread message for casual chat without sources, [Agent task](#agent-task) for multi-step work, and Sources with InlineCitation alone to cite inside your own content. The parts work alone: ThinkingPanel (`status` running or completed, `elapsed`, `sources`, `steps`, `open` with `onOpenChange`, `labels`), FeedbackBar (`feedback`, `reason`, `onFeedbackChange`, `onCopy`, `onRegenerate`) and FollowUps (`items`, `onSelect`). SourceChip, the chip for a source inside the thinking panel, is internal and not exported.

## Agent task

`AgentTask` lets an agent run a multi-step job while the person stays in control; [AgentTaskExamples](examples/AgentTaskExamples.tsx) plays the host. The host owns `status` (`plan`, `running`, `needs-you`, `failed`, `stopped` or `completed`), the `steps` and every time (`elapsed` and each step's `duration`, updated at most once a second); the pattern never advances. Each `AgentStep` has a unique stable `id`, a `title`, a `state` (`planned`, `pending`, `running`, `completed`, `needs-you`, `failed` or `skipped`) and optionally `detail`, `duration`, `tools` (a finished step's operations, listed under "Details" as plain ToolCalls), `notes` (steering notes, `applied` once the agent picked one up), `request` with `approval` (an `ApprovalDetails`), and `error` with the `actions` (`retry`, `skip`, `reconnect`) it offers.

The footer follows the status. A plan has "Edit plan" (`onEditPlan`) and "Start now" (`onStart`); a countdown runs only when the host gives `autoStartAfter` seconds and `onStart`, pauses while the pointer or focus is inside the pattern, and calls `onStart` when it ends. A running task has a steering field and Stop: Enter steers at the next step and Ctrl or Cmd+Enter steers now (`onSteer(text, "next" | "now")`), never while an input method is composing and never on a held key; `onStop` stops it. A task that needs the person names the waiting step and the request's expiry; a failed or stopped task names the step and the time; a completed task shows the time and operation count, the `outputs` chips (`onOpen`) and `primaryAction`. A failed step offers only the ways forward the host handles (`onRetryStep`, `onSkipStep`, `onReconnect`; Reconnect, else Retry, is the primary one).

A step that needs the person renders ApprovalCard in `appearance="plain"` from `request`, `approval` and `onDecision`; without `onDecision` it shows the action and target as text, with no actions. The inline approval keeps ApprovalCard's rules (see Questions and one-time decisions): a decision counts only after the host's promise resolves, and its Ctrl or Cmd+Enter follows `reversible` and `irreversible`. Start now has the same chord and waits 500 ms after the plan appears and whenever a step is added, removed, reordered or retitled; a change to a step's `detail` alone does not restart it, so retitle a step whose substance changes. The pattern's one polite region says each status once and never a time or a countdown tick; the countdown and the tool calls run with `announcement="off"`, and the inline approval keeps its own region. Moving to needs-you never moves focus; when a change removes the focused control (Stop, a failed step's button, the steering field), focus moves to the section. Use ApprovalCard for a single yes or no, and TaskRows for tasks without a run.

## Suggested edits

`SuggestedEdits` wraps the host's read-only text (`children`) and improves a selection with tracked changes the person accepts or rejects; [SuggestedEditsExamples](examples/SuggestedEditsExamples.tsx) plays the host. `actions` (`{ id, label, icon? }`) appear on a selection, through SelectionActions, and `onAction(id, { text, start, end })` reports the choice with offsets into the region's text content. The host rewrites the text and moves `status`: `idle`, `rewriting` (a note below the selection), `reviewing` (with a `suggestion`: a `title` and `segments`, `DiffSegment`s of kind `same`, `insert` or `delete`) and `applied`. The pattern keeps the person's decisions unless the host passes `decisions` with `onDecisionsChange`, and `selection` restores the range for a suggestion that arrives without an action. `onApply(text, { start, end })` hands the host the accepted text and the range it replaces. Nothing touches the host's content before that: the host replaces its own text, then shows `applied`, whose receipt («طُبّق تعديلان من ٣») offers Undo only with `onUndo`. `onDismiss` closes the suggestion, from the Dismiss button and from Escape. Offsets count every text node in the region, so a host that changes its text before Apply should dismiss the suggestion.

The review card is a non-modal dialog below the selection: a counter («١ من ٣») with previous and next, Reject all and Accept all, and the passage with deletions struck through and insertions underlined. The diff works on the plain text of the selection, so when the range spans formatting the card says «يُطبَّق كنص عادي». Each change is a focusable group with accept and reject toggles; Y accepts and N rejects while focus is in a change, matched by key position (`KeyY`, `KeyN`) so an Arabic layout works, and never on a repeat, with Ctrl, Meta or Alt, or in a text field. The selection stays underlined through the CSS Custom Highlight API (`::highlight(tz-suggestion)`); where the browser lacks it the range is not marked. The pattern's one polite region says each status once, not the one it mounts in.

InlineDiff (`segments`, `decisions` keyed by each change's first segment id, `onDecisionsChange`) is the part to use directly for an editable draft. A change is a run of consecutive `insert` and `delete` segments, and the passage once decided is the `same` text plus, for each change, its inserted text when accepted or its deleted text when rejected or undecided. SuggestedEdits computes that with `diffText` (diff-text.ts), which is internal and not exported, so compute it yourself when you use InlineDiff alone. Use SelectionActions alone to copy or quote a selection, and show the new version beside the old when nearly every word changes.

## Image generation

`ImageGeneration` makes an image from a description and lets the person choose the version to use; [ImageGenerationExamples](examples/ImageGenerationExamples.tsx) plays the host. The host owns `status` (`queued`, `weaving`, `completed`, `failed` or `blocked`), `progress` (0–100, or `null` when unknown; never invent one), the `images` (`id`, `src`, `alt`, `width`, `height`; `src` may arrive late) and, if it wants, `selected` with `onSelectedChange`. `prompt` and `options` (chips such as ratio and style) describe the request, `agent` and `duration` fill the footer, and `blockedReason` explains a request a policy refused. Events: `onUse(id)`, `onVariations(id)`, `onEditPrompt` (the pencil by the prompt, and the primary button when blocked) and `onRetry` (failed). The versions are a radio group named «اختر نسخة», and they and the actions stay disabled until `completed`.

While it is queued and weaving the canvas is WeaveCanvas: faint warp threads, then the picture revealed row by row from the inline-start edge, with a thread-colored shuttle at each row's front. With `progress` the reveal follows it; without one a shuttle travels until `src` arrives, and the weave then finishes in under 1.2 seconds. Under reduced motion, from the application or the OS, no loop runs: a still thread shows and the picture fades in whole over 200 ms (`--weave-fade`). A finished or failed image is ImageResult, so Retry moves focus to the figure. The progress tag is the pattern's progressbar, and the polite region says each status once, never the progress or the time. Use ImageResult alone for an image the host already has.

## What changed

`ChangeSummary` tells a manager what moved, why it moved and what to do next; [ChangeSummaryExamples](examples/ChangeSummaryExamples.tsx) plays the host. The host owns `status` (`updating`, `ready`, `stale` or `failed`) and every row: `{ id, metric, change, direction, tone, series? }`, of which the first six show. `change` is the host's sentence, `direction` (`up`, `down` or `flat`) draws the arrow and `tone` (`good`, `bad` or `neutral`) is the host's judgement and sets the color, so more late invoices is `bad` although it rises. Arrows show direction, color shows meaning, and sparklines run left to right in both directions. `reason` with `sources` (cited), `basedOn` and `updated` fill the rest. `actions` (`{ id, label, primary?, onSelect }`) show only while `ready`; a `stale` summary offers Refresh and a `failed` one Try again (`onRefresh`), so no step rests on numbers that may be old. Format digits in the row text with `numberLocale(config)`. The polite region says each status once, not the one it mounts in. Use a chart for one measure over time, and [InsightCards](#images-sources-and-findings) for findings read one at a time.

## AI activity feedback

LoadingState uses a compact 3×3 pixel grid with `variant="drive" | "dots" | "orbit"`
(default drive), a shimmering label and optional description. Drive/Dots use a
brightness wave; Orbit travels around the perimeter with a dim center. Optional
`elapsedMs` is a finite host-supplied duration, not a library clock. Negative values
clamp to zero; nonfinite values hide the timer. It reads ٦٫٢ث / 6.2s under a minute
and ١د ١٢ث / 1m 12s from a minute; digits follow provider direction and config.numerals.
Elapsed text and all decorative animation are excluded from announcements.
`indicator="spinner"` remains the compatibility value for the pixel grid;
`indicator="skeleton"` retains the placeholder.
Use Spinner alone for general loading beside existing text, or Skeleton for the
shape of future content. The host owns aria-busy on its actual loading region.

ThinkingIndicator pairs the turning AI mark (AIMark, size xs) with a shimmering whole word.
`label` is the stable accessible activity summary. Supply optional `words` for
cosmetic whole-word rotation, or omit it for a single label. Blank/empty arrays
fall back to label. `textOnly` removes the mark. All words share one measured
layout width; Arabic strings remain connected and are never split into letters.
Equivalent arrays on parent updates do not restart rotation. Changed words start
at the first word; the interval clears on change, reduced motion and unmount.
Word transitions do not announce or represent execution progress.

ThinkingState uses the AI mark (turning while `active`), the supplied current
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
the mark's turn, leaving a still mark and stable first word. Disclosure is immediate.
The general-purpose Spinner is unchanged. No animation dependency is added.

See [standalone examples and a live trace](examples/AIFeedbackExamples.tsx).
The trace plays once on mount (reading → matching → summary ready), owns its
elapsed clock and steps, cancels its timers on unmount and replay, and shows the
final summary under reduced motion. Library cosmetic rotation never drives
execution. No real AI/network activity is implied.

## Tool activity

ToolCall records one host-supplied operation: pending, running, needs-you, completed
or failed, with a readable label, monospace tool name and optional formatted duration.
Pass strings for preformatted input/output/error or React nodes for
application-rendered results. JSON.stringify belongs to the host; never pass a plain
object as a node. ToolCall owns only optional disclosure state (expanded/defaultExpanded
and onExpandedChange). onRetry is a host callback, outside the disclosure button,
shown on failure; focus moves to disclosure before retry. `appearance="plain"` drops
the card for a host's own surface (Agent task's details use it), `labels` replaces any
of the five state words (the shared step words) or the input, output, error and retry
words, and `headingLevel` (2–6, default 4) sets the section headings. needs-you means
the operation waits for the person; the host sets it.

ToolChips takes a named list of items (stable id, label, state, optional count) and
the same partial `labels`. Informational items are spans. onActivate creates a button;
connect it to real behavior before supplying controls/expanded. No built-in details
are implied.
ToolCall, ToolChips and TaskRows draw their status with StatusIcon, which is also
exported: state is pending, running, needs-you, completed, failed, stopped or
skipped; number gives a pending ring its position (digits follow config.numerals),
and a ring without one takes the field boundary color so it keeps 3:1; tone="ai"
turns the running arc to the AI color when the assistant is the actor.
Without label it is decorative, so adjacent text must state the status. A check or
cross draws itself only after the state changes, never on first render. Size it
with --status-size.
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

CodeBlock and Markdown are content blocks (Display & feedback in the documentation
navigation) and StreamingText is a part (Parts). Use the
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
execution or application-specific rendering framework. `renderCitation(marker)`
turns each `[n]` marker in the text into the node you return (code and link text
are left alone, and a marker stays text when the function returns nothing); Cited
answer uses it for its citation chips. `links="strict"` sends link and image
targets through `sourceHref`, so only http, https, relative and fragment targets
survive and a rejected link shows as text (a `mailto:` link included); `default`
keeps the parser policy above.

StreamingText takes `text` and explicit `state="streaming" | "completed" | "stopped" | "failed"`.
It renders the host's current text immediately. Plain words briefly resolve from
blur with stable word spans and a trailing cursor; completing, stopping or failing
stops decoration and removes the cursor, and stopped and failed keep the text that
arrived and announce «أُوقف الرد» / "Response stopped" or «تعذّر إكمال الرد» /
"Couldn't finish the response". Optional `markdown` composes the same Markdown
renderer and passes `renderCitation` and `links` through to it.
Unfinished fences and partial syntax are provisional and reparse each host update;
there is no cached final parse or second typing queue. Stable renderer identities
retain settled nodes and code copy focus. Selection inside syntax that changes
structure can move; do not remount the whole response by keying it on text.
System and OS reduced motion disable decoration and show all updates immediately.

The response body is not a live region. `statusLabel` overrides one concise
localized state announcement; `announcement="off"` delegates announcements to the
host. Never announce every character. The host owns transport, buffering, errors,
limits and cancellation. On cancellation keep received text and set stopped; when
the transport fails keep it and set failed; statusLabel overrides the announced
sentence. No model connection, execution timer, token count
or transport belongs in the component. The bundled demo alone uses fixed chunks
and timers. In the workbench the StreamingText page opens complete, and nothing
starts on its own. Its frame offers the Streaming, Done, Stopped and Failed states,
and Replay streams the local sample again from its first word. Every documentation
page shows its example in that one frame: a toolbar above the stage holds the
Preview/Code switch, a state switcher where the component has meaningful states and
a link that opens the playground in a new tab; a round Replay button in the stage's
corner appears only where the component has a lifecycle; Copy code sits in the Code
view's header. Replay steps through states and never resets
props; the inspector's "Reset playground" does that. Workbench copies include
current settings, source examples and dependency instructions. Copied into an
app, StreamingTextExample passes autoStart, so it plays once on mount inside
StreamingDemo's own portable frame; StreamingDemo used on its own starts only on
request. That frame keeps local provenance in its accessible name, in Arabic and
English, rather than a visible footer. Runs invalidate timers
on replay, configuration changes and unmount. The host still owns cancellation
and should keep received text if a real stream is cancelled. The local demo has
no stop control and makes no AI/network request. Plain demo chunks
arrive every 160ms, overlapping a 300ms reveal (`--motion-word-settle`) in which
each word settles out of a light blur; no movement
is applied to Arabic glyphs or existing content. The component still owns no timer.

## Chat foundations

[ChatExamples](examples/ChatExamples.tsx) contains a static thread and one portable
application-owned conversation, using fixed local chunks only after explicit
submission. No model, service, upload, permission system, history or persistence.
ChatThread renders messages with unique stable `id`, `role` (user/assistant),
`content` (ReactNode), optional `identity`, `avatar` and `actions`, and an optional
`status` (streaming, completed, stopped or failed), `error` and `onRetry`. A stopped
message notes «أُوقف الرد»; a failed one keeps «تعذّر إكمال الرد» and your `error` as
persistent text, not a live region, with «أعد المحاولة» calling `onRetry`, after which
focus moves to the message. `ChatThreadMessage({ message })` draws one message on its
own, and ChatThread draws each of its messages through it. Compose Markdown
for static rich content, StreamingText for host-updated text, ThinkingIndicator
for activity and, as one message, any pattern in `appearance="plain"`. Supply
decorative Avatar when identity is already adjacent. Keep
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
scrolling; `compact` draws the bounded one-line entry that PromptBar uses.
`tools={{ start, end }}` adds a row under the text area (start controls, a flexible
space, end controls, then Send) for the host's own controls; Start a task puts attach,
@, the mode menu and dictate there, and any such control is the host's intent, so do
not invent one the host does not wire. `appearance="plain"` drops the floating shadow
for an entry inside another surface, and a hairline keeps the field's edge. A host that
sets `state="submitting"` sees Send show progress. PromptBar is compact task/start
entry, bounded to 80px, reusing the same engine. PromptBar optionally takes
`suggestions` (strings, or `{ id, label, prompt?, icon? }`) with required
`onSuggestionSelect(text)`, which receives a suggestion's `prompt`, or its label when
it has none; the host must explicitly populate or submit. Suggestions show only for an
empty draft and are disabled while busy. No implicit suggestion send, queue, ArrowUp
history or Tab completion is implemented.

The example app appends one user and one stable assistant message, updates that
assistant in place, guards duplicate sends, keeps composer focus, and invalidates
its timer generation on stop/locale change/unmount. Stop retains received text; an
assistant message that is still empty is removed. Its Failed state sends the seeded
draft once to an offline host that rejects it, so the entry shows its failure line and
keeps the draft. Its fixed scheduler is `useLocalResponse.ts`, example-only support
and not a public execution API; generated examples inline it.
The thread plays one opening exchange on mount, then stays interactive.
Documentation Replay remounts and invalidates the old example. StreamingText
announcements are off. These are in-memory checks, not physical mobile/OS IME or
screen-reader validation.

## Images, sources and findings

ImageResult, Sources / InlineCitation and InsightCards are parts (Parts in the
documentation navigation); Image generation, Cited answer and What changed are built
on them. Use [the connected bilingual examples](examples/AIResultsExamples.tsx). Their
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
with one compact summary and expandable rows; `expanded` with `onExpandedChange`
controls it, and `highlightedId` marks (`data-highlighted`) the row of the source
whose citation is being previewed. Empty input is honest text. Summary,
empty and unavailable wording can be translated with `SourcesLabels`.

`InlineCitation` defaults to `mode="disclosure"`: a superscript button activated
by click/Enter/Space opens source details and an optional native Open link.
Deliberate activation keeps interactive-popup focus predictable; it does not open
on hover/focus. Escape closes the popup and restores the trigger; Tab follows
normal popup focus order. `mode="link"` uses a native link, preserving middle click,
modifier click, context menu and keyboard navigation. Without an accepted
`href`, link mode is static text with an unavailable accessible description;
disclosure still shows the supplied reference honestly. `mode="preview"` suits
numbered chips in running text, as in Cited answer: hover or focus shows the source's
domain, number, title, description and metadata in a tooltip that takes no focus and
carries no link, Escape or blur closes it, and the pointer moving onto it keeps it
open. Enter or a click then opens the source through a native link; a chip whose
destination is rejected is a button that only previews. `onOpenChange(open)` reports
opening and closing in every mode. Labels support source
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
`labels` translates title, previous, next, position and empty text, and
`headingLevel` (2–6, default 3) sets the finding's title. A Card groups
supporting detail, which may compose an existing chart. Keep supporting content
brief. Tones default neutral; use semantic colors only when actual supplied data
justifies the label. Host owns findings, evidence and action execution; no insight
generation or generic card-builder API. InsightCards reads one finding at a time; to
tell a manager what moved and why, use [What changed](#what-changed).

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
`label` and `actions` ({id, label, onSelect(text, { start, end }), optional
icon/disabled}). `start` and `end` are offsets into the region's text content (every
text node in it, hidden ones included), so the host can find the selection again to
anchor a suggestion or replace it; a host whose text model differs from its DOM text
must map them. Only text wholly inside that region qualifies, including mixed
Arabic/English text.
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
({id,label,value}), metadata, label, unit, locale, className, `thresholds` and a
controlled `open` with `onOpenChange`. `thresholds` ({ high?, near? }, defaults 0.8
and 0.95 of capacity) moves where the status reads Filling up and Near capacity; over
capacity stays above 1. Values must be
finite and nonnegative: missing/invalid values stay unavailable; zero remains
zero. Zero capacity has no percentage. Over-capacity text retains the real value
and excess percentage while the decorative ring clamps at full. The trigger's
accessible name reports full values and statuses; visible status text supplements
color. Estimated values are explicitly labeled. Details use the existing Popover
(click/Enter/Space; Escape restores focus). Details are supplied independently;
the component does not infer parts, cost, limits, truncation or host behavior.
A supplied locale sets the Intl locale for every figure: ar digits follow
config.numerals and other locales format as supplied. Without one, digits follow
direction and config.numerals.

ModelSelector requires models, controlled value and onValueChange(id). Every
model needs a unique nonempty stable id and name; provider, description, tags,
context, price and disabled are optional supplied display data. Update value in
the callback. Removing a selected ID shows the placeholder without selecting a
replacement or calling the host. A supplied selected disabled model remains the
current choice; disabled options remain visible and cannot be chosen. An empty
list disables the trigger. size defaults sm; md follows shared control tokens.
`labels.unavailable` replaces the word beside a model that cannot be chosen («غير متاح»
/ Unavailable). Radix Select provides grouping, typeahead, arrows, Home/End, disabled skipping,
selected state, viewport collision handling and Escape restoration. No connection,
API keys or current provider claims are embedded in this family. Reuse the Radix
layer overrides above and preserve @radix-ui/react-select, react-popover and
react-popper dependencies when relocating the whole source bundle.

## Questions and one-time decisions

Use [AskUserQuestions](../AskUserQuestions.tsx) (Clarifying questions) for
application-supplied questions with stable unique IDs. Supported types are single choice (`type: "choice"`, the
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

AskUserQuestions also takes `agent` (names the asking agent in the header), `onSkip`
(a button for questions the agent can do without), `headingLevel` (default 3),
`appearance` (`card` on a tray, at most 38rem wide, or `plain` on its host's paper) and
`labels`. With `receipt`, an accepted submission folds the questions into «إجاباتك»,
the answers the host accepted and never what the agent did with them; `onEditAnswers`
adds «تعديل الإجابات», and `answered` mounts straight into the receipt from `value`
when the host already holds the answers, submitting and announcing nothing. States:
asking, submitting, answered and failed. A status pill reads needs-you while the
questions wait.

Use [ApprovalCard](../ApprovalCard.tsx) (Approval request) for a concrete proposed
action. Supply `request: {id, action, target, consequences, details?, approveLabel,
rejectLabel}`. Write specific labels, such as “Approve rename” and “Keep current
title”. Show critical parameters verbatim. Optional: `impact` (who or what is
affected, with amounts, as a compact table), `irreversible` (true shows a note in the
attention color and a node replaces it; set it whenever the action cannot be undone),
`reversible`, `expiryLabel` and `expired` (the host's expiry text and its word that
the request lapsed: the card runs no clock), `secondaryAction` (a middle button, such as
“View the messages”), `receiptTime` (host-formatted text after the approved receipt),
`headingLevel` and `labels`, and `appearance` (`plain` inside Agent task or a
conversation). Rejection is safe and equally available; there is no preselected
decision, countdown, automatic approval or standing access. Approve never takes default
focus, and an inline card never steals focus on mount. They are named groups, not modal
dialogs. Use the existing Modal if a host requires a trapped dialog and place initial
focus on its safe action.

The card's shortcuts are scoped and safe. They work only while focus is inside the card.
Escape rejects an undecided card; inside a Sheet or Modal the dialog takes Escape and
closes, and nothing is recorded. Ctrl or Cmd+Enter approves only when `reversible` is
true and `irreversible` is not: an irreversible request, or one not marked reversible,
has no shortcut and needs a click, or Enter or Space on the focused button. The chord
waits 500 ms after the card mounts and again whenever what it approves changes (the
request, `reversible`, `irreversible`, `expired`, or an impact row's `id`, or its `label`
or `value` when given as a string or number), uses exactly one
of Ctrl or Cmd, and ignores key repeat and input-method composition, so a held key can
never approve the next request unread. A React-node label or value and a row's `note` do
not restart the wait, so pass figures that can change as strings or numbers. Plain Enter
is never a shortcut on the card: it
only activates the focused button. Key hints show only on real shortcuts.

`onDecision(request, "approved" | "rejected", {signal})` acknowledges the
**decision only**. Resolving it records approved/rejected; it does not mean that
an action executed or completed. Once decided, the card condenses to a one-line
receipt that keeps the action, its target and the outcome: «تمت الموافقة · {receiptTime}»,
«رُفض الطلب» or, when the host set `expired`, «انتهت مهلة الطلب». There is no Undo, and
the host shows whether the work ran where it happens. Expiry aborts a decision still in
flight, so a late answer records nothing; a card already decided stays decided. A failed
acknowledgement keeps the full proposal visible. A failed acknowledgement restores the
initiating button when focus has
not intentionally moved elsewhere. Buttons are guarded while submitting and
after acceptance. A controlled `value` is an `ApprovalRecord` (or null), bound to
both `requestId` and `approvalRequestKey(request)`; stale records are ignored.
For controlled cards publish an accepted record explicitly; null continues to
show the pending proposal and cannot trigger a duplicate callback.

[ApprovalFlow](../ApprovalFlow.tsx) (Approval sequence) composes a short
application-owned sequence.
It shows position and accepted prior decisions, advances only after the host
accepts, and requires a fresh decision for every request. IDs must be unique and
stable across updates. Unchanged decisions survive append/reorder; changes to
ID, action, target, details, consequences or action labels invalidate the previous
record. Use optional `value` and `onValueChange` for controlled records; publish
the returned array in `onValueChange`. This is a UI composition, not a workflow
or authorization engine. Keep requests immutable. `approval(request)` returns an
`ApprovalDetails` for each request (`impact`, `irreversible`, `reversible`,
`expiryLabel`, `expired`, `secondaryAction`, `receiptTime`, `labels`), so each card
carries its own impact, shortcut rule and words; the flow's own `labels` (position,
history, allDecided, none), `headingLevel` and `appearance` (`card` puts the whole flow
in one tray around a plain card) work as on the card. After each accepted decision focus
moves to the next card, only when focus was inside the flow, and that card's chord waits
500 ms before it acts. The flow's polite region announces the decision with the next
position, in config.numerals digits, and its last announcement is `labels.allDecided`.

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
ongoing permissions. There is no approve-all and no permission management: every
approval is a decision about specific content.

[Compiling examples](examples/AIDecisionsExamples.tsx) include independent basic
examples, which tell the October close from the shared story in
[finance-story.ts](examples/finance-story.ts), and `AIDecisionsExample`: a question
whose answer hands off to a two-request ApprovalFlow. Host acknowledgements resolve
after a short delay, and unmount/replacement cancels their signal listeners. No data
leaves memory, no action executes, and approved is never labeled completed. The
documentation's states show each outcome, including a failed acknowledgement and an
expired request.
Use `SystemProvider` for Arabic/English direction, theme, accent, typography,
density and reduced motion. Motion here (a receipt folding in, its mark drawing, a
decided request rising into the flow's history) runs only after a change, never when
a card mounts, and honors both reduced-motion settings. Screen-reader speech
and physical-device behavior require host testing; automated checks alone do not
establish them.

## Terminal

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

## Assistant workspace

`ChatApp` is the composition shell for the Assistant workspace screen (page id
`chat-app`; the repository also serves it at `/examples/chat-app`). Required props:
`conversations` (unique stable `{id, title, group?}` records), `activeConversationId`
(`string | null`), `onConversationSelect(id)`, `onNewConversation()`, `children` and
`composer`. Optional slots: `toolbar` and `actions` (the header's end, in that order),
`sidePanel` (an aside at the inline end for evidence, a draft or a task's details;
below 960px of container width it sits under the conversation), `brand` (nothing shows
without it), `title`, `labels: ChatAppLabels` (the navigation words plus
`conversationActions(title)`, `rename`, `delete` and `sidePanel`) and `className`.
Conversations that share a `group` sit under its heading, in the order their first
conversation appears; ungrouped ones sit under the list's own heading.

With `onConversationRename(id)` or `onConversationDelete(id)` each row gets a menu
button («خيارات {title}», shown on hover and focus and always on touch). They are
intents: the host owns the rename field and the delete confirmation. Open your own
Modal from the intent and delete only when the person confirms it, never on the
intent alone. A deleted row's menu goes with the row, so the host chooses where focus
goes next; the example's Modal returns it to its own trigger.

The host owns messages, drafts, the active conversation and execution state. ChatApp
owns only the mobile navigation disclosure. It uses the existing Sidebar and Sheet: at
a container width up to 640px the rail becomes a menu trigger and Sheet. Selecting a
row, a new conversation, rename and delete dismiss it; Escape, outside click and close
restore trigger focus. The shell has a bounded height; navigation, thread and side
panel scroll independently. Set its block-size in host CSS if embedding in a different
viewport.

Compose the conversation from patterns: a ChatThread whose messages hold CitedAnswer,
AskUserQuestions and AgentTask in `appearance="plain"` (or `ChatThreadMessage` for one
message), and TaskStarter in plain appearance as the `composer`. Key the thread and
the entry by conversation ID, invalidate delayed work on switch, new, delete and
unmount, and bind callbacks to both the run and the conversation identity, so stale
work never updates another conversation.

`ai/examples/ChatAppExample.tsx` tells the October close in memory, with fictional
content and no real AI or tools: a cited answer, the agent's questions with their
receipt and a task waiting on the reminders' approval, with the task's details in the
side panel. Approving finishes the task; rename opens a Modal and delete a
confirmation Modal; each conversation keeps its own draft, and a new request gets one
neutral canned reply. Unmount clears its timers. No authentication, backend,
persistent history, model connection, application framework or uploads are added.
Copy all source and `ai/` together; adjust CSS and `./system` imports to the
relocated library root.
