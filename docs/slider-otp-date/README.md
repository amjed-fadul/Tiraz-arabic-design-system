# Slider, OTPInput and DatePicker

Local batch on `codex/slider-otp-date`, based on
`30e0332939ab59facc4a1a92618ca920fa23eed2`. Checkout:
`/Users/amjedfadul/.codex/worktrees/slider-otp-date/Tiraz`.
Preview: <http://127.0.0.1:5227/>. All implementation and verification ran on the
user's Mac with Node 24.21.0. Nothing was pushed, merged, deployed or published.
The original checkout/index/edits were left alone; port 5214 retains PID 90957.

## Scope and contracts

- Slider is one native range. It clamps/snaps to min-based steps, removes decimal
  noise and never exceeds the last reachable step below max. Optional formatValue
  affects presentation and aria-valuetext only. Native pointer and keyboard
  behavior remain intact, including mirrored horizontal arrows in RTL. Native
  name/form submit the numeric string; disabled omits it.
- OTPInput is one native text input over decorative slots. ASCII, Arabic-Indic
  and Eastern Arabic digits normalize to ASCII. Strings retain leading zeros and
  partial edits. Native editing, selection, clipboard paste and undo remain
  available. length defaults to 6, floors/clamps to 1–12; extra digits truncate,
  other characters are removed. Code direction is LTR. Native autocomplete and
  numeric input mode remain set. Complete means only the requested digit count,
  never verified. Native pattern requires the full count when validating a form;
  empty is allowed unless required. FormData still represents partial input.
- DatePicker uses a single Gregorian YYYY-MM-DD (0001–9999), or empty string.
  Local year/month/day conversion avoids UTC shifts. Arabic/English display and
  labels follow locale, independently of direction. Inclusive min/max, Today and
  Clear work through a maintained calendar primitive. Invalid props show feedback
  and submit empty; a valid external date outside bounds remains visible/submitted
  with feedback, so the application owns validation. Hidden submission has no
  native required constraint. The popup uses the nearest provider/dialog portal,
  viewport collision handling and internal scrolling. Keyboard navigation belongs
  to the primitive; Escape closes calendar before Sheet/Modal and restores focus.

All three reuse Field descriptions and existing reset conventions. Uncontrolled
uncanceled native reset restores the initial defaultValue without onValueChange;
controlled forms update their own state in onReset. Current/external form
associations and canceled reset are covered. Changes in props do not emit callbacks
while rendering. A caller supplies either the label/helper/error convenience API
or a separate Field. Standalone native labels keep native naming; DatePicker
references its visible date as a description in this mode. Field/explicit ARIA
names include the visible date or placeholder.

The standard continuous documentation pages live under Forms. Minimal inspectors,
working local forms, generated usage, copied prompts, exports, registry and portable
AI guidance are synchronized. No dashboard product code changed. The dashboard
browser harness now waits for the language effect before checking html direction;
its original immediate assertion raced at the 320px English case.

## References and dependencies

