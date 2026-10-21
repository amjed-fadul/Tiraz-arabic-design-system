# Ten example screens: design

**Date:** 21 Oct 2026 · **Branch:** `claude/woven-p5`, from `2875cc4` · **Research:** `docs/superpowers/research/2026-10-21-affectui-screens.md`

**What this is.** Ten standalone screens, built from Tiraz's components and patterns for the final review. Four builders build them in parallel, and this file is their single source of truth; where it differs from the research, this file wins.

**Where screens show.** Every screen, the Dashboard included, opens as a page inside the docs workbench (§2.3), never in a new tab. Its standalone route stays, because that page's iframe and its new-tab link both use it.

**No new parts.** The only shared additions are the screen frame (§2.2) and the workbench's screen page (§2.3). The pipeline board is stage columns of Cards, each card with a keyboard-accessible «نقل إلى» menu. There is no drag-and-drop.

## 1. Rules for every screen

**Ownership.** A screen owns `src/examples/<slug>/`: its `<Component>.tsx` (which exports only the screen), `data.ts`, `<slug>.css`, `<Component>.test.tsx` and any helpers. Builders never edit `src/system/**`, `src/workbench/**`, `src/main.tsx`, `finance-story.ts`, `src/examples/frame/**`, `screens-css.test.ts`, the Dashboard or another screen, though importing from them is fine. A missing capability is worked around in the folder or left out, and named in the report.

**Arabic first.** Every screen renders in `ScreenFrame`: Arabic, RTL and light by default, with the Dashboard's language and theme buttons. Every string goes through `t(ar, en)`, Arabic first, with counts and genders that agree. CSS uses logical properties only, and pointing icons mirror with `.tz-mirror-rtl`. Digits come only from the frame's `number`, `percent`, `money` and `date`, which use `numberLocale`. No figure has a + or − beside it: use words, or ChangeSummary's `direction`. Fractions are words («٢ من ٤»), Latin ids and emails sit in `<bdi dir="ltr">`, and figure columns are end-aligned.

**Data.** `data.ts` holds values only: `{ ar, en }` text, numbers and ISO dates. Take every fact the story has, so the screens agree: customers, invoices, totals, close steps, agents, sources, the draft and the early payment. Invent only what it lacks. The clock is `today` (`2026-10-18`), and nothing reads `Date.now()`.

**Layout.**
- **Headings.** `ScreenHeader` gives the only h1, and regions are h2. Patterns placed as regions take `headingLevel={2}`, or `{3}` inside a Sheet.
- **Appearance.** Patterns and parts inside a Card, a Sheet or an end panel use `appearance="plain"`; elsewhere, the default card.
- **Balance.** Amjed found the Dashboard's cards off balance, hugging the start of its column. On every screen:
  - every row spans the main column. A centred column is the main column its rows span;
  - one height applies to cards in the same grid row. An end panel is one card at its content's height, sticky at the top when `wide`;
  - a pattern card never hugs one edge with empty space beside it. It either fills its grid cell, lifting the 38rem cap inside its own scope (`.<slug> .tz-change-summary[data-appearance="card"] { max-inline-size: none }`), or it sits beside another card;
  - all cards share one surface, border, radius and padding scale.

  Builders check this in screenshots at 1,280 and 1,024 px.
- **Breakpoints.** The frame's main column is the size container `screen`. CSS uses `@container screen (width < 960px)` and `(width < 640px)`.
- **Structural changes**, such as a panel becoming a Sheet or the board becoming Tabs, read `size` and render one variant only. `size` is `wide` from 960 px, `medium` from 640 to 959 px, and `narrow` below 640 px.
- **End panels** are 20rem at the inline end. They sit beside the main column when `wide`, and after it otherwise.
- **Sheets** open from the logical end edge (`side={endSide}`). Only the frame's navigation Sheet opens from the start, where the Sidebar is.
- **Small screens.** Screens work down to 390 px with no sideways page scroll. Tables and the board scroll in their own boxes.

