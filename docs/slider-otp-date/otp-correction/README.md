# OTPInput presentation correction

Scoped follow-up on `codex/slider-otp-date`, after batch commit
`bd70bceab83ba14b544dc9722b9f36f19886b6e2`.
Checkout: `/Users/amjedfadul/.codex/worktrees/slider-otp-date/Tiraz`.
Preview remains <http://127.0.0.1:5227/>. All checks ran on the user's Mac.

## Cause and correction

The old full-width input received the global focus-visible outline, and
`:focus-within` changed every slot border. Its padded, letter-spaced text also
exceeded its visible width: the captured full-code input had clientWidth 218px,
scrollWidth 232px and scrollLeft 14px. Native scrolling shifted the digits away
from the slots. [Original geometry](before-geometry.json) and focused screenshots
show both problems.

One native text input still owns the value, caret, range, keyboard editing,
clipboard, native form submission/reset and one-time-code attributes. It overlays
the visual cells transparently. The aria-hidden grid paints each digit and the
static visual caret once, with CSS grid centering instead of letter-spacing,
font-width estimates or text offsets. The input's group outline is suppressed.
Only the active cell gets a focus outline; inactive borders stay neutral, and
error borders remain independently visible. Native selected ranges receive cell
shading; no decorative slot becomes another input or accessibility stop.

Native selectionStart/selectionEnd/direction are the source of visual selection.
Clicking a slot positions the native caret before that digit. Clicking beyond a
partial code clamps to its actual end. Shift-click and pointer drag map slot
positions to real native ranges; keyboard editing remains with the input.
Forward ranges indicate their last selected cell; backward ranges indicate their
first. A collapsed caret at a complete code's end stays in the final cell.
Focus/selection/input/key events and native selectionchange keep the decoration
synchronized, including programmatic selection and controlled owner decisions.

Public props and value/change/submission/reset contracts are unchanged. Normal
ASCII input no longer reassigns the DOM value unnecessarily, preserving native
undo. Arabic digit normalization still maps the real caret through removed or
normalized characters. Source-copy guidance and registry describe the new
presentation behavior. Slider, DatePicker and dashboard product code are unchanged.

## Verification

- Four new focused regressions first failed against the original implementation.
  The focused OTP + entry/batch component run then passed **27/27 tests**.
- Full `npm test -- --maxWorkers=1`: **455 tests, 52 files passed**, including
  generated usage, portable relocated compilation and registry/source contracts.
- Production build, lint and format checks pass. Build retains its existing
  large-chunk warning; lint has no warnings. Fixture/browser scripts also pass
  explicit Prettier checks.
- `node tests/browser/otp-correction.mjs`: **128 measured states across 32 layouts**:
  Arabic/English × light/dark × standard/large typography × compact/standard density
  × 1100/320px. Empty, partial `001`, complete `001234` and `000000` remain centered.
  Maximum measured digit/slot center difference: **0.0078125px horizontally, 0px
  vertically**. Exactly one active outline, neutral inactive borders and single
  text/caret paint were checked. Disabled/read-only/error states are exercised
  in every layout.
- Both languages exercise every slot with empty/partial/full codes; arrows,
  Home/End, Backspace/Delete, forward/backward ranges, selection replacement,
  Shift-click, pointer drag, Arabic-Indic/Eastern Arabic clipboard normalization,
  leading zeros, paste/copy, undo, imperative selection, controlled rejection,
  external value changes and reset. Read-only selection/copy works and editing
  remains blocked. Native Mac Chrome's read-only Shift+Arrow behavior was compared
  with an ordinary native read-only input; both retain the same selection. The
  read-only range/copy check uses Shift-click.
- Existing `node tests/browser/slider-otp-date.mjs` passes all **22 check groups**,
  including DatePicker overlays/focus/Escape, customization, reduced motion,
  documentation/clipboard prompts and automated accessibility scans.
- A separate reviewer inspected source, actual browser interactions, focused
  before/after screenshots and completed metrics. Its final re-review reported
  **no actionable findings**. It independently reproduced slot/caret/range mapping,
  geometry, read-only behavior, error styling and Arabic LTR code order.

[Focused browser results](results.json), [full test output](tests.txt),
[batch browser output](batch-browser.txt), [build](build.txt), [lint](lint.txt),
[format](format.txt), [fixture formatting](fixture-format.txt).

## Screenshots

- Same fixture: [before empty](before-empty.png), [before full](before-full.png),
  [after empty](after-matched-empty.png), [after full](after-matched-full.png).
- [Focused close-up](after-focused-closeup.png), [partial code](after-partial.png),
  [Arabic dark narrow](after-ar-dark-320.png), [focused error](after-en-error.png).

## Limits and preservation

These are desktop Chrome keyboard/pointer/clipboard events, layout measurements
and simulated input events. They do **not** establish physical-phone SMS autofill,
mobile keyboard or touch long-press selection behavior. Native
`autocomplete="one-time-code"` and `inputmode="numeric"` are retained. No actual
mobile-device autofill or manual screen-reader session was tested.

The original checkout/index/edits and unrelated servers were preserved. Port 5214
retains its original process. The preview remains running on 5227. Nothing was
pushed or merged.
