# AffectUI components: research for Plan 5

**Date:** 21 October 2026 · **Branch:** `claude/woven` · **Feeds:** Plan 5 (`…-woven-5-wave-2.md`)
**Asked by Amjed:** "try to also implement these or improve our own".
**Pages:** AffectUI's AI Answer, Thinking State, Usage Meter, Agent Inbox, Agent Lanes, Agent Steering and Agent Tree. AffectUI is used here for behaviour and features only. Nothing below copies its visuals, copy or code.
**Tiraz side:** `src/system` source and the [AI task patterns spec](../specs/2026-10-18-ai-task-patterns-design.md), §8–13.

## How this was checked

- WebFetch returned only the site title, because the pages render in the browser. So each page was loaded with Playwright. I read its rendered text, accessibility tree and props table, then used the live demo: hover, click, keyboard, Escape, the switches, approve, retry, steer and fold. A small observer logged every change to the live regions.
- To test direction, I forced `dir="rtl"` on each demo. The demo text stays English, so only the structural results count: rails, axes, chevrons and signs. The order of English words in an RTL box doesn't count.
- The screenshots are in the session scratchpad, not in the repo. The Agent Lanes and Agent Tree demos run on a fast clock.

## What all seven share

**Good, and Tiraz already does it:** labelled regions, `aria-expanded` disclosures whose closed panels are inert, reduced motion, controlled and uncontrolled pairs, "when to use" notes, and a summary written for coding agents.

**Weak, or wrong for an Arabic-first system:**

- **They move on their own.** Thinking State reveals its steps on its own timer, and AI Answer streams at its own word rate. When no handler is passed, Agent Inbox and Agent Lanes change a task's status themselves. Tiraz forbids all of this: the host owns state, and a missing handler means no action (spec §5, §8).
- **Physical layout breaks in RTL.** When the text flips, the step rails, tree connectors and lane time axis stay on the left. Chevrons don't mirror. Signs move to the other side of the number: a "+1" chip reads "1+", and a "−25m" tick reads "25m−". Spec §15 bans signs next to digits for this reason.
- **Digits and agreement.** Every number uses Latin digits, with no locale. Counts are strings joined without plural rules, and the English already breaks ("1 need you", "1 task need you"). Arabic's six plural forms and gender agreement would break everywhere.
- **Some states are shown by colour alone.** A failed lane block is a red tint, with no glyph or word on screen. On Usage Meter's small limit meters, "nearly full" and "full" differ only by dot colour. Agent Steering gives done and pending steps no state word, not even a hidden one.
- **Some live regions are noisy.** Agent Tree's live summary includes a running cost, which in the demo changed about ten times a second. Usage Meter's hover readout is a live region, so moving the mouse makes the screen reader speak. Thinking State makes its whole step list live. AI Answer and Agent Steering get it right, with one sentence per change of state.
- **Decision safety.** In Agent Lanes and Agent Tree, opening an approval puts focus on Approve, even for rotating production keys. Enter opens the approval, and a second Enter approves it unread. Agent Tree also offers only Approve and Reject for an either/or question.
- **State names.** Their statuses map onto Tiraz's six (waiting → needs you, queued → idle). The exception is "paused", which Agent Steering paints amber, the colour Tiraz reserves for needs you.

---

## 1. AI Answer → Cited answer · إجابة موثّقة

**For.** An answer that shows where each claim came from.

**Anatomy and states.**
- The question is the title. Under it is a row of source cards that scrolls sideways; each card has the app icon, app name, number and title.
- A status line moves from reading N sources, to writing, to answer.
- In the answer, each claim carries an inline chip named after its source's app, with "+N" when the claim cites several sources.
- Follow-ups appear as rows with chevrons.
- The footer holds copy, regenerate, helpful and not helpful, plus the time taken.
- States: reading, writing, done, and stopped (the partial answer stays). Its API has no failed state.

**Interaction and keyboard.**
- Tab moves through the cards, chips, follow-ups and actions.
- A chip shows every source behind it on hover or focus, and Escape closes that preview. The docs say a tap opens the preview on touch screens.
- Hovering a chip lights up its source cards, and hovering a card lights up its chips.
- "Not helpful" opens four reasons; picking one shows a thank-you. Copy hands the host plain text with a numbered list of the sources.
- The answer is marked `aria-busy` while it streams. One polite region announces stopped, done (with the time), copied, and the feedback steps.