**Decision safety.** The patterns carry it, and screens must not weaken it.
- **Recording.** Decisions and answers go through `recorded(signal)`. Closing a Sheet, Escape in an inbox row, and unmounting abort and record nothing. Elsewhere Escape is the focused pattern's own key (Reject, Dismiss) and records like a click; never suppress it.
- **Inbox Sheets.** Escape closes the Sheet, returns focus to its trigger and records nothing. Screens with one test this.
- **Edits first.** An approval comes only after every suggested edit has a decision (§3.6).
- **One at a time.** There is no approve-all, bulk send or select-all. Suggested edits' Accept all and Reject all stay: they settle one suggestion, not several requests.
- **Messages.** A customer message is one Draft for review per record. So the three reminders are three drafts, never the docs example's «أرسل الرسائل» request.
- **Irreversible actions ask.** The contract send is `irreversible`, and removing a member confirms in a Modal. Only reversible requests get quick decisions.
- **Receipts** say only what was recorded.
- **Nothing runs on its own.** Every change follows a person's action and the host's moment. Host timers clear when superseded and on unmount.

**Accessibility.** Icon-only buttons are named in the page language, and row buttons name their row («إزالة سارة علي»), with any visible label first. Only transitions are announced: a screen has at most one hidden polite region, empty at mount, which says each change once and never announces timers, progress, filtering or tabs. When an action removes the focused element, the screen says where focus goes. CSS uses tokens only, keeps `:hover` inside `@media (hover: hover) and (pointer: fine)`, and names `.<slug>` in every rule. `screens-css.test.ts` checks both (§2.4).

## 2. Prep commit

One commit on `claude/woven-p5`, made before the streams branch: `feat(examples): route ten screens through one frame`. It passes the gate (§4).

It must not edit `src/examples/dashboard/**`. Another branch builds the Dashboard's embed mode: it reads `?embed`, `?lang` and `?theme`, and hides its own language and theme buttons when embedded.

### 2.1 Routes and the screens table

**Routes.** `src/main.tsx` replaces its `path ===` chain with one table, `const routes: { path: string; component: ComponentType }[]`. It lists the Dashboard, the chat app, then the ten below, each imported from `src/examples/<slug>/<Component>.tsx`. The page renders the matching route, else the playground route, else the Workbench.

| Slug | Component | Arabic | English | Icon | Uses (docs page ids) |
|---|---|---|---|---|---|
| `dashboard` | `Dashboard` (exists) | لوحة العملاء | Customer dashboard | `LayoutDashboard` | change-summary, data-answer, decision-inbox, data-table, filter-bar |
| `month-end-close` | `MonthEndClose` | إقفال الشهر | Month-end close | `CalendarCheck` | agent-task, change-summary, decision-inbox |
| `invoices` | `Invoices` | الفواتير والتحصيل | Invoices and collections | `ReceiptText` | draft-review, data-table, filter-bar |
| `customer-profile` | `CustomerProfile` | ملف العميل | Customer profile | `UserRound` | task-starter, data-answer, timeline, tabs |
| `onboarding` | `Onboarding` | التسجيل والتوثيق | Onboarding and verification | `BadgeCheck` | ask-user-questions, steps, otp-input, file-dropzone |
| `help-center` | `HelpCenter` | مركز المساعدة | Help center | `LifeBuoy` | task-starter, cited-answer, prompt-bar |
| `contract-review` | `ContractReview` | مراجعة العقود | Contract review | `FileSignature` | suggested-edits, approval-card, file-tree |
| `content-studio` | `ContentStudio` | استوديو المحتوى | Content studio | `Palette` | image-generation, suggested-edits, tag-input, color-picker |
| `agent-control-room` | `AgentControlRoom` | غرفة متابعة الوكلاء | Agent control room | `Bot` | decision-inbox, task-rows, tool-call, context-meter |
| `team-settings` | `TeamSettings` | الفريق والإعدادات | Team and AI settings | `Settings` | assistant-controls, data-table, modal |
| `sales-pipeline` | `SalesPipeline` | خط المبيعات | Sales pipeline | `SquareKanban` | change-summary, draft-review, card, dropdown |

**One place for each fact.** `screens`, in `src/examples/frame/screen.ts` (§2.2), holds each row's slug, name, icon and a one-sentence description in both languages, Dashboard first. The ten descriptions are §3's Job lines; the Dashboard's is «الطلبات والعملاء وصندوق القرارات في لوحة واحدة.» / "Orders, customers and the decision inbox on one page." Beside it, `screenPath(slug)` gives the standalone href, `/examples/<slug>`. The Uses column is `screenUses: Record<ScreenSlug, readonly ComponentId[]>` in `src/workbench/catalog.ts`, on the workbench side so that `src/examples` never imports workbench types.

