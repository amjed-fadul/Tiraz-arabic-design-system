# AffectUI screens: research for the ten example screens

**Date:** 21 October 2026 · **Branch:** `claude/woven-p5` · **Feeds:** the ten example screens (not yet planned)
**Asked:** study AffectUI's screens for composition only, then compare them with Tiraz's ten planned screens. Nothing below copies AffectUI's visuals, copy or code.
**Pages:** `affectui.com/screens` lists 13 screens. Each has a docs page and a full view at `/screens/<name>/full`.
**Tiraz side:** `src/system/ai/registry.json`, the Dashboard example (`src/examples/dashboard/Dashboard.tsx`), `ChatApp`, and the finance story (`src/system/ai/examples/finance-story.ts`).

## How this was checked

- The pages render in the browser, so each screen was loaded with Playwright. I read its docs page (when to use, API, accessibility and responsive notes). Then I opened its full view at 1440, 1024, 768 and 390 px, and recorded the landmarks with their boxes, any sideways overflow and a screenshot at each width.
- I used the live demos: menus, tabs, suggestion chips, side-panel toggles, row selection, Approve and Deny, Generate, Run eval and Revoke. These are client-side demo controls, and none of them reaches a real account. A small observer logged every change to the live regions.
- To test direction, I forced `dir="rtl"` on each full view. The demo text stays English, so only the structural results count: which side a panel opens from, arrows, chevrons, switches, chart axes, signs and fractions.
- The screenshots are in the session scratchpad (`…/scratchpad/affectui-screens/`), not in the repo.

## What the thirteen share

- **One frame.** Every screen sits in the same app shell. A 248 px sidebar holds the workspace button, Search and Collapse, then a menu, then a second list (Projects, Pipelines, Agents or Prompts). At its foot are announcement cards, a "getting started" progress card and the account. Each screen brings its own header row inside the page, and there's no app-wide top bar.
- **Breakpoints.** Below about 900 px the sidebar becomes a drawer, opened from a toggle in the page's top corner. Side panels (Agent Chat, Agent Run) hide when the main area is narrower than about 1000 px, and open as a layer over the page. Multi-column content stacks, wide tables keep their width and scroll sideways inside their card, and header actions wrap under the title.
- **AI appears in four screens out of thirteen:** Assistant Home, Agent Chat, Agent Run and Evals. Elsewhere it's only mentioned: agent templates in Onboarding, and an "Agents" usage category in Billing.
- **Good, and Tiraz already does it:** real buttons with labels, toasts announced as a status, and reduced motion. AffectUI's charts can also be read with the arrow keys; Tiraz's charts offer a data table instead.

**Weak, or wrong for an Arabic-first product:**

- **Physical sides.** Flex and grid layouts flip with `dir`, but the parts placed by position don't:
  - the drawer still slides in from the left;
  - the narrow side panels still open on the physical right, over the navigation side;
  - the inset page keeps its 8 px gap on the physical right, so in RTL it touches the left edge.
- **Mirroring.** Back arrows, Continue chevrons, disclosure chevrons and the previous/next arrows don't mirror, and neither do switches. Chart time axes stay left to right.
- **Signs and fractions reorder.** "+12.5%" reads "12.5%+", "−$4,180" reads "$4,180−", and the checklist's "1/4" reads "4/1".
- **Digits and plurals.** Latin digits and English plurals are used throughout ("3 files", "1 tool connected").
- **Letter shortcuts.** They check the typed character, so on an Arabic layout Y and N type غ and ى and do nothing. I checked this on Evals with a key event carrying `code: "KeyY"`. Tiraz's InlineDiff already matches by `event.code`.
- **Decision safety.**
  - In Agent Run, pressing Escape while focus is on Approve denies the request and stops the whole run.
  - The same run let me approve sending a draft whose nine suggested edits were still unreviewed.
  - In Settings, a production API key is revoked at once, with a toast and no confirmation or undo.
- **Overlays that aren't dialogs.** The phone drawer and the narrow side panels don't take focus and don't make the page inert. Escape doesn't close the side panels. Closing the drawer with Escape drops focus to the page body.
- **The demo runs itself.** Agent Run plays its own simulation by default (`autoRun`). In Tiraz the host owns state (AI patterns spec §8).

