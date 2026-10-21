# طِراز · Tiraz

An Arabic-first, MIT-licensed design system for business dashboards, with seventy-four source-owned component families and a local documentation workbench. Arabic + RTL are the defaults. The landing-page work remains paused.

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

Open **Customer dashboard** («لوحة العملاء») under Screens in the documentation
navigation, or **Dashboard example** in the documentation header. Like the ten example
screens, it opens as a screen page inside the docs, with Desktop, Tablet and Phone
width chips; its new-tab link, or `/examples/dashboard` on the local server, opens it
on its own. This full-page Arabic-first customer
dashboard connects metrics, period-filtered charts, searchable/filterable
DataTable and validated customer creation using existing Tiraz components. Its
overview shows four figure cards: customers, orders, revenue and the average order.
Order performance sets the trend beside What changed (`ChangeSummary`): orders, revenue
and the average order, the last seven days against the seven before, computed from the
sample orders. Beside the channels' donut, Ask your data (`DataAnswer`) answers how
much revenue each channel brought in this period, as a bar chart or a donut. The
header's Decision inbox button (`DecisionInbox`, in a Sheet) counts the requests that
wait on you; approving the reversible one reactivates Layla Ahmed in memory.
Records and preferences live in memory; reload restores the deterministic sample.
Secondary preview controls demonstrate loading, empty and error states.
See [run/reuse and behavior notes](docs/dashboard-example/README.md).

## Documentation workbench

Each component has one continuous page: its name once, as the heading, with the description → "Use it in your app", a single-line agent prompt with its copy button → the interactive playground (Preview and Code views) → usage guidelines → the API reference, an open table of props, types, defaults and descriptions. The prompt is always English, on Arabic and English pages alike. The visible prompt truncates with an ellipsis; copying includes the entire prompt, current configuration and compiling usage module. Paths are isolated as left-to-right runs. Prompts first ask the agent to locate Tiraz within the current project and clearly report if the system cannot be found. Source, export, configuration, font-entry and README guidance paths are relative to the located Tiraz root; prompts contain no machine-specific project root, installer or invented instruction file.

Arabic mode has navigation only in the compact 190px right sidebar. «تخصيص» / "Customize" in the playground toolbar opens the settings, closed by default. From 1,024px a 320px paper panel docks at the end side and pushes the page narrower; below that, the same settings open in a modal Sheet. Navigation scrolls independently for a growing library.

The inspector presents common controls without technical subtitles or an advanced disclosure. Button has label, variant, size, one state selector (including disabled/loading), icon preset and icon-only mode. Tabs has variant/selection; Switch has label/checked/disabled; Menu has trigger label/alignment/validated items; Sheet has title/content/side; Toast has title/description/tone/duration. Input has label/placeholder/helper/error/required/size/disabled/read-only; Field stays available as a composition helper under Input; Select has placeholder/size/disabled/options. Other public props, native attributes, functions and refs remain documented and supported by the library. Per-component edits survive navigation and reload.

One header light/dark preference updates documentation, the settings panel, controls, playgrounds, examples and scoped portals. One language selector pairs Arabic + RTL and English + LTR. System settings affect preview/example accent, text scale, numerals, density, corners and motion; documentation typography and layout stay stable. Accent choices show theme-aware swatches beside localized names: Green, Blue, Purple, Brown, Lime, Amber, Teal, Cyan, Indigo, Rose, Slate and Ink. The original four paired values and internal palette IDs are retained.

Navigation moves into an accessible drawer on narrow screens, and the settings open in a Sheet below 1,024px. Code and API tables scroll within their own containers. The prompt remains one line with a visible copy button at 320px.

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

Keep `:dir()` as written in your CSS pipeline. Tiraz sets every direction-bearing detail with `:dir(rtl)` (mirrored icons, popup origins, the switch, slider and progress fills, the skeleton sweep, shimmers and the Sources fan), which Chrome and Edge 120+, Firefox 49+ and Safari 16.4+ support; a build that targets older browsers rewrites it to `:lang()`, which follows the page language instead of its direction. This repository's `vite.config.ts` sets `build.cssTarget` for that reason.

`Button` defaults to `sm`; the system defaults to compact density. `md` and standard density remain available. Small labels use readable 14px Arabic text and normal pointer targets; Sheet widths remain **440px**, bounded by the viewport.