**Catalog.** The `screens` section drops `links`. Its navigation lists Assistant workspace (`chat-app`, unchanged), then one button per `screens` row. A button has `aria-current="page"` while its screen page is open, and then no docs page is current. The buttons have no arrow and never open a new tab, and like the page buttons, they close the phone drawer.

### 2.2 The screen frame

**Decision: one shared frame.** The Dashboard's shell (Sidebar, phone navigation, language and theme buttons, document effects, providers) is about 150 lines, and four builders copying it would drift ten ways. The frame holds no screen content, such as an inbox.

**`src/examples/frame/screen.ts`**

```ts
export const screens = [/* §2.1's table, Dashboard first */] as const satisfies readonly {
  slug: string; name: readonly [string, string]; description: readonly [string, string]; icon: LucideIcon;
}[];
export type ScreenSlug = (typeof screens)[number]["slug"];
export const screenPath = (slug: ScreenSlug) => `/examples/${slug}`;
export const today = "2026-10-18"; // story.period.week.to
/** Stands in for a server: resolves after `ms`; rejects with an AbortError on abort. */
export function recorded(signal: AbortSignal, ms = 600): Promise<void>;
export interface Screen {
  slug: ScreenSlug;
  language: "ar" | "en";
  t(ar: string, en: string): string;
  locale: string; // numberLocale(config, language)
  number(value: number): string; // «٤٨٬٣٠٠»
  percent(value: number): string; // a whole percent: 18 → «١٨٪»
  money(value: number, options?: { compact?: boolean }): string; // finance-story's money()
  date(iso: string): string; // «٣٠ أكتوبر» / "Oct 30": day numeric, month short, UTC
  href(slug: ScreenSlug): string; // screenPath(slug), plus lang=en and theme=dark when set
  open(slug: ScreenSlug): void; // embedded: posts tiraz:open-screen; otherwise goes to href(slug)
  size: "wide" | "medium" | "narrow";
  endSide: "left" | "right"; // Sheet's side for the end edge: left in Arabic
}
export const ScreenContext: Context<Screen | null>;
export function useScreen(): Screen; // throws outside ScreenFrame
```

**`ScreenFrame({ slug, children })`**, in `src/examples/frame/ScreenFrame.tsx`:

**State and document.** Language, theme and embed mode come from `?lang=en`, `?theme=dark` and `?embed=1`; without them the frame is Arabic, light and standalone. An effect sets `<html>`'s `lang`, `dir` and `style.colorScheme`, and the title «طِراز · {name}» / "Tiraz · {name}".

