# Contextual workspace in Tiraz

The example has its own documentation tab under AI interfaces:

- Docs: <http://127.0.0.1:5432/library/contextual-workspace>
- Full canvas: <http://127.0.0.1:5432/examples/contextual-workspace>

The continuous documentation frame, Preview/Code and one-line prompt/Copy row
remain intact. TaskStarter and the Night loom landing are unchanged.

## Conversation and panel behavior

The composer retains TaskStarter’s **38rem / 608px** maximum width. Conversation
and final answers appear above it in a bounded scroll region; messages settle on
the composer and history grows upward. The composer is the hub: panels hang off
it and are never part of the conversation’s flow, so opening, filling or closing
one cannot move a message or the composer.

- **First view.** Before the first request the composer waits near the top
  under a short welcome (5rem from the stage's top), lifted by a transform so the
  frame keeps its height and the conversation keeps its 32rem. The first send
  lets it glide down (420ms) while the page scrolls with it frame by frame, so
  the composer stays where it was on screen (measured: 496px before and after,
  page scrolled 432px) and the conversation opens above it. Where the page cannot
  scroll further, the composer simply glides. Stacks are placed from layout offsets, so they aim at where the
  composer rests while it is still gliding.
- **Rails (container ≥ 50rem).** Reading, Research and Checks sit in a rail on
  the composer’s leading side, the three agents on its trailing side. The
  rail width is fluid (11–15rem); between 50rem and about 62rem the composer
  narrows to make room. Each stack centers on the composer and never extends below
  its bottom edge. A pipe runs from a socket on the composer’s edge to a socket on each
  card: an 8px edge in the strong border colour around a 5px core in the
  composer tray's colour, with the activity flowing inside while an agent
  works. All wires share one edge layer and one core layer, so branches merge
  without seams.
  Sides mirror in RTL.
- **Dock (container < 50rem).** Panels wait as chips plugged into the composer’s
  top edge. A chip opens one card above the chips, over the conversation; the
  chip shows it is expanded. Chips do not open on their own here.

Motion: the thread is drawn out from the composer, then the card comes into focus
at its end (blur, scale and offset toward the composer, 280ms after a 90ms
delay). Neighbours glide to keep the stack centered. Closing plays the card back
toward the composer, then leaves a chip on the same thread. Reduced motion (OS or
`config.reducedMotion`) removes the animation and the glide.

A panel attaches on its first supplied activity and stays open after
completion, Stop, focus loss and later requests. Closing leaves its chip, returns
focus to the chip and never stops execution; the chip reopens the card and moves
focus into it. A closed panel never reopens on its own. There is no row of
trigger buttons under replies.

The latest reply’s panels are attached. Each reply keeps its own panel choices.
An earlier reply shows **Show activity**, which reattaches its panels (with its
closed panels still closed) and moves focus to them. Stop cancels the fixture and
ignores late events. Finished agents stay finished, a running agent stops,
and unresolved input requests cease waiting after Stop. Language changes preserve
the draft, settings, activity and choices.

## Effort and task progress

The model and effort sit in the composer's top row, on the tray, as in the
reference: the model at the start, effort at the far end. Effort is a compact
meter, the level's name beside a 64×12px four-segment track. Dragging anywhere on
the meter moves the fill with the pointer, the name changes as each stop is
crossed, and release settles on the nearest stop. The names share one grid cell,
so the widest sets the width and nothing jumps. A native range underneath carries
the keyboard (arrows, Home, End; mirrored in RTL), the accessible name and value,
and the tradeoff as its description and hover title. The model and effort are
frozen for the current run; later choices do not rewrite an earlier request's
settings.

| Level    | Color | Example-local alias                              |
| -------- | ----- | ------------------------------------------------ |
| Quick    | Sage  | `--effort-quick` → `--chart-sage`                |
| Balanced | Blue  | `--effort-balanced` → `--chart-blue`             |
| Deep     | Ochre | `--effort-deep`: light `#89621f`, dark `#e7bd76` |
| Thorough | Plum  | `--effort-thorough` → `--chart-plum`             |

These tier meanings are independent of success, warning and error. No global
palette or public token was added. The meter's segmented fill shows the selected
level; there is no decorative gradient. A public effort component would need
a documented tier-color policy and capability mapping for the selected model.

Three agents each do one thing: the explorer traces the signup flow, the analyst
reads the test notes at the same time, and the reviewer starts once both report,
checks the way back and ranks the advice. The sample run lasts about 26 seconds. Khayt first plans
for 2.5 seconds: the reply reads «Planning the review · 2s» and no panel opens.
Then the explorer starts, the analyst 0.8s later, and each tool panel a beat
after its agent; the reviewer starts once both report (explorer 6.0s, analyst
9.2s, reviewer 14s). Each agent reports what it is doing along the way, and
Reading, Research and Checks receive their evidence item by item. Each card has the supplied Khayt
avatar and the agent's role, a status line with its state and elapsed time
(ticking while it runs), the one thing it is doing, and a single 4px line that
fills when it is done and carries a sheen while it runs, never a guessed
fraction. The agents produce the Reading, Research and Checks evidence on the
other side.

Work time comes from host timestamps: each event carries `at`, and the runtime
records when a run and each step started and settled. The reply's line reads
«Worked for 26s · 3 agents» (live status and ticking time while running,
«Stopped after …» after Stop) and opens onto each agent's task with its duration. Durations use
the reader's digits and units (٢٦ث، ٦٫٠ث).

Expandable rows (work log, evidence) end in a plus that folds into a
minus, and open content hangs from a thin thread on the leading edge. Where the
browser can animate to auto height, opening and closing glide.

## Useful activity content

Reading shows the material being consulted and observations. Research presents
source titles and expandable excerpts. Checks presents named outcomes, including
issues found. Each agent card shows the one thing it is doing.
These are supplied evidence records, not folder selectors, permission switches,
raw execution logs or invented reasoning. Error and waiting states retain their
own words and never become a finished task.

The demo replays explicit Nawa sample material after submission. It never reads
files, browses, calls a model or runs an actual agent. The sample output is fixed,
including when a different request is typed. Real apps replace `demo-host.ts` with
their authenticated transport and supply their own evidence, answers, task title,
plan, permissions and cancellation acknowledgements.

## Design-system boundary

Reused public parts: ChatComposer, ChatThreadMessage, ModelSelector,
Button and Tray. Optional Khayt is supplied by the documentation host; copied
example code also runs without mascot/workbench dependencies.

Example-owned parts: the effort treatment, agent cards, activity
panels and chips, rail placement, dock, reply attachment policy and threads. These have not been
promoted to public exports. A reusable ContextualActivity API, compact AgentTask
variant, generic milestone contract and effort tier colors still need separate
library contracts. TaskStarter’s public API is unchanged.

## Verification

Checkout: `/Users/amjedfadul/Tiraz`  
Branch: `codex/agent-composer-study`  
Base: `7b89a52ada798c585742f26ac06fcce503ea26b1` plus this uncommitted revision.

### Composer-hub revision (2026-10-29)

Before: panels were grid items inside each reply. In the 1020px docs frame they
pushed the reply from 463px to 692px during a run, behind the composer; on the
full canvas, Send moved the conversation 369px and the reply moved 58px while
panels filled.

After, measured every 100ms through a full run:

- Full canvas (1392px, RTL): reply held at 535px and composer at 620px from the
  first event until the final answer; the conversation only grew upward when the
  answer text arrived.
- Docs frame (1020px): reply held at 549px, composer at 634px, workspace height
  680px and page scroll unchanged throughout.
- Docs frame at a 1280px viewport (860px): rails at 165px, composer 456px, no
  horizontal overflow.
- Narrow canvas (652px) and phone (375px): dock chips, one card over the
  conversation, no horizontal overflow.

Focused tests cover automatic attachment without focus theft, panels outside the
conversation region, completion retention, chip focus after close and Escape,
reopening with focus, Stop, attaching the latest reply and bringing an earlier
reply back with its choices and focus, the narrow dock, language changes and
attention/error states. Browser checks covered English LTR in dark theme and
Arabic RTL in light theme, close/reopen focus, Show activity, Tab order
(conversation, composer, leading rail, trailing rail), reduced motion
(`data-reduced-motion`) removing card, glide and thread animation, and no console
errors.

Local results: full `npm test -- --maxWorkers=2` **2,045 passed**; 15 focused
workspace, effort and docs tests passed; `npm run build` (pre-existing bundle-size
advisory only), `npm run lint` (no warnings), `npm run format:check` and
`git diff --check` passed. No commit or push was made.

### Effort meter, work time and disclosure revision (2026-10-29)

Browser: a real pointer drag in Arabic moved the meter to «شامل» and focused the
native range; Home and ArrowLeft (RTL) stepped the levels; the top row fits on one
line at 375px with no horizontal overflow. A run showed «Running · 4s» ticking on
the task card, a sheen on the running segment, a pulsing running step, per-step
durations, and «عمل لمدة ٧٫٢ث · ٦ خطوات» / «Worked for 7.2s · 6 steps» after
completion, in Arabic light and English dark. `data-reduced-motion` removed the
sheen, pulse and meter glide. Focused tests cover the meter drag, timestamps,
live and settled times, per-step durations and «Stopped after». Full suite: **2,046
passed in 165 files**; build, lint (no warnings), format and `git diff --check`
passed.

### Agents, Arabic copy and direction revision (2026-10-29)

Three single-task agents replace the single agent task and its milestones. The
composer's empty entry now follows the page direction (it had fallen back to
left-to-right in Arabic); typed text still sets its own. The grey line under the
composer and the disclaimer under the answer were removed. Arabic copy was
rewritten across the example, including a grammar fix («ثلاثة تحسينات»).

Physical touch, screen-reader speech, OS-level reduced motion in a live browser
and a live AI/tool backend are not tested.
