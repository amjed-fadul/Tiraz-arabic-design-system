# Alignment, language layout and selected logo follow-up

The annotated Arabic screenshot showed a 40px inset between the hero copy and
header/following section. At 1440px, the column was 520px while the copy maximum
was 480px. The copy now has explicit width and end alignment, keeping the shared
container and its typography unchanged.

The user also requested English on the left. English now uses column 1 with
start alignment; the same image/canvas wrapper and quiet mask mirror together.
The caption moves to the opposite edge. Arabic retains its right composition.
A 600px breakpoint check exposed an existing logical auto-margin resolving to
the wrong physical side for the Arabic flex item; explicit left auto-margin
corrects it, while the English rule keeps its own left edge.

The user selected option 1, Warp. The existing SVG is paired with the existing
wordmark in the landing header and footer, with dark-mode monochrome inversion.
The brand preview marks Warp selected and retains the alternatives for reference.
Decorative symbol images have empty alt text and explicit 24px dimensions. The
Arabic wordmark font selector now targets its language instead of first-child,
so inserting the symbol preserves its typography. React review checklist applied:
no added state, effects, listeners, fetching or dependencies.

## Local verification

- `alignment.json`: Arabic/English x light/dark x 1440/768/600/390/320 CSS pixels,
  20 states, all correct logical content-edge alignment, no horizontal overflow,
  and loaded symbol. English image transform mirrors both static image and canvas.
- Independent source/visual review: Arabic desktop copy and wordmark share their
  right edge; English desktop/mobile are physically left; Arabic 320px logo fits.
  Independent final 600px re-review confirms Arabic right/English left with no
  overflow. Review notes and refreshed captures are in `review.md`.
- Root isolated browser console: no warnings/errors. Temporary emulation cleared.
- `npm test -- src/landing/Landing.test.tsx --maxWorkers=1`: 4/4 passed.
- Production TypeScript/build, lint and full repository formatting checks passed.
  The existing shared bundle advisory remains.
- Prior full serial suite passed 464/464 at
  `af338718f91bff721629cc6f0f9835d9430f9144`; it was not repeated for these
  presentational changes. No shared files, original checkout/index edits or
  unrelated servers changed. Preview remains on 5238, development on 5237.

Chrome raw CDP encountered a paused-document-response tool state in the final
capture pass. Supported screenshot fallback excluded scrollbar/frame pixels:
1440x1000 CSS viewport produced 1425x990 images, and 390x844 produced 375x812.
Native JPEG screenshot bytes were converted to PNG without resizing/visual edits.
Four landing captures and `brand-selected.png` reflect the final design. Physical
devices, manual screen readers and alternate GPUs remain untested.