---

## AffectUI's thirteen screens

### 1–2. App Shell Flat and App Shell Inset

**Job.** The frame every other screen sits in: navigation beside a page.

**Regions and narrow widths.**
- The sidebar is described under "One frame" above.
- **The page.** Inset draws it as a rounded card 8 px off a grey canvas. Flat runs it edge to edge behind a hairline. The two take the same props and page classes, so one can replace the other without touching the screens inside.
- **At 1024 px** only the page narrows.
- **Below 900 px** the sidebar moves off-screen. A toggle appears in the page's top corner and opens it as a drawer over a dimmed page.
- **At 390 px** the Inset card keeps a 6 px rim.

**Components.** Navigation list, menu buttons, dismissible notice cards, a progress card and an account menu.

**AI.** None in the frame itself; "New chat" is the first menu item.

**Worth adopting.**
- Build the frame once, so each screen is only a page. The two surface styles are one swap apart.
- Setup progress lives in the sidebar's foot, so a skipped onboarding stays one click away.

**Wrong for us.**
- In RTL the drawer still comes from the left, and the Inset gap stays on the right.
- The drawer doesn't take focus or make the page inert. Escape closes it but drops focus to the body instead of returning it to the toggle.

### 3. Assistant Home

**Job.** Start a request from an empty page.

**Regions and narrow widths.**
- The page holds a centred 672 px column.
- The column has a greeting heading and a prompt box. Under the text sits a tools row: add file, a Plugins menu, an "Auto" mode menu that picks a model, dictate and send.
- A strip under the box says where the work happens: work in a folder, and connect apps with app icons.
- Seven suggestion chips follow, and "Invite people" sits at the page's top end.
- At 390 px the column fills the width, the greeting wraps to two lines, and the chips wrap into centred rows.

**Components.** A composer with tools, two menus of radio items, and chips.

**AI and handback.**
- A chip sends its text at once, and the page turns into the conversation in place. The greeting and chips go, and the question shows as a bubble.
- A "Thinking" disclosure lists steps as they happen, then folds to "Worked for 3s".
- The answer ends by offering a short, shareable report. The box docks at the bottom as a reply box, which is how control returns.

**Gaps.** While it thinks there's no Stop; Send is only disabled. The answer names a folder but shows no sources, and it has no copy or retry.

**Worth adopting.**
- The change from start page to answer happens in place, without navigation, and the question stays on screen.
- The answer ends with one concrete next step, which the reply box can accept.
- The strip under the prompt says where the work will run.

**Wrong for us.** Nothing structural beyond the frame: the column and the chips flip cleanly. A chip that sends before the person can edit it is a product choice, not an RTL issue. The missing Stop is the real gap.

### 4. Folders

**Job.** Find and manage folders and file templates.

**Regions and narrow widths.**
- A page header has a title and a one-line description.
- Two sections follow, and each has its own toolbar: tabs, a sort toggle, a grid/list radio (folders) or a type filter (templates), search, and a primary button.
- The cards sit four across.
- At 390 px each toolbar breaks into rows. The tabs come first. The sort toggle, view switch and button share the next row. Search takes a full-width row of its own. Folder cards drop to one column and template cards to two.

**Components.** Tabs, a segmented radio, search, a sort toggle, and cards with large previews.

**AI.** None.

**Worth adopting.**
- Each section owns its toolbar, and at phone width the search gets its own full row instead of shrinking.
- The sort toggle is named by what it does next ("sort Z to A").

**Wrong for us.** Counts are English strings ("Shared · 3 files"), so Arabic needs the plural helper and gender agreement. An "A to Z" label needs an Arabic equivalent. Structurally there's nothing beyond the frame.

### 5. Folder

**Job.** Look inside one folder.

**Regions and narrow widths.**
- A breadcrumb bar runs across the top of the page, with a back link under it.
- The title row has the folder icon, then a More menu, Share and a primary Upload at the end.
- A grid of file cards follows; each card shows a preview, the name, the type and a relative time.
- At 390 px, Share and Upload drop under the title with More at the row's end, and the grid goes to two columns.
- The docs mention an empty state, but none of the demo's four folders is empty.

