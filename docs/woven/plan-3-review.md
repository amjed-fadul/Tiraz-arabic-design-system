# Plan 3 (Woven restyle): end-of-plan review

Reviewed at 37d6f18 against Woven §9–18 and §20 and Docs §6 and §10. The browser was used only to confirm the items below, through fresh Playwright contexts at 1280 × 900. Line numbers refer to `git show 37d6f18:<path>`.

## Verdict

Ready after three small CSS fixes. The restyle holds across themes, directions, radii, 390 px and forced colours. The three fixes cover two states that disappear in forced colours and one sidebar state that looks wrong.

## Must fix

1. **Important: ApprovalCard consequence bullets disappear in forced colours.**
   - Where: `src/system/components.css:6797–6807`.
   - What is wrong: the bullet is drawn only by the `::before` background (`var(--text-muted)` at 0.6). Forced colours turn that background into Canvas, measured as rgb(255 255 255) on white, so both consequences lose their markers.
   - Fix: add this right after line 6807. It was checked in Chromium's forced-colours emulation: the bullets come back in CanvasText, measured as rgb(0 0 0).
     ```css
     @media (forced-colors: active) {
       .tz-approval-card .tz-decision-consequences > li::before {
         background: CanvasText;
         opacity: 1;
       }
     }
     ```
   - Image: `docs/woven/after-restyle/ar-light-forced/approval-card.jpg`.

2. **Important: Sidebar shows two current items.**
   - Where: `src/system/components.css:2468–2475`, and the hover and press rules at `:2450` and `:2462`.
   - What is wrong: an open group whose child is the current page gets `data-active="true"` (`Sidebar.tsx:346`, which `SidebarExamples.test.tsx:65` asserts). It therefore draws the same paper chip as the current page, with the same white background, `--shadow-chip` and weight 500, both measured. In the default example, «المكتبة» and «المكوّنات» are both chips. That breaks §12's selection rule and §17.3, which allow one active chip. The same pair shows up as two outlined boxes in forced colours. Before Plan 3, the group showed accent text only.
   - Fix (CSS only, so the test stays valid; checked by editing the live stylesheet: the open group loses its chip and keeps weight 500, and the current page keeps its chip and its focus ring):
     - At 2468–2475, keep `color` and `font-weight` on `.tz-sidebar-item[data-active="true"]`. Move the chip into a zero-specificity rule, so `:focus-visible` (0,2,0) still wins the outline:
       ```css
       .tz-sidebar-item[data-active="true"] {
         color: var(--text);
         font-weight: var(--weight-medium);
       }
       /* The chip marks the current page, and a closed group that holds it. An
          open group leaves the chip to the page inside it. */
       .tz-sidebar-item:where([data-active="true"]:not([aria-expanded="true"])) {
         background: var(--surface);
         box-shadow: var(--shadow-chip);
         outline: 1px solid transparent;
         outline-offset: -1px;
       }
       ```
     - At 2450 and 2462, change `:not([data-active="true"])` to `:not([data-active="true"]:not([aria-expanded="true"]))`, so the open group keeps the hover and press washes.
   - Images: `docs/woven/after-restyle/ar-light/sidebar.jpg` (also in `ar-dark`, `ar-light-r0`, `ar-light-r16` and `ar-light-forced`).

3. **Important: Pagination's current page cannot be seen in forced colours.**
   - Where: `src/system/components.css:2147–2151`.
   - What is wrong: only `--action-soft`, `--action` and `--action-border` mark the current page, and forced colours drop all three. «٦» then looks exactly like «٥» and «٧». The workbench state chips already solve this case at 5418–5438 (Task 8).
   - Fix: add this after 2159, following that pattern. It was checked in forced-colours emulation: «٦» shows as a Highlight fill, and a CanvasText ring appears on focus.
     ```css
     @media (forced-colors: active) {
       .tz-pagination .tz-button[aria-current="page"],
       .tz-pagination .tz-button[aria-current="page"] > * {
         forced-color-adjust: none;
       }
       .tz-pagination .tz-button[aria-current="page"] {
         background: Highlight;
         color: HighlightText;
         border-color: Highlight;
       }
       .tz-pagination .tz-button[aria-current="page"]:focus-visible {
         outline-color: CanvasText;
         outline-offset: 2px;
       }
     }
     ```
   - Image: `docs/woven/after-restyle/ar-light-forced/pagination.jpg`.

**The sidebar background in full-page captures is a capture artifact, not a page bug.**

