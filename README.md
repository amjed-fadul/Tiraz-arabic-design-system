# طِراز · Tiraz

An Arabic-first, MIT-licensed design system for business dashboards, with sixty-eight source-owned component families and a local documentation workbench. Arabic + RTL are the defaults. The landing-page work remains paused.

## Run locally

Use Node.js **22.12 or newer** and npm.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the Local URL printed by Vite, normally **http://127.0.0.1:5173**.

```sh
npm test
npm run lint
npm run build
npm run format:check
```

## Customer dashboard example

Open **Dashboard example** in the documentation header, or visit
`/examples/dashboard` on the local server. This full-page Arabic-first customer
dashboard connects metrics, period-filtered charts, searchable/filterable
DataTable and validated customer creation using existing Tiraz components.
Records and preferences live in memory; reload restores the deterministic sample.
Secondary preview controls demonstrate loading, empty and error states.
See [run/reuse and behavior notes](docs/dashboard-example/README.md).

## Documentation workbench

Each component has one continuous page: title and description → a single-line agent prompt with its copy button → playground → useful examples → generated usage code and an API disclosure. The visible prompt truncates with an ellipsis; copying includes the entire prompt, current configuration and compiling usage module. Latin paths are isolated within Arabic text. Prompts first ask the agent to locate Tiraz within the current project and clearly report if the system cannot be found. Source, export, configuration, font-entry and README guidance paths are relative to the located Tiraz root; prompts contain no machine-specific project root, installer or invented instruction file.

Arabic mode has navigation only in the compact 190px right sidebar. A separate 240px rail sits 10px from the viewport's left edge, with compact system settings above the contextual component inspector, each on its own rounded surface with a 16px gap. Its bounded scroll region supports keyboard access and shorter windows. English mode mirrors both rails through logical layout. They reserve their own grid space outside the centered article. Navigation scrolls independently for a growing library.

The inspector presents common controls without technical subtitles or an advanced disclosure. Button has label, variant, size, one state selector (including disabled/loading), icon preset and icon-only mode. Tabs has variant/selection; Switch has label/checked/disabled; Menu has trigger label/alignment/validated items; Sheet has title/content/side; Toast has title/description/tone/duration. Input has label/placeholder/helper/error/required/size/disabled/read-only; Field stays available as a composition helper under Input; Select has placeholder/size/disabled/options. Other public props, native attributes, functions and refs remain documented and supported by the library. Per-component edits survive navigation and reload.

One header light/dark preference updates documentation, both rails, controls, playgrounds, examples and scoped portals. One language selector pairs Arabic + RTL and English + LTR. Rail settings affect preview/example accent, text scale, numerals, density, corners and motion; documentation typography and layout stay stable. Accent choices show theme-aware swatches beside localized names: Green, Blue, Purple, Brown, Lime, Amber, Teal, Cyan, Indigo, Rose and Slate. The original four paired values and internal palette IDs are retained.

Navigation and the combined customization rail move into separate accessible drawers on narrow screens. Code and API tables scroll within their own containers. The prompt remains one line with a visible copy button at 320px.

Validated browser storage uses these keys:

| Preference                                  | Key                      |
| ------------------------------------------- | ------------------------ |
| One shared theme                            | `tiraz.theme.v1`         |
| Language, current page and disclosure state | `tiraz.documentation.v2` |
| Non-theme system settings                   | `tiraz.system.v3`        |
| Per-component properties                    | `tiraz.playgrounds.v2`   |

Theme migration chooses the first **valid** value in this order: new shared preference → previous documentation theme (`tiraz.documentation.v1`) → previous system theme (`tiraz.system.v2`) → milestone theme (`tiraz.preferences.v1`) → light. Other settings/properties migrate separately. Obsolete `previewTheme` and `previewAccent` fields are discarded, so no old page can retain a different mode or color. Old keys remain as migration inputs, but valid new keys take precedence. Blocked storage leaves the UI usable in memory.