**Motion.** Cards pop in one by one. Words fade in from a light blur, chips pop in, and a pulsing dot marks where the text is still growing. The card glides to its new height. With reduced motion, the answer appears at once.

**Worth adopting.** Grouped markers, one tap to preview on touch, and copy with numbered sources.

**Weak or wrong for us.**
- Chips named after brands drop Latin app names into Arabic sentences, and they get long.
- In RTL the chip's "+1" flips to "1+", and the follow-up chevrons don't mirror.
- The component sets the text's pace itself.
- The done announcement includes a duration.

**Tiraz today.** CitedAnswer already does this job, and more strictly:
- Streaming is driven by the host, through StreamingText's word spans.
- Chips are numbered in the reader's digits. The preview stays open while the pointer is on it, keeps focus on the chip, and closes on Escape.
- The cited row is marked when the sources list is open.
- ThinkingPanel shows the search, and FeedbackBar offers the same four reasons.
- There is a failed state with Try again. One region announces each change, never the answer's text and never the time.

Three gaps showed up in the comparison:

- Markdown turns only `[n]` with ASCII digits into a chip. `[1,3]`, `[١]` and `[٢، ٣]` print as raw text; I checked this, because JavaScript's `\d` matches only 0–9.
- On touch, tapping a citation that has a link leaves the page at once (CitationPreview ignores touch on purpose). A phone user can't check a source without leaving the answer.
- FeedbackBar's `onCopy` receives nothing. So every host has to rebuild the text, and the `[n]` markers lose their sources.

**Recommendation: improve ours** (Markdown, Sources, FeedbackBar, CitedAnswer). Size S.

1. **Markers in any digits, single or grouped.** Markdown reads `[n]`, `[n,m]` and `[n، m]` written in ASCII, Arabic-Indic or Persian digits. A group renders as adjacent chips, and `renderCitation` is still called once per number. *Why:* Arabic answers drift into Arabic digits and the Arabic comma, and today those markers show up as raw brackets.
2. **Tap to preview.** In `mode="preview"`, a tap opens the preview, which holds «فتح المصدر» / Open source, the way `mode="disclosure"` does, instead of leaving the page. *Why:* on a phone, checking a source shouldn't mean leaving the answer.
3. **Copy with sources.** `onCopy(text)` receives the answer, followed by its numbered sources under «المصادر» / Sources, with safe links and the reader's digits. The argument is additive, so hosts that ignore it keep working. *Why:* a pasted answer keeps its evidence.

**Not adopted.** Source cards above the answer: Tiraz keeps cited sources folded behind the meta count, and sideways scrolling hides cards. Brand-named chips. `aria-busy`: Tiraz's region never reads the text anyway.

**With Wave 2.** DataAnswer reuses all three. Its explanation can cite tables with `[n]`, and its copy should carry «كيف حُسب هذا؟» the same way. DecisionInbox, DraftReview and AssistantControls aren't involved.

---

## 2. Thinking State → Thinking panel · يفكّر

**For.** Showing what the assistant does while it works: searching, reading, drafting.

**Anatomy and states.**
- A header row holds a small animated mark, the label (with a shimmer), a live timer and a chevron.
- Below it is a timeline:
  - a "searched" row with source chips: the first four, then "+N more";
  - steps that appear one by one;
  - a final "finished" row with a check.
- When done, the label changes to "worked for N seconds". There is no stopped or failed state.

**Interaction and keyboard.** The header is a disclosure that opens with Enter or Space. Only the steps fold; the header stays. Tab reaches each source link, which shows its domain in a tooltip on hover or focus. "+N more" reveals the remaining sources and becomes "show less".

**Motion.** The label shimmers and the mark twinkles. Steps fade up while the rail grows to each node. Chips pop in, the active step pulses, and the final check draws itself. With reduced motion, nothing animates.

**Worth adopting.** The expandable "+N".

**Weak or wrong for us.**
- It runs on its own clock. All the steps are passed in at once and revealed every 1.3 s, with an optional loop and a done callback. That is simulated progress.
- The whole list is a live region, so every step and chip is read aloud.
- The header button's accessible name includes the ticking time.
- In RTL the rail stays on the left, cut off from its nodes.