**Structure.** Outermost first: `<div lang className="screen-host">`, SystemProvider (a memoized `{ ...defaultConfig, direction, theme }`), ToastProvider (the Dashboard's labels) and `ScreenContext.Provider`. Inside them come a skip link «انتقل إلى المحتوى» to `#screen-main`, then the Sidebar, the bar and main.

**Sidebar** (`.screen-sidebar`). It is sticky and full height, labelled «أمثلة طِراز», with a controlled `collapsed`. Its header holds ✳ «طِراز», «أمثلة الشاشات» and a SidebarToggle with the Dashboard's labels. SidebarContent «الشاشات» holds one SidebarItem per `screens` row, each with `href(slug)`, its name and its 18 px icon, and the current one is `active`. A footer item, «توثيق طِراز» (`BookOpen`), links to `/`.

**Bar** (`header.screen-bar`). At its start, on phones only, it holds the menu trigger (a ghost icon button «فتح القائمة», `Menu`) and the brand. At its end it holds the Dashboard's language button («English» / «العربية») and theme button («الوضع الداكن», `aria-pressed`).

**Main** is `<main id="screen-main" tabIndex={-1} className="screen-main">`, with `container: screen / inline-size`. A ResizeObserver sets `size` from its content width; it starts `wide`, so jsdom tests run wide.

**Phones** (`@media (max-width: 640px)`). The Sidebar hides, and the bar shows the menu and the brand. The menu Sheet («الشاشات», «انتقل إلى شاشة أخرى.», «إغلاق القائمة») keeps the default start side and holds the same list, without the toggle.

**Embed mode** (`?embed=1`) hides the language and theme buttons and «توثيق طِراز». A plain click on any link to a screen route doesn't navigate, whether it's a Sidebar item, a breadcrumb or a link in content. Instead, one capture-phase click listener on `.screen-host` calls `window.parent.postMessage({ type: "tiraz:open-screen", slug }, location.origin)`, and the workbench opens that screen page. `href(slug)` stays the standalone URL, so a middle or modified click still opens it. Embedded, the bar renders only on phones (`max-width: 640px`), with the menu and the brand.

**`ScreenHeader({ title?: ReactNode; description?: ReactNode; actions?: ReactNode })`** renders `header.screen-header`; §3.3 passes the Avatar and name as `title` and the facts as `description`. It holds the h1 (the screen's name by default), `p.screen-description`, and the actions at the inline end, which wrap under the title below 640 px. `screen-frame.css` uses only `.screen`.

**`ScreenFrame.test.tsx`**
1. **Arabic by default.** `lang`, `dir` and the title are Arabic, the current link has `aria-current="page"`, and a probe child shows «٤٨٬٣٠٠» and «٩٬٤٠٠ ر.س». «English» switches them all, and the links gain `?lang=en`.
2. **The menu.** «فتح القائمة» opens a Sheet with `data-edge="start"`, and Escape returns focus to it.
3. **Embed mode.** With `?embed=1`, the language and theme buttons and «توثيق طِراز» are gone. Clicking «الفواتير والتحصيل» posts `{ type: "tiraz:open-screen", slug: "invoices" }` to the page's origin, without navigating.

### 2.3 Screen pages in the workbench

**Scope.** This is part of the prep commit. It changes `storage.ts`, `catalog.ts`, `Workbench.tsx` and `workbench.css`, and refreshes what asserts the old Dashboard link: `navigation-groups.test.tsx`, `tests/browser/documentation-groups.mjs`, and the header step of `tests/browser/dashboard.mjs`.

**State.** `DocumentationPreferences.screen` is a `ScreenSlug | null`, persisted with the docs state in `tiraz.documentation.v2`; `readDocumentation` turns an unknown slug into `null`. `openPage(id)` clears it, and `openScreen(slug)` sets it and scrolls to the top. The header's «مثال لوحة العملاء» becomes a button that calls `openScreen("dashboard")`. While a screen page is open, the title is «طِراز · {screen name}».

**Layout,** in `main.component-page` at the docs sections' width:
1. **Heading.** `header.component-heading` holds the screen's name as the h1, then its description.
2. **Toolbar** (`.tz-demo-bar`).
   - **At the start:** width chips «سطح المكتب» / «جهاز لوحي» / «هاتف» (Desktop / Tablet / Phone). Desktop renders the iframe 1,280 px wide and scales it to the stage with `transform: scale(stage ÷ 1,280)` from the top, scaling its box height the same way; Tablet and Phone stay 768 and 390 px, unscaled. A ResizeObserver on the stage recomputes the scale. So Desktop shows each screen's `wide` layout. The chips are the playground's state chips: a `.tz-demo-states` group named «عرض المعاينة» / "Preview width", of `.tz-demo-state` buttons with `aria-pressed`. The choice lasts the session.
   - **At the end:** the new-tab link, a `.tz-demo-icon` with lucide `ArrowUpRight` and `.tz-mirror-rtl`. It is named «افتح في نافذة جديدة» / "Open in a new tab", has `target="_blank" rel="noopener"`, and points to `screenPath(slug)` with the current `lang` and `theme`.
3. **Stage:** `<iframe title={name} src={`${screenPath(slug)}?embed=1[&lang=en][&theme=dark]`}>`.
   - It follows the workbench's language and theme, so a change reloads it.
   - Its width comes from the chip, centered in the stage.
   - Its height is `clamp(560px, 100dvh - 260px, 900px)`, which Desktop scales with the width. The 260 px covers the header, padding, heading and toolbar above it.
   - It uses the playground stage's border, radius and surface.
4. **«على هذه الشاشة» / "On this screen"** (h2): one button per `screenUses[slug]` page, named after it, which opens it.

A screen page has no prompt, Code view, guidelines, API table or settings panel.

**Messages.** The workbench listens for `message`. It calls `openScreen(data.slug)` only when `event.origin === location.origin`, `data.type === "tiraz:open-screen"` and `data.slug` is in `screens`; it ignores anything else.

**Ruling: why an iframe.** Screens set `<html>` lang, dir and title, portal their Sheets, and have a sticky full-height Sidebar. Rendered inline, they would leak CSS both ways. The iframe also gives the chips real container and viewport behaviour.

**Tests** (`src/workbench/screen-pages.test.tsx`):
1. The Screens group has buttons and no new-tab links.
2. Opening a screen renders the iframe with the right `src` and `title`.
3. Switching language or theme changes the `src`.
4. The new-tab link points to the standalone route.
5. A same-origin `tiraz:open-screen` message opens that screen. A foreign origin or an unknown slug does nothing.
6. A saved screen restores on reload.

### 2.4 Placeholders and audit

**Placeholders.** Each `<Component>.tsx` is `<ScreenFrame slug="<slug>"><ScreenHeader /></ScreenFrame>`, and it imports `./<slug>.css`, which holds one comment.

**Audit.** `src/examples/screens-css.test.ts` expects `auditFamily(css, [prefix])` from `src/system/css-audit.ts` to return `[]`. It checks `frame/screen-frame.css` with `.screen`, and each `<slug>/<slug>.css` with `.<slug>`. `screens-css.test.ts` also expects `familyRuleCount(css, [prefix])` to equal the file's rule count (postcss `walkRules`). `auditFamily` reads only rules that name the prefix, and `main.tsx` loads every screen's CSS on every page, the docs included, so no rule may lack it.

## 3. The screens

Each screen starts with `ScreenHeader` and gets its helpers from `useScreen()`. Unless it says otherwise, on phones it is one column, with its end panel after the main column. Links to other screens are plain `<a href={href(slug)}>`, and callbacks call `open(slug)`; embedded, both stay inside the workbench. Tests render the screen itself, which opens in Arabic; «English» switches it.

### 3.1 Month-end close · `MonthEndClose`

**Job.** Follow وكيل المالية's October close, and step in where it waits on ليلى.

**Build.** ScreenHeader «إقفال حسابات أكتوبر» has the Dashboard's inbox button as its action; its Sheet holds DecisionInbox. The main column holds AgentTask over `story.closeSteps`: steps 1–2 completed, each with a `detail` and two `tools`; step 3 `needs-you`, with the docs example's accruals `request` and `approval: { reversible: true }`; steps 4–5 pending, step 4's `agent` being وكيل التحصيل. The end panel holds ChangeSummary (the story's cash flow, days sales outstanding and overdue, all `bad`), then a `<dl>` of the agent, who started the run (ليلى) and the tool calls.

**Flows.** The inbox starts with «هل أستثني فرع جدة؟». Approve completes step 3; Reject skips it. Either way: step 4 turns `needs-you`, with the `detail` «٣ مسودات تنتظر مراجعتك · افتح الفواتير», whose last words link to `href("invoices")` (`detail` is a `<p>`); the inbox gains three `draft: true` items, whose «راجع» calls `open("invoices")`.

**Tests.** (1) Approving completes step 3 after the moment and shows the link. The inbox button's name goes from «…بانتظارك: ١» to «…: ٤». (2) Escape in the inbox Sheet, while the answer records, closes it and returns focus. 800 ms later the count is still ١.

### 3.2 Invoices and collections · `Invoices`

**Job.** Find late invoices, and send reviewed reminders one invoice at a time.

**Build.** **ScreenHeader:** with a computed description, «١٢ فاتورة متأخرة · ٤٨٬٣٠٠ ر.س». **FilterBar:** search, and a status Select that defaults to متأخرة. **DataTable** (`pageSize={8}`): the invoice id is the row header, in `<bdi dir="ltr">`; days late and status are Badges; each late row's button is named with its invoice, as «راجع التذكير · INV-1043»; `sortValue` returns `String(amount)` and ISO dates. The collator is numeric, so nothing is padded. **End panel:** DraftReview by وكيل التحصيل, with no undo. In `medium` and `narrow` there is no panel; each row's button triggers its own Sheet instead.

**Data.** Sixteen invoices: the story's four; eight more late ones, each under ٨٬٠٠٠ and ١٣٬٥٠٠ together, so the twelve late ones make ٤٨٬٣٠٠; two paid; two due later.

**Flows.** Invoices opens with the story's three reminders `ready` (INV-1043's is `story.draft`, then INV-1039 and INV-1041); their buttons read «راجع التذكير», the panel starts on INV-1043's, and the other late rows offer «اكتب تذكيرًا». A new draft goes from writing to ready, and Send takes a draft through sending to sent. The row then reads «أُرسل التذكير». Its button becomes «عرض التذكير», so the Sheet keeps its trigger.