`ButtonProps` requires an accessible name for icon-only buttons; loading blocks repeated clicks and exposes `aria-busy`. State icons accompany caller-supplied labels. `Tabs` and `Switch` support controlled/internal state. Switch inherits native Radix Root attributes/ref; the wrapper owns Thumb markup, so `children` and `asChild` are excluded.

`DropdownMenu` supports typed items with callbacks, icons, shortcuts, disabled/destructive states, and separators. Arrow keys, Home/End, typeahead, Escape and Tab dismissal retain their behavior. `Sheet` accepts caller-supplied content/footer and defaults to right in RTL / left in LTR. Escape, backdrop and close controls dismiss and restore focus. Its editable example saves local changes and discards cancelled drafts.

Use `useToast()` inside `ToastProvider` for success/error/info/warning feedback. At most three entries are shown; expiry pauses on hover/focus, and manual/swipe dismissal and F8 viewport navigation remain available.

## Configuration

`SystemConfig` contains `theme`, `direction`, `density`, `accent`, `radius`, `reducedMotion`, optional `typography` (`standard` or `large`) and optional `numerals` (`arab` for Arabic-Indic ٠١٢, the default, or `latn` for Western 012). Every component number and date formatter follows `numerals` through the exported `numberLocale(config, language?)` helper; English always uses Western digits. Paired accent presets are sage, blue, plum, clay, lime, amber, teal, cyan, indigo, rose, slate and the monochrome ink. The AI and attention colors are fixed and never follow the accent. Indigo, blue, plum and slate bring the accent close to the AI color, and amber and clay close to attention, so meaning never rests on color: AI content carries its mark or label, and "needs you" its glyph and word. The corner control ranges from 0–16px. `typography="large"` raises every step of the type scale below. The documentation chrome keeps its own fixed configuration: standard density and typography, the sage accent and 8px corners.

Interface motion stays between 90 and 240ms. A press takes 90ms and releases over 160ms; hover and color changes take 120ms and state changes 200ms; popovers and menus enter in 180ms and leave in 120ms; dialogs take 220ms in and 150ms out, and toasts 240ms and 150ms. Sheets are the one exception, at 280ms in and 200ms out. Keyboard actions do not animate. OS reduced-motion preferences always win; component settings can additionally disable preview motion.

### Tokens

