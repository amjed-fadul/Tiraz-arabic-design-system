# Play icon direction correction

The shared demo Play SVG now has a dedicated class. The portable stylesheet uses
`:dir(rtl)` to mirror only this icon horizontally, following the actual inherited
interface direction. All shared playground/example headers receive the correction.
Copy, success and error icons remain unchanged; code stays LTR.

Reproduced before the change: both Arabic StreamingText headers had RTL direction
but an untransformed right-pointing triangle. Browser checks after the change:

- Both Arabic headers: `matrix(-1, 0, 0, 1, 0, 0)` (left-pointing).
- Both English headers: `none` (right-pointing).
- Copy icons: `none` in both languages.
- English and Arabic Enter replay: stream starts and focus stays on the button.
- Shared helper is the only Play icon source in the repository.

Measurements: [play-direction-checks.json](play-direction-checks.json).
Screenshot: [Arabic direction](arabic-play-direction.png).

Full suite: 70 files, 618 tests passed, including generated/source-only compilation.
Focused demo-frame/AI-page checks: 14/14 passed. Build, lint and format check passed;
build retains the existing main-bundle size advisory. Independent review found
no actionable issues. This is a presentation correction with no API/dependency
changes. Checks used the local Mac and in-app Chromium browser; no new manual
VoiceOver or separate browser/device session was performed.