**Tests.** (1) «مدار» leaves INV-1043 and INV-1046. Under the default filter, sorting by amount descending puts INV-1039 first. Removing the status chip gives sixteen results. (2) INV-1043's draft names سارة العتيبي and ٩٬٤٠٠ ر.س, and Send marks the row.

### 3.3 Customer profile · `CustomerProfile`

**Job.** شركة مدار at a glance, and a question about it with the customer attached.

**Build.** **Breadcrumbs:** «الفواتير والتحصيل» (`href("invoices")`), then «شركة مدار». **ScreenHeader:** `title` is a decorative Avatar and the name, and `description` is three facts: ١٥٬٦٠٠ ر.س owed, two invoices late, and سارة العتيبي. **Tabs:** «نظرة عامة»: the facts, and a Timeline of the two invoices issued, the first reminder, and سارة العتيبي's promise to pay before 25 Oct; «الفواتير»: the two invoices. **End panel:** TaskStarter, with `context` `[{ id: "madar", label: "شركة مدار", kind: "عميل" }]` and the suggestion «كم تأخّرت مدار في السداد كل شهر هذا العام؟»; DataAnswer under it: days late per month from January to October, as bars (`chartTypes` bar and line), with an explanation citing [2] and [4].

**Change.** No Cited answer: Start a task is how a question starts.