**Tiraz today.** ThinkingPanel is built on ThinkingState's disclosure and follows ThinkingIndicator's label rules. It already has the same parts:
- the AI mark, the label, the elapsed time (hidden from screen readers) and a chevron;
- «بحث في» chips that arrive one by one;
- steps with StatusIcon and hidden state words;
- the thread line.

It is driven by the host and announces one stable label. Two gaps:

- The «+٤» after the first three chips is plain text. The other sources searched can't be seen anywhere.
- *Found in our code, not through AffectUI:* when the answer stops or fails, CitedAnswer passes `completed` to the panel. So stopping during the search folds the panel to «فكّر لمدة ٦ث», and the thread closes into the solid line that means done.

**Recommendation: improve ours** (ThinkingPanel, CitedAnswer). Size S.

1. **«+N» becomes a button.** It shows «+٤», is named «عرض كل المصادر» / Show all sources, and has `aria-expanded`. It reveals the remaining chips, then reads «عرض أقل» / Show fewer. The revealed chips don't animate in. *Why:* every source searched should be checkable, and today the rest are hidden for good.
2. **`status` gains `stopped` and `failed`.** Their labels are «أُوقف بعد ٦ث» / Stopped after 6s and «تعثّر بعد ٦ث» / Failed after 6s, and the thread stays still instead of closing. CitedAnswer passes them when the answer stops or fails before it starts writing. *Why:* the closed line means done (spec §10), and a stopped search shouldn't show it.

**Not adopted.** The timed reveal, the loop and the done callback. The live step list. The final "finished" row: the folded label already says so. Domain tooltips: SourceChip is a link, and the domain can go in its meta.

**With Wave 2.** DataAnswer's thinking state uses the same panel, searching tables instead of documents, so it gets both fixes at no extra cost.

---

## 3. Usage Meter → Context meter · السياق

**For.** Plan usage on a billing page. It shows the credits used this cycle, what they went into, the plan limits, and an upgrade prompt near the limit.

**Anatomy and states.**
- A title with the plan and the reset date, with the full date on hover.
- A period switch.
- The large number, shown as "of total", with a share tag.
- A stacked bar by category, with a legend giving each value and share.
- A daily sparkline (days still to come show as stubs) and the daily average.
- Thin limit meters, such as seats and storage; an unlimited one sits on a striped track.
- A footer with the credits left and a button.
- States: normal; warn, which starts at 80 % and is amber; and limit, which is red. At the limit the footer says so, and the button switches to an "add credits" label and turns dark.

**Interaction and keyboard.**
- The period switch is a radio group with arrow keys.
- The bar and the sparkline take focus, and the arrow keys step through categories or days. Escape hides the readout.
- Hovering a part dims the others and highlights its legend row.

**Motion.** On first view the bar fills from zero and every number counts up. Changing the period makes the highlight glide, the numbers roll and the parts resize. Near the limit the tag changes colour, a dot pops in and the button nudges.

**Worth adopting.** A share for each part, a next step at the limit, and one announcement when a threshold is crossed.

**Weak or wrong for us.**
- It's billing, not an AI task.
- In RTL the sparkline mirrors, so time runs right to left. Tiraz's charts keep time running left to right (spec §12.8).
- The hover readout is a live region, so moving the mouse makes the screen reader speak.
- The numbers count up on mount, but Tiraz animates a value only after it changes.
- Numbers are formatted in English only.

**Tiraz today.** ContextMeter shows the context window, not credits. It has:
- a ring trigger reading "used / capacity";
- a status word once the configurable thresholds are passed;
- a popover listing the parts.

It is a part of Start a task and of Assistant controls. It shows no shares, offers no action, and announces nothing.

**Recommendation: improve ours** (ContextMeter). Size S. Don't build a billing usage card. It isn't a task pattern, and a host that needs one can compose Progress and Charts.

1. **Shares and a bar in the details.** Each part shows its share («٣٢٪»), end-aligned. A thin bar sums the parts in tints of one hue, and each segment is also named in the list beside it. *Why:* people can see what fills the context and what to remove.
2. **`action?: { label: ReactNode; onSelect(): void }`.** It appears once the meter is filling up, for example «لخّص المحادثة» / Summarize the conversation or «ابدأ محادثة جديدة» / Start a new conversation. *Why:* the warning comes with a way out.
3. **Announce each crossing once.** When the status word changes («يقترب من الامتلاء» → «شبه ممتلئ» → «تجاوز السعة»), one polite region says it once. In the composer that is TaskStarter's region; on its own, ContextMeter takes `announcement="polite"`. *Why:* today the warning is only visible, so a screen-reader user isn't told during a long conversation.