**Components.** Breadcrumbs, back link, menu, buttons and cards.

**AI.** None.

**Worth adopting.** The title row: secondary action, then primary, then an overflow menu at the end. Customer profile can reuse it.

**Wrong for us.** In RTL the back arrow still points left, which there means forward. A breadcrumb and a back link together is double navigation; one is enough.

### 6. Integrations

**Job.** Browse a directory of apps and connect them.

**Regions and narrow widths.**
- A header leads to a toolbar: tabs (All, Connected, Available), search and Request. The docs call it sticky.
- Sections follow, one per category.
- Rows sit in two columns. Each has an icon, the name, a verified mark, a one-line description cut with an ellipsis, and a square connect button. Connected shows as a filled check.
- The longer categories end with an overflow row ("…and 2 more").
- At 390 px the rows drop to one column, and search moves under the tabs at full width.

**Components.** Tabs, search, list rows and icon buttons.

**AI.** Only in the description: connected tools are used from the chat.

**Worth adopting.**
- Group the directory by category, and end each group with an overflow row instead of showing everything.
- Onboarding's version of the same row is better: it puts a "Connected" tag beside the name.

**Wrong for us.**
- "Connected" is shown only by a filled icon. The button's accessible name says Disconnect, but no visible word does.
- The overflow chevron doesn't mirror.

### 7. Agent Chat

**Job.** Talk to an orchestrating agent and fill in the brief it will act on.

**Regions and narrow widths.**
- **Frame.** The menu is Home, Chat, Analytics, Plan, Deliverables and On Slack, followed by a Tools list and a Chats list.
- **Conversation column.**
  - A header holds the chat's title as a breadcrumb, an options menu, Tasks and the panel toggle.
  - Then come the messages and the composer.
  - Above the composer a line names who receives the message: the orchestrator.
- **Brief panel.** It is 400 px wide at the inline end.
  - Its header has a breadcrumb and a close button, and tabs switch between Brief, Assets and Activity.
  - The Brief tab holds a product card and the selling angle as a radio group with signal bars. Audience chips, channel switches, palette swatches and formats follow, then a definition list (launch, budget, markets).
  - A sticky footer shows a count and a time estimate beside Generate.
- **Narrow widths.** At 1024 px (a 768 px main area) the panel is hidden, and the toggle opens it as a layer over the chat. At 390 px that layer takes the full width.

**Components.** Messages, chips, the composer, tabs, radio cards, switches, swatches, a definition list, and a primary button with an estimate.

**AI and handback.**
- The orchestrator asks the one thing it can't infer, and offers the answers as a radio group in the brief. The person sets the brief and presses Generate.
- The button reads "Generating…", then the panel switches to Assets with six results, each labelled with its format and channel.

**Flaws.**
- Changing the angle in the brief doesn't touch the chat, which still shows the old answer, so one decision has two places.
- Nothing in the chat records that the generation ran.
- "Worked for 3m 38s" and the agent chips look clickable, but they aren't.

**Worth adopting.**
- The decision is made in the brief beside the chat: the chat explains, the panel decides.
- A count and an estimate sit next to the primary action ("6 ads · ~2 min").
- An addressee line above the composer.

**Wrong for us.**
- In RTL the narrow layer still opens on the physical right, over the navigation side.
- The layer isn't a dialog: Escape does nothing, and focus stays on the toggle.
- The disclosure chevron and the switches don't mirror.

### 8. CRM

**Job.** Edit a list of companies like a spreadsheet.

**Regions and narrow widths.**
- A page header has a breadcrumb with a view menu, and a favourite star.
- A strip shows the open views as tabs with app icons, plus "new view" and "all views".
- A card holds the table's title with undo and redo, then the grid. The grid has a checkbox column and seven columns with icons in their headers. Category and stage are coloured badges, and domains are links.
- The card's footer has Add row and a double-click hint.
- Selecting rows swaps that footer for "2 selected · Delete · Clear", announced as a status.
- At 768 and 390 px the grid keeps its 880 px and scrolls sideways inside its card, and the views strip is clipped.

