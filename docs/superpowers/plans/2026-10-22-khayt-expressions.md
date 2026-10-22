# Khayt State Expressions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for implementation. Asset generation is delegated as required by the image-to-code workflow; source edits stay with the parent.

**Goal:** Make Khayt's six states recognizable through its eyes, thread silhouette, and motion, following the owner's selected second expression sheet.

**Architecture:** Preserve the raster cotton body and canvas lifecycle. Add generated eye/thread layers, interpolate expression channels, and give each state a distinct motion phrase. Existing agent identity colors and host status text remain authoritative.

**Tech Stack:** React, TypeScript, Canvas 2D, generated PNG layers, Vitest, local browser verification.

**Spec:** The owner-approved image `docs/woven/khayt-state-reference.png` and the six-state proposal in this conversation, 22 October 2026.

## Global Constraints

- Work in `claude/woven`; leave main and the other worktrees untouched.
- Preserve the cotton and ivory materials, four tiers, eye position on the third tier, and customizable identity color.
- Ready breathes; Thinking looks up and pauses; Working moves steadily; Needs you waves once; Done lifts and settles; Blocked catches and stops.
- Reduced motion renders a recognizable static pose. Hidden/offscreen/unmounted mascots do not run animation.
- Finite attention/completion/error gestures settle. Never imply a completed action from a preview gesture.
- Arabic/English, light/dark, narrow layouts, and 32–48 px rendering remain usable.
- Keep both existing preview servers running. No pushes, PRs, main merges, or deployment.

## Review Focus

- State changes during another gesture must blend without stale expressions or clipped thread.
- Recoloring a paused character must preserve its pose, keep pupils legible, and preserve ivory whites.
- Pausing, reduced motion, and offscreen transitions must stop drawing and resume safely.
- Each state needs a different still expression, especially Ready versus Needs you and Thinking versus Working.
- Long threads must remain inside the avatar at all sampled animation frames and not shrink the body disproportionately.

## Task 1: Artwork and expression motion

**Files:** `src/mascot/assets/`, `src/mascot/khayt-motion.ts`, `src/mascot/khayt-motion.test.ts`.

- [x] Generate and inspect eye whites, happy eyes, and Thinking/Working/Done/Blocked thread sprites using the selected image.
- [x] Add focused tests for meaningful expression channels, finite gestures, static poses, interpolation, and invalid time input.
- [x] Run the focused tests and observe the new behavior tests fail.
- [x] Implement distinct pose and motion phrases with numeric channels that blend continuously.
- [x] Run the motion tests; document asset sources and bounds.

## Task 2: Render the selected expressions

**Files:** `src/mascot/khayt-renderer.ts`, `src/mascot/Khayt.tsx`, relevant mascot tests.

- [x] Load/crop/cache the generated sprites and retain tinting only for cotton.
- [x] Render ivory surrounds, independent dark pupils, happy eyes, and six thread silhouettes from pose weights.
- [x] Preserve lifecycle, pause/recolor behavior, DPR limits, fallback, and host API.
- [x] Verify the rendered six states against the selected sheet, including transitions and small avatars.

## Task 3: Visual and regression verification

**Files:** `design-qa.md`, `docs/woven/khayt-motion.md`, browser evidence under `docs/woven/`.

- [x] Inspect Arabic/English and light/dark at desktop/phone widths; check focus, state controls, color changes, and host panels.
- [x] Sample animated bounds, pause/resume, reduced motion, and unmount cleanup with a throwaway script outside the repo.
- [x] Compare reference and rendered states together, fix important differences, and capture revised evidence.
- [x] Run `npm test`, `npm run lint`, `npm run build`, and `npm run format:check`; CSS audits must return `[]`.
- [x] Obtain a focused independent review, address important findings, update QA, and commit explicit paths.

## Decisions and progress

- The user's approval of the exact second image authorizes this implementation; no additional design approval is needed.
- Existing worktree and servers are reused; no public API or new dependency is introduced.

- All six expressions are implemented, with generated ivory eyes, cotton eyelids, happy eyes, and distinct thread silhouettes. The existing body, color controls, and lifecycle remain intact.
- Independent review identified long-thread clipping during interrupted transitions. Per-silhouette rotation limits resolved it; 1117 sampled poses and transitions pass canvas-boundary checks.
- Arabic/English, light/dark, desktop/phone, paused recoloring, reduced motion, host integration, and unmount behavior passed browser checks. The six-state video and rendered comparison are saved under `docs/woven/`.
- Two existing clipboard tests now await parent feedback instead of asserting before its effect runs. Production clipboard behavior is unchanged.
- Final gate: `npm test -- --maxWorkers=2` passed 142 files / 1796 tests; lint returned zero errors and warnings; build and format checks passed. CSS audit returned `[]`. The existing Vite large-bundle advisory remains.