**With Wave 2.** All three land in AssistantControls' "Context and usage" section (spec §13.4), which Plan 5 builds. The prerequisites that section lists, `thresholds` and a controlled `open`, are already in the code. DataAnswer, DecisionInbox and DraftReview don't use the meter.

---

## 4. Agent Inbox → Decision inbox · صندوق القرارات (planned, §13.2)

**For.** All of an agent's background tasks in one calm place: what finished, what failed, and what waits for you.

**Anatomy and states.**
- A title and a Board/List switch.
- Three groups with counts: Needs you (waiting and failed tasks), Running and Done.
- Each card shows:
  - a mark in the status's colour and the title;
  - a two-line description;
  - a status line with a live clock;
  - the number of sources read and of tool calls.
- An open card adds the model, the last few steps as a small timeline with relative times, and the actions that apply now:
  - Reject and Approve (waiting);
  - Retry (failed);
  - Open (running or done).
- Statuses: running, waiting, done and failed.

**Interaction and keyboard.**
- Each card is a disclosure button. Enter or Space opens it, and Escape closes it and returns focus to it. Closed details are inert.
- Board/List is a radio group.
- One polite region says how many tasks need you and how many are running.
- Below about 620 px wide, the board turns into the list.

**Motion.** Running cards spin a ring, and their clocks tick. When a status changes, the card first shows its new state where it is, then glides to its new group. Cards open where they are.

**Worth adopting.**
- Failed tasks sit with the ones that need you.
- Rows open to show their last steps and the actions that apply now.
- A row changes where it is first, then moves.
- Escape returns focus to the row.

**Weak or wrong for us.**
- Without handlers, the board changes statuses itself: approving makes a task run, and retrying restarts its clock.
- The source and tool counts are bare numbers with only a `title` attribute, so each card's accessible name ends in "9 14".
- The count sentence breaks agreement ("1 need you").
- In RTL, the open card's step rail stays on the left.
- The board needs width, and it mirrors awkwardly.

**Tiraz today.** Not built yet. Spec §13.2 plans the same job:
- tabs «الكل، بانتظارك، يعمل، اكتملت»;
- rows with quick decisions inline, which open into the full Approval request or Clarifying questions;
- no "approve all";
- a 5 s receipt before a resolved row moves.

**Recommendation: improve ours.** Agent Inbox extends DecisionInbox rather than replacing it; fold these in before Plan 5 builds it. Size M, on top of the planned build.

1. **Failed tasks wait on you too.** They sit in «بانتظارك» with the «تعثّرت» pill and «أعد المحاولة» / Try again (`onRetry(id)`). *Why:* §13.2 doesn't say where failed tasks go, and a failed task blocks on the person just as a question does.
2. **Rows open to their last three or four steps.** Each step shows its StatusIcon, a hidden state word and a time the host formats («قبل ٤ د»), above the actions that apply now. Running and done rows offer «افتح» / Open (`onOpen(id)`). Reuse TaskRows' disclosure, which keeps closed rows inert and returns focus to the trigger. *Why:* people see what led to a request without leaving the inbox.
3. **Quick decisions only for reversible requests.** A row decides inline only when its `ApprovalDetails` sets `reversible`. Otherwise it shows «راجع» / Review, and the decision happens in the full Approval request, with its impact list and its note that the action can't be undone. Opening a row never puts focus on Approve. *Why:* when Agent Lanes and Agent Tree focus Approve, two presses of Enter approve a request unread. Spec §8 says a repeated key must never approve a request unread, and a one-line row hides the impact.
4. **Focus survives a move.**
   - When a row leaves its tab after its receipt, focus goes to the next row, or to the tab panel, never to the page.
   - Escape folds an open row and returns focus to it.
   - The move uses the "change where it is, then move" order. It doesn't glide under reduced motion, or when a keyboard action started it.
   - The 5 s receipt is a UI timer, so the host can turn it off (spec §5).

   *Why:* rows move on their own, and keyboard users must not be dropped.