**Components.** Tabs, a data grid with selection and sortable headers, badges, undo and redo, and a footer that becomes a selection bar.

**AI.** None.

**Worth adopting.**
- The footer turns into the selection bar, so the actions appear where the eye already is.
- Stage is a coloured badge that also carries its word, so colour never carries the meaning alone.

**Wrong for us.**
- Amounts are start-aligned with no currency. Arabic-Indic digits are proportional in Plex Sans Arabic, so figure columns must be end-aligned (spec §15).
- "Double-click a cell" only works with a mouse.
- Dates use English month abbreviations.

### 9. Analytics

**Job.** A revenue dashboard.

**Regions and narrow widths.**
- A header holds the title, a date range, Export and Save as report.
- Four KPI cards follow, each with a label, a value, a delta and small bars.
- The second row puts revenue by channel (a line chart with four series) beside a breakdown list with sparklines.
- The third row has top products (horizontal bars) and two small this-week-against-last-week charts.
- At 1024 px the KPI cards go 2×2 and the large charts stack, with the two small charts still side by side. At 390 px everything but the KPI pairs is one column, and the header's actions wrap under the title.

**Components.** KPI cards, line charts, a list with sparklines, bars and a date range button.

**AI.** None.

**Worth adopting.**
- The charts can be read from the keyboard: the arrow keys move a status that reads each day's values.
- Every figure has a delta beside it.
- The breakdown is a list rather than another chart.

**Wrong for us.**
- In RTL the time axes stay left to right, and the sparklines don't mirror.
- Signs move to the wrong side ("12.5%+", "$4,180−"). Tiraz already anchors Arabic y-axis labels and uses arrows instead of signs.

### 10. Agent Run

**Job.** Follow one agent's run and step in when it needs you.

**Regions and narrow widths.**
- **Frame.** The menu carries a "Runs 3" count and an Agents list.
- **Run header.**
  - A breadcrumb, then a status pill that moves through Running, Needs input, Done and Stopped.
  - The start time and elapsed time.
  - Stop run, which becomes Run again, plus an options menu and the panel toggle.
- **Run column.**
  - A plan card: five steps, each with a detail line, a tool chip and its duration, and a footer such as "Running · 4 of 5".
  - An activity log of numbered steps. Each step folds its tool calls, and each call shows its arguments and result with copy buttons.
- **Side panel (360 px).**
  - "Needs your input": an approval card with the step, the tool, a risk level, the recipient, subject and attachment, and Deny and Approve.
  - "Draft": an inline diff with a counter, previous and next, Reject all and Accept all.
  - "Details": the agent, who started the run, the number of tool calls, and the cost.
- **Narrow widths.**
  - At 1024 px and below the panel is hidden. The header pill says Needs input, and the waiting step in the log gets its own Review link.
  - The toggle opens the panel as a layer over a dimmed run.
  - At 390 px the title shrinks to "P…", and the panel's own heading is clipped.

**Components.** A status pill, a timer, a plan list, tool-call disclosures with code, an approval card, an inline diff and a definition list.

**AI and handback.**
- The plan is editable: rename, reorder with Alt and the arrow keys, delete, add a step.
- The run pauses at its send step for an approval.
- After Approve, focus moves to the receipt ("Approved"), the log says the person approved the step, and the run ends ("Done in 21s").
- The docs give ⌘↵ for approve and Esc for deny.

**Flaws.**
- Escape on the Approve button denied the request and stopped the run.
- The send was approved while the draft it sends still had nine unreviewed edits. Approval and review aren't linked.
- The page has 17 status regions. One 24-second run changed their text 28 different ways, once per tool call as well as once per step.

**Worth adopting.**
- The status pill, the time and Stop / Run again share one header slot that changes with the run.
- When the panel is hidden, the waiting step carries its own Review link.
- A short details list: agent, who started it, tool calls.

**Wrong for us.**
- In RTL the narrow panel opens on the physical right.
- The previous and next arrows don't mirror.
- The diff's Y and N shortcuts fail on an Arabic layout.

### 11. Settings & Billing

**Job.** Workspace, team, plan and API access in one place.

