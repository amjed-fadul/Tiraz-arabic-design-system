# Khayt motion prototype

22 October 2026. Selected by the owner from mascot concept option 3.

Preview: `/illustrations/khayt`. Existing screen integration: Invoices and
Customer profile. English and Arabic share the character's physical silhouette;
the layout, copy, controls, and numerals follow the page language.

## Character and material

Four rounded cotton tiers, ivory spool rims, two dark ceramic eyes, and an
expressive loose thread. The original generated PNG layers live in
`src/mascot/assets/`. Each is 1254 × 1254 RGBA. They were generated for Tiraz
from the selected concept, with no external character artwork used.

The browser crops transparent padding and removes near-invisible alpha fringe
when loading. Yarn chroma is recolored while its shading, weave, and ivory rims
remain. Very dark identity colors use light eyes. Up to eight color variants
are cached. No network service is needed after the local assets load.

## Motion vocabulary

| State     | Character behavior                                   | Timing                     |
| --------- | ---------------------------------------------------- | -------------------------- |
| Ready     | Small breath, sparse blink, quiet thread tip         | 13-second blink phrase     |
| Thinking  | Slight lean and upward glance, slow thread flex      | Continuous while thinking  |
| Working   | Upper tiers twist, thread follows, gaze follows work | 3.2-second cycle           |
| Needs you | Thread lifts once and the character holds the pose   | Settles within 1.2 seconds |
| Done      | Small nod and soft eye expression                    | Settles within 1.2 seconds |
| Blocked   | Work stops, concerned lean and lowered thread        | Settles within 1.2 seconds |

Transitions blend over 420 ms. The lower body stays grounded. Body deformation,
eyes, and thread are drawn separately from real raster artwork. This is a 2D
character rig, not a 3D model or a whole-image bounce. Small avatars use the same
silhouette; texture naturally simplifies with raster downsampling.

`Khayt` accepts `state`, `color`, `animated`, `size`, and `className`. Animation
is opt-in. The canvas is decorative: the host supplies the agent name and
textual status. It adds no live region. The studio has one empty-at-mount status
region that announces state transitions only.

## Playback and decisions

- Pausing holds the current pose and elapsed time. Resume does not jump ahead.
- Visibility and intersection observers stop offscreen frame loops. Unmount
  removes observers, event listeners, and scheduled animation frames.
- Reduced motion uses a distinct static pose for each state.
- Finite states stop requesting frames once settled.
- The studio's task demonstration waits for the review button. It sends and
  records nothing. Manual state selection cancels its task clock.
- Invoices uses draft writing/sending, ready, and sent states; Customer profile
  uses the answer's thinking/completed states. Existing screen presentation
  controls continue to govern the opening preview.

## Identity color

`useAgentColor` stores colors per stable agent identity. Collections defaults to
plum, Customer to sage. The studio edits Collections. The palette button in each
screen header uses Tiraz's Tooltip, Button, and ColorPicker inside the existing
Radix popover primitive. Escape restores focus to its trigger.

Names and readable text use normal text tokens, not arbitrary identity hues.
Warning, error, and success meanings retain their normal styling. The same
identity color tints the mascot, header, panel border, and subtle panel surface.
Changes persist locally, with an in-memory fallback if storage is unavailable.

## Scope

The mascot is internal to `src/mascot`, outside the public `src/system` API.
Brand marks and existing status glyphs remain separate. A future public mascot
family should bring its assets, types, examples, and registry metadata together.

Browser and accessibility evidence is recorded in the root `design-qa.md`.
