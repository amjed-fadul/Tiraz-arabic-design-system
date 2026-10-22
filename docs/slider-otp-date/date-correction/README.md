# DatePicker navigation and caption correction

Scoped follow-up on `codex/slider-otp-date`, following OTP correction
`0af9f60054b17f1de73dd5f2d7fe4d18fd9c857c`. Both corrections are on the same branch.
Checkout: `/Users/amjedfadul/.codex/worktrees/slider-otp-date/Tiraz`.
Preview: <http://127.0.0.1:5227/>. Implementation and verification ran on the user's Mac.

## Behavior and dependency decision

The actual previous/next actions and localized names were already logical, but
DayPicker 10.0.2's legacy Nav emitted left/right chevrons in both directions.
Its supported `navLayout="around"` renders direction-aware chevrons and puts
caption controls between the buttons in DOM/tab order. Tiraz now uses that
layout, without an additional CSS flip: English previous left/next right;
Arabic previous right/next left. December/January transitions retain logical
previous/next behavior.

The caption now uses `captionLayout="dropdown"`, the primitive's native month/year
selects, translated month names and localized year digits. Changing either
control navigates only. The selected date, trigger display, hidden form value
and onValueChange remain unchanged until a day, Today or Clear is chosen.
Existing controlled ownership, date-only conversion and reset conventions remain.

`yearRange?: readonly [number, number]` configures the inclusive direct year choices.
Default: viewed year ±100, clipped to 1–9999. The viewed year is always included.
The example explicitly uses `[1900, 2100]`. This window does not restrict date
validity or month-arrow/calendar-keyboard navigation. Only min/max constrain
navigation and selectable dates, filtering year options and disabling unavailable
months. Dates outside the window remain navigable/selectable. Invalid ranges
fall back to the default; fractional endpoints are truncated. All details are
in the API reference, registry and portable guidance. Generated usage and copied
prompts inherit the updated compiling example and guidance.

No new dependency. The existing pinned **@daypicker/react 10.0.2** and
**@radix-ui/react-popover 1.3.1** remain. Current official
[caption customization](https://daypicker.dev/docs/customization/),
[navigation](https://daypicker.dev/docs/navigation) and
[localization](https://daypicker.dev/docs/localization/) documentation and installed
source/types were inspected. Supported components/formatters only; no custom
calendar keyboard or dropdown framework. A cached number formatter avoids
formatting 9999 full dates before the primitive's year options are filtered.

## Verification

- Four new focused regressions failed against the original caption/icons, then
  passed. Final focused OTP/date/entry/documentation run: **34 tests, four files**.
- Full `npm test -- --maxWorkers=1`: **459 tests across 52 files passed**, including
  generated usage, source registry and relocated portable compilation.
- Build, lint and source/fixture formatting pass. Build retains the existing
  large-chunk warning; lint has no warnings.
- `node tests/browser/date-correction.mjs`: all five groups pass, **32 layouts**
  across Arabic/English, light/dark, standard/large typography and
  1100×850, 320×600, 320×320 and 264×320 viewports. **48 geometry cases** include
  Sheet/Modal and reopen checks; no runtime errors. Selected-label space is checked
  against rendered font metrics plus a native-arrow/padding allowance.
- Both languages: click actual previous/next buttons, check accessible names and
  polygon direction/no CSS flip; December/January; direct month/year changes;
  leap day; preserved selection/callback count; inclusive min/max and disabled
  navigation; clear/reset; years 0001, 0099, 1800, 2200, 9999; tab/Escape/focus.
- The headless script uses simulated selectOption changes. **Separate native Mac
  app-browser checks** open the actual native menus and use Up/Down/Return.
  English/Arabic month December→November and year 2024→2025 leave the selected
  date at 2024-12-31. In both Sheet and Modal, Escape first collapses the native
  menu, then dismisses the calendar/restores its trigger, then dismisses the
  surrounding dialog/restores its launcher. See [native results](native-mac.json).
- The app browser's requested 320px override produced an actual innerWidth of
  264px. An independent screenshot review caught clipped native month/year text
  there. Compact padding/navigation columns and explicit four-digit year space
  fixed it. Re-reviewed native September/2024 and Arabic screenshots now fit.
- Existing batch browser checks pass **22 groups**, including live customization,
  reduced motion, Sheet/Modal focus/Escape, generated/copy prompts and automated
  Axe scans with zero violations. A temporary runner changes only the evidence
  output path to `/tmp/tiraz-date-batch-browser`, preserving prior batch screenshots.
- One earlier concurrent batch run failed its immediate post-Escape dialog
  visibility assertion. The unchanged isolated rerun passes all 22 groups;
  30 additional immediate open/Escape repetitions had zero failures. The initial
  output is retained in [initial-batch-browser.txt](initial-batch-browser.txt).
- Independent source/browser/screenshot review and re-review found **no outstanding
  actionable issues** after the native text-clipping correction.

[Focused tests](focused-tests.txt), [full tests](tests.txt),
[focused browser results](results.json), [batch browser](batch-browser.txt),
[build](build.txt), [lint](lint.txt), [format](format.txt).

## Screenshots and limits

[Before Arabic caption/icons](before-ar.png),
[after Arabic light](after-ar-light-standard-1100x850.png),
[after English dark narrow](after-en-dark-large-320x320.png),
[native English narrow Modal](native-en-modal-320.jpg),
[native Arabic narrow Sheet](native-ar-sheet-320.jpg).

These checks cover desktop Chrome automation and native Mac app-browser controls,
not a physical mobile device or a manual screen-reader session. OS-native menus
are browser/system surfaces; no new portal or custom dropdown layer was added.
Original checkout/index/edits and unrelated servers remain preserved. Port 5214
is untouched; preview 5227 remains running. Nothing was pushed, merged or published.