System reset restores **light theme, Green accent, compact density, standard text scale, 8px corners and motion enabled**, preserving language and component properties. Component reset restores only the selected component's props, preserving current system settings and shared theme.

### Confirmed accent bug

Reproduction: set Button to idle, save a blue per-page override, change the global accent to Purple, and reload. System state and examples become Purple; the playground stays Blue. `previewConfig` reapplied persisted per-page overrides after the reactive global configuration, giving the preview provider a different `--action` value. Inherited previews updated correctly; no missing dependency or stale provider snapshot was found. The smallest fix makes preview configuration use the current global config, and migration removes obsolete appearance fields. A regression test was observed failing before the fix and passing after it.

Success/error/destructive variants intentionally retain semantic feedback colors. A green success Button received the new accent token correctly during diagnosis; its green success surface was not stale. Exact reproduction steps and provider/CSS/storage traces are in [docs/accent-root-cause.json](docs/accent-root-cause.json).

## Library and source

```text
src/system/                 Reusable library, exported TypeScript APIs
  config.ts                 Typed configuration and paired accent colors
  Provider.tsx              Direction, scoped tokens and portal container
  tokens.css                Semantic foundations, themes, typography, density
  components.css            Interaction states, focus and motion
  Button.tsx                Variants, sizes, idle/loading/success/error
  Tabs.tsx                  Keyboard navigation and active indicator
  Switch.tsx                Labeled checked/unchecked controls
  DropdownMenu.tsx          Anchored, non-modal action menu
  Sheet.tsx                 Modal panel with focus trap and dismissal
  Toast.tsx                 Bounded feedback stack and announcements
  Field.tsx                 Typed label/helper/error associations
  Input.tsx                 Text entry with optional label/helper/error
  Select.tsx                Radix single choice with scoped scrolling popup
  ai/                       Portable registry, guidance and compiling examples
  index.ts                  Public exports
src/workbench/              Documentation shell, inspector, models and generators
  model.ts / fields.ts      Validated props and API-derived controls
  generate.ts               Usage modules and agent prompts
  storage.ts                Independent persisted state layers
src/tests/setup.ts          Test-only DOM support
```

The workbench uses React 19, TypeScript, Vite, Tailwind CSS v4, Radix interaction primitives, and Lucide icons. IBM Plex Sans Arabic is bundled locally at weights **400, 500 and 600** from Fontsource, with no remote font request.

Components consume scoped provider tokens. Menus and Sheets portal into the provider container and inherit its theme/configuration. Provider wrappers do not create stacking contexts that trap overlays below later examples; Tabs isolates its indicator locally. Toast viewports remain within their provider scope.

## Use the system

Copy `src/system` into your app, excluding tests, and install the runtime dependencies listed in `package.json`. No workbench code is required. Import the local fonts and library CSS once:

```tsx
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
import { Button, SystemProvider, defaultConfig } from "./system";

export function App() {
  return (
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <Button onClick={() => console.log("Local example")}>إنشاء مشروع</Button>
    </SystemProvider>
  );
}
```

`Button` defaults to `sm`; the system defaults to compact density. `md` and standard density remain available. Small labels use readable 14px Arabic text and normal pointer targets; Sheet widths remain **440px**, bounded by the viewport.

`ButtonProps` requires an accessible name for icon-only buttons; loading blocks repeated clicks and exposes `aria-busy`. State icons accompany caller-supplied labels. `Tabs` and `Switch` support controlled/internal state. Switch inherits native Radix Root attributes/ref; the wrapper owns Thumb markup, so `children` and `asChild` are excluded.

`DropdownMenu` supports typed items with callbacks, icons, shortcuts, disabled/destructive states, and separators. Arrow keys, Home/End, typeahead, Escape and Tab dismissal retain their behavior. `Sheet` accepts caller-supplied content/footer and defaults to right in RTL / left in LTR. Escape, backdrop and close controls dismiss and restore focus. Its editable example saves local changes and discards cancelled drafts.