**Flows.** The answer thinks for a moment, then completes. Its heading is always the sample question.

**Tests.** (1) «الفواتير» lists ٩٬٤٠٠ and ٦٬٢٠٠ ر.س, and the Timeline keeps its order. (2) With the chip attached, the suggestion completes, with bars and the chips ٢ and ٤.

### 3.4 Onboarding and verification · `Onboarding`

**Job.** Register a company and verify it in four short steps.

**Build.** **Column:** centred, 40rem wide. **ScreenHeader:** «سجّل منشأتك», described «الخطوة ٢ من ٤ · نحو ٥ دقائق». **Steps:** المنشأة، الجوال، المستندات، المراجعة. **Cards:** one per step, each with a native h2 (`tabIndex={-1}`). **Card footer:** a quiet «تخطَّ الآن» link to `href("month-end-close")` at the start, and «السابق» and «متابعة» at the end. **Phones:** the footer stays on one row, and only the current step keeps its label. There is no checklist.

**The four steps.** (1) The name, the ten-digit registration number (`dir="ltr"`), and the fiscal year's start in a Gregorian DatePicker (2026-01-01). (2) OTPInput, six digits; any six pass. (3) FileDropzone (`maxFiles={2}`) for the registration and the VAT certificate, both required. (4) Clarifying questions (`receipt`), only for what the documents leave open. The registration says «شركة النخيل للتجارة», but the person typed «النخيل». Which is right?

**Flows.** «متابعة» validates the step. Invalid fields show `error`, and the first one takes focus. A valid step moves on, and its h2 takes focus. After step 4, the screen shows «اكتمل التسجيل» and «ابدأ إقفال الشهر».

**Tests.** (1) An empty step 1 shows both errors and focuses the name. A valid one shows «الخطوة ٢ من ٤», completes المنشأة and focuses the h2. (2) Five OTP digits show an error. Six Arabic-Indic digits pass.

### 3.5 Help center · `HelpCenter`

**Job.** Ask one question, then get a sourced answer or reach a person.

**Build.** A centred 42rem column, with no panel. (1) **First, TaskStarter.** It shows «مرحبًا ليلى», «كيف نساعدك؟» and three suggestions, each filling the draft: «كيف أطابق كشف البنك الأهلي؟», «لماذا ارتفعت أيام التحصيل؟», «كيف أرحّل قيد استحقاق؟» (2) **On submit, CitedAnswer.** The same column shows the question and CitedAnswer, in place. Its `sources` are help articles from `data.ts`, and its `followUps` start a new answer. (3) **Then the reply box.** Once the answer stops running, a PromptBar sits under it; TaskStarter isn't reused, since it has its own heading.

**Flows.** An answer thinks for about 1.5 s, writes in parts, then completes. Stop gives `stopped`, with Regenerate. The accrual question fails on its first run, with Try again. Other typed questions complete as «لم أجد مقالًا يجيب عن هذا السؤال.», with no sources.

