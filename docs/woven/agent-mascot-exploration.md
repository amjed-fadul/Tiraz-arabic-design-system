# Tiraz agent mascot exploration

22 October 2026. Visual proposals only; no mascot is implemented yet.

## Recommendation

Start with **Nool**, the woven-loop character. It has the closest connection to
Tiraz's Warp mark and offers a distinctive silhouette. The selected direction
still needs a small-size and motion pass before product integration.

The three boards were displayed in this order:

1. **Nool / نول** — a folded woven ribbon surrounding an expressive face.
2. **Makouk / مكوك** — a ceramic weaving shuttle with an inset face.
3. **Khayt / خيط** — an upright spool of thread with an expressive loose end.

Each board includes the same character in several colors, Arabic and English
collections-agent panels, and static poses suggesting ready, working, waiting
for the user, and done states. These are concept illustrations, not screenshots
of implemented controls or finished animations.

## What the references contribute

- [OpenAI's dots](https://openai.com/index/introducing-dots/) provide a reference
  for a recognizable, personal character presented alongside useful work. The
  official page was inspected directly, including its character selector.
- [Grok Bot's design account](https://x.ai/news/designing-grok-bot) explains its
  use of simple shapes and expressive eyes for recognition at sidebar sizes,
  and avatar motion to communicate agent state. Its working-state example was
  inspected directly.
- [GitHub's mascot guidelines](https://brand.github.com/graphic-elements/mascots)
  distinguish mascot roles from brand identity and warn against interrupting
  users. For Tiraz, this supports keeping the working character compact and
  leaving consequential decisions to clear copy and controls.

These inform the direction; Tiraz's character remains original. The landing
page's existing Warp mark remains the product logo.

## Identity and customization

- Give each agent one persistent user-selected identity color. Apply it to the
  mascot and a restrained panel header or trim. Keep the reading surface neutral.
- Always show the agent's name. Color alone must not distinguish agents.
- Preserve eye/face contrast independently of the chosen body color, including
  in dark mode. Confirm recognition at 24, 32, and 48 px.
- Keep semantic warning and error colors separate from agent identity.
- Simplify the hero material at small sizes. Fine weave and thread detail should
  disappear before it becomes visual noise.
- The Nool and Khayt boards contain an avatar/header color mismatch in the Arabic
  example. Correct that in the selected direction; the intended behavior is
  that avatar and panel identity color always match.

## Motion to develop after selection

- **Ready:** still pose with an occasional quiet blink.
- **Working:** a small weaving, shuttle, or thread movement tied to actual work.
  Show the current action in text as well.
- **Needs you:** one gentle change of pose, then hold still beside the decision.
- **Done:** a short settling motion, then return to rest.
- **Blocked:** stop the working motion and explain the blocker in text.
- Under reduced motion, use static poses and status labels. Pause all loops when
  the panel is hidden, work ends, or the component unmounts.

Arabic panels align the identity to the right; English panels align it to the
left. Mirror spatial gestures only when they point toward content. Preserve the
character's identity, isolate Latin identifiers, and use Arabic-Indic numerals
in Arabic UI.

## Next step

Choose a direction, refine its small-size silhouette and color correspondence,
then create a motion prototype in one existing agent panel before extending it
to other screens. Color persistence and animation behavior are not built yet.
