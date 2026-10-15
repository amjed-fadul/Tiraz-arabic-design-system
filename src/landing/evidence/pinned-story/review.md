# Independent pinned story review

Reviewed the final local changes to WhyTiraz.tsx, story.css and WhyTiraz.test.tsx against baseline ebbf3ae157e0289ca35a85fc8f28fd8a115954c2 in /Users/amjedfadul/.codex/worktrees/landing-page/Tiraz (codex/landing-page). Browser verification used the production preview http://127.0.0.1:5238/landing.html in existing Chrome tab 1309616658, controlled through CUA and tab-scoped CDP. No product files were modified by this review.

## Findings

No actionable findings remain within the requested scope.

## Verified behavior

- Arabic desktop: image fills the physical left half, text occupies the right half; English mirrors this. Images cover the full scene without border, radius or card framing. The small Why Tiraz label stays inside the text panel.
- The scene is 100svh and remains at top 0 during the 400svh section. All three existing images appear with readable dwell. At normalized progress 1.1 the scene top was about -300px, showing natural release into the next section.
- Sampled progress .27/.30/.34/.50/.68/.74/.90 and backward .50. Only one copy had nonzero opacity at each sample; settled chapter copy tops match. At the midpoint the outgoing copy reaches zero before incoming copy appears. Image reveal, scale and copy offsets track scroll in both directions.
- All three images loaded at naturalWidth 1200; incoming image scales reduce from 1.03 toward 1 as the feathered mask rises. Real screencast frame 14 visibly shows the soft upward wipe; frame 25 shows the second chapter. These were visually inspected from raw JPEG files.
- 390x844 Arabic and English: image above text in a vertical split; third chapter and source link fit. 320x844 and 320x600 English remain readable pinned layouts. Arabic 320x600 also fits. Arabic/English 320x568 use the measured content fallback despite being above the fixed 560px cutoff. A 1440x500 viewport uses the short-height fallback. Additional 760x600, 768x600, 768x700 and 1024x768 states were checked.
- Reduced motion: all three copies and inline images display in a normal stack, all inline image alt text is available, source link tabindex is 0. No live region exists. All three story headings and image descriptions remain present in the accessibility snapshot during pinned mode.
- Forced readiness gate: temporarily blocked shared-system asset with cache disabled. Its naturalWidth became 0 and the scene stayed static; after removing the block and restoring cache behavior, all images loaded and pinning resumed. Browser-only network overrides were cleared.
- No horizontal document overflow in any saved matrix state. Fresh CDP capture recorded no Runtime.exceptionThrown events and no application warnings/errors. Installed extensions emitted an unload permission-policy error and extension font notices; exact events are preserved in console-events.json. An earlier tab log also contained extension asynchronous-listener messages.

## Evidence

browser-matrix.json contains measured geometry, copy opacity/offset, asset readiness and overflow. Desktop/mobile/static/reduced-motion PNGs use real CDP viewport captures, not stitched or recreated renders. The Chrome scrollbar reduces content width by 15px; capture dimensions remain the requested viewport dimensions.

recording.json describes a real Page.startScreencast recording: 119 JPEG compositor frames, 1440x1000, approximately 16.6 seconds, normal wheel input forward through the three chapters and release, then backward to the first. Raw frames are in /tmp/tiraz-pinned-recording for timestamp-preserving encoding. No synthetic screenshot interpolation was used.

## Limits

This is local Chrome verification with browser wheel input and responsive emulation. It does not substitute for physical iOS/Safari, touch scrolling, or a native screen-reader session. Focused/full automated test and build results are owned by the implementing parent agent. The initial preview connection refusal was resolved by the parent restarting its absent preview process; no existing server was stopped by this review.

## Supplemental dark, keyboard and zoom review

Arabic and English dark themes were each visually inspected at 1440x1000 and 390x844. Active third-chapter copy fits fully inside both its panel and viewport; document scrollWidth equals clientWidth in all four states. Captures dark-ar/en-desktop-third.png and dark-ar/en-narrow-third.png preserve the visible result. Exact theme values, text bounds and containment checks are in dark-keyboard-zoom-matrix.json.

Keyboard navigation from the active third source link to the next section with Tab, then back with Shift+Tab, placed focus on the source link. The link remained visible at opacity 1 with tabindex 0 and :focus-visible=true; its computed outline was 2px solid rgb(165,201,180). Saved keyboard-focus.json and dark-ar-keyboard-focus.png.

Actual 200% browser zoom remains unverified. Native Chrome initially allowed inspection of its menu at 100%. Attempts to activate zoom did not change measured viewport or devicePixelRatio, then native UI reported the Mac was locked. No actual 200% result is claimed. A 756x386 CSS viewport was checked only as a reflow fallback: it correctly uses a static stack without horizontal overflow. Device emulation and page-scale emulation are not equivalent to browser zoom.

Source re-review of the fit-fallback latch confirms that once copy is too tall it stays static until viewport resize, preventing the static width from repinning itself. The added regression test covers shorter copy measurements after stacking. Final rebuilt preview was reloaded in a fresh Chrome tab. Transient DOM MutationObservers observed zero data-static changes during 1.2 seconds of idle time at 768x600 and 1024x600 (both pinned), and at 320x568 (static). Resizing to 390x844 restored pinning and remained stable. No horizontal overflow was found. Exact observations are in fit-latch-idle.json. Observer instances were disconnected, responsive overrides cleared, and the temporary review tab closed. No actionable findings remain in the fix.

The screencast was recorded before the final fit-fallback latch patch. That patch changes only fallback stability; it leaves the ordinary desktop transition path unchanged. The final rebuilt preview was independently re-reviewed for fallback behavior as described above.