**Regions and narrow widths.** A centred column about 1040 px wide sits under the page title, with tabs for General, Members, Billing and API keys.
- **Billing.**
  - A usage card: the credits used as a large figure; a stacked bar by category with a legend; daily bars with an average; meters for seats and storage; and the credits left beside Upgrade.
  - A current-plan card, and a card for the payment method and billing email.
  - A plan comparison with a monthly/yearly switch.
  - An invoices table with status badges and download buttons.
- **Members.** "5 of 10 seats used" sits beside Invite. Each row has avatar initials, the name and email, a role menu, and a More menu with Remove.
- **API keys.** Masked keys, each with copy and revoke.
- **At narrow widths** the cards stack and the invoices table scrolls sideways.

**Components.** Tabs, meters, a stacked bar, a mini bar chart, cards, a segmented switch, a table, role menus and toasts.

**AI.** Only as a usage category ("Agents"). There are no assistant settings.

**Worth adopting.**
- The seat count sits beside Invite.
- Each member's role is set from a menu on their row.
- Settings use a centred column rather than the full width.

**Wrong for us.**
- A production key is revoked instantly, with only a toast.
- "Yearly −20%" puts a sign beside the digits.
- Prices and dates use Latin digits and English formats.

### 12. Onboarding

**Job.** Set up a new workspace on first run: name, tools, team and a first agent.

**Regions and narrow widths.**
- A 640 px centred column holds:
  - "Step 2 of 4";
  - a greeting with a time estimate;
  - a four-step stepper;
  - a step card whose footer has Skip for now at the start, and Back and Continue at the end.
- A 264 px setup checklist sits beside the column. It has a progress bar and four items, each with a sub-status such as "1 tool connected". A "need a hand" call link follows it.
- At narrow widths the checklist moves under the card, and the stepper keeps only the current step's label.

**The four steps.**
1. Workspace name and URL, with a team-size radio.
2. Switches for tools.
3. Invites as removable email chips, with a role and a copy-link button.
4. Agent templates as radio cards, each with its trigger.

**Components.** Stepper, form fields, radio cards, switches, chip input and a progress checklist.

**AI and handback.**
- The last step creates an agent from the template the person picks. Its instructions and tools can be changed later.
- The tools step frames each tool as something the agents may read and act in.

**Flaw.** The two progress indicators disagree. Jump to the last step from the checklist, and the stepper marks every step done while the checklist still says 1 of 4.

**Worth adopting.**
- The footer order: a quiet skip at the start, Back and Continue at the end.
- On phones the stepper keeps only the current step's label.
- The subtitle gives a time estimate.

**Wrong for us.**
- Continue's chevron doesn't mirror, and neither do the switches.
- The checklist's "1/4" reads "4/1".

### 13. Evals

**Job.** Test a prompt version against a fixed suite, and review changes to the prompt.

**Regions and narrow widths.**
- **The header** has the prompt's name, a version menu that lists each version's pass rate, a model chip, the last run, and Run eval.
- **Four KPI cards** show deltas against the previous version.
- **A pass-rate-by-version line chart** sits beside a card of changes to the prompt. The card names who edited it and shows an inline diff with a counter, previous and next, Reject all and Accept all.
- **The test cases** have a segmented filter that carries counts, and a table with the input and its ID, the expected and actual output, a score badge and the latency.
- **Below 1000 px** the diff moves under the chart and the KPI cards go 2×2. At every width the table scrolls inside a fixed-height area, one scroll nested in another, and at 390 px it scrolls sideways too.

**Components.** A version menu, KPI cards, a line chart, an inline diff, a segmented filter, a table and badges.

**AI and handback.**
- The whole page is about the AI's behaviour. A person's edit to the prompt is reviewed change by change.
- Run eval re-runs the suite. The button disables, "Running 8 of 25…" counts up and the pass rate ticks, but none of it is announced.
- Selecting a row only highlights it; there's no detail view.

**Worth adopting.**
- The filter segments carry their counts.
- Each figure has a delta against the previous version.
- The change card says who made the edit.

**Wrong for us.**
- The chart's axis runs left to right in RTL.
- Signs land on the wrong side ("0.2s vs v11−").
- The Y and N shortcuts check the typed character.

