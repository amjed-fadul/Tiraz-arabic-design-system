# Independent source and visual review

Reviewed the landing worktree against `450e776e2b04e3633aec5a1752dfcce1d46f0138` and its rebuilt local production preview on 2026-10-15. No implementation edits or test runs were performed by the reviewer.

## Findings, fixes and re-review

1. The accent helper sentence crossed a dark textile fold in English/light at tablet and desktop widths. The implementer added a translucent backing and strengthened the tablet quiet mask. Re-inspected the rebuilt preview at 768 and 1440 pixels: the entire sentence is readable and the tactile textile remains visible.
2. Changing the OS motion preference from no-preference to reduce disposed the canvas; changing back did not remount it because the attempted flag remained set. The implementer resets that flag in the reduced-motion branch. Re-tested in Chrome: reduce produces canvas count 0 / fallback; no-preference produces canvas count 1 / running.
3. The landing README described the superseded SVG and isolated two-accent example. The implementer is updating landing-owned documentation/provenance separately.

No remaining actionable implementation or visual findings after re-review. This is a scoped review, not an accessibility or GPU compatibility certification.

## Independent inspection

- Used a separate local Chrome tab. Inspected Arabic/light desktop and mobile, Arabic/dark mobile, English/dark 320 and 390 mobile, English/light 768 tablet and 1440 desktop, and English/dark desktop. The root implementation session covers the complete language/theme/width matrix separately.
- Real textile remains recognizable across crops. Text and controls are HTML siblings outside the canvas. Image and canvas share center/cover cropping. The visible treatment combines minute texture sampling displacement, slow directional light and stable edge cells; no pointer tracking or geometry entrance is present.
- Reduced motion leaves the same real image visible. Offscreen scrolling changed the effect to paused. Visibility-change source handling was inspected. Compile/link/import/context-loss fallback paths were inspected in source; this reviewer did not fault-inject every GPU branch.
- Keyboard ArrowRight cycled sage to blue to plum to clay with focus and checked state together. Selecting the last-three-days period yielded 672; selecting another hero swatch retained 672. Root verification additionally records the shared canvas and actual GL tint uniform.
- One SystemProvider and one selected-accent state drive hero texture and the live example. Existing semantic Badge tones remain success/neutral. The duplicated demo color picker is removed; helper text connects hero controls to the example.
- Three original SVG concepts retain strong monochrome/reversed silhouettes at 16, 24 and 32 pixels and in header examples. Arabic and English preview lockups were inspected; the landing retains its existing wordmark. Brand language selection updates document lang and direction.
- No horizontal overflow was observed at the inspected mobile/desktop widths. Final four viewport captures are exactly 1440x1000 and 390x844, device scale factor 1. The logo sheet is 1440x1400. Temporary tab-local viewport and media overrides were cleared after capture.
- Brand tab console had no warnings/errors. The landing tab captured three identical asynchronous message-channel listener errors at 12:22:04 UTC during browser automation; no landing source uses extension messaging. Their precise origin was not established, so this review does not claim a completely clean console session. Root isolated console inspection is recorded separately.

## Captures

- `arabic-desktop-light.png`
- `english-desktop-dark.png`
- `arabic-mobile-light.png`
- `english-mobile-dark.png`
- `brand-concepts.png`

Screenshots were captured directly from the built preview through tab-scoped Chrome DevTools Protocol and saved without image alterations. Physical devices, a manual screen-reader session, exhaustive pixel contrast measurement and alternate browser/GPU drivers remain untested by this reviewer.

## Final mobile navigation-overlay re-review

Locally inspected the final production preview at `http://127.0.0.1:5238/landing.html` in a separate Chrome tab. Saved `arabic-mobile-light.png` and `english-mobile-dark.png` with tab-local emulation at exactly 390×844, deviceScaleFactor 1, viewport-only PNG capture. Both states measured innerWidth 390, innerHeight 844, document scrollWidth 375 (scrollbar excluded), header bottom 119.19px and hero copy top 170px. The navigation overlays the hero cleanly, with readable controls and approximately 51px separation before the copy. No header/content collision, horizontal overflow, clipping or screenshot duplication was observed. Both images were visually inspected. No actionable mobile-overlay findings remain. Cleared the tab-local device emulation afterward; implementation files, other tabs, checkout and servers were untouched.

## Selected Warp symbol and physical English placement

Independent narrow source/render review of the production preview confirmed English copy uses grid column 1 with start alignment, physically on the left (1440px CSS viewport: copy x=168.5 through 648.5). The artwork and quiet mask mirror together; the artwork computed transform is matrix(-1,0,0,1,0,0). Visually inspected English light/dark desktop and mobile; text, controls, caption and selected symbol remained readable with no collisions. At Arabic 320px, the wordmark spans x=212.56–285 and the 24×24 symbol x=261–285; document scrollWidth=305 excludes the scrollbar, with no horizontal overflow. Warp carries the Selected badge in the brand preview. No actionable findings remain in this scoped follow-up.

Refreshed four landing PNGs and brand-selected.png through Chrome's normal screenshot API after raw CDP reported a paused-document-response tool state. This fallback captures the visible content area: CSS 1440×1000 produces image 1425×990 and CSS 390×844 produces image 375×812. Native JPEG bytes were converted to PNG without resizing or other visual edits. Browser viewport override was reset afterward.

Final 600px built-preview re-review confirmed the physical mobile margin correction: Arabic copy aligns right at x=61–561 (24px content inset), English copy aligns left at x=24–524, both are 500px wide with document scrollWidth 585 < innerWidth 600; source uses margin-left:auto with the LTR override, no actionable findings remain, and the temporary viewport override was reset.