**Change.** «تواصل مع فريق الدعم» (`mailto:support@tiraz.example`) shows under: a failed answer; a "down" rating; an answer with no sources.

**Tests.** (1) A sent suggestion shows thinking, with Stop. Stop shows «أُوقفت الإجابة», and Regenerate completes it, with sources and follow-ups. (2) The accrual question shows the error, Try again and the support link. Try again completes it.

### 3.6 Contract review · `ContractReview`

**Job.** Review the assistant's edits to the payment terms, then send the revised contract, never before.

**Build.** **Main:** the document, with Suggested edits on the payment-terms clause. It starts `reviewing` with `selection` on the clause, holds three changes from `story.earlyPayment`, and has controlled `decisions`. **End panel:** the FileTree, then an Approval request. In `wide`, the FileTree heads the end panel above the approval; there is no start column. The tree is a folder «النخبة للتغليف» holding «ملحق شروط الدفع» (selected) and the read-only «اتفاقية التوريد» and «المراسلات». The approval (ApprovalCard) is «إرسال العقد المعدّل إلى النخبة للتغليف», `irreversible`, with `details` holding the clause as decided and `impact` the amount, discount and due date. **In `medium` and `narrow`:** the FileTree moves into a Sheet behind «الملفات» in ScreenHeader, and the approval follows the document.

**The gate.** ApprovalCard can't be disabled, so it mounts only once every change has a decision. Apply decides any undecided change as rejected, and Dismiss rejects them all. Until then, the panel says how many changes wait. Before approval, a changed decision changes `details`, which remounts the card. Once the send is approved, the host keeps the record and passes it as the card's `value`, and moves Suggested edits to `applied` with no `onUndo`, so `details` can't change and the card stays its receipt.

**Tests.** (1) While a change is undecided, there's no approval. After two accepts and a reject, it shows, irreversible, with the decided clause. (2) Opening «المراسلات» and coming back keeps the decisions and the card.

### 3.7 Content studio · `ContentStudio`

**Job.** Make the payment-reminder campaign's visual from a brief, pick a version, and polish its caption.

**Build.**

- **Main:** ImageGeneration by مصمّم الحملات.
  - Its `prompt` and `options` come from the brief.
  - Its `status` and `progress` come from the host.
  - Its four `images` are drawn in `data.ts` as SVG data URIs.
- **Caption:** once an image is used, the caption follows it, with Suggested edits («أقصر», «أكثر رسمية»).
- **End panel: the brief.** Below 960 px it moves above the canvas. It holds a Textarea, a TagInput, a ColorPicker, the RadioGroup «المقاس» (مربّع، أفقي، عمودي), and «ولّد ٤ صور · نحو ١٢ ثانية», which shows `loading` while the images weave.

**Change.** Suggested edits replaces Draft for review for the caption. The brief is the only input.

**Flows.** (1) The screen starts with four completed versions. (2) Generate goes `queued`, then `weaving` (+20 every 300 ms), then `completed`. (3) Use image puts «مختارة للحملة · النسخة {n}» above the caption.

**Tests.** (1) **Weaving.** While weaving, the button is loading and the version radios are disabled. When done, they're a radio group, and using the third shows the caption. (2) **The caption.** Selecting the caption and choosing «أقصر» opens the review. Accept all, then Apply, replaces it.

### 3.8 Agent control room · `AgentControlRoom`

**Job.** Every agent at once: what waits on ليلى, what runs, and what failed.

**Build.** **Main:** DecisionInbox, with an agents strip of the story's three agents. Each agent's state comes from its items, and `agent` is controlled. **Inbox items,** most urgent first: the accruals request, which is reversible, so it gets quick decisions; the Jeddah question; three reminder drafts, whose «راجع» calls `open("invoices")`; «غلاف حملة رمضان», which failed (`onRetry` sets it running); the running close and the completed supplier match, whose «افتح» calls `open("month-end-close")`. **End panel,** for the picked agent: its name and its ContextMeter, in the default ring; TaskRows; ToolCall (`announcement="off"`) for its running step. Both are `appearance="plain"` inside the panel. **In `medium` and `narrow`:** picking an agent adds «مهام {الوكيل}» to ScreenHeader, and that button opens the panel in a Sheet.

**Change.** ContextMeter's `inline` shows the details, not the ring, so it isn't passed. The strip's toggles belong to the inbox and can't trigger a Sheet, so the button does it.