- `.docs-sidebar` (`src/workbench/workbench.css:146–161`) is sticky, with `block-size: calc(100dvh - 58px)` plus a 58 px tray `box-shadow`.
- A full-page screenshot lays the page out once, at scroll 0 with the 900 px viewport. The tray therefore ends at 58 + 842 + 58 = 958.
- Measured in a real 1280 × 900 viewport:
  - At scroll 0 the sidebar spans 58–900.
  - Scrolled to the end (scrollY 262) it spans 0–842, and the shadow fills 842–900.
- So the tray always reaches the bottom of the viewport. Nothing to fix.

`browser-suite.md` did not exist when this review finished, so its regressions are not merged here.

## Backlog

- Task 1: `.tz-field-label` and the help and error text keep line-height 1.8, where §7.2 pairs them with `--leading-meta` 1.6.
- Task 1: `:read-only` also matches disabled fields, so a disabled Input or Textarea sits on the well. Add `:not(:disabled)`.
- Task 1: Button's `data-changed` (`Button.tsx:43`) has no test.
- Task 4: the sort button's ring is cut when `caption=""`, in compact density, at r ≥ 12.
- Plans 1–2: audit precision: `:has(:lang(en))`, equivalent hover gates, check 3 (token ± token) and check 7 (transform-only).
- Plans 1–2: extend check 11 to type tokens.
- Plans 1–2: commit the FilterBar remove-hover browser check.
- Plans 1–2: `--border-field` on `--wash` in dark mode is 2.75:1.
- Arabic prose inside mono wells falls back to a thin system Arabic face. Examples: ToolCall's output «حُفظ الملف في …» and CodeBlock's Arabic comment (`ar-light/tool-call.jpg`, `ar-light-r16/code-block.jpg`). Consider a stack of mono, then Plex Sans Arabic.
- The FileTree example hard-codes Western digits in Arabic: «1.2 KB» and «860 B» (`FileTreeExamples.tsx:61–75`). FileDropzone shows «٢٤٢٫٢ KB» (`ar-light-forced/file-tree.jpg`).
- The NotificationList example filter (الكل / غير المقروءة) uses ghost Buttons with `aria-pressed` and no pressed style. The active filter is invisible in every theme, and this predates Plan 3 (`ar-light/notification-list.jpg`).
- At 390 px, ToolCall's mono tool name breaks mid-word, «drive.create_fi / le». This predates Plan 3 (`ar-light-390/tool-call.jpg`).
- ToolChips still wrap to two rows at 390 px (carried from Task 6). The wrap is acceptable.
- Status words differ between parts: «مكتملة» in TaskRows and ToolCall, «مكتمل» in Terminal, and «قيد الانتظار» against the spec's «لم تبدأ». Plan 4's shared step words own this (plan 4, lines 114–115 and 514), so it is not a Plan 3 fix.
- Evidence gap: overlays are captured closed (Modal, Sheet, Dropdown, Toast, Tooltip, and the Select, DatePicker and ModelSelector popups), so the matrix never shows an open overlay. Add open-state captures if Plan 4's evidence needs them.

## Evidence

- **Before against after (ar-light), plus after in ar-dark:**
  - forms: date-picker;
  - surfaces and overlays: modal (closed);
  - navigation and data: sidebar, data-table;
  - charts: bar-chart;
  - AI part A: terminal (Arabic and English header zoomed), tool-call, chat-thread, task-rows;
  - AI part B: approval-card, ask-user-questions, sources, context-meter, insight-cards.
- **Also checked:** toast, dropdown and alert (ar-light, after).
- **Forced colours (ar-light-forced):**
  - forms: switch, checkbox, radio-group, slider;
  - files: file-dropzone, file-tree;
  - navigation and data: tabs, steps, pagination (zoomed against ar-light), sidebar, data-table, notification-list;
  - feedback: skeleton, progress, avatar-group;
  - AI parts: task-rows, tool-call, ask-user-questions, chat-composer, context-meter, thinking-state.
- **390 px:** approval-card, ask-user-questions, tool-call and data-table (both against before), tool-chips, chat-composer, sources, terminal, steps, date-picker. Task 7's carried mid-word break («الهد / ف») is gone.
- **Radius 0:** approval-card, sidebar, task-rows, tool-call, chat-composer.
- **Radius 16:** approval-card, chat-thread, sidebar, data-table, task-rows, file-dropzone, code-block.
- **en-light:** terminal, tool-call.
- **Full-page chrome:** `full/ar-light/task-rows.jpg`. The header, the woven band, the tray sidebar with its active paper chip, the rails, the prompt row and the notes tray match Docs §10.
- **Confirmed in the browser:**
  - ApprovalCard's `::before` colour in forced colours, before and after the fix;
  - the docs sidebar's geometry at scroll 0 and at the end of the page;
  - the two Sidebar chips and the CSS fix;
  - the Pagination forced-colours fix.
