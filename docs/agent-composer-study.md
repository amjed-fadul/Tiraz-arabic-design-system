# Tiraz contextual agent workspace

The current integration is documented in
[agent-workspace-integration.md](agent-workspace-integration.md) and shown on
[Contextual workspace’s own documentation page](http://127.0.0.1:5432/library/contextual-workspace).
This file records the earlier spatial study; its screenshots and verification
below predate the documentation composition and revised effort control.

Preview: <http://127.0.0.1:5432/experiments/agent-composer>
Documentation: <http://127.0.0.1:5432/>

Checkout: `/Users/amjedfadul/Tiraz`, branch `codex/agent-composer-study`.
Base commit: `7b89a52ada798c585742f26ac06fcce503ea26b1`, plus uncommitted study
changes. The experiment introduces no public library API or landing/documentation
layout changes.

## Product direction

The composer stays in one place. Its surroundings respond to the work. This is a
useful pattern for an AI app with several tools, attachments, or delegated agents:
the person writes in one place and can inspect the resources currently being used
without navigating away from their conversation.

Start compact. Context already selected is represented by the small boxed
triggers. Sending a request reveals the relevant tool and the agents that actually
start. One automatic context panel is selected at a time; research and active
agents have separate positions. People can deliberately keep more panels open.
This bounds automatic clutter without making manual inspection restrictive.

| Person or runtime action                | Result                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Click a closed trigger                  | Open and pin its panel until dismissed or unpinned                                                           |
| Tool begins or agent starts             | Reveal the relevant panel when Follow activity is enabled                                                    |
| Another context tool begins             | The automatic context surface follows it; manual pins remain                                                 |
| Focus any control in an automatic panel | Hold that panel while focus is inside                                                                        |
| Edit a control or inspect an agent      | Pin the panel so it cannot move away during inspection                                                       |
| Hover a panel                           | Hold it until the pointer leaves                                                                             |
| Close a panel or press Escape           | Return focus to its trigger and suppress automatic reopening for this run                                    |
| Reopen a dismissed panel                | Clear its suppression and pin it; unpinning can resume following                                             |
| Turn off Follow activity                | Stop automatic reveals; manually opened panels stay                                                          |
| Work finishes                           | Automatic panels settle for 1.8 seconds when the activity set is empty, then fold away unless held or pinned |
| Stop the run                            | Freeze execution state and reject subsequent updates; manual context remains                                 |

Individual completed agents can fold as other work continues. Their result and
steps remain available from Agents. Hiding a panel never cancels a tool, disables a
selected resource, or grants permission.

## Tiraz personality

The supplied reference established useful spatial relationships, not Tiraz's skin.
The current treatment uses the existing **Warp** mark, **Khayt** artwork, IBM Plex
Sans Arabic, and Night loom's dark botanical surfaces / light ivory surfaces.
Sage, blue, ochre, and plum derive from the existing agent swatches. Lighter and
darker UI variants provide contrast in the two themes.

Effort uses the shared source example’s native Tiraz `RadioGroup`, with Quick,
Balanced, Deep, and Thorough visible together. Each option has its own accessible
description; a short helper explains the selected level. Existing action, info,
AI and attention tokens distinguish the choices. There is no dropdown or drag
interaction.

Tools carry restrained category color. Fine thread-like connections carry that
color only while work is active. Agent cards reuse Khayt in the existing agent
colors, with a current action, elapsed time, five explicit demo stages, and a
result. Khayt moves only while working and follows the system's reduced-motion
preference. Idle effort and progress marks remain static. This makes the brand
visible in identity, state, and interaction rather than adding ornamental effects.

## Reference research

[Shawn's agent composer video](https://x.com/zzzzshawn/status/2115270577866842602)
was inspected in the browser and as nine frames from the 91-second clip. The
original local HTML was read for structure and interactions. The author's
[Orbkit](https://orbkit.zzzzshawn.cloud/) and
[Dot Matrix](https://dotmatrix.zzzzshawn.cloud/) supplied context for compact state
visuals; no third-party shader or loader code was copied.

The retained ideas are the stable composer, attached supporting surfaces, nested
folder selection, and small boxed triggers. The principal changes are contextual
reveal, user-owned pins, dismissal precedence, a discrete effort choice, and the
existing brand identity. The study retains a 360px composer and roughly 176px
side panels. On narrow screens the working surfaces reflow below the composer.
The second folder picker becomes inline at 1200px and below.

## Connecting it to a real AI app

The local fixture is replaceable. `activity-runtime.ts` defines the normalized
runtime boundary and rejects updates for stale runs, replayed sequence numbers,
and stopped runs. `useActivityPanels.ts` owns only view preferences. The app owns
execution, settings, persistence, and the final result.

A practical integration has four layers:

1. **Request.** Snapshot the prompt, model, supported effort value, selected
   resources, and permitted tools when sending. Changing the next message's
   settings must not rewrite the running request.
2. **Execution.** The server calls tools and delegates agents. Map actual started,
   updated, completed, failed, and needs-input events to stable activity IDs.
   Do not parse assistant prose to decide whether a tool ran.
3. **Presentation.** Reduce those events into a snapshot and pass it to the panel
   controller. Tool names map to application-owned panel IDs. A research app can
   use sources, documents, and a research agent where this coding example uses
   repository, folders, and a builder.
4. **Outcome.** Render the actual answer, citations, files, or proposed changes in
   the conversation. Keep the activity panels as supporting evidence and controls.
   Completing an animation is never evidence that work succeeded.

The AI SDK exposes typed tool parts with input, output, failure, and approval
states; it also supports custom data parts for app-owned activity. These can feed
an adapter without making the model invent interface commands. See the official
[tool lifecycle guide](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage) and
[custom data streaming guide](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data).
OpenAI's [typed streaming events](https://developers.openai.com/api/docs/guides/streaming-responses)
provide another source for an application adapter. The application's execution
layer must distinguish a requested function call from work actually starting.

Example normalized update (illustrative server data):

```ts
const next = applyActivityEvent(previous, {
  type: "activity.changed",
  runId,
  sequence: 12, // monotonically ordered by the server within this run
  activity: {
    id: toolCallId,
    panel: "folders",
    status: "running",
    label: ["Read selected files", "قراءة الملفات المحددة"],
    detail: ["src/composer", "src/composer"],
  },
});
```

Start a run with an explicit application-owned `run.started` intent. Reconnecting
requires restoring the authoritative current snapshot before accepting later
ordered events. An unresolved error or needs-input activity takes precedence over
a newer completed call on the same panel. Showing a needs-input state does not
implement an approval workflow: connect a real Tiraz ApprovalCard or
AskUserQuestions surface and wait for the server to acknowledge the decision.

The four effort names are product labels, not universal API enum values. The host
must provide the selected model's supported levels and map them to that provider's
current options. Hide unsupported choices. Do not imply a guaranteed speed, cost,
or quality improvement. Real progress should use known completed stages; without
a known total, use status and elapsed time instead of fabricated percentages.
Cancellation requires a server acknowledgement; this local demo can stop
synchronously because it has no external execution.

## Implemented and remaining

Implemented: contextual panel policy, manual pins, per-run dismissal, keyboard and
pointer holds, focus restoration, colored effort control, RTL/light/dark layouts,
normalized events, late-event rejection, tool receipts, and a scripted example
that exercises the same event boundary.

The demonstration makes no model calls, repository reads, web searches, file
changes, or external submissions. `demo-activity.ts` and `useDemoRun.ts` deliberately
own the scripted events and timestamps. A production host still needs transport,
authenticated tools, persistence/reconnection, model capability mapping, real
agent identities/steps, approval surfaces, and actual output rendering. This is
an experiment to validate the interaction, not a published drop-in agent runtime.

## Verification

Browser inspection on the user's Mac covered:

- Desktop at 1322×826 CSS pixels and phone at 320×826, with no horizontal overflow.
- Arabic and English, light and dark themes, and the mirrored desktop composition.
- Native pointer dragging from Balanced to Thorough, keyboard Home/End/arrows,
  effort-choice focus and Escape restoration, and reversed RTL arrow behavior.
- Real Arabic text with Shift+Enter; the submitted text retained its newline.
- Automatic tool and agent reveals while focus stayed in the composer.
- An automatic panel's close control retaining focus across a tool transition,
  then Escape returning focus to the original trigger.
- Reduced motion with computed panel transition `0s` and wire animation `none`;
  hiding panels moved the composer's anchor by zero pixels on both axes.

Saved captures:

- [Contextual activity with Khayt](/Users/amjedfadul/.codex/visualizations/2026/10/28/01a183ed-5a88-7ec0-a7ff-7255a2100d03/composer-contextual/contextual-running.jpg)
- [Desktop effort choices](/Users/amjedfadul/.codex/visualizations/2026/10/28/01a183ed-5a88-7ec0-a7ff-7255a2100d03/composer-contextual/effort-desktop.jpg)
- [Arabic phone effort choices](/Users/amjedfadul/.codex/visualizations/2026/10/28/01a183ed-5a88-7ec0-a7ff-7255a2100d03/composer-contextual/phone-ar-effort.jpg)

Physical touch-device behavior, live backend execution, and screen-reader speech
have not been tested. Accessible names, focus, native inputs, and the browser
accessibility tree are inspected directly.

Final local verification on 2026-10-29, against the base commit above plus the
current uncommitted changes:

| Command                                         | Result                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npx vitest run src/experiments/agent-composer` | 19 tests passed                                                                                         |
| `npm test -- --maxWorkers=4`                    | 2,030 tests passed across 162 files, including generated example compilation and package release checks |
| `npm run build`                                 | Package runtime, declarations, editable source, registry, TypeScript, and website built                 |
| `npm run lint`                                  | Passed without warnings                                                                                 |
| `npm run format:check`                          | Passed                                                                                                  |
| `git diff --check`                              | Passed                                                                                                  |

The initial default-worker full run hit the package release suite's 30-second
build setup timeout. Two subsequent complete runs with four workers passed; the
final run includes the focus, restoration, priority, and render-timing fixes.
No checks were weakened or skipped. The build retains its large-chunk advisory;
tests retain two jsdom navigation notices.

The documentation and experiment routes both respond with HTTP 200. Their Vite
server remains running on port 5432. No commit, push, publication, or merge was
performed.