**Tests.** (1) Picking وكيل التحصيل leaves its three drafts and shows its panel. (2) The accruals quick Approve records after the moment, with a receipt. Nothing offers approve-all.

### 3.9 Team and AI settings · `TeamSettings`

**Job.** Who is on the finance team, and what the assistant may do without asking.

**Build.** A centred 64rem column with Tabs «الفريق» and «المساعد». **«الفريق»:** an h2 «الفريق» (`tabIndex={-1}`), with «٦ من ١٠ مقاعد» beside «دعوة عضو», which opens a Modal that adds a row marked «مدعو». A DataTable lists ليلى («أنتِ») and the five in `teamMembers`. Every other row has a «إزالة {name}» icon button that opens a confirming Modal. **«المساعد».** AssistantControls, with the docs example's data copied into `data.ts`.

**Change.** Two tabs only. Remove is a row button rather than a menu item, because a Modal needs a trigger to return focus to.

**Flows.** Escape or Cancel changes nothing, and focus returns to the button. Confirming removes the row and updates the seats. A toast says «تمت إزالة {name} من الفريق», and the heading takes focus.

**Tests.** (1) Escape keeps سارة علي, and focus returns to her button. Confirming removes her and shows «٥ من ١٠ مقاعد», and the heading takes focus. (2) «إرسال رسائل للعملاء» stays «اسأل دائمًا», and its other levels are disabled.

### 3.10 Sales pipeline · `SalesPipeline`

**Job.** October's deals by stage: move one on from the keyboard, and follow up.

**Build.** **ScreenHeader:** «أكتوبر ٢٠٢٦ · ١٠ صفقات · {total}». **FilterBar:** the owner Select. **What changed:** the deals that moved, the value in negotiation, and one stalled deal. **The board:** five sections from the inline start (جديد، مؤهَّل، عرض سعر، تفاوض، مكسوبة), each with an h2, a count and a total. `wide`: `repeat(5, minmax(11rem, 1fr))` with a `--space-4` gap (944 px), which fits because Desktop now shows a 1,280 px frame (§2.3), whose main column is about 990 px; `medium`: the board scrolls sideways in its own box, from the start; `narrow`: Tabs with counts show one stage at a time. **Each Card:** an h3 holding the customer button, which opens a Sheet with DraftReview; the amount and the next step; the owner's named Avatar and the days in this stage; the «نقل إلى» DropdownMenu, triggered by «نقل إلى · {customer}», with the other four stages as its items.

**Data.** Ten deals: the story's three customers and seven more.

**Flows.** A move updates both columns, and the screen's region says «نُقلت صفقة {customer} إلى {stage}» once. In `wide` and `medium`, focus goes to the moved card's button. In `narrow`, focus goes to the next card in the shown stage, else the previous one, else that stage's tab; the region still says the move.

**Tests.** (1) Moving شركة مدار to تفاوض updates both columns, focuses its button, and announces the move once. (2) The customer button opens a Sheet with `data-edge="end"`. Escape returns focus to the button, and nothing is sent.

## 4. Builders' process

**Streams.** Each stream works in its own worktree, branched from the prep commit. Their folders don't overlap, so merges don't conflict. A: Month-end close and Agent control room. B: Invoices, Customer profile and Sales pipeline. C: Help center, Contract review and Content studio. D: Onboarding, and Team and AI settings.

**Commits.** One commit per screen, `feat(examples): add the <English name> screen`, staged by path (`git add src/examples/<slug>`), with no Co-Authored-By trailer.

**Gate.** Before each commit, run `npm test && npm run lint && npm run build && npm run format:check`, allowing 5 minutes. Lint stays at 0 warnings, and the CSS audit stays at `[]`. To test a narrow path, a test may swap in a `ResizeObserver` that reports a width, then restore it. A test that waits on host moments passes a 15 s timeout, as `Dashboard.test.tsx` does.

**Browser.** Each stream runs its own dev server: `npm run dev -- --port 5181` for A, then 5182, 5183 and 5184. Check each screen standalone at 1280, 900 and 390 px, and on its workbench screen page at each width chip. Check in Arabic and English, light and dark, and by keyboard alone, with no sideways scroll at 390 px. Check Balance (§1) in screenshots at 1,280 and 1,024 px.

**Report.** For each screen, give its commit, its tests, what the browser check covered, and any missing capability, noted and not patched.