Use `useToast()` inside `ToastProvider` for success/error/info feedback. At most three entries are shown; expiry pauses on hover/focus, and manual/swipe dismissal and F8 viewport navigation remain available.

## Configuration

`SystemConfig` contains `theme`, `direction`, `density`, `accent`, `radius`, `reducedMotion`, optional `typography` (`standard` or `large`) and optional `numerals` (`arab` for Arabic-Indic ٠١٢, the default, or `latn` for Western 012). Every component number and date formatter follows `numerals` through the exported `numberLocale(config, language?)` helper; English always uses Western digits. Paired accent presets are sage, blue, plum, clay, lime, amber, teal, cyan, indigo, rose and slate. The corner control ranges from 0–16px. Standard typography is 24px titles, 18px section headings, 14px body/control labels and 12px metadata; large previews use 26/20/16/14px. Documentation has its own fixed typography and control styling.

Hover/press feedback uses 120ms, state changes 180ms, overlay entrance 240ms and exit 160ms. OS reduced-motion preferences always win; component settings can additionally disable preview motion.

## Verification and screenshots

The compact update passed the full Vitest suite, strict compilation of **19 generated usage modules**, Oxlint, TypeScript/Vite production build and formatting. The original browser checks covered nine pages (current navigation has ten, with Field under Input), all 20 scalar inspector controls plus the menu editor, clipboard contents, shared portal themes, immediate successive accent updates, navigation/reset/reload, legacy migration, keyboard/focus, reduced motion and 320/390px mobile layouts. Ordinary and wide desktop geometry confirms the rail stays 10px from the viewport edge without overlapping content; short windows have accessible internal scrolling.

Independent source review and re-review were performed. Details: [docs/compact-workbench-verification.json](docs/compact-workbench-verification.json). The earlier [workbench verification record](docs/workbench-verification.json) describes the previous design and is retained as history.

- [Compact Arabic desktop](docs/screenshots/compact-light-rtl.jpg)
- [Mirrored dark English desktop](docs/screenshots/compact-dark-ltr.jpg)
- [Mobile Arabic](docs/screenshots/compact-mobile-rtl.jpg)
- [Combined mobile customization drawer](docs/screenshots/compact-mobile-customization.jpg)
- [Shared dark RTL Sheet](docs/screenshots/compact-sheet-dark.jpg)

Physical-device touch and a manual screen-reader pass remain unverified. Axe scans do not establish full accessibility conformance. The compact inspector demonstrates representative content and common properties, not arbitrary JSX/functions; complete APIs remain available in source and documentation. Demo actions send no data. The initial source baseline is prepared for GitHub; no release or deployment is included, and landing-page work remains paused. See the [baseline verification record](docs/baseline-verification.md) for checks associated with this baseline.

## Reference and license