5. **One count sentence, with agreement.** The region speaks only when the counts change: «طلبان بانتظارك · ٣ مهام تعمل» / 2 requests need you · 3 tasks running. The shared count helper gains طلب (m) and مهمة (f). *Why:* this is the exact sentence AffectUI gets wrong, even in English.
6. **Drafts can wait here too.** A draft «بانتظار مراجعتك» is a row whose «راجع» calls `onOpen(id)`, and the host opens DraftReview. The inbox doesn't embed it. *Why:* one place for everything that waits on you, without a third pattern inside the row.

These additions, in sketch form. §13.2 gives no API yet.

```ts
// Each item gains:
status: "needs-you" | "running" | "failed" | "completed";   // failed items sit under «بانتظارك»
steps?: { id: string; label: ReactNode; state: TaskState; time?: ReactNode }[]; // the last 3–4, oldest first
approval?: ApprovalDetails;   // `reversible` allows the quick decision inline; otherwise «راجع»
context?: ReactNode;          // one line: «ضمن إقفال حسابات أكتوبر», «من وكيل المالية»
// The pattern gains:
onRetry?(id: string): void; onOpen?(id: string): void;
agents?: { id: string; name: ReactNode; state: StatusPillState }[];  // section 6
agent?: string | null; onAgentChange?(id: string | null): void;
```

**Not adopted.**
- The board layout: tabs are enough.
- Clocks inside the component: the host passes `elapsed`.
- Bare counts: use words from the count helper, or leave them out.

**With Wave 2.** This *is* DecisionInbox. It also feeds the Dashboard's header button, whose count is «بانتظارك», failed tasks included. Item 6 ties it to DraftReview. Section 6 adds an agents strip. Requests from sub-agents (section 7) arrive here with their parent task named.

---

## 5. Agent Steering → Agent task's steering · مهمة الوكيل

**For.** Correcting an agent while it runs, without stopping it.

**Anatomy and states.**
- The header shows the title, the agent with "step N of M", a status with a live clock, and Pause/Resume.
- Each step in the plan shows a done, active or pending icon and its duration.
- A "queued for the next step" section shows a count. Each queued note offers Now and Remove.
- A text field sits under hints for its keys: Enter for the next step, Cmd or Ctrl+Enter to interrupt now.
- Notes the agent has taken in sit under their step, marked "Picked up" or "Interrupted". A note can rewrite its step's title.
- The run is running, paused or done. When done, the field closes and a line says the queued notes weren't used.

**Interaction and keyboard.**
- In the field, Enter queues a note, Cmd or Ctrl+Enter interrupts, Shift+Enter adds a line, and Escape clears the text.
- Tab reaches Pause, each note's Now and Remove, and Send.
- The region announces a note being queued, an interruption, and each note the agent picks up.

**Motion.** A note the agent takes in glides from the queue into its step and lights up. The card's height follows its content. The active step spins and shimmers, and done steps pop in their check.

**Worth adopting.** Taking back or pushing a queued note, saying which notes were never used, and announcing both the queue and the pickup.

**Weak or wrong for us.**
- Step states exist only in `aria-hidden` icons, plus `aria-current` on the active step, so done and pending have no words.
- Paused is amber, the colour Tiraz reserves for needs you.
- In RTL, the rail stays on the left, cut off from the steps.

**Tiraz today.** AgentTask already supports steering:
- The running footer has a field: Enter applies a note at the next step, and Ctrl or Cmd+Enter applies it now, with guards for input methods and held keys.
- Notes appear under their step, with «أُخذ به» once applied and a «↳» that mirrors in RTL.
- Each step has a state word.

Three gaps:
- Queued notes have no actions.
- When the task ends, an unapplied note looks the same as a pending one.
- The region announces only statuses, so submitting a note is silent.

**Recommendation: improve ours** (AgentTask). Size S.

1. **Take back or push a queued note.** A note with `applied: false` reads «بانتظار الخطوة التالية» / Waiting for the next step. It offers «طبّق الآن» / Apply now (`onApplyNoteNow?(id)`) and «إزالة» / Remove (`onRemoveNote?(id)`), each only when its handler exists. Each button's name includes the note, for example «إزالة التوجيه: استثنِ فرع جدة». *Why:* today, fixing a wrong instruction means stopping the task.
2. **Say when a note wasn't used.** Once the task completes, fails or stops, a note that was never applied reads «لم يُؤخذ به» / Not used. *Why:* no one should believe an ignored instruction was followed.
3. **Announce each note once.** The task's existing region speaks at two moments:
   - when a note is submitted: «سيُطبَّق مع الخطوة التالية: …» / Queued for the next step: …, or «يُطبَّق الآن: …» / Applying now: …;
   - when `applied` turns true: «أخذ الوكيل بتوجيهك: …» / The agent picked up: ….

   *Why:* today the field just clears.

