# Documentation interface audit — 22 October 2026

The two reported controls were symptoms of duplicated UI styling. The Library search wrapper and its input both drew focus treatment; the category filter used an independent native select. This audit replaces those with Tiraz controls and follows the documentation journey through customization, code, integration prompts, quick start, and illustrations.

Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`.
Baseline: `65cd1cf`. Preview: <http://127.0.0.1:5411/library>.
The main checkout and original landing worktree were not edited.

## Journey and findings

1. **Browse and find a component — corrected.** Search now uses Tiraz Input, a Tiraz clear Button, and one field-owned focus halo. The empty Arabic field starts on the right; entered text can follow its own script. The category filter uses Tiraz Select with consistent materials, keyboard navigation, RTL placement, and focus restoration after filtering. Clearing returns focus to search. The clear button stays centered when pressed.
2. **Try and customize — corrected.** Inspector text/collection fields, Reset/Apply, and short choices now use Input, Textarea, and Button. Collection errors have `aria-invalid` and a connected description. Applying valid JSON keeps the same focused Apply button. Radius values respect the selected numeral setting. A failed settings copy now exposes the exact JSON in a labeled, read-only LTR field in both the docked panel and mobile Sheet. Copy keeps focus, the fallback scrolls into view, and a successful retry removes it. Existing preview controls, state switching, replay, Code view, and API scrolling remain available.
3. **Use it in your app — rebuilt with Tiraz.** A clear copy action and a collapsed Accordion replace the truncated prompt row. Opening it exposes an English LTR, read-only Textarea containing the complete prompt. Copying preserves exact text and current settings. A denied clipboard operation opens the selectable fallback without moving focus. Busy copying remains focusable; repeated clicks and stale results cannot produce misleading feedback. The visible copy label stays consistent with its accessible name after success.
4. **Read the integration instructions — rewritten.** The prompt separates source discovery, current settings, integration, component-specific notes, validation, and the exact TSX example. It scopes registry lookup, uses source APIs as authoritative, preserves local assets/licenses, and distinguishes demonstration behavior from application integration. Terminal and ChatApp notes no longer leak into each other's prompts. The instructions stay English on both language versions; example content follows the selected language.
5. **Start here and illustrations — corrected.** Project choices, filters, size choices, replay, and copy actions reuse Tiraz Button and the shared copy control. Each of these surfaces owns one copy announcement region. Source/example disclosures expose named keyboard-scrollable regions. Illustration copy failure reveals the exact source for manual copying. Shared copy styles also load on the landing's quick-start section.
6. **Navigate and read the rest — reviewed.** Header language/theme actions and drawer/settings close actions use Button. The Markdown sample's title is now h2, leaving one page h1. API tables retain their named, keyboard-focusable horizontal scroll containers and isolated LTR code values. The standalone playground’s return link retains scoped styling. Usage guidance, nested-part navigation, galleries, and screen-preview wrappers were included in the page sweep.

No critical issue remains in the tested documentation flows. The important issues above were corrected; unrelated visual redesigns and public API expansion were not needed.

## Component choices

- Reused: Button, Input, Select, Textarea, Accordion, and the library's guarded clipboard lifecycle. Existing Sheet, Switch, Slider, DemoFrame, and code rendering remain in use.
- Native number inputs remain because Input's public type intentionally excludes `number`; min/max and spinbutton semantics must survive.
- Accent swatches retain their keyboard-operated radio implementation because the current RadioGroup does not render custom swatches.
- The navigation trigger retains its native DOM ref for focus return. Button's exported type does not expose a ref prop.
- Quick-start and illustration disclosures keep native `details`: they deliberately allow multiple sections open. The single prompt disclosure uses Tiraz Accordion.
- The API table already provides the required table semantics and internal keyboard scrolling. Replacing it solely to change its component name would add no user benefit.

## Visual evidence

The before captures come from the in-app browser; the after captures come from local Chrome. Viewports differ, so these establish the corrected control anatomy and readable layout rather than a pixel diff.

| Area               | Before                                                                | After                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search             | [Doubled focus treatment](2026-10-22-docs-ui-audit/search-before.png) | [Single focus halo, Arabic](2026-10-22-docs-ui-audit/search-after.png)                                                                                                       |
| Integration prompt | [Truncated row](2026-10-22-docs-ui-audit/prompt-before.png)           | [Arabic](2026-10-22-docs-ui-audit/prompt-after-ar.png), [English](2026-10-22-docs-ui-audit/prompt-after-en.png)                                                              |
| Customization      | Missing error associations and focus loss reproduced in tests         | [Associated error and reusable controls](2026-10-22-docs-ui-audit/customize-after.png), [mobile settings-copy fallback](2026-10-22-docs-ui-audit/settings-copy-fallback.png) |

## Coverage and validation

- **96 unique documentation routes:** 76 component pages (including the five nested parts), 11 screen-preview pages, Library, Start here, illustration gallery, and six illustration detail pages.
- **384 final page checks:** Arabic/dark and English/light at 1440 px; Arabic/light and English/dark at 390 px. All passed the checked conditions: one top-level page h1, no document overflow, no page runtime errors, no detected broken eager images, and no axe WCAG A/AA violations. The initial Markdown heading failure was fixed and all four variants rechecked.
- **Six interaction runs:** Arabic and English at 1440, 390, and 320 px, covering search clear/focus, filter selection, JSON validation/Apply focus, customization Escape, exact prompt copying/failure fallback, code copying, API region focus, illustration source fallback, and quick-start project selection/copy.
- **Four additional interaction runs:** Arabic/dark and English/light at 1280 px exercise keyboard-only filtering, navigation open/close and focus return, clear-button alignment while pressed, validation, and the shared landing quick-start section; Arabic/light and English/dark at 320 px use touch contexts and verify coarse-pointer target sizes.
- **Four settings-copy fallback runs:** Arabic and English at desktop 1440 px and mobile 390 px verify exact JSON after denied clipboard access, retained focus, no overflow, and no detected axe violations. The two desktop runs also check prompt disclosure opening/closing with normal motion and the standalone return link.
- **Repository gate:** `npm test -- --maxWorkers=2` passed all 1,779 tests in 140 files (314.76 seconds). `npm run lint -- --max-warnings 0`, `npm run build`, and `npm run format:check` passed. The system/screen CSS audit, documentation control CSS audit, and sidebar/illustration CSS audit each returned `[]`. `git diff --check` passed. Checks used Node 24.21.0.
- Both preview servers responded with HTTP 200 after verification: Woven on 5411 and the original landing on 5243. They remain running.
- These results apply to the code in the commit containing this report; the baseline was `65cd1cf`.

Browser checks were throwaway scripts under `/tmp/tiraz-docs-audit-20261022`; no tracked browser evidence scripts were run. Screenshots were visually inspected, including Arabic/English, light/dark, narrow layouts, menus, validation, and the prompt panel.

## Limits

This audits the documentation interface and default route states, with representative interaction paths. It does not exhaust every state combination or every interaction inside all eleven embedded application screens. The broad sweep used reduced motion for repeatable captures. Automated accessibility checks and keyboard inspection do not establish screen-reader conformance; manual VoiceOver and physical-device testing remain unperformed. The production build still reports chunks larger than 500 kB; this audit does not include bundle splitting. npm publication, GitHub publication, and Vercel deployment are outside this change.
