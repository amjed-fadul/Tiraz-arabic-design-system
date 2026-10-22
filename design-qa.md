# Khayt expression design QA

Date: 22 October 2026. Worktree: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch: `claude/woven`.

final result: passed

Visual checks and the full local gate are complete.

## Target and evidence

The owner approved the exact second six-state sheet:
`docs/woven/khayt-state-reference.png` (1536 × 1024). It is a character expression
reference, not a replacement page layout. The existing Khayt studio is preserved.

The source and the final browser-rendered state sheet were opened together in one
comparison input. The implemented sheet is `docs/woven/khayt-expressions-rendered.png`
(1536 × 1107, six 440 CSS-pixel canvases, deviceScaleFactor 1). Character bodies
are approximately the same display height as the reference; panel chrome and
editorial captions are intentionally excluded from the fidelity comparison.
The six states were also captured individually at the actual studio size under
`/tmp/tiraz-khayt-expressions-20261022/{idle,thinking,working,waiting,done,blocked}.png`.

- Full studio: `docs/woven/khayt-expressions-studio.png` (1440 × 1314 CSS pixels,
  deviceScaleFactor 1, English/light/Needs you).
- Actual renderer recording of all six states:
  `docs/woven/khayt-expressions-preview.mp4`, 768 × 840, about 16 seconds.
- Arabic/English, light/dark, 1440/390 CSS-pixel viewport captures:
  `/tmp/tiraz-khayt-expressions-20261022/studio-*.png`.
- Existing Invoices and Customer profile integration screenshots and color checks
  in the same temporary evidence directory. Local IAB inspection confirmed the
  Arabic studio and state controls; repeatable browser checks used the previously
  authorized throwaway Playwright scripts outside the repository.

## Comparison history and findings

1. **P2 — expressions too similar in the original implementation.** Eyes were
   mostly the same black pills; thread silhouettes were identical. Added generated
   ivory eye surrounds, moving pupils, crescent happy eyes, a worried cotton lid,
   and four distinct thread sprites. Ready and Needs you reuse the hook at
   different heights. Each reduced-motion pose now has a different expression.
2. **P2 — first rendered Blocked face looked neutral.** Rotating plain ivory
   ovals did not communicate the selected worried expression. Generated a cotton
   upper-lid eye and mirrored it for the other side. The final focused Blocked
   capture and comparison sheet show raised inner lids and the visible knot.
3. **P2 — long thread clipped during state interruption.** An independent source
   review identified shared rotation carrying Waiting's strong upward gesture
   into Done's long thread. The browser reproduced edge clipping in six sampled
   transitions. Per-silhouette rotation limits fixed it. The final 1117 sampled
   poses/transitions include the exact Waiting(0.45) → Done(0.14) regression;
   all have no opaque pixels at the canvas boundary.

No actionable visual P0/P1/P2 findings remain. The original selected body is
retained: differences in the exact cotton windings and some 3D perspective are
expected from this layered 2D rig. The expression sheet guides pose and material;
it does not introduce a new 3D model or UI layout.

## Required fidelity surfaces

- **Fonts and typography:** existing IBM Plex Sans Arabic retained. English and
  Arabic state names, labels, focus indicators, and small captions remain legible.
  No new typography system or heading scale. Arabic blocked copy explicitly reads
  «تعذّرت المتابعة»; Arabic sample sizes use Arabic-Indic digits.
- **Spacing and layout:** existing desktop grid and phone stack retained. No
  horizontal overflow at 390/1440. Full-view screenshots inspected in both
  languages. Avatar texture simplifies at 24/32/48 px; state text remains nearby.
- **Colors and tokens:** one identity dye across all states. Cotton recolors;
  ivory stays ivory, pupils stay dark over it, and bare/happy eyes lighten on dark
  yarn. Existing text/status tokens remain independent of user colors. Dark and
  light panels, sage, ink, and white custom colors checked.
- **Image quality:** original generated RGBA layers, with documented crops and
  alpha filtering. Fine cotton and ceramic shading preserved. No placeholder or
  hand-drawn SVG replacement. Body, eyes and thread move independently; geometry
  blends from the current pose. Thread roots remain behind the upper cotton tier.
- **Copy and content:** operational status descriptions retained in both languages.
  Preview completion still says nothing was sent. Host agent names and visible
  state labels supplement the decorative, aria-hidden canvas.

## Interaction and accessibility checks

Eight language/theme/viewport combinations passed: one h1, one polite region,
no horizontal overflow, no JavaScript errors, and zero axe violations for the
studio. State buttons, task playback, pause, and finite completion were exercised.
The one polite region is empty at mount. Color popover Escape restores focus,
and the selected color survives reload in the actual Invoices panel. The
Customer profile integration also loads the new character.

Pixel comparisons confirm that Working moves, Pause holds, Resume continues,
Done settles, and reduced motion stays static. Hidden documents stop drawing;
returning resumes; unmount produces no stale draws. A paused color round-trip
through ink and white preserves the original pose exactly. The local animation
smoke check measured 61 frames over roughly one second; this is not a mobile
hardware performance guarantee.

## Code review and verification

Independent review found only the transition-clipping issue described above;
its fix was verified with the actual browser renderer. The React review checked
asset promise cleanup, shared caches, refs for transient motion, and effect
lifecycle. No new public API or dependency.

Focused tests: 13 passed before the final full-suite run. New motion behavior
checks failed before implementation, then passed. Two existing clipboard tests
checked parent feedback before its effect completed: IllustrationsPage failed
both in the suite and alone; QuickStart failed in the suite but passed alone.
Their assertions now wait for visible feedback; no production clipboard behavior
changed. Test timeouts stay at 15 seconds.

- Complete suite: 142 files and 1796 tests passed with `npm test -- --maxWorkers=2`.
  The worker limit reduces machine contention while retaining the 15-second test timeout.
- Lint: zero errors and zero warnings.
- Build: passed TypeScript and Vite, with the existing large-bundle advisory.
- Format check: passed.
- Mascot CSS audit: `[]` (covered by the motion test file).
- Browser evidence: `results.json`, `bounds.json`, `lifecycle.json`, and
  `pause-color.json` in `/tmp/tiraz-khayt-expressions-20261022/`.

## Limits and follow-up

No user recognition study, native mobile hardware, Safari, or Firefox run.
Expression recognition at avatar sizes remains a qualitative design check,
not a measured user-test result. Source PNGs favor material quality and remain
uncompressed originals; deployment-specific asset delivery is outside this pass.
The mascot remains internal to `src/mascot`.

## Implementation checklist

- [x] Approved six expressions and material layers.
- [x] State-specific rhythms and finite attention gestures.
- [x] Arabic/English, small avatars, color, reduced motion, and host integration.
- [x] Independent review finding fixed and browser-verified.
- [x] Final full-suite pass and documentation; included in the expression implementation commit.
