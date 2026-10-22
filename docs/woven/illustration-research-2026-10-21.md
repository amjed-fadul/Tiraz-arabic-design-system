# Illustration research: rebuilding the Tiraz collection

21 October 2026 · Research following the owner's rejection of the first eight scenes

## Conclusion

The draft missed the reference in composition, material quality, and behavior. Recoloring it or adding more movement will not address that. The collection should be rebuilt around specific product stories, with a rendering technique chosen for each story.

I inspected ten AffectUI detail pages and their live previews, read their public behavior/accessibility notes, and inspected the freely available source for Side Folder, Layer Stack, and Agent Team. Paid source was not accessed. Technical recommendations below also draw on MDN, web.dev, W3C Arabic layout guidance, and IBM's illustration principles. Observations describe the reference; the proposed Tiraz direction is my judgment, not a claim about the reference's design process.

## What the references actually do

| Reference | What makes it work | Construction or behavior verified |
| --- | --- | --- |
| [Glass Folder](https://www.affectui.com/illustrations/glass-folder) | One recognizable object, a strong blue silhouette, translucent pocket, crisp papers, and grounded shadow. The material carries the interest. | Public notes describe a pocket that tips open while the documents move independently. Designed primarily for a light surface. Paid implementation not inspected. |
| [Side Folder](https://www.affectui.com/illustrations/side-folder) | The partially hidden documents make the object feel useful and tangible. There are no orbit lines or surrounding confetti to explain it. | Public source combines SVG layers with a masked HTML front, backdrop blur, multiple shadows, perspective, and a hinged rotation. Papers slide by different amounts. This is achievable with browser-native rendering. |
| [Layer Stack](https://www.affectui.com/illustrations/layer-stack) | Consistent projection, visible thickness, and one highlighted layer establish depth. The list makes the scene understandable. | Public source uses projected SVG faces, separate side faces, a blurred glow, and HTML selection controls. Selection changes spacing, color, icon visibility, and the highlighted row together. |
| [Agent Team](https://www.affectui.com/illustrations/agent-team) | A recognizable prompt produces a visible result. Portraits, role labels, and tool marks make the illustration specific. | Public source uses distinct typing, sending, team, and reset phases. Connectors reveal before the team settles; small status details arrive later. This is a short story rather than unrelated floating objects. |
| [Integration Beam](https://www.affectui.com/illustrations/integration-beam) | A readable source–hub–destination structure, quiet curved paths, and a bright moving signal. | Documented behavior includes focused tool emphasis, connection toggles, coordinated incoming/outgoing pulses, measured endpoints, and a stacked narrow layout. It pauses off screen. |
| [Voice Orb](https://www.affectui.com/illustrations/voice-orb) | A restrained dot field changes shape to communicate a state. Shape, density, depth, and movement matter more than ornament. | Public docs identify a canvas renderer with listening, thinking, and speaking states. I inspected the sphere-to-ring transition. State shapes blend, and off-screen/background rendering pauses. Paid source not inspected. |
| [Cover Flow](https://www.affectui.com/illustrations/cover-flow) | Perspective, overlap, receding contrast, and a soft reflection place the selected card clearly in front. | Documented direct manipulation includes dragging, flicking, trackpad movement, keyboard navigation, and spring settling. Its content is the subject, not an icon surrounded by decoration. |
| [Glow Cloud](https://www.affectui.com/illustrations/glow-cloud) | A memorable silhouette and tightly controlled color family. Its brighter rim, shaded eyes, and soft body suggest material and volume. | Public notes describe coordinated body, eyes, shine, and shadow movement. These parts respond differently, making the object appear to turn. |
| [Ghosted Chat](https://www.affectui.com/illustrations/ghosted-chat) | Ordinary UI pieces communicate a specific problem. Sparse composition and small status changes do most of the work. | Public notes describe a hover reply, displaced messages, and a subtle warning shine. It preserves its artboard composition rather than reflowing every bubble. |
| [Integration Grid](https://www.affectui.com/illustrations/integration-grid) | Many objects still have hierarchy: a larger central mark, ordered rows, and quieter peripheral surfaces. | Public notes describe a wide composition whose tile fills fade at the edges while the marks remain legible. It is mainly static, with restrained hover feedback. |

## Diagnosis of the rejected draft

These are observations about our implementation, not assumptions about the owner's taste.

1. **Too much of one composition.** Several scenes use a centered object, orbit curves, tiny stars, and floating tiles. Different titles do not produce enough visual variety.
2. **Decoration substitutes for meaning.** The agent scene suggests “AI” but does not show a task, a decision, or a result. The team scene shows generic drawn faces without roles or a shared action.
3. **Materials are underdeveloped.** A translucent fill is not enough to make convincing glass. The folder needs different treatment for its back, papers, pocket, edge highlights, and contact shadows.
4. **Color is spread too evenly.** Sage, violet, and warm accents compete in small areas. The scene needs a primary accent and a quieter supporting field.
5. **Most motion is interchangeable.** Rise, float, bloom, and draw animations repeat across scenes. They reveal the artwork but do not explain what happened.
6. **The implementation contract was too restrictive.** Every scene became a decorative SVG with an `animated` flag. That does not accommodate selection, direct manipulation, localized text, or stateful particle rendering. SVG itself is suitable; the one-template-for-everything decision was the problem.
7. **Technical checks were mistaken for visual readiness.** Unique SVG IDs, responsive sizing, and passing tests protect functionality. They do not establish whether a scene is compelling or matches the intended reference quality.

IBM's guidance is useful here: illustration should have a clear purpose, controlled geometry, and only the elements needed to communicate its idea. Its guidance on composition also emphasizes focal points and choosing fidelity for the intended use. Those principles support a more deliberate composition pass before implementation. [Illustration principles](https://www.ibm.com/design/language/illustration/overview/), [tips and techniques](https://www.ibm.com/design/language/illustration/tips-and-techniques/).

## Proposed visual direction for Tiraz

**Precise product scenes with tactile surfaces and a clear action.** This is a proposed direction to rebuild toward.

- Establish one focal subject. Supporting pieces should explain the relationship or action around it.
- Vary the composition: one object, a branching workflow, a layered diagram, a wide grid, a particle field. Do not repeat a circular arrangement across the collection.
- Use the existing Woven palette with a dominant hue per scene. Neutral surfaces carry most of the composition; concentrated color marks the meaningful object or state.
- Keep Phosphor Duotone icons for small semantic details. An icon does not become a finished illustration just by adding a gradient and orbit lines.
- Give depth a consistent explanation: projection, overlap, thickness, contact shadow, edge light, and distance. Keep the apparent light source coherent within each scene.
- Create separate light and dark material values. Dark glass should retain a readable rim and visible layers; swapping a paper fill to a dark token is insufficient.
- Make the resting frame attractive. Animation should improve the scene, not conceal a weak still composition.
- Preserve negative space deliberately. Use the final gallery card size during review, not only an enlarged illustration canvas.

The material pass should distinguish three families: paper/UI surfaces, frosted glass, and emissive signals. Each needs its own edge, shadow, highlight, and transparency rules. They may share palette tokens without sharing every material value.

## How to build them

| Visual requirement | Preferred implementation | Why |
| --- | --- | --- |
| Papers, folders, and glass fronts | HTML/CSS surface layers plus SVG contours and masks | Keeps real backdrop blur, independent hinges, and responsive material sizing available. |
| Agent delegation, chat, and small workflows | Semantic HTML for text/controls, SVG for connectors, explicit React phases | Supports localized labels, coherent cause and effect, and accessible interaction. |
| Isometric layers and diagrams | SVG projected geometry plus HTML controls | Precise edges and consistent geometry without a 3D engine. |
| Voice particles and continuous shape morphs | A small Canvas 2D renderer with DOM controls/labels | Many changing points do not require hundreds of React updates per frame. |
| Spatial galleries and tilting cards | CSS perspective/transforms with gesture handling only where useful | Content can remain accessible HTML while spatial relationships animate. |

### Surface construction

For a new document scene, construct the rear shell, cast shadow, document stack, contact shadows, front pocket, and rim highlight as separate layers. The front pocket must soften the papers behind it while preserving its own silhouette. Tune opacity, blur, and contrast at the actual display size.

MDN confirms that `backdrop-filter` affects pixels behind an element and requires a transparent or partially transparent foreground to be visible. SVG filters provide blur, compositing, and lighting primitives for layers that are better kept inside SVG. These are tools to create a chosen material, not a recipe that guarantees good art. [Backdrop filtering](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter), [SVG filter effects](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Filter_effects).

### Motion construction

Write a short storyboard before keyframes. For example: prompt appears → send responds → path travels → agent receives → result settles. Each transition should have a reason, and there should be a readable hold on the result.

Use transforms and opacity for the main movement. Keep large blurred layers stable where possible, animate their opacity, and inspect actual paint costs. New dependencies are not necessary for the first prototypes. A motion library can be considered if direct manipulation or spring coordination becomes substantial. [web.dev animation guidance](https://web.dev/articles/animations-guide).

For canvas, use `requestAnimationFrame`, a device-pixel-ratio-aware drawing buffer, and cached static work. React should manage state and lifecycle; the drawing loop should handle intermediate frames. Stop work when the scene is not visible or the document is hidden. [MDN canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).

### A precise first sequence

The following is a proposed prototype storyboard, not timings copied from AffectUI:

| Beat | What the viewer sees |
| --- | --- |
| Rest | A crisp prompt surface and an unobtrusive hint of the destination. |
| Request | A short English prompt appears in one text node, following Tiraz's prompt-language rule. |
| Send | The send control gives brief pressed feedback, then returns. |
| Travel | A signal follows the connector toward the first agent. |
| Response | Two or three agent roles appear in a deliberate order; completion comes after receipt. |
| Hold | The result remains visible long enough to understand. |
| Replay | An explicit replay resets the sequence without affecting any actual application data. |

Animation durations should use Tiraz's motion tokens and respect reduced motion. A static, meaningful end frame must remain available. Reference autoplay is an observed behavior; its exact policy should not be copied wholesale into every Tiraz gallery card.

## Arabic and English are part of the drawing

- Keep labels as HTML text. Use IBM Plex Sans Arabic, with enough line height and room for Arabic phrases.
- Mirror the direction of a workflow where it communicates reading order. Do not mirror portraits, logos, document contents, or the light source indiscriminately.
- Keep English prompts isolated with `dir="ltr"`; surrounding labels follow the page language. Use `numberLocale` for counts.
- Do not animate Arabic by wrapping and moving individual letters. Preserve connected shaping with a single text run, or animate whole words/lines where appropriate. W3C documents the joining behavior and the problems caused by styling connected letters independently. [Arabic layout requirements](https://www.w3.org/TR/alreq/).
- Recompose dense scenes on narrow cards. Avoid shrinking meaningful text until it becomes illegible. A decorative thumbnail can use simplified text marks; the interactive detail needs readable labels and usable targets.
- Use decorative accessibility only for purely decorative scenes. If a layer, tool, or state can be selected, expose real controls with a stable accessible name and visible focus.

## Rebuild order and quality checks

Start with **three representative studies**, so each resolves a different weakness before expanding the collection:

1. **Document vault:** one strong folder silhouette, a convincing frosted pocket, independent document movement. Proves material and lighting quality.
2. **Agent handoff:** a prompt creates a short chain of purposeful agent actions. Proves story, sequencing, typography, and RTL composition.
3. **Voice field:** a calm particle object with distinct idle, listening, thinking, and speaking forms. Proves a more expressive medium and state transitions.

For each study:

1. Define one sentence describing what it communicates.
2. Draw the resting and result compositions first. Compare them with the reference at the same card size.
3. Finish silhouette, spacing, material, contrast, and lighting before adding motion.
4. Add one coherent interaction or sequence.
5. Inspect Arabic/English, light/dark, and narrow/wide previews together.
6. Review the visual result before building variants or expanding the library.

The threshold is visual, not a component count: a clear focal point; recognizable purpose; convincing material; no unexplained decorative objects; readable Arabic and English; motion that explains a change; a composed reduced-motion frame; no clipping or jumping at responsive sizes.

At the end of this research, the eight scenes were a rejected draft. The approved replacement and its implementation are recorded below.

## Research-stage verification (21 Oct)

The shared Docs/Illustrations/Library sidebar now uses the wider Phosphor navigation and full-hide toggle; the mobile drawer has the same styling. These are local working changes in `/Users/amjedfadul/Tiraz-worktrees/woven`, branch `claude/woven`, based on commit `6639437`. The rejected artwork has not been committed as finished work.

- Full suite: `npm test -- --maxWorkers=2` — 125 files, 1,685 tests passed.
- After the final mobile portal correction: focused navigation suite — 17 tests passed; `npm run lint`, `npm run build`, and `npm run format:check` passed. Lint reported no warnings. The build retains its existing large-chunk advisory.
- System/screen CSS audit and additional sidebar/illustration CSS audit both returned `[]`.
- Throwaway browser checks covered Arabic/English, light/dark, widths from 320 to 1,440 pixels, complete sidebar collapse, mobile dismissal, focus during responsive changes, the customization panel, finite replay, and reduced motion. No page errors were recorded. Those checks establish behavior, not artistic quality.
- Preview remains available at http://127.0.0.1:5411/; `/docs` returned HTTP 200 after the work.


## Approved replacement (22 Oct)

Replaced the eight rejected scenes with three original, self-contained React illustrations. The three existing empty-state drawings remain, for a six-item gallery. Each new detail page copies its own source file and a matching localized usage example.

- **Document vault** (`/illustrations/document-vault`): separate rear shell, paper layers, contact shadows, frosted front, and rim lighting. An SVG alpha mask constrains genuine backdrop blur to the pocket contour. Opening the folder hinges its front and lifts the papers independently. The light direction stays consistent in RTL and LTR; text follows the selected language.
- **Agent handoff** (`/illustrations/agent-handoff`): one English prompt is typed, sent, routed, researched, analyzed, and reviewed. The role order follows reading direction. The sequence ends on a completed brief and replays explicitly. Compact previews simplify supporting status copy while retaining readable role labels.
- **Voice field** (`/illustrations/voice-field`): a depth-shaded Canvas point field morphs between a sphere, expanded listening form, tilted thinking ring, and speaking waves. State controls follow the demo and immediately take over when selected. React manages controls and state changes; requestAnimationFrame manages intermediate frames. The renderer stops when settled and pauses when hidden or outside the viewport. A decorative SVG fallback remains available without Canvas.

The gallery is still on arrival and previews on hover or focus, subject to Tiraz's keyboard-motion rules. The agent and voice detail pages play one finite demonstration; the folder opens through its localized control. Motion tokens, reduced-motion preferences, localized HTML labels, and stable keyboard focus apply throughout. None of these scenes makes an external request or records audio.

The wider Phosphor sidebar and complete hide/reopen behavior now apply consistently to Library, Docs, and Illustrations. Gallery art shares a common aspect ratio so neighboring captions align.

Browser review used throwaway scripts outside the repository. It covered Arabic and English, light and dark themes, widths from 320 to 1,440 pixels, glass masking, folder open/close and focus, finite handoff replay, voice-state selection and interruption, reduced motion, and empty live regions. All completed without page errors. Both CSS audits returned `[]`.

Final local gate on 22 Oct:

- `npm test -- --maxWorkers=2`: 126 files, 1,688 tests passed.
- `npm run lint`: passed, zero warnings.
- `npm run build`: passed; the existing large-bundle advisory remains.
- `npm run format:check`: passed.
- Shared-navigation browser checks also passed: full hide/reopen, mobile Escape, route focus, breakpoint focus, and settings alongside the wider sidebar.
- Preview: http://127.0.0.1:5411/illustrations, on `claude/woven` in `/Users/amjedfadul/Tiraz-worktrees/woven`.