**Not adopted.**
- **Pause/Resume.** It would add a seventh state to the six, and most agent hosts can only stop. Stop plus steering covers the need.
- **A separate queue section.** Notes read better under the step they will change.
- **Escape to clear.** Escape belongs to an enclosing dialog and to the approval shown inside the task.
- **The glide.** A fade when `applied` flips is enough.

ChatComposer and PromptEntry need nothing, because in a conversation the task's own footer does the steering.

**With Wave 2.** DecisionInbox's running rows open the task through `onOpen`, where steering lives; the inbox doesn't steer. DraftReview's tone control is its own kind of steering and stays separate.

---

## 6. Agent Lanes → no Tiraz equivalent; agents strip in Decision inbox · شريط الوكلاء

**For.** A live timeline of several agents working in parallel. Each agent has a lane, task blocks grow towards "now", hand-offs are drawn between lanes, and approvals sit on the block.

**Anatomy and states.**
- The header shows counts (running, need you) and the time window.
- The names column shows each agent's avatar, name and model, with an Idle or Needs you tag.
- A time axis of past minutes ends at "now".
- The blocks carry tool logos and are coloured by status: done in grey, running in blue, failed in red, and waiting in amber with a "Needs you" tag.
- Dashed curves show hand-offs.

**Interaction and keyboard.** Tab moves from block to block, lane by lane. Enter opens a dark summary of what got done, with Open. On a waiting block, Enter opens a decision popover instead, holding the question, Reject and Approve. Escape returns focus to the block.

**Motion.** The window slides with the clock, with blocks and curves moving together. Running blocks shimmer, a live hand-off curve flows, and waiting flags pulse.

**Worth adopting.** The one question it answers at a glance: where is every agent right now, and which one waits for you?

**Weak or wrong for us.**
- In RTL the names column flips, but the blocks and ticks keep their physical places and overlap, and "−25m" becomes "25m−".
- A failed block is shown only as red on screen.
- The popover puts focus on Approve, though the demo asks to rotate production keys.
- The English counts disagree ("1 need you").
- Without handlers, it changes statuses itself.
- Tiraz's charts keep time running left to right, so a lane view in an RTL page would need a left-to-right section of its own.

**Tiraz today.** No equivalent. DecisionInbox (planned) and TaskRows group tasks by state, not by agent.

**Recommendation: improve ours.** Add an agents strip to DecisionInbox rather than a lanes component. Size S. A timeline would be L: a time scale, block packing, hand-off curves, a live clock and popovers. The finance story doesn't need one, because three agents and one hand-off read well as a list.

1. **Agents strip.** An optional row above the tabs holds one chip per agent, showing its StatusPill word: جاهز، يعمل، بانتظارك، تعثّر. Picking a chip filters the rows (`agents`, `agent`, `onAgentChange`). *Why:* it answers "where is every agent right now" in reading order and in words, and it doubles as a filter.

The hand-off itself needs no new prop. The row's context line says where the work came from, for example «من وكيل المالية» / From the Finance agent, with names in `<bdi>`.

**With Wave 2.** The strip goes into DecisionInbox, and the Dashboard can show it on its own near its header. If a host later needs a real timeline, build it from the Charts family as a left-to-right section, not as an AI pattern.

---

## 7. Agent Tree → no Tiraz equivalent; delegated steps in Agent task · خطوة مفوَّضة

**For.** Showing which agent started which: an orchestrator and its sub-agents as a live tree, with status, cost and time on every card.

**Anatomy and states.**
- The header shows totals: agents, running, needs you, failed, and total cost.
- The root card sits on top, with its children side by side below and deeper levels hanging under their parent, all joined by connectors.
- Each card shows:
  - an avatar, name and model;
  - a status pill with an icon (running, done, needs you, failed; queued and stopped are muted);
  - tool marks and the task;
  - cost and time;
  - a fold button with the child count.
- Needs you and failed each open a small window, holding the question or error and two answers: Approve or Reject, or Retry or Dismiss.
- Costs add up through each branch. A retried agent appears as a new sibling, and the failed one stays.

