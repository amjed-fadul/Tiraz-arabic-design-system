# Tiraz component customization review — 12 October 2026

Baseline: `97a532ac2ab129f932af21c092a899713d474f5c`. Local branch: `review/component-customization`.

The checkout started at the reviewed baseline with existing edits to `README.md` and `src/workbench/workbench.css`. Both were preserved. No applicable `AGENTS.md` was found in the repository or its ancestor chain. Documentation layout, landing-page work, and the AI instruction milestone remain paused. No push, merge, publish, or deployment was performed.

## Confirmed root causes

1. **Button density:** the `sm` selector hard-coded 12px inline padding and used the same `--control-small` value in both densities. Its 5px block padding, label line height, and 1px borders also created a 34.39px intrinsic floor. All four supported variants had identical geometry; a variant-specific density propagation failure was not reproduced. Small/regular dimensions now come from scoped density tokens, with smaller block padding and a shared 1px border reservation.
2. **Frozen simulated action:** `buttonAction` patched persisted `ButtonModel.state` to loading and then success/error. It scheduled no return phase. Only inspector state edits canceled its timer, so other edits could be overwritten by an old callback. Feedback now lives separately from configuration, lasts 1,200ms loading + 1,000ms feedback, and falls back to the chosen inspector state (normally idle). All Button contextual edits, either reset, navigation, brand navigation, language changes, and unmount cancel outdated work. An action ID guards callbacks. Global settings remain live during feedback. Copied examples now have the same transient lifecycle and unmount cleanup.
3. **Misleading semantic styling:** changing accent did update the provider's `--action` while success remained semantic green, as intended. However, secondary/ghost/destructive hover selectors also applied during feedback, overriding success/error backgrounds. Those hover rules now apply only to idle. Semantic success/error/destructive tokens remain independent of accent.
4. **Nested menus:** DropdownMenu used the outer provider portal container at z-index 60, outside Sheet's content/focus scope at 91 and backdrop at 90. A Sheet now provides its own content node as the portal container for descendants, preserving configuration and putting the menu inside the modal stacking and focus scope. The menu z-index remains 60.
5. **Switch descriptions:** the wrapper spread caller props, then overwrote `aria-describedby` with its internal ID or undefined. It now combines external IDs with the internal description ID. External-only, internal-only, combined, and accessible-description text are covered.
6. **Long menus:** content lacked a viewport height bound and overflow scrolling. It now uses [Radix's available-height CSS variable](https://www.radix-ui.com/primitives/docs/components/dropdown-menu#constrain-the-contentsub-content-size) and `overflow-y: auto`; End reaches and scrolls the last item into view in RTL and LTR, including within a Sheet.
7. **Other density defects:** Tabs' fixed block padding prevented its min-height tokens from shrinking rendered tabs; menu rows had the same problem at large text scale; Switch's gap never changed. Density now controls tab padding, menu item padding, and Switch field gap/min-height. Switch copy can remain taller to fit its description.
8. **Independent review findings:** icon-only feedback rendered the content icon plus a feedback icon outside the square target; feedback now replaces content. An initial descendant-selector gap fix allowed an outer compact provider to override an inner standard provider; a provider-scoped gap token resolves that.
9. **Toast repeat expiry:** dismissing the last focused or hovered toast could leave Radix's pause flag set after its resume listeners were removed. New batches reset the primitive provider/viewport while caller children retain their React state. Focus returns to a connected caller when Radix moves it to the viewport; sibling-toast focus is preserved. Hover/focus pause/resume and repeated expiry are verified.

## Customization verification matrix

All six components receive the shared theme and coupled language/direction. All exposed controls were exercised in Arabic and English. Preview/examples, code and copied prompts, navigation/reload, reset scopes, and representative combinations were checked with computed styles, geometry, DOM semantics, and screenshots.

| Component    | Contextual controls verified                                                                                                               | Accent                                            | Typography        | Density                                 | Corners                                             | Motion                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ----------------- | --------------------------------------- | --------------------------------------------------- | -------------------------- |
| Button       | Label, 4 variants, 2 sizes, idle/loading/success/error/disabled, 4 icon presets, icon-only                                                 | Primary fill/focus; feedback/destructive semantic | Label 14/16px     | Height, padding, gap, square targets    | Button radius                                       | Transition, label, spinner |
| Tabs         | Underline/segmented, every enabled selection, keyboard selection, disabled item skipped                                                    | Active text/indicator                             | Labels/panel      | Both tab variants                       | Segmented surface/indicator; underline stays flat   | Indicator                  |
| Switch       | Label, checked, disabled, Space toggling; 3 description combinations                                                                       | Checked track/focus; unchecked neutral            | Label/help text   | Field gap/min-height; copy can grow     | Pill track/circular thumb intentionally fixed       | Track/thumb                |
| DropdownMenu | Trigger label, start/end alignment, edited labels/icons/shortcuts/disabled/destructive/separators, selection, invalid collection rejection | Focus/highlight; destructive semantic             | Trigger/items     | Trigger and rows                        | Menu/items                                          | Enter/exit                 |
| Sheet        | Title, content, auto/left/right, open/close, focus trap/restoration, editable example save/cancel                                          | Contained buttons/focus; surface neutral          | Title/body/help   | Contained controls; panel spacing fixed | Contained buttons; edge-attached panel stays square | Sheet/backdrop             |
| Toast        | Title, description, 3 tones, duration, repeated dispatch/expiry, dismissal, F8/focus/hover                                                 | Trigger/focus; tone icons semantic                | Title/description | Trigger; message padding fixed          | Message card/close button                           | Enter/exit                 |

Intentional scope matters: accent does not recolor semantic feedback or every neutral surface. Density changes control/row metrics, not text scale. Underline tabs have no rounded surface; the Switch remains a pill with a circular thumb; Sheet's viewport edge stays square. Toast messages are snapshots produced by `toast(message)`: inspector content/tone/duration edits clear the previous demo instance and configure the next dispatch; global provider changes update already emitted messages live. Examples keep their own contextual content while consuming current system settings. These cases are explicit semantic rules, not exemptions for propagation defects.

## Button measurements

Measurements use loaded IBM Plex Sans Arabic, a 14px label with 22.4px line height, and a 1px border on **all four variants**. Heights/padding/gap are pixels. The browser regression repeats the comparison at 16px text (25.6px line height), with the same target heights. Icons stay 16 × 16px.

| Size / density | Height before → after | Inline padding before → after | Block padding before → after | Gap before → after |
| -------------- | --------------------- | ----------------------------- | ---------------------------- | ------------------ |
| sm / standard  | 34.39 → 36            | 12 → 12                       | 5 → 2                        | 8 → 8              |
| sm / compact   | 34.39 → 32            | 12 → 10                       | 5 → 2                        | 8 → 6              |
| md / standard  | 40 → 40               | 16 → 16                       | 5 → 3                        | 8 → 8              |
| md / compact   | 34.39 → 36            | 12 → 12                       | 5 → 3                        | 8 → 6              |

Size and density are independent: md adds 4px height over sm; standard adds 4px over compact. sm/standard and md/compact share 36px height and 12px inline padding, while density still controls gap and size controls block padding. Equivalent size/density combinations have equal geometry across variants. Minimum square target is 32px; keyboard focus remains a 2px outline with 3px offset. Icon-only idle/loading/success/error remain square and contain one icon.

## Browser evidence

Chromium checks used the installed Google Chrome and bundled Playwright against the local Vite server, with the project's required Node version satisfied by bundled Node 24. The default shell Node 20 could not start Vite; no dependency files were changed.

- [Before measurements and frozen persisted success](review-evidence/before.json), [before screenshot](review-evidence/before-success.png).
- [Before nested/long menu geometry](review-evidence/overlays-before.json): 40 items extended from y=65 to 1,642.5 in a 400px viewport; nested menu was outside the dialog and hit testing reached Sheet instead.
- [After regression measurements/checks](review-evidence/regressions.json): long menu fits y=63–388 in the 400px viewport and scrolls. [RTL last-item focus](review-evidence/after-nested-rtl.png), [LTR last-item focus](review-evidence/after-nested-ltr.png).
- Action under changed global configuration: [loading](review-evidence/live-action-loading.png) → [success](review-evidence/live-action-success.png) → [idle](review-evidence/live-action-idle.png), plus [simulated error](review-evidence/live-action-error.png) returning to idle. The inspector remains at the intentional configured state while transient feedback runs.
- [Live nested overlay settings](review-evidence/interactions.json): all seven controls exercised while Sheet and menu remain open; 17 setting/value transitions, plus example form save/cancel checks. Includes selection, Escape ordering, outside dismissal, focus restoration, action cancellation/repetition, and Toast focus/hover/expiry checks.
- [Full customization audit](review-evidence/customization.json): six pages × two languages × two themes × three viewports = 72 combinations. Desktop 1440 × 1000, narrow 320 × 640, short 1280 × 400. Includes 12 contextual/clipboard/persistence flows, 24 reset checks (desktop and 320 × 420 customization drawers), and OS reduced motion. Representative screenshots include [Arabic dark narrow Button](review-evidence/button-ar-dark-narrow.jpg) and [English short Tabs](review-evidence/tabs-en-light-short.jpg).

## Regression and command verification

Failing tests were run before fixes: initial lifecycle/description/modal regressions had 13 failures; browser tests failed on unchanged sm density, persisted simulation, unbounded menus, and nested placement. Later regressions failed on additional density, icon-only overflow, nested provider gap, semantic hover, and focused/pointer-only Toast repeat expiry. Generated-example runtime tests failed on permanent feedback and leaked unmount timers. Earlier red geometry is retained in `*-before.json` records.

Final checks:

- Full Vitest suite: **79 tests passed across 10 files**.
- Independent focused run: **28 regression tests passed**.
- Generated example TypeScript compilation: **88 modules**, covering six components, state modes/compositions, Button variant/size/density/text combinations, feedback states, and external Switch descriptions.
- Generated action runtime execution: transient return, selected-state preservation, repetition, unmount cleanup.
- Browser regressions: density/variant/large-text geometry, icon-only states, nested provider scope, semantic hover colors, long/nested menus; zero failures.
- `npm run lint`: exit 0, no warnings.
- `npm run build`: TypeScript and Vite production build passed.
- `npm run format:check`: passed. Browser fixtures/scripts separately formatted and checked.
- Independent review found the icon-only overflow, nested gap override, and pointer-only Toast pause path; all were fixed with regressions and re-reviewed. Latest assessment: no actionable findings.

## Remaining limitations

Browser verification covers desktop Chromium with simulated narrow/short viewports. Physical touch devices, Safari/Firefox, and a manual screen-reader session remain unverified. Simulated actions remain local and send no data. Browser fixtures are test-only and are not part of the production Vite entry point. No publishing or next milestone work is included.

To rerun browser checks, start `npm run dev -- --host 127.0.0.1 --port 5176` with Node ≥22.12, make Playwright available, and run `node tests/browser/regressions.mjs`, `node tests/browser/customization.mjs`, and `node tests/browser/interactions.mjs`. `TIRAZ_PLAYWRIGHT` can select an external Playwright package, `TIRAZ_BROWSER` an installed Chromium executable, and `TIRAZ_URL` another local server URL.