Components read these custom properties from `tokens.css`. The provider sets `--action` (the accent's light or dark value) and `--radius` (the corner setting) inline; everything else sits under `.tiraz-system`, with blocks for the dark theme, compact density, large typography, reduced motion and keyboard modality. Values are for the light theme, standard density and standard typography unless a column says otherwise.

**Type.** Headings use weight 600.

| Size                  | Standard | Large  | Leading                  | Use                                                  |
| --------------------- | -------- | ------ | ------------------------ | ---------------------------------------------------- |
| `--text-display`      | 30px     | 34px   | `--leading-display` 1.3  | page titles                                          |
| `--text-title`        | 24px     | 26px   | `--leading-title` 1.35   | section headings, Markdown h1                        |
| `--text-heading`      | 18px     | 20px   | `--leading-heading` 1.5  | card, dialog and panel titles                        |
| `--text-subheading`   | 16px     | 18px   | `--leading-heading` 1.5  | titles in compact cards, patterns and popovers       |
| `--text-reading`      | 15.5px   | 17px   | `--leading-reading` 1.95 | long reading: answers, drafts, Markdown, dialog text |
| `--text-body`         | 14px     | 16px   | `--line-height` 1.8      | controls and body text                               |
| `--text-label`        | 13px     | 15px   | `--leading-meta` 1.6     | chips, tags, sidebar and tree items, step labels     |
| `--text-meta`         | 12.5px   | 14px   | `--leading-meta` 1.6     | help, timestamps, descriptions in rows               |
| `--text-micro`        | 11px     | 12.5px | `--leading-micro` 1.4    | key hints, tool IDs, citation numbers                |
| `--text-figure`       | 28px     | 32px   | `--leading-figure` 1.25  | KPI values and totals                                |
| `--text-figure-small` | 20px     | 22px   | —                        | amounts in headers and rows                          |

`--text-touch` is `max(16px, var(--text-body))`, so fields on touch screens never zoom the page. `--weight-regular`, `--weight-medium` and `--weight-semibold` are 400, 500 and 600, the bundled weights. `--underline-offset` is 0.24em, and 0.45em in RTL so underlines clear Arabic dots.

**Fonts.** `--font` is `"IBM Plex Sans Arabic", system-ui, sans-serif`. `--font-mono` is `ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", "DejaVu Sans Mono", "IBM Plex Sans Arabic", monospace`: the Arabic face sits ahead of `monospace`, so Arabic inside code still joins. Mono is for machine values only: code, tool IDs, key hints and file names. The root sets `font-synthesis: none`, so every weight a token uses must be bundled.

**Color.**

| Token                                                          | Light                                 | Dark                                  | Use                                                                                        |
| -------------------------------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `--surface-page`                                               | #f7f8f7                               | #161b18                               | app background                                                                             |
| `--surface-tray`                                               | #eceeea                               | #121714                               | trays, sidebars, table headers, dialog footers                                             |
| `--surface`                                                    | #ffffff                               | #1c221e                               | paper: content surfaces                                                                    |
| `--surface-well`                                               | tray 55% into paper                   | tray 55% into paper                   | code, tool output and details inside paper                                                 |
| `--surface-subtle`, `--surface-hover`                          | #f2f4f2, #eaecea                      | #232b25, #2b352e                      | kept for compatibility                                                                     |
| `--text`, `--text-secondary`, `--text-muted`                   | #232a26, #56615a, #616b64             | #ecf0ec, #adb9af, #9ba8a0             | the three text tiers                                                                       |
| `--border`, `--border-strong`                                  | #e2e7e3, #c5cec7                      | #333e36, #546259                      | dividers; secondary buttons and dashed edges                                               |
| `--border-field`                                               | #848a85                               | #5f6f65                               | field, checkbox and radio edges (3:1)                                                      |
| `--hairline`                                                   | #12231a14                             | #ffffff14                             | 0.5px rows and edges                                                                       |
| `--action-text`                                                | #ffffff                               | #17241c                               | text on the accent                                                                         |
| `--action-hover`                                               | accent, 12% black                     | accent, 10% white                     | primary hover                                                                              |
| `--action-soft`, `--action-border`                             | accent 8% into paper; 24% into border | accent 9% into paper; 24% into border | selected rows and their edges                                                              |
| `--focus`, `--focus-halo`                                      | the accent; 22% of it                 | the accent; 30% of it                 | focus ring and field halo                                                                  |
| `--success`, `--success-soft`                                  | #316746, #edf5ee                      | #a5d4b3, #24372a                      | success                                                                                    |
| `--danger`, `--danger-soft`                                    | #a93738, #fbefef                      | #f0a4a5, #3e2729                      | errors and destructive actions                                                             |
| `--info`, `--info-soft`                                        | #355c87, #eef3f9                      | #adcaf0, #253347                      | information                                                                                |
| `--ai`, `--ai-soft`                                            | #4b47c6, 11% into paper               | #aba7ff, 18% into paper               | AI presence; fixed                                                                         |
| `--attention`, `--attention-soft`                              | #935200, 12% into paper               | #f1b45e, 16% into paper               | "needs you" and warnings; fixed                                                            |
| `--wash`, `--wash-strong`                                      | 4% and 7% of `--text`                 | 4% and 7% of `--text`                 | hover and pressed fills                                                                    |
| `--warp`                                                       | 6% of `--text`                        | 6% of `--text`                        | the demo stage's lines                                                                     |
| `--backdrop`                                                   | #0c18114d                             | #050a0799                             | behind dialogs, sheets and drawers                                                         |
| `--shimmer`                                                    | #ffffffa6                             | #ffffff12                             | the skeleton sweep                                                                         |
| `--switch-track`                                               | #77857b                               | #67776b                               | an off switch                                                                              |
| `--code-string`, `--code-number`, `--code-literal`             | #0b6f8f, #a4520b, #9b3a6c             | #6fcbe6, #f0a862, #f0a5cb             | code; `--code-key` is `--text`, `--code-comment` `--text-muted`, `--code-surface` the well |
| `--chart-sage`, `--chart-blue`, `--chart-plum`, `--chart-clay` | #355e4c, #365b87, #6b487a, #88543f    | #a5c9b4, #a8c6ef, #d6b6e5, #e8baa3    | chart series                                                                               |

**Shadows.** Each has a dark-theme value in `tokens.css`. `--shadow-paper` is paper's 1px ring, contact shadow and soft drop (`--shadow-surface` is an alias); `--shadow-chip` is small paper on a tray, such as a selected segment or the current sidebar item; `--shadow-control` sits under resting controls; `--shadow-raised` and `--shadow-pressed` are a primary button and its press; `--shadow-popover` lifts menus, selects and tooltips; `--shadow-overlay` lifts dialogs, sheets and drawers; `--shadow-thumb` is the switch and slider thumb. Content sits on paper; status, meta and decisions sit on the tray, with `--tray-pad` (5px) between a tray and the paper it holds.

**Radii**, from `--radius` (r):

| Token              | Formula                              | r = 0 | r = 8 (default) | r = 16 | Use                                                 |
| ------------------ | ------------------------------------ | ----- | --------------- | ------ | --------------------------------------------------- |
| `--radius-small`   | max(2px, r − 3px)                    | 2px   | 5px             | 13px   | checkbox, kbd, small tags, swatches                 |
| `--radius-item`    | r                                    | 0     | 8px             | 16px   | menu items, options, navigation, tree and list rows |
| `--radius-control` | r × 1.25                             | 0     | 10px            | 20px   | buttons, inputs, selects, segments                  |
| `--radius-paper`   | min(24px, max(control, r × 1.875))   | 0     | 15px            | 24px   | cards, popovers, dialogs, toasts, tables            |
| `--radius-tray`    | paper + min(`--tray-pad`, r × 0.625) | 0     | 20px            | 29px   | trays                                               |
| `--radius-pill`    | r × 999                              | 0     | pill            | pill   | status pills, switch tracks, round buttons, chips   |
| `--radius-panel`   | `--radius-paper`                     | 0     | 15px            | 24px   | kept for compatibility                              |

**Space, sizing and density.** `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-5`, `--space-6`, `--space-8` and `--space-10` are 4, 8, 12, 16, 20, 24, 32 and 40px.

| Token                     | Standard | Compact (default) | Use                                     |
| ------------------------- | -------- | ----------------- | --------------------------------------- |
| `--control-height`        | 40px     | 36px              | `size="md"` controls                    |
| `--control-small`         | 36px     | 32px              | `size="sm"` controls                    |
| `--control-padding`       | 16px     | 12px              | inline padding of md controls and cells |
| `--control-small-padding` | 12px     | 10px              | inline padding of sm controls           |
| `--control-gap`           | 8px      | 6px               | between an icon and its label           |
| `--tab-padding`           | 8px      | 4px               | block padding of tabs                   |
| `--cell-padding`          | 8px      | 4px               | block padding of table cells            |
| `--menu-item-padding`     | 5px      | 3px               | block padding of menu and option rows   |
| `--row-gap`               | 16px     | 12px              | between stacked rows                    |
| `--paper-padding-block`   | 16px     | 14px              | block padding of cards, dialogs, toasts |
| `--paper-padding-inline`  | 18px     | 16px              | inline padding of the same              |

Fixed sizes: `--status-size` 22px, `--remove-size` 24px, `--switch-track-width` 38px, `--switch-track-height` 22px, `--switch-thumb` 16px, `--slider-track` 6px, `--slider-thumb` 18px, `--avatar-sm` 32px, `--avatar-md` 40px and `--chat-avatar` 24px. A press scales to `--press-scale` (0.97); disabled controls fade to `--disabled-opacity` (0.5).

**Motion.**

| Token                                           | Duration     | Use                                            |
| ----------------------------------------------- | ------------ | ---------------------------------------------- |
| `--motion-press`, `--motion-release`            | 90ms, 160ms  | a press and its release                        |
| `--motion-fast`                                 | 120ms        | hover and color                                |
| `--motion-state`                                | 200ms        | state changes and moving indicators            |
| `--motion-enter`, `--motion-exit`               | 180ms, 120ms | popovers, menus and selects                    |
| `--motion-tooltip-exit`                         | 100ms        | a tooltip leaving                              |
| `--motion-dialog-enter`, `--motion-dialog-exit` | 220ms, 150ms | dialogs                                        |
| `--motion-panel`, `--motion-panel-exit`         | 280ms, 200ms | sheets                                         |
| `--motion-toast`, `--motion-toast-exit`         | 240ms, 150ms | toasts                                         |
| `--motion-collapse`, `--motion-collapse-exit`   | 200ms, 150ms | expanding and collapsing                       |
| `--motion-receipt`                              | 240ms        | a decided approval folding into its receipt    |
| `--motion-progress`                             | 240ms        | the progress fill moving to a new value        |
| `--motion-status`                               | 200ms        | a status glyph drawing its check or cross      |
| `--motion-reveal`                               | 240ms        | a loaded image fading in                       |
| `--motion-stagger`                              | 40ms         | between cascading items, at most four          |
| `--motion-word`, `--motion-word-settle`         | 34ms, 300ms  | between streamed words, and a word settling in |

Decorative loops: `--motion-loop-stitch` 800ms, `--motion-loop-shimmer` 1900ms, `--motion-loop-turn` 1800ms, `--motion-loop-skeleton` 1600ms, `--motion-loop-caret` 1100ms, `--motion-loop-spinner` 800ms, `--motion-loop-progress` 1500ms, `--motion-loop-pixel` 650ms and `--motion-loop-orbit` 950ms.

| Easing                      | Curve                             | Use                                         |
| --------------------------- | --------------------------------- | ------------------------------------------- |
| `--ease-out` (and `--ease`) | cubic-bezier(0.23, 1, 0.32, 1)    | entrances, state changes and press releases |
| `--ease-in-out`             | cubic-bezier(0.77, 0, 0.175, 1)   | indicators that glide                       |
| `--ease-exit`               | cubic-bezier(0.4, 0, 0.6, 1)      | exits                                       |
| `--ease-drawer`             | cubic-bezier(0.32, 0.72, 0, 1)    | sheets and toasts                           |
| `--ease-spring`             | cubic-bezier(0.22, 1.32, 0.36, 1) | defined; everyday controls do not use it    |

Reduced motion, from the OS or `reducedMotion`, sets every motion token to 0ms and stops the loops. The one duration it keeps is `--weave-fade` (200ms), the opacity fade that replaces the Image generation weave, so a picture still arrives whole. Under keyboard modality (`data-modality="keyboard"`, which the provider sets) interaction motion is 0ms and presses do not scale; status glyphs, the progress fill, image reveals, streamed words and the loops follow the system rather than a key, so they keep their timing.

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

Badge renders static status text with neutral/success/error/info/warning/ai tones (`warning` takes the attention color, for something that needs the person, and `ai` the AI color, for what the assistant produced); Alert takes the same tones, and Spinner has a `neutral` or `ai` tone. The customer DataTable uses Badge for statuses. Checkbox preserves native input state/form/ref behavior with label/helper/error. RadioGroup uses native radios in fieldset/legend with stable names and values. Textarea mirrors Input associations and preserves native editing/selection, rows and vertical resizing. All consume shared configuration.

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

The documentation component menu leads with AI patterns, grouped by job (Ask,
Delegate, Create, Understand and control), then Screens (the Assistant workspace
page, then the Customer dashboard and the ten example screens, each a button that
opens its screen page inside the docs) and Parts, a collapsible section that is closed
by default and remembers its state. Forms, Files, Navigation, Data, Display & feedback
(which holds the content blocks LoadingState, CodeBlock, Markdown and Terminal),
Overlays and Charts follow, with compact Arabic and English labels. Groups stay
expanded, and a job section appears once it has a page. Existing page selection and
documentation layout remain intact.

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
pending/running/needs-you/completed/failed states. Choose individual capsules, a
connected list or plain rows on a host's surface; details/actions remain outside
disclosure buttons. Its page, in Parts, has a clearly labeled local simulation (a task
that fails once, retries and completes, or a state held by the state switcher and
Replay), with its timer only in example code. It replaces the earlier checklist
interpretation without adding a component family.

NotificationList retains application-owned notifications, explicit read controls,
derived unread count, All/Unread filtering and focus recovery. Source contracts
and portable examples live in `src/system/ai/`; neither family adds a dependency,
backend or persistence.

## FileTree

FileTree displays application-supplied files and folders with stable unique IDs; it never reads the filesystem. Use `ai/examples/FileTreeExamples.tsx` (relative to the source root) for a nested project and application-owned sample-string preview. Controlled or internal expansion and single selection are separate from roving keyboard focus. File click/Enter calls `onActivate(file)`; the host decides what opening means. The example preview follows file selection, including Space; arrow focus does not change it. Empty folders are end nodes. Horizontal arrows mirror in RTL; arrows, Home/End, typeahead and * navigate visible nodes. On removal, focus recovers to the nearest visible ancestor or same visible position, then the empty root, without reclaiming outside focus. Supply nonempty names, globally unique stable IDs, and noninteractive metadata/empty content. No upload, editing, search, drag/drop, virtualization, multi-selection or context menu is supplied.

## AI task patterns

Each AI pattern finishes one job in one anatomy (a header that names the state once, what the assistant produced on paper, the evidence folded away, the person's options and the meta), using the zones its job needs. The host owns the state. A pattern renders the `status` and data it is given and reports what the person asks for; it never runs a request or simulates progress. There are nine pattern pages: Start a task (`TaskStarter`), Cited answer (`CitedAnswer`), Agent task (`AgentTask`), Clarifying questions (`AskUserQuestions`), Approval request and Approval sequence (`ApprovalCard`, `ApprovalFlow`), Suggested edits (`SuggestedEdits`), Image generation (`ImageGeneration`) and What changed (`ChangeSummary`). Two screens compose them: the Assistant workspace (`ChatApp`, at `/examples/chat-app`) and the Customer dashboard (`/examples/dashboard`). The shared parts they are built on (AIMark, StatusPill, Tray, Countdown, StatusIcon, ThinkingPanel, FeedbackBar, FollowUps, InlineDiff and WeaveCanvas) are exported and described under `support` in the registry; the fifteen older pieces, such as ChatComposer and ToolCall, keep their pages in Parts. Agents start at [Start with a pattern](src/system/ai/README.md#start-with-a-pattern). The rules every pattern follows are in [composition.md](src/system/ai/composition.md#patterns): one live region, scoped and safe shortcuts, plain appearance inside other patterns, amber only for "needs you", and no approve-all.

## AI feedback

LoadingState uses a compact pixel grid with Drive/Dots/Orbit variants, a shimmering
label and optional host-supplied elapsedMs. ThinkingIndicator pairs the turning AI
mark with optional cosmetic whole-word rotation, including textOnly.
ThinkingState uses the AI mark, a shimmering current summary and smooth
disclosure of application-supplied activity steps; the host supplies completion.

Only meaningful label changes announce. Decorative frames, elapsed ticks and word
changes stay out of live regions; Arabic words remain connected. Provider and OS
reduced motion leave static glyphs and readable labels. Disclosure/focus and local
demo cancellation are preserved. The general-purpose Spinner is unchanged.
See [portable guidance](src/system/ai/README.md) and
[compiling examples](src/system/ai/examples/AIFeedbackExamples.tsx).

## Tool activity

ToolCall records one host-supplied operation: pending, running, needs-you, completed
or failed, with a readable label, monospace tool name and optional formatted duration.
`appearance="plain"` drops the card for a host's surface, and `labels` and
`headingLevel` replace its words and set its headings. Pass
strings for preformatted input/output/error or React nodes for application-rendered
results. JSON.stringify belongs to the host; never pass a plain object as a node.
ToolCall owns only optional disclosure state (expanded/defaultExpanded and
onExpandedChange). onRetry is a host callback, outside the disclosure button,
shown on failure; focus moves to disclosure before retry.

ToolChips takes a named list of items (stable id, label, state, optional count).
Informational items are spans. onActivate creates a button; connect it to real
behavior before supplying controls/expanded. No built-in details are implied.
Use ToolCall for operation details, ToolChips for compact summaries, TaskRows for
broader tasks, Agent task for one task's steps with their tool details, and
ThinkingState for a brief application-owned activity summary.
No tool execution, network, permissions, orchestration, execution timers or
private model reasoning is supplied. Only meaningful ToolCall label/state changes
are announced; use announcement="off" when another host region owns announcements.

The portable ai/examples/ToolActivityExamples.tsx includes static states, rendered
output and a run that plays once on mount: read → save → failed, which the user
retries with ToolCall's own Try again; a chip opens and focuses its call. Replay and
unmount cancel stale timers; reduced motion starts at the final state. Sample data
contains no secrets and performs no tool operation.

CodeBlock and Markdown are content blocks (Display & feedback in the navigation) and
StreamingText is a part. They cover exact source copying, safe CommonMark/GFM
presentation and immediate host-driven streaming, with compact token-based styles.
Source-copy consumers
must install `react-markdown@10.1.0 remark-gfm@4.0.1`; see
[src/system/ai/README.md](src/system/ai/README.md#ai-response-content) for parsing,
URL/HTML restrictions, language fallback and host responsibilities. StreamingText is
streaming, completed, stopped or failed, and Markdown and StreamingText take
`renderCitation` for `[n]` markers and `links="strict"` for an AI answer's links. The
StreamingText page opens complete, with Streaming, Done, Stopped and Failed states,
and Replay streams its local fixed-chunk sample again.

Every documentation page shows its example in one demo frame. A toolbar above the
stage holds the Preview/Code switch, a state switcher where the component has
meaningful states and a link that opens the playground in a new tab
(`/examples/playground/<page-id>`, with the stored props and settings and no
workbench chrome). A round Replay button in the stage's corner appears only where
the component has a lifecycle, and Copy code sits in the Code view's header. The
page's name appears once, in its heading. Nothing autoplays, and Replay steps
through the states without a stop control. Replay no longer resets props: the
inspector's "Reset playground" does. The agent prompt, including source-copy
dependency instructions, sits right after the heading under "Use it in your app".
The notes sit under the playground as "Usage guidelines": use it when, use something
else when (or, on a pattern page that replaces parts, what it replaces) and what to
notice.

## Chat foundations

ChatThread, ChatComposer and PromptBar are parts (Parts in the navigation). Messages,
draft, submission, acceptance, cancellation and execution state stay in the
application. The two entries share IME-safe Enter/Shift+Enter handling and bounded
growth; valid text is passed unchanged and the host clears the controlled draft only
on acceptance. Thread following is opt-in and stops when the reader leaves the
bottom. A thread message can carry a `status`, an `error` and `onRetry`, and
ChatComposer takes a `tools` row for the host's own controls. See
[portable chat guidance](src/system/ai/README.md#chat-foundations) and the
[connected local example](src/system/ai/examples/ChatExamples.tsx). No backend,
model connection, uploads or persistence is included; the Assistant workspace below
is the shell.

ImageResult, Sources / InlineCitation and InsightCards are parts that provide
application-supplied images, real reference links, which can preview their source on
hover or focus, and concise supported findings.
Their bilingual local examples include fixed-frame loading/failure recovery,
connected citations, stable numbering on reorder and finding details. Copy the
whole `src/system/ai/assets/results/` directory with source-only examples; preserve
local SVG/text `?url&no-inline` imports and the bundled license. Source copies also need the
already installed `@radix-ui/react-popover@1.3.1` and documented Radix overrides.
See `src/system/ai/README.md` for URL restrictions and host responsibilities.

SelectionActions, ContextMeter and ModelSelector are parts. SelectionActions reports
the selection's offsets (Suggested edits builds on them), ContextMeter takes
`thresholds` and a controlled `open`, and ModelSelector takes `labels`.
Their connected chat example uses scoped selection, controlled model IDs and
explicit sample context values. See `src/system/ai/README.md` for ownership,
keyboard focus, selection exclusions and source-copy requirements. Local browser
verification and captures are in `docs/ai-context-controls/`.

### AI questions and decisions

AskUserQuestions, ApprovalCard and ApprovalFlow are the Clarifying questions,
Approval request and Approval sequence patterns. The
[portable guidance](src/system/ai/README.md#questions-and-one-time-decisions)
explains supported question types, controlled drafts/records, receipts, host
responsibilities, request replacement and decision versus execution. A receipt
records the decision, never the outcome, and there is no approve-all. Ctrl or
Cmd+Enter approves only a request the host marks reversible and not irreversible,
after a 500 ms wait; Escape rejects inside an inline card, but inside a Sheet or Modal
it closes the dialog and records nothing. The connected Studio Assistant
example uses harmless in-memory data with rejection, acknowledgement failure/retry
and a second independent request. No action executes and no standing access is
introduced. Local verification evidence is in `docs/ai-decisions/`.

Terminal is a content block: it presents supplied command/output text without
execution. ChatApp is the Assistant workspace screen: it composes existing
navigation with the host's conversation, whose messages are patterns in plain
appearance and whose composer is Start a task. Conversations can be grouped, a side
panel holds a task's details, and rename and delete are intents: the host owns the
rename field and the delete confirmation. The in-memory example runs at
`/examples/chat-app` and tells the October close (a cited answer, the agent's
questions and a task waiting on an approval), with a draft per conversation and no
real AI or tool. Portable contracts and examples live in `src/system/ai/`.
Verification and screenshots of the earlier build-log version:
`docs/terminal-and-chat-app/README.md`.
