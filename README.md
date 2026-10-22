# طِراز · Tiraz

An Arabic-first, MIT-licensed design system for business dashboards, with six source-owned components and a local documentation workbench. Arabic + RTL are the defaults. The landing-page work remains paused.

## Run locally

Use Node.js **24.15 or newer** and npm.

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

## Documentation workbench

Each component has one continuous page: title and description → a single-line agent prompt with its copy button → playground → useful examples → generated usage code and an API disclosure. The visible prompt truncates with an ellipsis; copying includes the entire prompt, current configuration and compiling usage module. Latin paths are isolated within Arabic text. Prompts first ask the agent to locate Tiraz within the current project and clearly report if the system cannot be found. Prompts read `tiraz.project.json` first, resolve the installed paths, load focused contracts, and adapt the sample to the consumer application. Checkout-relative paths are a fallback. API facts in the workbench come from generated TypeScript contracts; localized usage guidance remains authored.

Arabic mode has navigation only in the compact 190px right sidebar. A separate 240px rail sits 10px from the viewport's left edge, with compact system settings above the contextual component inspector, each on its own rounded surface with a 16px gap. Its bounded scroll region supports keyboard access and shorter windows. English mode mirrors both rails through logical layout. They reserve their own grid space outside the centered article. Navigation scrolls independently for a growing library.

The inspector presents common controls without technical subtitles or an advanced disclosure. Button has label, variant, size, one state selector (including disabled/loading), icon preset and icon-only mode. Tabs has variant/selection; Switch has label/checked/disabled; Menu has trigger label/alignment/validated items; Sheet has title/content/side; Toast has title/description/tone/duration. Other public props, native attributes, functions and refs remain documented and supported by the library. Per-component edits survive navigation and reload.

One header light/dark preference updates documentation, both rails, controls, playgrounds, examples and scoped portals. One language selector pairs Arabic + RTL and English + LTR. Rail settings affect preview/example accent, text scale, density, corners and motion; documentation typography and layout stay stable. Color labels are Green, Blue, Purple and Brown, with their original paired values and internal palette IDs retained.

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

Install source into an existing React 19/Vite application:

```sh
node scripts/install.mjs /absolute/path/to/consumer
```

The installer writes `tiraz.project.json`, copies runtime code, patterns, docs and contracts into `src/tiraz`, and prints only the required runtime dependencies. Install those dependencies with your package manager. Existing files are never overwritten. Read [integration](docs/ai/integration.md) for custom destinations, provider setup and update checks.

```tsx
import "./tiraz/styles.css";
import { Button, SystemProvider, defaultConfig } from "./tiraz/src/system";

export function App() {
  return (
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <Button onClick={() => console.log("Local example")}>إنشاء مشروع</Button>
    </SystemProvider>
  );
}
```

Start agent discovery at [llms.txt](llms.txt). Focused [component contracts](knowledge/components), full [inherited APIs](knowledge/api), and the [CSS token inventory](knowledge/tokens.json) are generated from source plus authored guidance. [Business patterns](docs/ai/patterns.md) add customer editing, preference settings and invoice actions with caller-owned persistence and localization. The inventory preserves CSS expressions and mode contexts; it is not a DTCG export.

```sh
npm run knowledge:build
npm run registry:build
npm run verify
npx playwright install chromium
npm run test:consumer
```

`verify` rejects stale knowledge/registry artifacts and runs tooling, unit, strict TypeScript, lint, build and formatting checks. `test:consumer` installs into an isolated temporary React/Vite project, builds it and exercises it in Chromium. CI runs both. Node dependencies for that consumer are resolved from the generated dependency list, without Tiraz's workbench dependencies. The consumer test pins that list to repository lockfile versions for reproducibility.

The generated shadcn registry item is at `public/r/tiraz-system.json`. It is ready for hosting but is not published by these commands. [Evaluation scenarios](evals/README.md) define a repeatable future agent benchmark; no model success-rate claim is implied. Figma Code Connect, remote MCP and SSR support remain separate integration work.

`Button` defaults to `sm`; the system defaults to compact density. `md` and standard density remain available. Small labels use readable 14px Arabic text and normal pointer targets; Sheet widths remain **440px**, bounded by the viewport.

`ButtonProps` requires an accessible name for icon-only buttons; loading blocks repeated clicks and exposes `aria-busy`. State icons accompany caller-supplied labels. `Tabs` and `Switch` support controlled/internal state. Switch inherits native Radix Root attributes/ref; the wrapper owns Thumb markup, so `children` and `asChild` are excluded.

`DropdownMenu` supports typed items with callbacks, icons, shortcuts, disabled/destructive states, and separators. Arrow keys, Home/End, typeahead, Escape and Tab dismissal retain their behavior. `Sheet` accepts caller-supplied content/footer and defaults to right in RTL / left in LTR. Escape, backdrop and close controls dismiss and restore focus. Its editable example saves local changes and discards cancelled drafts.

Use `useToast()` inside `ToastProvider` for success/error/info feedback. At most three entries are shown; expiry pauses on hover/focus, and manual/swipe dismissal and F8 viewport navigation remain available.

## Configuration

`SystemConfig` contains `theme`, `direction`, `density`, `accent`, `radius`, `reducedMotion`, and optional `typography` (`standard` or `large`). Paired accent presets are sage, blue, plum and clay. The corner control ranges from 0–16px. Standard typography is 24px titles, 18px section headings, 14px body/control labels and 12px metadata; large previews use 26/20/16/14px. Documentation has its own fixed typography and control styling.

Hover/press feedback uses 120ms, state changes 180ms, overlay entrance 240ms and exit 160ms. OS reduced-motion preferences always win; component settings can additionally disable preview motion.

## Verification and screenshots

The compact update passed the full Vitest suite, strict compilation of **19 generated usage modules**, Oxlint, TypeScript/Vite production build and formatting. Browser checks cover all six pages, all 20 scalar inspector controls plus the menu editor, clipboard contents, shared portal themes, immediate successive accent updates, navigation/reset/reload, legacy migration, keyboard/focus, reduced motion and 320/390px mobile layouts. Ordinary and wide desktop geometry confirms the rail stays 10px from the viewport edge without overlapping content; short windows have accessible internal scrolling.

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