---

## Tiraz's ten screens

**Shared notes:**

- **One frame for all ten.** AffectUI builds all thirteen screens on one shell, so do the same. The Dashboard example already has the parts: a Sidebar at the inline start, and a header whose Decision inbox button shows a "needs you" count and opens a Sheet. On phones a Sheet holds the navigation. Reuse that frame instead of building ten.
- **Panels.** Details go at the inline end, which is the left in Arabic. Follow ChatApp's container breakpoints:
  - from 960 px, the panel sits beside the page;
  - below 960 px, it moves under the page;
  - below 640 px, the sidebar moves into a Sheet.

  When a panel must overlay, use a Sheet on the end side. Sheet's `side` defaults to the start side (right in RTL), so details sheets pass `side="left"` in Arabic.
- **One story.** Every figure comes from `finance-story.ts`, and each screen is one moment of October's close.

### 1. Month-end close

**Resembles.** Agent Run, closely.

**Layout.**
- **Main column (about 720 px).** Agent task runs the close's five steps from the story:
  - 217 supplier invoices matched, with 3 differences;
  - the Al Ahli reconciliation, 94 transactions;
  - 4 accrual entries worth ٦٬٨٥٠ ر.س — posting them waits on Agent task's inline approval;
  - payment reminders to the three customers;
  - the one-page summary PDF for the CFO.
- **End panel (20rem).**
  - What changed for the close: net cash flow down 18%, days sales outstanding from 34 to 47, and ٤٨٬٣٠٠ ر.س overdue.
  - A short details list: the agent, who started the run (ليلى) and the number of tool calls.
- **Below 960 px.** The panel moves under the task. Nothing needs hiding, because the approval is already inline at its step; AffectUI hides it behind a toggle and a Review link.
- **The reminders step.** It hands its three drafts to Draft for review, through the inbox's `onOpen` or a link to Invoices, instead of asking to approve sending unreviewed text, which AffectUI's run allowed.

**Change.**
- Drop Steps. Agent task's plan already shows the progress, and two progress displays drift apart, as they do in AffectUI's Onboarding.
- Replace the Decision inbox region with the frame's inbox button and Sheet. The full inbox belongs to the Agent control room.

### 2. Invoices and collections

**Resembles.** CRM, plus Agent Run's draft panel.

**Layout.**
- **Header.** A title and a one-line total («١٢ فاتورة متأخرة · ٤٨٬٣٠٠ ر.س»). Under it, a FilterBar: search by customer or invoice, active filters (late, October) and Clear all.
- **DataTable.** Columns:
  - the invoice number, in `<bdi dir="ltr">`;
  - the customer;
  - the amount, end-aligned;
  - the due date;
  - the days late, as a Badge;
  - the status;
  - a row button such as «اكتب تذكيرًا».

  DataTable sorts text, so give amounts a zero-padded `sortValue` and dates an ISO one.
- **End panel.** Draft for review for the chosen invoice: the story's reminder to سارة العتيبي about INV-1043. Below 960 px it opens in a Sheet from the end side. After sending, the row's status says the reminder went.

**Change.** None. Keep reminders to one invoice at a time. DataTable has no row selection, and no bulk send keeps the inbox's rule of no approve-all.

### 3. Customer profile

**Resembles.** No AffectUI screen. The header borrows Folder's title row, and the questions borrow Assistant Home's in-place answer.

**Layout.**
- **Breadcrumbs:** customers, then شركة مدار.
- **Header.** An Avatar, the name, three facts (١٥٬٦٠٠ ر.س owed, two invoices late, contact سارة العتيبي) and actions at the end.
- **Tabs.**
  - Overview: the facts and a Timeline of invoices issued, reminders sent and a promise to pay.
  - Invoices: the two invoices in a DataTable.
- **End panel.** Start a task with the customer attached as a context chip. Ask your data answers under it, for example how late Madar paid each month this year, as a bar chart with its tables cited.
- **Below 960 px** the panel moves under the tabs.

**Change.** Drop Cited answer here. Help center and the Assistant workspace already show it, and one kind of answer keeps the panel clear. Start a task becomes the entry point, because that's how a question gets the customer attached.

