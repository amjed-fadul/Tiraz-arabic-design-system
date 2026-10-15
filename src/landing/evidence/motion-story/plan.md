# Visible textile motion and scroll story implementation plan

**Goal:** Make the textile visibly move, simplify the hero, overlap the working
example by 20px and explain Tiraz with three generated textile story chapters.

**Architecture:** Extend the existing native WebGL fragment pass and retain its
controller lifecycle. A landing-owned WhyTiraz component uses IntersectionObserver
for chapter activation, CSS sticky/crossfades, and static stacked content under
900px, reduced motion or unavailable observers. No dependencies or shared changes.

**Tech stack:** Existing React/TypeScript, CSS, WebGL, native observers, WebP.
**Spec:** User brief pasted 2026-10-15; starting commit bbd738c1a1eea9fccce28e59e46e6ae3552769fd.

## Constraints and review focus

- Preserve original checkout/index/component work/servers; landing-owned files only.
- No push, merge, deploy, root routing changes or new dependencies; one final local commit.
- Test actual motion over time, pause/resume, media changes and WebGL failure.
- Maintain one accent state and preserve live-example data, keyboard and state.
- All three chapters/images remain accessible on mobile, reduced motion and missing IO.
- Check mirrored language layouts, initial desktop overlap and short viewport behavior.

## Steps

- [x] Diagnose baseline in production: WebGL active, 780 draw calls in 6.5s, clock
      advances, no pause/reduce/hidden state; independent eight-second inspection
      confirms motion is too subtle. Save before images and shader-before.json.
- [x] Generate three distinct 4:3 image assets using the hero as material reference.
- [x] Optimize new images as 1200x900 WebP under assets/story; retain prompt provenance.
- [x] Add failing regression coverage for chapter activation, static/reduced layout
      and retained example controls/content removal; run the focused tests red.
- [x] Implement WhyTiraz.tsx and its scoped CSS, simplify Landing/AccentPicker/
      LiveExample and apply normal-flow 20px overlap. Tune image motion and light.
- [x] Run focused tests green, build/lint/format, then serial full suite alone.
- [x] Inspect both languages/themes at desktop/short desktop/tablet/320/390px;
      exercise shader, fallback, pause, swatches, keyboard and chapter transitions.
- [x] Independent source/visual review, fix and re-review; capture after images
      and an actual timestamped screencast of shader movement and all three chapters.
- [x] Recheck preservation and HTTP 200 previews, write honest verification report,
      commit locally and return exact SHA/preview/evidence. No push.
