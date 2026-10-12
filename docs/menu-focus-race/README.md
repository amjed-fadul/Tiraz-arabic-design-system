# Nested-menu focus race verification

Base: `dd87f63b7d30a83252e1d38306d322a12ea99e59`. Local branch:
`fix/nested-menu-focus-race`. Tested on macOS with Node 24.19.0 and Google
Chrome 154.0.8037.99 at 800 × 400. The fix and all new records are isolated
from the original checkout and the earlier `docs/review-evidence` records.

## Reproduction and root cause

In RTL with motion enabled, clicking **Open sheet** leaves the pointer inside
the future nested menu. Focus **Nested menu trigger**, press ArrowDown, wait
only for initial menu-item focus, and press End while opening motion runs.
Do not wait for opening motion to finish before End.

The menu scales/translates over 240 ms while the enclosing Sheet also slides.
End focuses Item 40 and scrolls the menu to 1234. Chrome then emits pointer
boundary events as the moving/scrolled items pass underneath the stationary
pointer. Radix's `MenuItemImpl` composes its `onPointerLeave` handler after the
user handler. Its `MenuContent` `onItemLeave` focuses the menu content and
clears `currentItemId`. Roving-focus entry initially returns to Item 40, but
a subsequent leave re-enters with that tab stop cleared and focuses Item 1.
`preventScrollOnEntryFocus` leaves the menu at 1234, so Item 1 is offscreen.
Enter consequently selects Item 1.

The first [before trace](before/results.json) records:

| Time relative to End | Event                                                               |
| -------------------- | ------------------------------------------------------------------- |
| 0 ms                 | End on Item 1; opening animation is active                          |
| +13.5 ms             | Item 40 receives focus                                              |
| +29.7 ms             | Radix's leave handler focuses the menu, then Item 40                |
| +36.0 ms             | Native pointer-leave trace identifies Item 3; scrolling is recorded |
| +146.3 ms            | Another leave resets focus to Item 1                                |
| +147.4 ms            | Native boundary trace identifies Item 37 leaving the same pointer   |
| +228.8 ms            | Opening animation ends                                              |
| +383.1 ms            | Enter acts on Item 1, selecting Item 1                              |

Both boundary events retain x=728.4, y=250.5 and movementX/movementY=0.
Immediately after End the animation sample is at 16.67 ms of 240 ms.
The final menu scroll is 1234 and the focused item is outside its visible area.
React dispatches its synthesized leave handler from pointer-out before the
native pointer-leave event reaches the capture trace. The baseline archive’s
193 tracked files match the base commit byte for byte, and its font serving
was verified with HTTP 200 after correcting the external dependency allowlist.

## Fix

The Item's user `onPointerLeave` prevents Radix's leave/reset handler when the
leaving item does not own document focus. An obsolete hovered item cannot
clear the focus that keyboard navigation has given another item.

An actual pointer move still runs Radix's unchanged `onPointerMove` and focuses
the hovered item. Leaving that focused item still runs Radix's normal leave
handler. CSS motion, keyboard handlers, scrolling, selection, and focus
restoration are unchanged. There is no timeout or corrective focus call.

## Regression and focused results

[`tests/browser/menu-focus-race.mjs`](../../tests/browser/menu-focus-race.mjs)
presses End before settling, verifies an active opening animation immediately
after the key, requires nonempty focus records that remain Item 40, checks
visibility, and asserts Enter selects Item 40. It also reopens the menu and
checks genuine hover movement, a small movement, normal pointer leave,
Home/ArrowDown, Escape, and menu/Sheet trigger restoration.

| Run                                                     | Result                                           |
| ------------------------------------------------------- | ------------------------------------------------ |
| Same final regression against untouched dd87f63 archive | 5/5 fail: offscreen Item 1; Enter selects Item 1 |
| RTL/LTR × light/dark × motion/reduced × early/settled   | 16/16 pass                                       |
| Original RTL early-opening sequence repeated            | 20/20 pass                                       |
| Independent early-opening pointer-position probes       | 14/14 pass                                       |
| Independent wheel-scroll and pointer selection          | Both directions pass                             |

Before changing production source, the regression also failed 5/5 runs in
the original isolated dd87f63 worktree. Earlier controls passed when waiting
300 ms before End, moving the pointer away, or using reduced motion. Heavy
focus-call instrumentation perturbed the race timing; the committed regression
uses event-only tracing and does not force layout on every animation frame.

Fresh results and captures: [before](before/results.json),
[full matrix](matrix/results.json), [20 repetitions](reliability/results.json),
[independent focus probes](independent-review/results.json), and
[independent wheel/click probes](independent-review/wheel.json).

Representative screenshots, visually inspected:

- [Before: offscreen focus, no visible highlighted item](before/rtl-light-motion-early-0.png)
- [After: RTL light, Item 40 highlighted and visible](matrix/rtl-light-motion-early-0.png)
- [After: RTL dark](matrix/rtl-dark-motion-early-0.png)
- [After: LTR light](matrix/ltr-light-motion-early-0.png)

## Independent review and final checks

The independent reviewer inspected Radix's handler composition and reported
no actionable findings. It independently checked multiple pointer positions,
hover handoff, pointer leave, keyboard navigation, wheel scrolling, click
selection, and focus restoration. No review-driven source fixes were needed.

Final full-suite results are recorded in [verification.json](verification.json).
All three existing browser scripts passed with zero failures/errors:
[regressions](full-suite/regressions/regressions.json),
[customization](full-suite/customization/customization.json), and
[interactions](full-suite/interactions/interactions.json). Unit tests passed
79/79 across 10 files. Build, lint, and formatting passed. Each required full
check ran once after the focused checks passed; its output is included here.

The original checkout's [before](original-before.json) and
[after](original-after.json) fingerprints match exactly: README, workbench
layout CSS, HEAD, branch, index bytes, and unstaged diff are preserved. The only
previously tracked file changed in the isolated checkout is DropdownMenu.tsx.

## Rerun

Start Vite from the isolated checkout with Node >=22.12. Set `TIRAZ_URL` to its
local URL. If Playwright is supplied externally, set `TIRAZ_PLAYWRIGHT` to its
module path and `TIRAZ_BROWSER` to a compatible browser executable.

```sh
TIRAZ_EVIDENCE=/tmp/tiraz-menu-matrix TIRAZ_MATRIX=true \
  node tests/browser/menu-focus-race.mjs
TIRAZ_EVIDENCE=/tmp/tiraz-menu-repeat TIRAZ_REPEATS=20 \
  node tests/browser/menu-focus-race.mjs
```

Run the three existing browser scripts from separate output directories with
their absolute script paths, so their relative `docs/review-evidence` outputs
do not replace previously committed records. Then run `npm test`,
`npm run build`, `npm run lint`, and `npm run format:check`.

## Limitations

Browser evidence covers desktop Chrome on macOS. Firefox, Safari, touch-only
devices, and assistive-technology sessions were not exercised. No known
failure remains in the checked interaction matrix. No push, merge, deployment,
publication, or new milestone was performed.
