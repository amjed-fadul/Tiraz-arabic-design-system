# Avatar, overlays and empty states verification

Implemented and verified locally on the user's Mac on 13 October 2026 (Asia/Dubai).

Baseline: `d28bea820bb6f1c64e86c1738ab9876013b26d30` (verified local commit).
Checkout: `/Users/amjedfadul/.codex/worktrees/avatar-overlays-empty-state/Tiraz`.
Branch: `codex/avatar-overlays-empty-state`.
Preview: [http://127.0.0.1:5206/](http://127.0.0.1:5206/), kept running from this checkout. The final chat response records the local tested commit.

## Result and scope

Avatar supplies an image with stable initials during loading/failure/missing source; explicit Arabic fallback and one accessible name; sm/md and an optional decorative mode. AvatarGroup uses stable member ids, direction-aware reading order, overlap with wrapping, a visible limit and translated static overflow with hidden member names. Tooltip supplies short noninteractive text on hover/focus, 500ms hover delay, Escape dismissal, merged descriptions/ref/handler preservation, hoverable content and collision handling. Modal uses the existing Radix Dialog with scoped nested overlays, optional initial focus, controlled/internal usage, containment/restoration and internal scrolling. EmptyState exposes optional description, custom/no illustration and application action; three original decorative geometric SVGs use shared theme/accent tokens.

Five documentation pages retain the approved continuous layout and one-line prompt/Copy row. The inspectors are small. Generated examples compile and work independently of workbench code; portable metadata follows actual exports/types, and relocated source compilation needs no root README/AGENTS/workbench/main entry. The only application examples are a static team, details toggle, one display-options dialog, and a guide reveal/Back action; no persistence or customer workflow expansion.

The existing Radix Popper primitive is now an explicit source dependency for Tooltip. Targeted overrides align the two already-installed Radix infrastructure patch versions to preserve shared overlay contexts; copied-source hosts must retain the instructions in `src/system/ai/README.md`. No new framework or illustration package was added.

## Commands and results

Use the installed local Node v24.21.0:

```sh
export PATH=/Users/amjedfadul/.nvm/versions/node/v24.21.0/bin:$PATH
npm ci
npm test -- src/system/avatar-overlays-empty-state.test.tsx src/system/overlay-regressions.test.tsx src/workbench/generated-batch.test.tsx
npm test -- --maxWorkers=4
npm run build
npm run lint
npm run format:check
node node_modules/prettier/bin/prettier.cjs --check tests/browser/avatar-overlays* docs/avatar-overlays-empty-state/plan.md
npm ls @radix-ui/react-dismissable-layer @radix-ui/react-focus-scope
git diff --check
```

- Baseline: 26 files / 205 tests passed under Node 24. The Mac shell's default Node 20 was insufficient; only this checkout's command PATH was changed.
- Focused tests: source failure/replacement/removal, deliberate/default/decorative Avatar naming/ref, group overflow/normalization/direction, Tooltip focus/hover/grace period/Escape/ref/external descriptions/empty content, Modal naming/initial focus/Tab/outside/Escape/restoration and nested Menu/Select/Tooltip.
- Regression evidence: `red.txt`, `review-red.txt`, `select-layer-red.txt` record expected missing-contract and review-finding failures before corrections.
- Full suite: **29 files / 239 tests passed** (`unit.txt`). Includes generated strict compilation, source-relative registry/type completeness, source-only relocation compilation, relocated prompt generation, clipboard code/prompt checks and executing copied Tooltip/Modal examples in both Modal state modes.
- Focused overlay + copied runtime run: 3 files / 36 tests passed (`focused.txt`). Copied runtime also passed separately (`generated-runtime.txt`).
- TypeScript + Vite build passed (`build.txt`). Existing nonblocking >500 kB documentation bundle warning remains; no unrelated bundling change.
- Lint passed without warnings (`lint.txt`). Source/project and browser-fixture formatting passed (`format.txt`, `browser-format.txt`). `git diff --check` passed.
- Default unconstrained full-suite parallelism initially timed out on this Mac under browser load. Four local workers complete the whole suite without changing repository timeout/configuration. Relocated prompt test was extended to copy the new pure generator helper and its source/example dependencies.

## Browser evidence

Run local Chrome with bundled Playwright (no added test dependency):

```sh
TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
node tests/browser/avatar-overlays.mjs
# Also run the approved documentation at narrow widths and its live settings:
TIRAZ_PLAYWRIGHT=/Users/amjedfadul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
node tests/browser/avatar-overlays-docs.mjs
```

See [machine-readable results](browser/results.json) and the screenshots in `browser/`. The complete fixture run passed **48 combinations** (2 languages × 2 themes × 2 densities × 2 text scales × 3 viewports: 1280×900, 320×568, 640×280) with zero page errors. It verified failed/replaced/removed images, hover delay and hoverable Tooltip text, refs/description preservation, viewport-edge flip, default/explicit focus, forward/backward Tab containment, outside/Escape restoration, pointer and keyboard nested overlays, Select's independent Escape dismissal, application actions, no horizontal overflow, AvatarGroup bounds/wrapping and RTL order, dialog/menu/Select collision handling and internal scrolling. Live provider changes verified theme/direction/density/text scale/accent/corners/application reduced motion; OS reduced motion overrode application=false. Local IBM Plex Arabic loaded.

The approved documentation screenshots were visually inspected: Arabic light EmptyState, English dark AvatarGroup and Arabic dark Modal. Narrow 320×568 documentation checks cover all five pages in both languages with standard density/large text and no overflow. [Documentation results](browser/documentation-results.json) also records live settings updates in the mounted dialog.

Representative captures: [three illustrations](browser/three-illustrations-arabic-light.png), [Arabic dark Modal](browser/docs-modal-arabic-dark.png), [English dark AvatarGroup](browser/docs-group-english-dark.png), [English light Tooltip](browser/docs-tooltip-english-light.png), [narrow Arabic documentation](browser/docs-empty-narrow-arabic.png), [live customization](browser/live-modal-customization.png).

## Review and limitations

[Independent review and re-review](review.md) records confirmed fixes and final clearance. Browser/DOM/accessibility-name checks are evidence, not a screen-reader speech guarantee. VoiceOver speech testing was not performed. No persistence, services, modal stacking or interactive Tooltip content are part of this batch.

The original `/Users/amjedfadul/Tiraz` checkout remains on `main` at `ce78408818b6a9866ab0faa7748404cba44d8939`, with its existing README.md/workbench.css edits and empty staged diff. Other localhost servers are preserved. Only our port-5206 server was restarted for Vite dependency optimization. No push, merge, deployment or publication occurred.
