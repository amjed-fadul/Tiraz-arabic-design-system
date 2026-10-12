# Independent consumption exercise

This is an independent consumer verification fixture, outside the production entry. Imports target `./vendor/tiraz`; the external host copies the complete `src/system` bundle there, excluding tests. All six documented families are used for invoice draft creation, related invoice views, reminder/theme/motion preferences, contextual payment actions, a modal settings Sheet with 48 scrolling project commands, and local outcome notices.

## Deliberate capability gap

Tiraz has no `DataTable` export or table family. No `DataTable` import or invented props were added. The concrete alternative is an application-owned semantic HTML table with caption, column and row headers, shared design tokens, horizontal overflow on narrow screens, and Tiraz DropdownMenu/Button commands per invoice. Filtering and local payment state belong to this application. Sorting, pagination, row selection and server storage are not implemented.

## Contract understanding

The source root contains the barrel, config, tokens, components and `ai/`; registry paths are relative to it. Configuration starts with `defaultConfig`, labels and language belong to the consumer, and direction must be coordinated explicitly. Toast is the `ToastProvider`/`useToast` family. Native selects and text inputs are application HTML controls, not added Tiraz families. The modal and nested menu stay under the SystemProvider and Sheet context. No runtime component, production entry or dependency was changed.

## Verified result

Strict TypeScript compilation of the external host, including the copied guidance example, and its Vite production build pass. Chrome/Playwright passes 13 browser check groups: default Arabic/RTL/light/compact; font file HTTP 200 and 400/500/600 weight loading; RTL and LTR Tabs arrows/Home/End; Space on Switch; persistent form error and actual invoice additions including rapid repeated actions; local payment state; theme/accent/density/typography/radius propagation; reduced motion from both config and OS; Sheet/menu scope; early menu End after 40ms then Enter; genuine pointer hover after keyboard; menu Escape/Tab trigger restoration; modal Tab trapping and Sheet trigger restoration; English overlay/Toast inherited language; Toast close and subsequent expiry; narrow table and short-menu internal scrolling. No page errors or failed network requests were observed. Screenshots were visually inspected in Arabic and English, light/dark, and narrow/short conditions.

## Misunderstandings and friction

- I initially placed `lang` only on `<main>`. English page content became `en`, while portaled Sheet/menu and Toast remained under document `ar`. The parent’s independent check exposed this. I corrected the consumer to put a language wrapper above `SystemProvider`, then verified English inheritance on dialog, nested menu and newly created Toast. The final guidance now explicitly describes this host requirement.
- I initially expected the next Escape after nested-menu dismissal to close the Sheet. A newly created project-selection Toast was the newest Radix DismissableLayer and consumed that Escape even with focus on the Sheet close control. Menu nodes had already detached, so this was not a menu exit-animation issue. Traces show no-menu/menu-Escape/menu-Tab variants close the Sheet on first Escape; the selection-notice sequence closes the notice first, then the Sheet. Verification now waits for actual menu/Toast DOM detachment and confirms Sheet dismissal and trigger restoration. The final guidance documents this priority.
- Host TypeScript 6 needs Vite’s `vite/client` declarations to type-check CSS imports. This is host setup, not an invented Tiraz API.
- The first browser assertions sampled Tabs before Radix’s deferred focus and button colors mid-transition. The harness now waits for the appropriate state/transition rather than declaring those samples runtime failures. A later assertion incorrectly sampled a success-state Button as accent-colored; success colors are deliberately distinct, so the accent check now targets the checked theme Switch.
- Radix’s Toast viewport accessible region label is on its wrapper, not the inner `.tz-toast-viewport` list. The revised browser check inspects the role/name, not a guessed DOM attribute.
- My initial application grid allowed the semantic table’s minimum width to expand a narrow column. I corrected only consumer CSS using `min-inline-size: 0` and `minmax(0, 1fr)`; the table now scrolls internally at 390px width. The parent also added practical grid-shrinking/internal-overflow guidance, and the source copy was refreshed with those final docs.

## Limits and reproducibility

This is in-memory state, with no backend, persistence, actual message delivery, table sorting/pagination or simulated network loading. Notices and user-entered client names retain their content from creation time; language changes translate new UI/action copy, not existing application data. Screen-reader announcement quality, touch/swipe, forced-colors, and cross-browser behavior were not manually verified. Browser DOM/keyboard checks and screenshots do not prove full accessibility.

From the Tiraz checkout, run `node tests/ai-exercise/prepare.mjs` with the browser dependency overrides below. This test harness copies the entire library/instruction bundle into a fresh temporary application, compiles it and the linked example strictly, builds it, starts a temporary local server, runs browser checks, then stops that server. No workbench files or checkout README are copied. It is verification infrastructure, not a consumer installer.

Alternatively run `verify.mjs` against a prepared standalone server with `TIRAZ_URL`, `TIRAZ_PLAYWRIGHT` (package/module path), `TIRAZ_BROWSER` (browser executable), and `TIRAZ_EVIDENCE` (output folder) overrides. It does not change runtime components.

The external host is `/Users/amjedfadul/.codex/visualizations/2026/10/12/01a1308f-8c0e-7253-872a-711cb9cdd0cf/tiraz-ai-instructions/consumer-app`. Its installed dependencies are symlinked from the isolated checkout and Vite `fs.allow` includes that real dependency directory so local fonts load. It serves `http://127.0.0.1:5189/` with strict port; the persistent exec session is **83611**. The original localhost:5176 server was untouched. Evidence lives alongside it under `agent-exercise/`: `browser-results.json`, seven screenshots, `debug-focus.mjs`/`focus-trace.json`, and `escape-cases.mjs`/`escape-cases.json`. The parent independently owns `language-before.json` evidence.