**Interaction and keyboard.** Tab moves between fold buttons, and between cards when they are selectable. Enter or Space folds a branch, and Enter selects a card. The header's "needs you" and "failed" chips open the first such agent's window, and Escape closes it.

**Motion.** New connectors draw out from the parent and cards rise in turn. Everything glides when the tree changes. Agents that leave fade out, bottom first. A cost that is still climbing shimmers.

**Worth adopting.** Naming which agent does which part, and keeping the failed attempt after a retry.

**Weak or wrong for us.**
- It uses the `tree` role, but tree items take no focus, and the documented keys are only Tab, Enter and Space (no arrows).
- The totals region includes the live cost, which in the demo changed about ten times a second.
- Its windows put focus on Approve or Retry first.
- An either/or question gets only Approve or Reject.
- In RTL, the connectors keep their physical places and the tool marks overlap the task.
- Costs are formatted in dollars by default.

**Tiraz today.** No equivalent. AgentTask shows one agent's steps, and ToolCall and ToolChips show a step's operations.

**Recommendation: improve ours.** Show the delegation inside AgentTask rather than adding a tree component. Size S. A live tree with measured connectors would be L, and it is a view for whoever operates the agents. In the finance story, the Finance agent hands one step, the reminders, to the Collections agent, and that step can say so itself.

1. **A step names its sub-agent.** `step.agent?: ReactNode` shows «فُوّضت إلى وكيل التحصيل» / Handed to the Collections agent under the title. When that step needs you, the Approval request shown in the step names the agent that asks. *Why:* people see who will act before they approve.
2. **Sub-agent requests name their parent task in DecisionInbox.** The row's context reads «وكيل التحصيل · ضمن إقفال حسابات أكتوبر» / Collections agent · Part of Closing October. *Why:* a request seen without its context can't be judged.

Retries need no new API: the host keeps the failed attempt in the step's detail («المحاولة الثانية؛ تعثّرت الأولى: …»). Costs stay in the meta, supplied by the host (spec §9), and are never placed in a live region. If a host asks for it, the next step is showing the sub-agent's own steps one level deep inside «التفاصيل» (M).

**With Wave 2.** Item 2 is DecisionInbox's context line. If Amjed later wants a standalone multi-agent view, Agent Lanes and Agent Tree should become one pattern, «فريق الوكلاء» / Agent team, not two.

---

## What Plan 5 picks up, by pattern

- **DecisionInbox:** section 4's six additions, section 6's agents strip, and section 7's parent named in the context line. New count nouns: طلب and مهمة.
- **AssistantControls:** section 3's shares, bar, action and single announcement, in "Context and usage".
- **DataAnswer:** gets sections 1 and 2 at no extra cost through Markdown, Sources and ThinkingPanel: markers in any digits, tap to preview, copy with sources, and the «+N» and stopped fixes.
- **DraftReview:** a draft waiting for review shows as a DecisionInbox row that opens the draft.
- **Wave 1 parts, before or alongside Plan 5:** Markdown and Sources (section 1), ThinkingPanel (section 2), ContextMeter (section 3), and AgentTask (sections 5 and 7).

## Summary

| AffectUI component | Nearest Tiraz part | Decision | Size |
| --- | --- | --- | --- |
| AI Answer | CitedAnswer, with Markdown, Sources and FeedbackBar | Improve ours: markers in any digits and grouped; tap to preview; copy with numbered sources | S |
| Thinking State | ThinkingPanel | Improve ours: «+N» shows the rest; stopped and failed labels | S |
| Usage Meter | ContextMeter | Improve ours: shares and a bar, an action near capacity, one announcement per crossing; no billing card | S |
| Agent Inbox | DecisionInbox (planned, §13.2) | Improve ours: extend DecisionInbox (failed tasks under بانتظارك, rows open to their last steps, quick decisions only when reversible, focus kept on moves, counts with agreement, drafts as rows) | M |
| Agent Steering | AgentTask's steering | Improve ours: take back or push queued notes; mark unused notes; announce each note once | S |
| Agent Lanes | None; DecisionInbox | Improve ours: agents strip in DecisionInbox; no timeline | S |
| Agent Tree | None; AgentTask | Improve ours: a step names its sub-agent, and its request names the parent task in the inbox | S |

No new pattern is needed. The work is one M inside DecisionInbox as Plan 5 builds it, five S changes to parts already built, and one S addition to DecisionInbox.
