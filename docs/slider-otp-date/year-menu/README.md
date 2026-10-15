# Five-row DatePicker year menu

Follow-up to `bd705a1eac65a41f98698f1bd29997344e02d9f8` on
`codex/slider-otp-date`. The year menu now shows up to **five visible rows**, with
scrolling through all available years. It retains the existing yearRange and
min/max contracts; it does not truncate the available years to five.

Native select popup height is browser-controlled. Only the year control now
adapts the existing **Radix Select 2.4.1** primitive through DayPicker's supported
[custom dropdown API](https://daypicker.dev/guides/custom-components).
No dependency was added. The month select remains native. The primitive owns
focus, keyboard navigation, typeahead, selected option and scrolling; Tiraz caps
the viewport to five token-sized rows, or fewer if the screen has less room.
The year layer portals inside the calendar popup, retaining its scoped tokens
and Sheet/Modal layer ownership. Changing years navigates without committing a
date. Escape closes the year list before the calendar and surrounding dialog.

Independent review caught the calendar's focus visibility handler scrolling for
nested year options in short viewports. The handler now leaves those options to
their own scroll viewport. The original 264×320 list at y=-22 is now contained at
y=55..217, with the calendar scroll position unchanged. Re-review has no outstanding
actionable findings.

Verification on the user's Mac:

- Focused DatePicker regressions: **22 passed**, including a new initially failing
  full-range, keyboard-selection and Escape/focus regression.
- Full tests: **460 tests, 52 files passed**, including generated examples and
  relocated portable compilation. Build, lint and formatting pass; the existing
  build chunk-size warning remains.
- `node tests/browser/year-menu.mjs`: **32 layouts** across Arabic/English,
  light/dark, standard/large typography, compact/standard density and desktop/
  264px short viewports. The list is five rows tall with all 201 default choices
  retained, supports wheel scrolling, and preserves the date and callback count.
- Sheet/Modal in both languages: Home/End, arrows, Enter, min/max, selected-date
  preservation, three-level Escape ordering and focus restoration. Open-menu Axe
  scan has zero violations. Independent browser review reproduced these checks.
- The existing DatePicker browser script now uses the accessible year menu and
  waits for the primitive's asynchronous keyboard focus. Prior evidence is
  preserved; temporary runners direct their screenshots to `/tmp`.
- Actual Mac app-browser inspection measured a 160px viewport with 32px rows,
  201 choices and 6432px scroll extent. Native scrolling changed the visible years
  while the selected date remained 2024-12-31. See [native metrics](native-mac.json).

[Focused tests](focused-tests.txt), [full tests](tests.txt),
[browser results](results.json), [DatePicker regressions](date-browser.txt),
[build](build.txt), [lint](lint.txt), [format](format.txt),
[Arabic five rows](ar-light-five.png), [English five rows](en-light-five.png),
[native Mac screenshot](native-ar-five.jpg).

Physical mobile and manual screen-reader checks remain untested. Original
checkout/index/edits and port 5214 remain preserved. The preview stays running at
<http://127.0.0.1:5227/> in
`/Users/amjedfadul/.codex/worktrees/slider-otp-date/Tiraz`. No push or merge.