### 4. Onboarding and verification

**Resembles.** Onboarding, closely.

**Layout.**
- **Centred column (about 40rem).** «الخطوة ٢ من ٤», a title and a time estimate.
- **Steps.** Short one-word labels: المنشأة، الجوال، المستندات، المراجعة.
- **One card per step.** The footer has a quiet «تخطَّ الآن» at the start, and «السابق» and «متابعة» at the end.
- **The steps.**
  1. The company's name and commercial registration number, and the start of its fiscal year (DatePicker).
  2. A one-time code to the phone (OTP).
  3. FileDropzone for the registration and the VAT certificate.
  4. The assistant reads the documents and uses Clarifying questions for only what it can't infer, for example when the name on the registration differs from the one typed.
- **Phones** keep the same column, and the footer stays on one row.

**Change.** Don't put a checklist beside the steps: AffectUI's stepper and checklist disagreed. DatePicker is Gregorian only, so use it for a Gregorian date such as the start of the fiscal year.

### 5. Help center

**Resembles.** Assistant Home, closely.

**Layout.**
- **One centred column (about 42rem)** and no side panel. Start a task opens it, with a greeting and suggestions drawn from help topics (matching a bank statement, why collection days rose).
- **On submit** the same column becomes the answer, with no page change. The question shows, then Cited answer moves through thinking, writing and completed, with Sources and FollowUps. The starter docks under it as the reply box.
- **Stop stays visible** while the answer is thinking (AffectUI has none), and the failed state keeps Try again.

**Change.** Add one line under a failed or unhelpful answer, «تواصل مع فريق الدعم», to hand off to a person. AffectUI's version is its "need a hand" link. Nothing else changes. The screen differs from the Assistant workspace by being one question with no conversation list.

### 6. Contract review

**Resembles.** Agent Run's draft panel and Evals' change card, with Folder's file list.

**Layout.**
- **Start column (about 16rem).** A FileTree of the contract set with النخبة للتغليف: the agreement, the payment-terms annex and the correspondence.
- **Main column.** The open document. Suggested edits works on the payment-terms clause (the 2% early-payment discount, due 30 October), with its counter, Reject all and Accept all.
- **End panel.** An Approval request to send the revised contract. The send is irreversible, so it always asks, and it's enabled only once every edit is accepted or rejected.
- **Below 960 px.** The FileTree moves into a Sheet behind a «الملفات» button, and the approval moves under the document.

**Change.**
- Show InlineDiff only through Suggested edits, which already renders it. A second diff region would show the same changes twice.
- Tie the approval to the review. AffectUI let a send be approved over unreviewed edits.

### 7. Content studio

**Resembles.** Agent Chat, closely: a brief beside the work, Generate with an estimate, and the results as versions.

**Layout.**
- **Main column.** Image generation for مصمّم الحملات, for example a visual for the payment-reminder campaign, with the versions as its radio group.
- **End panel.** The brief:
  - the description;
  - TagInput for the audience and keywords;
  - ColorPicker with the brand presets;
  - the format as a RadioGroup;
  - Generate, with a count and an estimate.
- **Under the chosen image.** The caption. Suggested edits handles it when the person asks for a shorter or more formal version.
- **Below 960 px** the brief moves above the canvas.

**Change.** Swap Draft for review for Suggested edits on the caption. Draft for review's tray is built around a record with a customer, an amount and an overdue badge, and a campaign caption has none of those. Keep the brief as the only input: AffectUI's chat and brief held two answers to one question.

### 8. Agent control room

**Resembles.** Agent Run's frame (the Runs count and the Agents list), and AffectUI's advice that many runs belong in a list with a status column. No AffectUI screen shows several agents at once.

**Layout.**
- **Main column.** The Decision inbox with its agents strip (وكيل المالية، وكيل التحصيل، مصمّم الحملات) and its tabs, most urgent first.
- **End panel, for the chosen agent.** TaskRows for its tasks, then ToolCall cards for the step that's running. ContextMeter's inline ring sits in the panel's header.
- **Links.** Each task links to its full run; for the Finance agent, that's Month-end close.
- **Below 960 px** the panel opens in a Sheet from the end side when an agent is chosen.