Both requested Formic references loaded and were inspected locally:
[Slider & OTP](https://formicai.dev/preview.html#/slider-otp) and
[DatePicker](https://formicai.dev/preview.html#/datepicker). Their compact field
presentations informed this batch; Tiraz retains its own Arabic-first tokens.

Pinned **@daypicker/react 10.0.2** supplies the accessible Gregorian calendar,
keyboard behavior and translated Arabic/English labels. Its official peer contract
accepts React >=16.8, covering Tiraz's React 19. The package delegates to
react-day-picker 10.0.2 and date-fns; no calendar framework was written locally.
[Official documentation](https://daypicker.dev/) and
[keyboard/accessibility guidance](https://daypicker.dev/guides/accessibility).

Pinned **@radix-ui/react-popover 1.3.1** supplies positioning, dismissal and focus
restoration. Its peer contract explicitly includes React 19. It shares Tiraz's
existing popper 1.4.0, focus-scope 1.3.1 and dismissable-layer 1.2.1; existing npm
overrides remain. Source-copy hosts install these dependencies and preserve those
overrides. Tiraz's scoped CSS styles the calendar; upstream default CSS is not
required. [Official Popover documentation](https://www.radix-ui.com/primitives/docs/components/popover).
The official site showed 1.2.0 while npm's current package was 1.3.1; installed
package types, peer metadata and the resolved graph were inspected locally.

## Independent review

A separate reviewer inspected source, examples, registry, portable guidance, tests
and browser evidence. Actionable findings were fixed and re-reviewed:

1. Initial calendar autofocus could sit below the popup's constrained scroll area.
   Resize/focus reconciliation now keeps the focused control visible. Browser
   assertions check the focused day, not just the popup rectangle.
2. Re-enabling a previously disabled open picker could reopen it. Disabling clears
   its internal open state; a regression test covers the sequence.
3. Clearing a malformed controlled date compared against its normalized empty
   value and suppressed the callback. Comparison now uses the caller's raw value;
   controlled Clear is covered by a regression.
4. The naming accessibility correction initially overrode native label identity.
   Native label mode now preserves that identity and describes the date; Field
   and explicit ARIA modes include visible text in the accessible name. Explicit
   and implicit native labels have regression tests.

Evidence was also corrected to wait for ancestor entry animations and reopen the
popup after changing theme, so customized dark screenshots actually show a calendar.

## Remaining limitations

Desktop Chrome on macOS was exercised with real keyboard/pointer automation and
clipboard paste. The one-time-code attributes and input events are checked, but no
physical phone, SMS delivery, mobile keyboard or real one-time-code autofill was
tested. JSDOM events do not establish device behavior. No manual VoiceOver or other
screen-reader session was performed; automated accessibility scans do not prove
full accessibility conformance. Safari/Firefox/touch devices remain untested.

The production build retains the existing large-chunk warning; build succeeds.
No unrelated splitting/refactoring was introduced. DatePicker has no manual date
text editor, range, time or Hijri mode. No backend or OTP verification flow exists.

## Final verification

- `npm test -- --maxWorkers=1`: 451 tests across 51 files, including strict
  generated usage compilation, movable registry contracts and relocated portable
  examples. The final day-label change also passed 23 focused component tests.
- `npm run build`, `npm run lint`, `npm run format:check` and explicit fixture/
  browser-script Prettier checks pass. Lint has no warnings. Build's existing
  large-chunk warning is retained.
- Date-only round-trip/rejection tests pass in both `TZ=Pacific/Honolulu` and
  `TZ=Pacific/Auckland`: 9 passed per zone (8 unrelated cases intentionally skipped).
- `node tests/browser/slider-otp-date.mjs`: 22 check groups and 24 popup geometry
  checks. Arabic/English, light/dark, desktop/narrow, clipboard/selection/undo,
  min/max, leap day, year boundary, Today/clear/reset, live inspectors and system
  customization, OS/system reduced motion, Sheet/Modal at 1100×900, 390×420 and
  320×320, focus visibility, Escape ordering and trigger restoration.
- Existing `tests/browser/dashboard.mjs` regression with its effect-aware language
  assertion: 29 check groups, including filters, sorting, validated create, Toast,
  dialog layers, reload, mobile navigation, short scrolling and accessibility.
  No dashboard product code changed.
- Axe scans find zero violations in the focused controls and open English calendar.
  The independent reviewer also found zero violations in English and Arabic open
  calendars. Arabic digit/name matching remained an incomplete automated check;
  direct inspection confirmed the visible digits are in the accessible day names.
  This does not establish manual screen-reader support.
- Independent source and browser re-review reports no outstanding actionable
  findings. Its final focused run passed 23/23 tests. Fixes and naming modes were
  independently reproduced in actual browser components.

Logs: [tests](tests.txt), [build](build.txt), [lint](lint.txt),
[format](format.txt), [browser checks](browser/results.json),
[focused accessibility](browser/accessibility.json),
[dashboard checks](dashboard/results.json), [resolved dependencies](dependencies.txt).

Representative screenshots:
[Arabic Slider](browser/docs-slider-ar-light-1440.png),
[Arabic dark narrow OTP](browser/docs-otp-input-ar-dark-390.png),
[selected DatePicker popup](browser/docs-date-picker-selected-popup.png),
[Arabic short Sheet](browser/ar-sheet-320.png),
[Arabic dark customized popup](browser/ar-dark-customized.png).

The final day-button labels use DayPicker's supported label formatter with
Gregorian Intl numeric dates, preserving weekday, Today and selected-state text.
This avoids the default English ordinals failing visible-day name matching.
A parallel full run hit the generated-compilation test's 15s timeout under local
load; the isolated compilation passed, and the final full run uses one worker.
No test assertion or compilation check was removed.