The reading order was informed by the public [FormicAI component preview](https://formicai.dev/preview.html#/button), reviewed in the browser. Tiraz has its own layout and implementation; no premium source was copied.

[MIT](LICENSE). Font and dependency licenses remain with their respective packages.

## Form foundation

Input is the starting point for text entry: `<Input label="Name" helper="As shown on the invoice" error={error} required name="name" />`. Labeled mode reuses Field internally. Helper/error accompany label; label/helper/error and field composition are mutually exclusive. Ref, className/style and native attributes remain on the actual input. Field remains exported for lower-level composition and existing consumers, with stable label/help/error associations and external description IDs. Error display never performs validation. Input supports text, email, password, search, tel and url, with React 19 refs and native form behavior. Select uses Radix Select 2.4.1; its hidden native select participates in submission and required validation. Cancelled reset preserves value and emits no change; successful reset is applied after event dispatch. Static checkValidity preserves focus, while interactive native focus redirects to the trigger. Application invalid cancellation and error-summary focus are respected. Controlled values require application callbacks (Input reset also needs application onReset).

The Sheet page includes the application-owned Create customer example. Input has focused basic, labeled/helper, required/error, disabled and read-only examples; Select has a small status example. Field is documented under Input, and a saved Field page redirects to Input without losing its customization. Customer name is required, email optional and validated when supplied, and status is a single Select. Cancel/dismiss discards the draft; saving adds a semantic Table row and Toast. Data exists only while the example is mounted, with no backend or reload persistence.

### Table foundation

Use native composition: `Table` (optional `caption`, separate `containerProps`),
`TableHeader`, `TableBody`, `TableRow`, `TableHead`, and `TableCell`. Table props/ref
stay on the actual table; other wrappers accept their native HTML attributes/ref.
Headers default to column scope. Rows need stable application keys; empty content
is a spanning cell supplied by the application. The scroll container is keyboard
focusable and inherits the table name. Shared density, text scale, theme and
RTL/LTR apply. Cells wrap and narrow screens scroll internally. This foundation
has no sorting, filtering, pagination, selection, editing, virtualization or sticky
columns. The connected Sheet customer example displays saved customers in Table.

### DataTable v1

Use Table for plain native tabular composition. DataTable adds typed columns,
locale-aware text sorting and client pagination (10 rows by default). The
application supplies filtered records, stable IDs, translated labels, empty
content and row actions. Change resetKey with search/filter changes; sorting
returns to page one and shrinking results clamp the page.

The distinct جدول البيانات / DataTable documentation page demonstrates 26
Arabic/English customers, search, status filtering, create with validation and
Toast, and row-specific details Sheets. Caption and explicit example-state
presets are its only contextual controls. Copied code includes the connected
application and compiles against a relocated source bundle. Data remains in
memory. No selection, bulk actions, editing, deletion, virtualization, sticky
columns, backend, persistence or server grid framework is included.

### Badge and native form controls

Badge renders static status text with neutral/success/error/info tones; the customer DataTable uses it for statuses. Checkbox preserves native input state/form/ref behavior with label/helper/error. RadioGroup uses native radios in fieldset/legend with stable names and values. Textarea mirrors Input associations and preserves native editing/selection, rows and vertical resizing. All consume shared configuration.

The focused documentation pages retain the continuous layout and complete copied prompts. `src/system/ai/examples/FeedbackForm.tsx` demonstrates all three form controls with application-owned validation and native reset. Field remains documented under Input. No indeterminate state, table selection, selection cards, automatic textarea growth or new dependencies are included.

### Structure and navigation

Card groups content with native CardHeader, CardTitle, CardDescription,
CardContent and CardFooter; application Buttons own actions. Accordion uses
Radix single-open disclosures with optional collapse and controlled/uncontrolled
state. Breadcrumbs uses native links and current-page text. Pagination provides
controlled page navigation while the caller owns data and page size; DataTable
keeps its existing internal lifecycle. See the portable
[composition guidance](src/system/ai/composition.md#structure-and-navigation) and
[complete examples](src/system/ai/examples/StructureExamples.tsx).

### Charts foundation

LineChart, AreaChart, BarChart, DonutChart render with Recharts 3.10.1 and Tiraz
tokens. Required label/summary accompany application data; optional keyboard
legend toggles and a semantic data-table disclosure supply additional access.
Missing values stay gaps, zero stays zero, and RTL keeps chronological order.
The four documentation pages include single/multiple series and edge samples,
live shared settings, compiling usage, and sample analytics with a working period
selector. See the portable [chart guide](src/system/ai/README.md#charts) for
contracts, source-copy dependencies and honest screen-reader limitations.

Sidebar provides compact expanded/rail navigation with native links, disclosure
buttons and header/footer slots. See its continuous documentation page and
[src/system/ai/examples/SidebarExamples.tsx](src/system/ai/examples/SidebarExamples.tsx).
The connected dashboard uses Sidebar on desktop and the same content in Sheet
on mobile, keeping Overview, Orders and Customers as real section destinations.

The documentation component menu groups implemented pages under Forms,
Files, Navigation, Data, Display & feedback, Overlays and Charts, with compact Arabic
and English labels. Groups stay expanded; the empty AI patterns section is
not shown. Existing page selection and documentation layout remain intact.

TagInput, FilterBar and InputCopy extend the existing native Field and control
patterns. TagInput submits committed repeated form values and respects IME/reset;
FilterBar composes application-owned filters and powers dashboard customer
search/status chips. InputCopy keeps text selectable and reports real clipboard
results. See the portable [guidance](src/system/ai/README.md#tags-filter-controls-and-copying)
and component documentation. These examples add no persistence or filtering engine.

### Files and colors

FileDropzone (Files) selects/removes local files with shared browse/drop validation, duplicate feedback and application-owned submission. ColorPicker (Forms) synchronizes opaque RGB presets, HEX and a native chooser; its sample is independent of system accent. Read the portable contracts and working examples in `src/system/ai/README.md` for submission/reset behavior and scope. Neither component uploads or stores data.

### Slider, OTPInput and DatePicker

The Forms documentation now includes native single-value Slider, one-input OTPInput
and single Gregorian DatePicker. OTP values remain ASCII digit strings, preserving
leading zeros and incomplete edits. Dates use YYYY-MM-DD without UTC conversion.
All reuse Field associations, shared tokens and cancelable form reset conventions.
Controlled forms own their reset state. DatePicker uses @daypicker/react 10.0.2
and @radix-ui/react-popover 1.3.1 with existing scoped portals and Radix overrides.
See [local verification and limitations](docs/slider-otp-date/README.md) and the
[portable contracts](src/system/ai/README.md).

### Steps and Timeline

Steps adds ordered process progress with upcoming/current/completed/error states,
horizontal/vertical layouts, responsive wrapping and opt-in button activation.
The application owns validation, eligibility and progress. Timeline preserves
supplied event order, localized timestamps, semantic dates and application content.
Portable examples include a validated local form and an explicitly in-memory
activity list with real local append. See `src/system/ai/README.md` for contracts.

### TaskRows and NotificationList

TaskRows renders compact, expandable agent-task rows with application-supplied
pending/running/completed/failed states. Choose individual capsules or a connected
list; details/actions remain outside disclosure buttons. Its AI patterns page has
a clearly labeled local simulation with Run/Replay, intentional failure and explicit
retry, with canceled/stale-run-safe timers only in example code. It replaces the
earlier checklist interpretation without adding a component family.

NotificationList retains application-owned notifications, explicit read controls,
derived unread count, All/Unread filtering and focus recovery. Source contracts
and portable examples live in `src/system/ai/`; neither family adds a dependency,
backend or persistence.

## FileTree

FileTree displays application-supplied files and folders with stable unique IDs; it never reads the filesystem. Use `ai/examples/FileTreeExamples.tsx` (relative to the source root) for a nested project and application-owned sample-string preview. Controlled or internal expansion and single selection are separate from roving keyboard focus. File click/Enter calls `onActivate(file)`; the host decides what opening means. The example preview follows file selection, including Space; arrow focus does not change it. Empty folders are end nodes. Horizontal arrows mirror in RTL; arrows, Home/End, typeahead and * navigate visible nodes. On removal, focus recovers to the nearest visible ancestor or same visible position, then the empty root, without reclaiming outside focus. Supply nonempty names, globally unique stable IDs, and noninteractive metadata/empty content. No upload, editing, search, drag/drop, virtualization, multi-selection or context menu is supplied.

## AI feedback

LoadingState uses a compact pixel grid with Drive/Dots/Orbit variants, a shimmering
label and optional host-supplied elapsedMs. ThinkingIndicator morphs a circle into
an infinity loop beside optional cosmetic whole-word rotation, including textOnly.
ThinkingState uses a small activity glyph, shimmering current summary and smooth
disclosure of application-supplied activity steps; the host supplies completion.

Only meaningful label changes announce. Decorative frames, elapsed ticks and word
changes stay out of live regions; Arabic words remain connected. Provider and OS
reduced motion leave static glyphs and readable labels. Disclosure/focus and local
demo cancellation are preserved. The general-purpose Spinner is unchanged.
See [portable guidance](src/system/ai/README.md) and
[compiling examples](src/system/ai/examples/AIFeedbackExamples.tsx).

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
output and an explicitly started local simulation: running → success, failure →
host retry, and a chip that opens and focuses its call. Replay/reset/unmount cancel
stale timers. Sample data contains no secrets and performs no tool operation.

CodeBlock, Markdown and StreamingText extend the existing AI patterns category.
They cover exact source copying, safe CommonMark/GFM presentation and immediate
host-driven streaming, with compact token-based styles. Source-copy consumers
must install `react-markdown@10.1.0 remark-gfm@4.0.1`; see
[src/system/ai/README.md](src/system/ai/README.md#ai-response-content) for parsing,
URL/HTML restrictions, language fallback and host responsibilities. The
StreamingText page opens complete, with Streaming and Done states, and Replay
streams its local fixed-chunk sample again.

Every documentation page shows its example in one demo frame: the page name in
both languages, a state switcher where the component has meaningful states,
Replay only where it has a lifecycle, a Preview/Code switch and Copy code, with
a notes row below. Nothing autoplays, and Replay steps through the states
without a stop control. Replay no longer resets props: the inspector's "Reset
playground" does. The agent prompt, including source-copy dependency
instructions, sits below the frame under "Use it in your app".

## Chat foundations

ChatThread, ChatComposer and PromptBar live under AI patterns. Messages, draft,
submission, acceptance, cancellation and execution state stay in the application.
The two entries share IME-safe Enter/Shift+Enter handling and bounded growth;
valid text is passed unchanged and the host clears the controlled draft only on
acceptance. Thread following is opt-in and stops when the reader leaves the bottom.
See [portable chat guidance](src/system/ai/README.md#chat-foundations) and the
[connected local example](src/system/ai/examples/ChatExamples.tsx). No backend,
model connection, uploads, persistence or ChatApp shell is included.

ImageResult, Sources / InlineCitation and InsightCards extend **AI patterns** with
application-supplied images, real reference links and concise supported findings.
Their bilingual local examples include fixed-frame loading/failure recovery,
connected citations, stable numbering on reorder and finding details. Copy the
whole `src/system/ai/assets/results/` directory with source-only examples; preserve
local SVG/text `?url&no-inline` imports and the bundled license. Source copies also need the
already installed `@radix-ui/react-popover@1.3.1` and documented Radix overrides.
See `src/system/ai/README.md` for URL restrictions and host responsibilities.

SelectionActions, ContextMeter and ModelSelector are documented under AI patterns.
Their connected chat example uses scoped selection, controlled model IDs and
explicit sample context values. See `src/system/ai/README.md` for ownership,
keyboard focus, selection exclusions and source-copy requirements. Local browser
verification and captures are in `docs/ai-context-controls/`.

### AI questions and decisions

AskUserQuestions, ApprovalCard and ApprovalFlow live under AI patterns. The
[portable guidance](src/system/ai/README.md#questions-and-one-time-decisions)
explains supported question types, controlled drafts/records, host responsibilities,
request replacement and decision versus execution. The connected Studio Assistant
example uses harmless in-memory data with rejection, acknowledgement failure/retry
and a second independent request. No action executes and no standing access is
introduced. Local verification evidence is in `docs/ai-decisions/`.

Terminal and ChatApp complete the requested AI patterns. Terminal presents supplied
command/output text without execution; ChatApp composes existing navigation, chat
and entry components with host-owned state. The in-memory example runs at
`/examples/chat-app`; it uses fixed local responses and supplied Terminal output.
Switch/new cancels and retains received content and per-conversation drafts/models;
reset restores samples. Portable contracts and examples live in `src/system/ai/`.
Verification and screenshots: `docs/terminal-and-chat-app/README.md`.