**Change.**
- Make this screen the overview of many agents, and Month-end close the detail of one run, so neither repeats the other.
- Use ContextMeter only as the inline ring. Its detail view is already in Assistant controls (screen 9).

### 9. Team and AI settings

**Resembles.** Settings & Billing.

**Layout.**
- **Centred column (about 64rem).** The page title, then Tabs for «الفريق» and «المساعد».
- **The team tab.**
  - «٥ من ١٠ مقاعد» sits beside Invite.
  - A DataTable lists each person with their Avatar and name, email, role and last activity.
  - A row menu holds Remove, which asks first; AffectUI revoked a production key with no confirmation.
- **The assistant tab.** Assistant controls: a level for each action, memory, and the context meter's detail view with the model selector.
- **On phones** the table scrolls sideways inside its card, and the tabs stay at the top.

**Change.** Use two tabs only. Billing and API keys aren't part of the story.

### 10. Sales pipeline

**Resembles.** CRM (stage badges, views) and the KPI deltas in Analytics.

**Layout.**
- **Header.** A title, the period, and a FilterBar for the deal's owner.
- **What changed.** It sits above the board with two or three rows: the deals that moved and one that stalled.
- **The board.**
  - Five stage columns run from the inline start, the right in Arabic: جديد، مؤهَّل، عرض سعر، تفاوض، مكسوبة.
  - Each column's header shows its count and its total in riyals.
  - Each Card shows the customer, the amount, the next step, the owner's Avatar and the days in the stage. Card isn't interactive, so the customer's name is the card's button.
- **Deal follow-up.** That button opens a Sheet from the end side, with Draft for review of a follow-up message for the deal.
- **Narrow widths.** Between 640 and 960 px the columns scroll sideways from the start edge. Below 640 px, Tabs with counts show one stage at a time.

**Change.** Drop Ask your data and the Charts. The Dashboard example already has both, and a row of charts pushes the board below the fold. The column totals carry the numbers.

---

## Should a planned screen be replaced?

No. The AffectUI screens that Tiraz's ten don't cover fall into three groups:

- frames: the two shells;
- catalogues: Folders, Folder and Integrations;
- a tool for whoever builds the assistant: Evals.

None of them fits a finance team's task better than what's planned. The weakest of the ten is Sales pipeline, because it repeats the Dashboard's AI pieces. Trimming it, as above, fixes that, and it keeps the only board layout among the ten, which is the one that tests RTL column order.

## Summary

| Tiraz screen | AffectUI reference | Key layout | Change |
| --- | --- | --- | --- |
| 1. Month-end close | Agent Run | Agent task in the main column; What changed and run details in an end panel | Drop Steps; the inbox becomes the frame's button and Sheet |
| 2. Invoices and collections | CRM, with Agent Run's draft panel | FilterBar over a DataTable; Draft for review in an end panel, a Sheet below 960 px | None; one draft per invoice |
| 3. Customer profile | none (Folder's header, Assistant Home's answer) | Header with facts; Tabs (overview with Timeline, invoices); asking panel at the end | Drop Cited answer; Start a task is the entry |
| 4. Onboarding and verification | Onboarding | Centred column; Steps; one card per step with skip, back and continue | No checklist beside the steps |
| 5. Help center | Assistant Home | One column: the starter becomes the cited answer in place | Add a line to hand off to a person |
| 6. Contract review | Agent Run's draft panel, Evals' change card | FileTree at the start, document with Suggested edits, approval at the end | InlineDiff only inside Suggested edits; approval after the review |
| 7. Content studio | Agent Chat | Canvas in the main column; brief with Generate at the end | Draft for review → Suggested edits on the caption |
| 8. Agent control room | Agent Run's frame | Decision inbox with agents strip; agent panel with TaskRows and ToolCall | Overview only; ContextMeter as the inline ring |
| 9. Team and AI settings | Settings & Billing | Centred column; Tabs: team (DataTable) and assistant (Assistant controls) | Two tabs only |
| 10. Sales pipeline | CRM, Analytics | What changed over a board of stage columns; draft in a Sheet | Drop Ask your data and Charts |
