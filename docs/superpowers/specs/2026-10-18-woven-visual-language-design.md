# Woven visual language: design

**Status:** Draft for review · 18 October 2026
**Branch:** `claude/woven`, cut from `claude/component-craft` at `aa1d0e3`
**Related specs:** [AI task patterns](2026-10-18-ai-task-patterns-design.md) · [Workbench docs and demo frame](2026-10-18-workbench-docs-design.md)
**Approved proposal:** https://claude.ai/artifact/3K7uiaG2SEpAWmmkERMTih (the "Look and feel" section and the live mockups)

---

## 1. Intent

The AI patterns proposal introduced a visual direction called **Woven (منسوج)**. It takes Tiraz's brand story, a thread that becomes fabric and then an interface, and turns it into rules: content on white paper resting on a tinted tray, one color reserved for AI, one color reserved for "needs you", a stronger type ladder, and calm, quick motion.

Amjed approved it and asked for three things:

1. **Every component** gets the same look and feel, not only the AI patterns.
2. **Adopt the fonts** used in the proposal if they are not already Tiraz's.
3. **Pay attention to every small detail.**

This spec defines the foundations (fonts, type scale, color roles, surfaces, radii, states, status vocabulary, motion), then the exact change for each of the 68 component families. It also lists every inconsistency and defect the inventory found, each fixed as part of the restyle.

The inventory behind it (18 October 2026) read `tokens.css`, `config.ts`, `Provider.tsx`, all 6,992 lines of `components.css` and every component file. A few cascade issues were confirmed in headless Chromium.

## 2. Decisions already made

1. **Woven applies to all 68 families**, the documentation workbench and the two example screens (Amjed, 18 Oct).
2. **Fonts: no new face; the examples' setting is adopted.** The font Amjed liked is the one in the proposal's AI pattern examples. Measured, it is Tiraz's own IBM Plex Sans Arabic; what differs is its setting (16/600 titles, 15.5 px reading text at 1.95 line height, 12.5 px small text), which section 7 adopts (Amjed, 18 Oct).
3. **Field borders meet WCAG 3:1** (Amjed, 18 Oct; section 12).
4. **The in-flight numerals setting and the browser-test repairs from other worktrees join this branch** (Amjed, 18 Oct; sections 19 and 21).
5. **AI patterns** and **docs** are specified separately and build on this spec.

Calls made by the author and open to change are marked **(call)**.

## 3. Goals

- **G1. One language.** Every family uses the same surfaces, radii, type roles, states and motion, defined once as tokens.
- **G2. Foundations as tokens.** The type scale (the examples' setting), color roles (including AI and attention), surfaces (page, tray, paper, well, floating, overlay), the radius scale, state tokens (hover, press, focus, selection, disabled, invalid, read-only), the status vocabulary and the motion budget.
- **G3. One of each.** One control height per size, one focus recipe per control kind, one hover mechanism, one selection style, one press scale, one disabled treatment, one invalid treatment, one status vocabulary, one spinner, one shimmer, one skeleton.
- **G4. Every defect found is fixed** (section 18).
- **G5. Nothing breaks.** No public API changes except additive ones. `SystemConfig` keeps its shape and accepts every value it accepts today. The 806 tests keep passing, updated only where they assert something this spec changes on purpose.

## 4. Non-goals

- New component families (they are in the AI patterns spec).
- Behavior changes beyond motion, visual state and the listed defect fixes.
- New `SystemConfig` fields beyond `numerals` (`"arab" | "latn"`, default `"arab"`), which joins from the in-flight numerals work at Amjed's request. The AI and attention colors are fixed reserved colors, so they need no option.
- New chart types or a new chart palette.
- The landing page (paused). It shares the accent with the system but has its own fonts (Thmanyah Sans and Thmanyah Serif Display, loaded with `local()` only), and this spec does not change it.

## 5. Anti-goals

The restyle fails, even if it technically works, if:

- AI color, the star mark or the thread appear on content the assistant did not produce.
- Decoration creeps into dense data screens (tables, forms, dashboards).
- Any text drops below WCAG AA contrast in either theme with any accent, or color becomes the only signal.
- Keyboard actions animate, or everyday controls bounce (spring overshoot).
- Arabic shaping breaks: letter-spacing, uppercase transforms or italics applied to Arabic.
- A font loads from a remote server.
- The dark theme is an inverted light theme rather than a designed one.

## 6. Constraints

- **Source-owned bundle.** Hosts copy `src/system`. Fonts are bundled locally through Fontsource; no remote requests (README:90).
- **`font-synthesis: none`** is set on the root (tokens.css:111). Every weight a token uses must be bundled, or the browser falls back to the nearest bundled weight.
- **RTL first.** Logical properties only; every family must also work in LTR.
- **Provider.** It sets `--action`, `--radius` and `color-scheme` inline, and nests: the workbench renders a chrome provider and a preview provider. Overlays portal into the provider element, so tokens cascade into them.
- **Forced colors.** Keep the transparent borders that exist for Windows High Contrast.
- **Tests.** No unit test reads CSS. The Playwright scripts in `tests/browser` are manual evidence tools; 21 of their assertions check computed fonts and radii, and some are already stale.

## 7. Typography

### 7.1 Faces

**No font is added.** Amjed confirmed on 18 October that the font he liked is the one in the proposal's AI pattern examples. Measured in Chromium (`CSS.getPlatformFontsForNode`), every Arabic glyph in those examples is drawn in **IBM Plex Sans Arabic**, the same face Tiraz bundles today. The workbench's ApprovalCard title, its body text and the examples' titles and answers all report that face.

What he saw is the **setting** of the type:

| Element | Tiraz today | The examples |
| --- | --- | --- |
| Card and pattern titles | 18 px, weight 500 | 16 px, weight 600 |
| Reading text | 14 px, line height 1.8 | 15.5 px, line height 1.95 |
| Small text | 12 px | 12.5 px |

A side-by-side render of the same Arabic text in both settings was shared with him. This spec adopts the examples' setting through the type scale below (`--text-subheading`, `--text-reading`, `--text-meta`).

| Role | Family | Weights | Change |
| --- | --- | --- | --- |
| UI, reading and titles | IBM Plex Sans Arabic (Latin from the same family) | 400, 500, 600 | none; titles use 600 at the new display sizes |
| Mono | the existing stack (`ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", "DejaVu Sans Mono", "IBM Plex Sans Arabic", monospace`) | system | none; IBM Plex Sans Arabic stays before `monospace` so Arabic inside code still joins |

Stacks:

- `--font: "IBM Plex Sans Arabic", system-ui, sans-serif`. The only change is a real fallback before the generic `sans-serif`.
- `--font-mono` is unchanged.

Mono is used only for machine values: code, tool IDs, key hints, file names. Today some human values use mono, for example LoadingState's elapsed time and the CodeBlock language label. They move to Plex with tabular figures (section 17).

The proposal page itself also used other faces for its own chrome (a Kufi display face on demo names, a mono face on labels). Those were page styling, not part of the examples, and are not adopted. **(Decided with Amjed.)**

### 7.2 Type scale

| Token | Standard | Large | Leading | Weight | Face | Role |
| --- | --- | --- | --- | --- | --- | --- |
| `--text-display` (new) | 30 px | 34 px | 1.3 | 600 | Plex | page titles |
| `--text-title` (existing, today unused in components) | 24 px | 26 px | 1.35 | 600 | Plex | section headings, Markdown h1 |
| `--text-heading` | 18 px | 20 px | 1.5 | 600 | Plex | card, dialog and panel titles |
| `--text-subheading` (new) | 16 px | 18 px | 1.5 | 600 | Plex | titles inside compact cards and patterns: AI pattern headers, ApprovalCard, AskUserQuestions, ToolCall and TaskRows titles, popover titles. These are 18 px at weight 500 today. |
| `--text-reading` (new) | 15.5 px | 17 px | 1.95 | 400 | Plex | long Arabic reading: AI answers, drafts, Markdown body, dialog descriptions |
| `--text-body` | 14 px | 16 px | 1.8 | 400 or 500 | Plex | controls and body |
| `--text-label` (new) | 13 px | 15 px | 1.6 | 500 | Plex | chips, tags, sidebar and tree items, step labels, the 13 px sizes computed today |
| `--text-meta` | 12.5 px (was 12) | 14 px | 1.6 | 400 or 500 | Plex | help, timestamps, descriptions in rows |
| `--text-micro` (new) | 11 px | 12.5 px | 1.4 | 500 | Plex or mono | key hints, tool IDs, citation numbers, tags inside menus |
| `--text-figure` (new) | 28 px | 32 px | 1.25 | 600 | Plex, tabular | KPI values, totals |
| `--text-figure-small` (new) | 20 px | 22 px | 1.3 | 600 | Plex, tabular | amounts in headers and rows |

Rules:

- Every literal size in `components.css` maps to a token. The ten hard-coded 10 and 11 px sizes become `--text-micro`. The `calc((body + meta) / 2)` sizes become `--text-label`. Today none of them grow with `typography="large"`; after the change they all do.
- Leading becomes tokens: `--leading-display 1.3`, `--leading-title 1.35`, `--leading-heading 1.5`, `--line-height 1.8` (body, existing), `--leading-reading 1.95`, `--leading-meta 1.6` (also used by labels), `--leading-micro 1.4`, `--leading-figure 1.25`. These match the table above. The 20+ literal line heights map to them.
- Conversation text (user bubbles, the composer input, answers, drafts) uses the `--text-reading` size; bubbles and inputs keep the body leading of 1.8. The examples used a few in-between sizes (14.5 and 13.5 px); the scale rounds them to the nearest token.
- One heading weight: 600. AskUserQuestions' 18/500 heading and InsightCards' 14/500 titles move to the ladder.
- **Arabic typography.** No letter-spacing, no `text-transform`, no italics on Arabic. Uppercase and tracking are allowed only for Latin eyebrows in the docs (`:lang(en)`). Headings use `text-wrap: balance`, body text `text-wrap: pretty`. Underlines keep `--underline-offset` (0.24em; 0.45em in RTL) so they clear Arabic dots.
- **Figures** use `font-variant-numeric: tabular-nums` and are aligned to the end in tables.

### 7.3 Text tiers

Today `--text-muted` (#5f6b62) is slightly *darker* than `--text-secondary` (#616b64) in light mode, so there is no real third tier. New values, all at least 4.5:1 on paper, tray and well in their theme:

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--text` | #232a26 (unchanged) | #ecf0ec (unchanged) | primary |
| `--text-secondary` | #56615a | #adb9af (unchanged) | supporting text, labels in rows |
| `--text-muted` | #616b64 | #9ba8a0 | meta, placeholders, timestamps |

The hierarchy comes mainly from size and weight; color separates three tiers only modestly, because a lighter muted gray would fail AA on the tray. Computed on 18 October 2026:

- **Page, tray, paper and well, both themes.** The lowest pair is `--text-muted` on the light tray and well, at 4.74:1.
- **Soft tones** (section 20). The lowest is dark `--text-muted` on `--ai-soft`, at 4.59:1.
- **Hover washes.** The lowest is light `--text-muted` on the page under `--wash-strong`, at 4.58:1.

A first draft darkened both dark tiers (#a5b0a9 and #8e9a93). That put muted text at 3.88:1 on the AI tint, so planning kept today's dark secondary and raised muted's lightness only. Every AI and attention pair in section 8.2 is 5.1:1 or better on paper, tray and its soft fill. The existing success, danger and info colors also pass on every surface. The builder keeps these checks as the contrast test (section 20) and adjusts lightness, never hue, if a later value fails.

## 8. Color roles

### 8.1 Existing roles

Surfaces, text, borders, `--action` (accent), `--success`, `--danger`, `--info`, `--focus`, the code colors and the chart colors keep their names. Values change only where listed.

### 8.2 New roles

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--ai` | #4b47c6 | #aba7ff | AI presence: star mark, working thread, AI spinners, citations, the "prepared by the assistant" label |
| `--ai-soft` | `color-mix(in srgb, var(--ai) 11%, var(--surface))` | `color-mix(in srgb, var(--ai) 18%, var(--surface))` | AI chips and tags |
| `--attention` | #935200 | #f1b45e | "needs you" and the warning tone |
| `--attention-soft` | `color-mix(in srgb, var(--attention) 12%, var(--surface))` | `color-mix(in srgb, var(--attention) 16%, var(--surface))` | backgrounds of attention pills and panels |

**These colors are fixed.** They do not change with the accent; the approved proposal says "status colors never move: amber waits for you". They are defined in `tokens.css` next to the success, danger and info pairs; the Provider does not set them.

Tiraz offers twelve accents, and some sit close to these reserved colors: `indigo`, `blue`, `plum` and `slate` near the AI indigo; `amber` and `clay` near the attention amber. A first draft switched to fallback colors for those accents. Review showed the fallbacks collide with other roles:

| Fallback | Collides with | Gap |
| --- | --- | --- |
| vermilion attention | clay accent | 1.3° |
| vermilion attention | danger | 17.6° |
| teal AI | success | about 30° |

The hue space of twelve accents plus five semantic colors is too crowded for any color-only rule. So meaning never rests on color alone:

- AI content always carries the star mark or the thread, and an AI label where it is a whole block.
- "Needs you" always carries the "!" glyph and the word بانتظارك.
- Every status has its glyph and word (section 13).

The documentation notes that the indigo, blue, plum and slate accents bring the accent close to the AI color, and the amber and clay accents bring it close to attention. **(call)**

A new `tokens.test.ts`, beside `config.test.ts`, holds these checks, because they read `tokens.css`:

- `--ai` and `--attention` reach 4.5:1 on paper, tray and their soft fills in both themes.
- The reserved and semantic colors (AI, attention, success, danger, info) are pairwise distinguishable: at least 0.08 apart in OKLab distance. **(call)** Measured on 18 October 2026:
  - The closest pairs are attention and danger in light mode (0.091), and success and info in dark mode (0.100). All five pass.
  - For comparison, the accents closest to the reserved colors are amber (0.038 from attention), clay (0.051 from attention) and indigo (0.081 from AI). That is why meaning never rests on color alone.

**Code colors must not borrow the AI color.** Today `--code-literal` (#5b4fc4 / #aea8ff) is effectively the AI indigo, which would put AI color on code the assistant did not write. It moves to a rose hue: #9b3a6c light (6.0:1 on the well) and #f0a5cb dark (9.0:1), 0.20 away from the AI color in OKLab.

**Focus** stays `var(--action)`. The AI color never replaces the focus ring, even inside AI components, so keyboard focus looks the same everywhere.

### 8.3 Tones

`BadgeTone` (`Badge.tsx:3`, reused by Alert) gains `warning` (attention colors) and `ai` (AI colors), additively. Toast gains `warning`. Today there is no warning tone anywhere.

## 9. Surfaces

| Role | Token | Light | Dark | Used for |
| --- | --- | --- | --- | --- |
| page | `--surface-page` | #f7f8f7 (unchanged) | #161b18 (unchanged) | app background |
| tray (new) | `--surface-tray` | #eceeea | #121714 | trays, sidebars, segmented lists, dropzones, table headers, dialog footers |
| paper | `--surface` | #ffffff | #1c221e | content surfaces |
| well (renamed from code surface) | `--surface-well` | `color-mix(in srgb, var(--surface-tray) 55%, var(--surface))` | same formula | code, tool output, details panels inside paper |
| subtle | `--surface-subtle` | unchanged | unchanged | kept for compatibility; new rules use tray or wash |

Shadows:

- `--shadow-paper` (new) formalizes today's `--shadow-surface` ring: light `0 0 0 1px rgb(18 35 26 / 7%), 0 1px 2px rgb(18 35 26 / 5%), 0 10px 24px -16px rgb(18 35 26 / 30%)`; dark `0 0 0 1px rgb(255 255 255 / 7%), 0 12px 28px -18px rgb(0 0 0 / 80%)`. `--shadow-surface` remains an alias.
- `--shadow-chip` (new) for small paper on a tray: light `0 0 0 1px rgb(18 35 26 / 10%), 0 1px 2px rgb(18 35 26 / 6%)`; dark `0 0 0 1px rgb(255 255 255 / 10%), 0 1px 2px rgb(0 0 0 / 40%)`.
- `--shadow-control`, `--shadow-raised`, `--shadow-pressed`, `--shadow-popover`, `--shadow-overlay`, `--shadow-thumb` keep their values.
- No literal shadow colors in component rules. Today the composer's shadow `#12231a24` is the same in dark mode (`components.css:4926, 4935`); it moves to `--shadow-paper`.

**Composition rules.**

1. **Content on paper; status, meta and decisions on the tray.** This is the system-wide reading of the AI anatomy. Outside AI it applies to dialog footers, card footers, the DataTable footer and the sidebar.
2. A tray holds paper with `--tray-pad` around it: 5 px at both densities, so the radius scale (section 10) gives the same corners whatever the density.
3. Never a tray inside a tray, never a card inside a card.
4. Paper padding by density: standard 16 px block × 18 px inline; compact 14 × 16.
5. Edges are rings or hairlines (`--hairline`), not 1 px borders. These still use a 1 px `--border` today and move to rings and hairlines: Alert, ChatApp, the Sheet's side edge, the ModelSelector trigger, the chart tooltip, and the NotificationList and ContextMeter dividers.

## 10. Radii

One scale derived from `--radius` (r; default 8; the workbench offers 0 to 16):

| Token | Formula | r = 0 | r = 2 | r = 8 (default) | r = 16 | Used for |
| --- | --- | --- | --- | --- | --- | --- |
| `--radius-small` | `max(2px, r − 3px)` (unchanged) | 2 | 2 | 5 | 13 | checkbox, kbd, small tags, swatches |
| `--radius-item` (new) | `r` | 0 | 2 | 8 | 16 | menu items, options, navigation and tree rows, list rows |
| `--radius-control` (new) | `r × 1.25` | 0 | 2.5 | 10 | 20 | buttons, inputs, selects, segments, chips with text |
| `--radius-paper` (new) | `min(24px, max(--radius-control, r × 1.875))` | 0 | 3.75 | 15 | 24 | cards, popovers, dialogs, toasts, tables, paper inside trays |
| `--radius-tray` (new) | `--radius-paper + min(--tray-pad, r × 0.625)` | 0 | 5 | 20 | 29 | trays |
| `--radius-pill` (new) | `r × 999` | 0 | pill | pill | pill | status pills, switch tracks, round send and icon buttons, chips |
| `--radius-panel` (existing) | alias of `--radius-paper` | 0 | 3.75 | 15 | 24 | kept for compatibility |

The formulas keep three properties across the whole 0–16 range:

- paper is never squarer than the controls inside it;
- paper stops at 24 px, so cards, dialogs and tables never turn into blobs at r = 16 (an unclamped formula gives 35 px);
- the tray is exactly concentric with its paper at the default and above, and density does not change any corner (`--tray-pad` is 5 px at both densities).

- Circles stay circles only where shape carries meaning (status discs, radio, avatar photos).
- Every literal radius (5, 6, 9, 10, 12, 16, 18, 20, 22, 100 px, 999 px) and every multiplier (× .6, × .5, + 4 px, + 10 px) maps to the scale. That is 15 different formulas and 9 literals in `components.css`.
- At r = 0 every surface and control is square, including pills. That is what someone choosing 0 expects. Only `--radius-small` keeps its existing 2 px minimum.
- Concentric corners: an inner surface's radius equals the outer radius minus the gap between them (tray 20, pad 5, paper 15).

## 11. Sizing and density

- **One height per size.** `size="sm"` uses `--control-small` (32 compact, 36 standard); `size="md"` uses `--control-height` (36, 40). Every field-like control follows it exactly. Measured today at sm: ColorPicker 34 px, DatePicker trigger 36, TagInput 36.4, OTP 36 instead of 32.
- **Fixed sizes become tokens:** switch track (38 × 22), switch thumb (16), slider track (6) and thumb (18), remove buttons (24), status discs (22), avatars (32 and 40: no more fractional 33.6 px), chat avatar (24).
- Density applies to paper padding, NotificationList rows (fixed 12 px today), Toast padding (fixed 16) and AskUserQuestions (fixed 16).

## 12. Interaction states

| State | One rule |
| --- | --- |
| Hover | Neutral fills use `--wash` (4% text); pressed or active fills use `--wash-strong` (7%). Primary buttons keep `--action-hover`. Field borders darken 22% toward text. On a tray, hoverable rows keep their text at `--text` or `--text-secondary`: muted text on a hovered light tray falls to 4.40:1 (found while planning). **Every** hover rule sits inside `@media (hover: hover) and (pointer: fine)`. Twelve rules are not gated today (`components.css` 1030, 1033, 1890, 1992, 2425, 3080, 3169, 3728, 3956, 5231, 5592, 6569). |
| Press | `--press-scale: 0.97` on every pressable: buttons (icon-only too), chips, segments, swatches, the send button, legend items, navigation items. Released with `--ease-out`, never the spring. This replaces today's .9, .92, .94, .95 and .96 scales and the 1.06 and 1.12 growth. |
| Focus | Pressables: a 2 px `--focus` outline at a 2 px offset (the global rule). Rows inside scroll containers (tabs, sidebar, tree, menus, options): the same outline inset at −2 px, so overflow never clips it. Field-like controls, and containers that focus as a field (dropzone, color entry): the border turns `--focus` plus a 3 px `--focus-halo`. |
| Field boundary | Field-like controls (Input, Textarea, Select trigger, DatePicker trigger, OTP slots, the TagInput shell, the ColorPicker entry) and checkbox and radio edges use the new `--border-field`: #848a85 light (3.31:1 on page, 3.53:1 on paper, 3.02:1 on the tray) and #5f6f65 dark (3.28, 3.04 and 3.41:1). This meets WCAG 1.4.11 (Amjed, 18 Oct). Today `--border-strong` (#c5cec7) gives 1.38 to 1.61:1. `--border-strong` keeps its value for secondary buttons and dashed edges, which their text or role already identifies. Hover darkens the field border 22% toward text, as today. |
| Selection | Rows, navigation items, pages and tabs: `--action-soft` background, `--action` text, weight 500. Binary controls (checkbox, radio, switch, calendar day): solid accent. On a tray, the selected item can instead be a paper chip (`--surface` + `--shadow-chip`), as in the segmented control and the sidebar. |
| Disabled | `--disabled-opacity: 0.5`, no shadow, no hover, `cursor: not-allowed`. Replaces .4, .45, .48 and .55, and the text-only treatment on radio options. |
| Invalid | Field-like controls: `--danger` border, a danger halo on focus, and an error message tied with `aria-describedby`. **No shake** (call): today's shake is not mirrored for RTL and also plays on mount and on keyboard submit. Focus moving to the first invalid field carries the signal instead. Applies equally to Input, Textarea, Select, DatePicker, OTP, TagInput (whose halo is the accent today), Slider (an outline today), ColorPicker, Checkbox, RadioGroup and FileDropzone. Switch has no invalid state and keeps none. |
| Read-only | Well background (`--surface-well`), the same `--border-field` boundary (a read-only field is still an active, focusable component under WCAG 1.4.11), no shadow, normal text color, no caret. Applies to Input, Textarea, TagInput and OTP. `:read-only` is restricted to `input, textarea`, which fixes the DatePicker trigger, a `<button>` that is grey today by accident. |
| Loading | `aria-busy` plus a visible state: a spinner inside the control, or skeleton rows for data (DataTable has no loading visual today). |

**Required marker.** The asterisk moves from `--danger` to `--text-secondary`, so danger means only "something is wrong". **(call)**

## 13. Status vocabulary

One vocabulary for everything that has a status (tasks, tool calls, steps of agent work, terminal runs, approvals, uploads):

| Status | Color | Glyph (shared `StatusIcon`) | Words (Arabic / English) |
| --- | --- | --- | --- |
| pending | neutral | dashed ring, number when ordered | لم تبدأ / Not started |
| running | `--ai` when the assistant is the actor; `--text-secondary` otherwise | arc spinner | يعمل / Running |
| needs you | `--attention` | "!" on a filled disc | بانتظارك / Needs you |
| completed | `--success` | check on a filled disc | اكتمل / Done |
| failed | `--danger` | × on a filled disc | تعثّر / Failed |
| stopped | neutral outline | small square | أُوقف / Stopped |
| skipped | neutral, dashed | dash | تُخطّي / Skipped |

Today "completed" is the accent in ToolStatus and the TaskRows disc but green in Terminal, the TaskRows badge and the decision receipts; "running" is the accent on indicators but info blue on badges; "failed" is an × in one place and an alert icon in another. All converge on the table above. Badge tones on TaskRows follow the indicator.

**Steps keep their own progress vocabulary.** Steps shows where a person is in a process they drive (a wizard), not system status: completed steps are an ink disc with a check, the current step has an accent ring, an error step is danger. **(call)**

## 14. AI identity

Used only where the assistant acts or produced the content:

- **`--ai`** for working indicators, citations and AI labels.
- **The eight-point star** (`AIMark`) replaces the generic sparkle and ThinkingIndicator's morphing glyph. While working it turns a quarter step on a loop; since the star is symmetric, it never looks tilted at rest.
- **The stitch line** (`Thread`) travels in the reading direction while working and closes into a solid line when done.
- **One shimmer** (`tz-shimmer`) for working labels. It sweeps in the reading direction, so it reverses in RTL (today `tz-ai-shimmer` does not, while `tz-text-shimmer` does), and it becomes a static color under reduced motion.
- **Word settle** for streamed text (whole words, blur and fade, 300 ms).
- **Weave reveal** for generated images (AI patterns spec).

Five "working" indicators exist today: the rotating LoaderCircle, the pixel grid, the morphing glyph, the pulsing dot and the sliding bar. After the change:

- AI working uses the star and the shimmer label.
- Generic loading uses one neutral spinner.
- Progress uses the bar.

LoadingState keeps its `variant` values (`drive | dots | orbit`, a public API) but renders them in neutral colors.

## 15. Motion

**Budget.** Interface motion stays between 90 and 240 ms.

| Use | Duration | Easing |
| --- | --- | --- |
| Press | 90 ms in; release 160 ms | `--ease-out` |
| Hover and color | 120 ms | `ease` |
| State change | 200 ms | `--ease-out` |
| Enter (popovers, menus, tooltips) | 180 ms, scale 0.97 from the trigger's transform origin | `--ease-out` |
| Exit | 120 ms | `--ease-exit` |
| Dialogs | 220 ms in, 150 ms out (was 280) | `--ease-out` / `--ease-exit` |
| Sheets | 280 ms in, 200 ms out (was 420 and 260) | `--ease-drawer` |
| Toasts | 240 ms in, 150 ms out (was 420) | `--ease-drawer` |
| Expand and collapse | 200 ms in, 150 ms out | `--ease-out` |
| Indicators that move (tabs, selection glide) | 200 ms | `--ease-in-out` |
| Stagger | at most 40 ms apart, at most 4 items; the rest appear together | — |

Allowed exceptions, all decorative and all stopped by reduced motion:

- AI loops: stitch 800 ms, shimmer 1,900 ms, star turn 1,800 ms.
- Skeleton sweep: 1,600 ms.
- Image weave: up to 1,200 ms.
- Countdowns: linear, as long as they last.

These run over 240 ms today and are brought into budget:

| Today | Duration |
| --- | --- |
| Panel tokens | 420 / 260 ms |
| Modal | 280 ms |
| Accordion | 260 ms |
| Messages and cards rising | 300 ms |
| Approval receipt fold | 380 ms |
| Thinking panel | 320–370 ms |
| Streamed words | 360 ms |
| Progress fill and context ring | 400 ms |
| Image reveal | 700 ms |
| Glyph pop | 320 ms |
| Check draw | 340 ms |
| OTP ripple | 400 ms + stagger |

**Motion only after change.** Persistent content never animates on mount. Fixed:

- AskUserQuestions and ApprovalCard rising on every mount.
- The chat's last message replaying its entrance whenever an earlier message becomes last.
- Status glyphs popping and drawing on mount.
- OTP digits and the completion ripple playing when a value is prefilled.
- The invalid shake playing on mount.

The existing `useChanged` and `Tick` rules apply everywhere.

**Input modality.** The Provider sets `data-modality="keyboard"` on keydown (Tab, arrows, Enter, Space, Escape, Home, End, letters and digits) and `data-modality="pointer"` on pointerdown, on its root element. Under keyboard modality:

- no transform or opacity animation for overlays, menus and selects opening or closing;
- no glide of the selection highlight;
- no expand or collapse animation;
- no cascades, no press scale, no check drawing;
- the tab indicator and switch thumb jump;
- color changes are instant.

This is the precedent the `data-theme-switching` kill switch (tokens.css:209–214) already sets, generalized. Tooltip's existing `data-instant` stays.

**Reduced motion.** The existing rule (all motion tokens to 0 and a global override) stays. Decorative loops stop: the shimmer becomes a static color, the stitch a static line at 45% opacity, the star stops, the weave becomes a 200 ms crossfade, and streamed words fade without blur.

**Tokens.**

- Kept: `--motion-press`, `--motion-fast`, `--motion-state`, `--motion-enter`, `--motion-exit`.
- Changed: `--motion-enter` 220 → 180 and `--motion-exit` 150 → 120 for popovers, with new `--motion-dialog-*` for dialogs; `--motion-panel` 420 → 280 and `--motion-panel-exit` 260 → 200.
- New: `--motion-release` 160 (press release), `--motion-toast` 240, `--motion-toast-exit` 150, `--motion-collapse` 200, `--motion-collapse-exit` 150, `--motion-stagger` 40, `--motion-word` 34 (word interval), `--motion-loop-stitch` 800, `--motion-loop-shimmer` 1,900, `--motion-loop-turn` 1,800 and `--motion-loop-skeleton` 1,600. The release, exit and skeleton tokens give the durations in the tables above a name, so no component rule needs a literal time.
- `--ease-spring` stays defined but unused by everyday controls.
- The seven written-out `cubic-bezier(0.23, 1, 0.32, 1)` and the plain `ease` keyword at `components.css:4290` become tokens.

## 16. Icons

- Lucide stays. Sizes: 16 px in controls, 14 px in chips and meta, 12 px at micro size.
- Icons that imply direction mirror in RTL with the existing `tz-mirror-rtl` class. Fixed: the InsightCards "open" arrow and the EmptyState illustration arrow that rises to the right.
- Status glyphs come from the shared `StatusIcon` (section 13).
- EmptyState illustrations use the Woven materials: a tray wash, paper with a ring and accent lines.

## 17. Per-family changes

"Paper", "tray", "well", the radius names, "field recipe", "row focus" and the state rules refer to sections 9 to 15. Each family also gets the motion budget, modality rules and pointer-gated hovers, so these are not repeated.

### 17.1 Forms

| Family | Changes |
| --- | --- |
| Button | `--radius-control`. Every variant uses the 0.97 press, icon-only too (was .94). Disabled is 0.5 (was .48). Loading keeps full opacity, shows the spinner and blocks clicks. The label's blur-in on state change stays at 200 ms. The glyph pop drops from 320 ms with spring to 200 ms ease-out, and the check draw from 340 ms to 200 ms. No scale on keyboard Space. |
| Input, Textarea, Select | Paper with an inset `--border-field` ring and `--shadow-control`; `--radius-control`; exact heights per size; field recipe; invalid and read-only as defined; no shake. Textarea padding uses padding tokens, not `--control-gap`. **Select popup:** `--radius-paper`, `--shadow-popover`, 180 / 120 ms from the trigger (opacity-only 120 ms today, no exit). Options use `--radius-item`. The highlight glide uses `--wash-strong` over 180 ms with pointer and is instant with the keyboard. The trigger shows its open state, with a chevron rotated 180°. The dead `action-soft` highlight rule (912–915) is removed. |
| Field | Label `--text-label`, weight 500, color `--text`. Help and error `--text-meta`. Required asterisk `--text-secondary`. |
| Checkbox, RadioGroup | 18 px boxes at `--radius-small`, on paper with `--border-field`. Hover turns the border accent (fine pointer only). Press 0.97 (was .9). Checked: solid accent. The check draws in 160 ms (was 40 ms delay plus 260 ms), the radio dot scales in 160 ms with ease-out (no spring), and both are instant with the keyboard. Controls align to the first line of multi-line copy (today only the AI variant does). The base `.tz-radio-copy` and `.tz-radio-description` rules move from the AI section (6200–6209) to Forms. Indeterminate stays out of scope. |
| Switch | Track and thumb sizes become tokens. Thumb travel is 200 ms ease-out (240 ms spring today). The press stretch is removed. Keyboard Space toggles instantly. |
| Slider | The thumb uses `--surface` (hard-coded `#fff` today, white in dark mode too). No growth on press. Invalid uses the field recipe on the thumb (an outline today). |
| OTPInput | Slots honor `size` (36 px at sm today), use `--radius-control` and the field recipe. Typed digits appear without animation (typing is keyboard). The completion ripple is removed, and on completion the slots briefly take the success border color. No animation when prefilled. No shake. |
| DatePicker | The trigger honors `size` (36 px at sm today) and loses the accidental grey (the `:read-only` fix). Popup: `--radius-paper` from the trigger. Fixed: a hovered selected day shows white text on light grey (specificity: `button:hover:enabled` 0,3,1 beats `.rdp-selected .rdp-day_button` 0,3,0). Day hover is fine-pointer only. Day press 0.97 (was .92). Today and Clear become real `Button`s with `size` and `state` (36 px raw buttons today). |
| TagInput | The shell matches Input exactly (36.4 px at sm today). Tags: tray chips with `--radius-small` and `--text-label`. Remove buttons use the shared icon-button variant. Invalid uses a danger halo (the accent today). Tags appear without the pop (added by Enter, a keyboard action); tags added by paste fade in over 120 ms. |
| ColorPicker | The entry becomes a field (paper, `--shadow-control`, hover border, field recipe); today it has no shadow, hover or transition. Swatches: `--radius-small`. Selected swatch: a paper gap plus an ink ring, with no growth (scales to 1.06 today). Press 0.97. |
| InputCopy | A read-only Input. The copy control uses the shared icon-button variant. On success the icon swaps to a check with a 160 ms color change, without the pop. |

### 17.2 Files

| Family | Changes |
| --- | --- |
| FileDropzone | A tray with a dashed `--border-strong` edge at `--radius-paper`. While dragging: `--action-soft` with a dashed accent edge. Focus uses the field recipe. File rows are paper chips on the tray at `--radius-item`, with the shared remove button. The paperclip lifts 2 px over 160 ms (today: rotation and scale on a spring). New rows fade and rise over 160 ms; only the first three are staggered. |
| FileTree | Rows use `--radius-item` (matching the sidebar) and `--text-label` (12 px today). Hover `--wash`; selected uses the selection rule. Focus uses the row ring on the row only. Today the wrapping `li` also gets the global ring, because its `outline: none` (0,1,0) loses to the global rule (0,2,0). Chevron 120 ms, instant with the keyboard. |

### 17.3 Navigation

| Family | Changes |
| --- | --- |
| Sidebar | The surface becomes the tray (subtle today, which already reads as a tray). Items use `--text-label` (the whole sidebar is 12 px today), `--radius-item`, hover `--wash`. The active item is a paper chip with weight 500 (today an accent tint). Press 0.97 (today none). The width animation stays at 200 ms, as a documented layout-animation exception, and is skipped under keyboard modality and reduced motion. The chevron gets a transition. |
| Tabs | Underline variant: the list keeps a hairline baseline. The indicator moves over 200 ms ease-in-out (260 today) and jumps with the keyboard. The active label is `--text` at weight 500, while the indicator carries the accent **(call)**. Segment variant: a tray list with a paper active pill (already close). Focus uses the inset row ring, because the list's overflow clips the outer ring today. The panel fades in over 160 ms with pointer changes only. |
| Breadcrumbs | Hover fine-pointer only; the transition uses tokens (the browser's `ease` keyword today). The current item is `--text` at 500. The separator stays mirrored. |
| Pagination | Buttons use `--radius-control`. The current page keeps the selection rule. Numbers stay Arabic-Indic. |
| Steps | Its own progress vocabulary (section 13). Connectors are hairlines. The current ring closes from 6 px to 2 px over 200 ms, with pointer changes only. The button variant's hover underline is fine-pointer only. |

### 17.4 Data

| Family | Changes |
| --- | --- |
| Table | Paper at `--radius-paper` (8 px today, while cards are 12). The header row sits on the tray tint, in `--text-secondary` at `--text-label`, weight 500. Row dividers become hairlines (1 px borders today, while the outer edge is a ring). Cell padding uses padding tokens; today it borrows the tab token. Numbers are tabular and end-aligned. |
| DataTable | Row hover is `--wash` only, fine-pointer only; the duplicate rule at 1033 is removed. Sorted column: the header text is `--text` with an accent icon, and hover no longer overrides the sorted color. Loading shows skeleton rows (today only `aria-busy`). The footer, with pagination, sits on a tray band. |
| Timeline | The rail becomes a hairline, the dot stays neutral, times are `--text-meta` and isolated. No status colors (events are history, not status). |
| FilterBar | The search field is a paper field. Chips are tags. Remove buttons use the shared variant; today the Button hover rule (0,5,0) hides the chip's remove hover, so hovering shows no change. |

### 17.5 Display and feedback

| Family | Changes |
| --- | --- |
| NotificationList | Dividers become hairlines. Row padding follows density (fixed 12 px today). Rows get a `--wash` hover. The unread dot stays accent. Disabled actions use the disabled rule. |
| Card | Paper at `--radius-paper`. The title stays Plex at `--text-heading` 600. A footer slot, when present, sits on a tray band (decisions on the tray). |
| Accordion | Paper at `--radius-paper` (8 px today, while Card is 12 under the same rule), with hairline dividers. Open item: `--text` at weight 500 (the accent today) **(call)**. Height animates 200 / 150 ms with pointer changes only. The chevron takes 200 ms (260 today). |
| Avatar, AvatarGroup | Sizes become integers: 32 and 40 px (33.6 and 39.2 px today). The separator ring uses `--avatar-ring`, which defaults to the surface the group sits on. The hover lift is removed. The `+N` count uses Arabic-Indic digits in Arabic and is no longer forced LTR. |
| Badge | Gains `warning` and `ai` tones. Keeps `--radius-small` (a label, not a status). Padding becomes tokens. |
| EmptyState | The title uses `--text-heading` at weight 600. The description uses `--text-reading` in `--text-secondary`. The illustrations use Woven materials and mirror their direction arrows in RTL. |
| Alert | Moves to the ring style: a tone-soft background, a hairline ring in the tone, and a new icon per tone. The title is `--text` at weight 600. The description is `--text-secondary` (today the default info tone colors all the text). Gains the warning tone. The default tone value stays `info`. |
| Toast | Paper at `--radius-paper` with `--shadow-popover`. Padding follows density. Enter 240 ms (420 today). Gains the warning tone. The 8 px gap is defined once: today it exists in JS (`TOAST_GAP`) and in CSS (`--toast-gap`). |
| Skeleton | Tray base; the sweep stays at 1,600 ms and RTL-aware. Shapes use radius tokens. |
| Progress | Tray track and accent fill. The fill animates with `transform: scaleX()` from the inline-start edge over 240 ms (today `inline-size` over 400 ms). |
| Spinner | The one neutral spinner, rotating every 800 ms. Gains an `ai` tone for AI contexts. |
| Tick | Unchanged: 200 ms, 2 px blur. |

### 17.6 Overlays

| Family | Changes |
| --- | --- |
| DropdownMenu | Paper at `--radius-paper` with `--shadow-popover`. Items use `--radius-item` and the `--wash-strong` glide (instant with the keyboard). Shortcut hints use `Kbd` in mono at `--text-micro`, so the menu and `.tz-kbd` match (mono 11 px versus the reading font today). Enter 180 ms and exit 120 ms from the trigger. Disabled items use the disabled rule (.4 today). |
| Tooltip | Paper at `--radius-control` with `--shadow-popover`. Gains a 100 ms exit (no exit today). The delay, warm window and grace timing stay. |
| Modal | Paper at `--radius-paper`. The title uses `--text-heading` at 600. The description is `--text-reading`. Footer actions sit on a tray band, primary last. 220 / 150 ms (280 in today). |
| Sheet | The side edge becomes a hairline (a 1 px border today). Positioning uses logical properties (physical `left` and `right` today). The title uses `--text-heading` at 600 and the footer a tray band. 280 / 200 ms (420 / 260 today). |

### 17.7 Charts

| Family | Changes |
| --- | --- |
| Line, Area, Bar, Donut charts | The tooltip becomes paper with `--shadow-popover` at `--radius-control` (1 px border today) and padding tokens. Axis and legend text use `--text-meta` 12.5 px. Grid lines use `--hairline` in the existing dash pattern. Legend items use `--radius-small`, a fine-pointer hover and the 0.97 press. The palette and marks are unchanged, the time axis still runs left to right, and digits stay Arabic-Indic. |

### 17.8 AI parts (visual changes only; behavior in the AI patterns spec)

This phase changes CSS and existing markup only. Rows below that need a part which does not exist yet are delivered by the AI patterns spec when it builds that part (its build step 2), not here:

- the AIMark in ThinkingIndicator and ThinkingState;
- the attention pill on decisions;
- the tray and paper anatomy of AskUserQuestions, ApprovalCard and ApprovalFlow.

Until then those families get only the token, radius, type, status-color and motion changes in their rows.

| Family | Changes |
| --- | --- |
| LoadingState | Neutral colors. Elapsed time uses Plex tabular figures: it is a human value, not a machine one, and mono today. |
| ThinkingIndicator | AIMark instead of the morphing glyph. Label `--text-label`. The shared shimmer. |
| ThinkingState | AIMark instead of the sparkle. The panel opens in 200 ms (370 today). Steps use `--text-label`. Chevron 200 ms (320 today). |
| StreamingText, Markdown | Words settle over 300 ms (360 today). The caret uses `--ai`. Markdown headings follow the scale (h2 is a hard-coded 16 px today). |
| CodeBlock, Terminal | A well inside a paper ring at `--radius-paper`. Headers use the reading font for labels and mono only for machine values: CodeBlock's language label is mono today, Terminal's is not. Terminal states are neutral running, success completed and danger failed. Terminal's words and "exit N" are localized, with Arabic-Indic digits. |
| ToolCall, ToolChips | The status vocabulary. The tool name is mono at `--text-micro`. The panel opens over 200 ms ease-out (`ease` today). Glyphs pop only on change. Chips are pills at `--radius-pill`, with padding tokens and the 0.97 press. |
| TaskRows | Capsules are paper at `--radius-paper` (16 today); the list appearance is paper with hairlines. Indicators and badges follow one vocabulary. |
| ChatThread | User bubbles use the tray color, at `--radius-paper` with a `--radius-small` tail at the end-end corner. Only genuinely new messages animate. Actions reveal on hover (fine pointer) and always on focus-within. |
| ChatComposer, PromptEntry, PromptBar | Paper with `--shadow-paper` (fixing the hard-coded light shadow), at `--radius-paper`. Focus uses the field recipe. The send button is a pill. When empty, the disabled send keeps its shape on the tray color with a muted icon. Press 0.97 (.9 today). Suggestions are tray chips. |
| ChatApp | The shell is paper with a hairline. The sidebar is the tray. The header divider is a hairline. |
| AskUserQuestions, ApprovalCard, ApprovalFlow | Tray and paper anatomy (AI spec). Titles use `--text-subheading` (16 px at 600; 18 px at 500 today). Options use `--radius-item`. Key hints use `Kbd`. While waiting, the attention pill shows. The receipt fold takes 240 ms (380 today). No mount animation. |
| SelectionActions | A paper pill at `--radius-pill` with `--shadow-popover`. The inverted first action stays. Press 0.97. |
| ContextMeter | The ring uses `--ai` when normal, `--attention` at the high threshold and `--danger` near or over capacity. The status text takes the same color (never colored today). The popover is `--radius-paper` (8 today), with hairline dividers. |
| ModelSelector | The trigger becomes a paper ring (an outlined 1 px border today). The popup is `--radius-paper` (8 today) and gains a 120 ms exit. Literal 10 and 11 px sizes become `--text-micro`. |
| ImageResult | The frame is `--radius-paper`. Loading shows the tray with warp lines and an `--ai` glow. The plain reveal is a 240 ms crossfade (700 ms with blur today); the weave lives in Image generation. |
| Sources, InlineCitation | The trigger is a paper pill. Source marks become source icons on tray chips. The list is paper with `--radius-item` rows and a 120 ms close animation (none today). Citation numbers are `--ai-soft` chips with `--ai` text, in Arabic-Indic digits in Arabic. |
| InsightCards | Arabic-Indic position digits in Arabic. No nested Card. Titles follow the ladder. Switching findings fades over 160 ms. |

## 18. Defects fixed by this work

Each item has a regression test where a unit test can observe it, or a browser check otherwise.

1. A hovered selected DatePicker day shows white text on light grey (specificity).
2. The DatePicker trigger is 36 px at sm and grey, because `.tz-input:read-only` matches buttons.
3. DatePicker's Today and Clear are raw `.tz-button` elements without `size` and `state`.
4. FilterBar's remove hover is invisible (Button hover rule 0,5,0).
5. FileTree shows two focus rings.
6. The Tabs focus ring is clipped by the list's overflow.
7. The Slider thumb is `#fff` in dark mode.
8. The composer's shadow color is light-tuned in dark mode.
9. `tz-ai-shimmer` does not reverse in RTL.
10. The chat's last message replays its entrance when an earlier message becomes last.
11. Status glyphs pop and draw on mount.
12. AskUserQuestions and ApprovalCard rise on every mount; options cascade again on keyboard Next and the 1–9 keys.
13. The invalid shake is not mirrored, and plays on mount and on keyboard submit.
14. OTP digits and the ripple animate when a value is prefilled.
15. Western digits in Arabic: AvatarGroup `+N`, Sources counts and citation numbers, the InsightCards position, Terminal "exit N", the ApprovalFlow announcement, and `Dashboard.tsx` and `SliderExamples.tsx`. The last two format with plain `"ar"`, which current ICU renders with Western digits; the components use `ar-u-nu-arab`. All of them, and every formatter touched by this work, go through `numberLocale(config)` from the numerals work, so they follow the `numerals` setting (Arabic-Indic by default in Arabic). Plain `"ar"` is never used.
16. Terminal shows English words in Arabic.
17. The EmptyState illustration arrow and the InsightCards open arrow are not mirrored in RTL.
18. DataTable: hover overrides the sorted color, and the row hover rule is duplicated.
19. Alert's default tone colors all of its text.
20. Sheet uses physical `left` and `right` and a 1 px side border.
21. Tooltip and the ModelSelector popup have no exit animation.
22. The Toast gap is defined twice (JS and CSS).
23. `--text-muted` is darker than `--text-secondary` in light mode.
24. Avatars are fractional sizes (33.6 and 39.2 px).
25. The late override block (`components.css:6673–6724`) leaves dead rules at 885, 912–915, 967 and 2956. The overrides are folded into the original rules.
26. Radio base rules live in the AI section.
27. Hard-coded 10 to 13 px sizes ignore `typography="large"`.
28. Twelve hover rules apply on touch screens.
29. TaskRows badge colors contradict their indicators; ToolStatus and TaskRows use different glyphs.
30. ContextMeter's status text is never colored, and its thresholds use info and danger inconsistently.
31. The workbench docs backdrop uses `#10181055` instead of `--backdrop` (Workbench spec).
32. README:127 lists motion values (120/180/240/160 ms) that no longer match the tokens (120/200/220/150 ms), and README:125 leaves out the "ink" accent. Both are rewritten from the new tokens.

## 19. Provider and config changes

- `SystemConfig` gains only `numerals` (from the numerals work, with its `numberLocale()` helper and the Provider's `data-numerals` attribute). The AI and attention colors live in `tokens.css` like the other semantic pairs (section 8.2).
- The Provider owns `data-modality` (section 15). The modality listener is attached once per provider root, and nested providers share it.
- `tokens.test.ts` (new, beside `config.test.ts`) holds the contrast and distinguishability checks (section 8.2).

## 20. Verification

- **Contrast script** (a Vitest test reading the token values): every text token on every surface (page, tray, paper, well, each soft tone) in both themes and with all twelve accents reaches 4.5:1, or 3:1 for text at 24 px and above or 18.66 px bold and above. The focus ring, status discs, switch track, and checkbox and radio edges reach 3:1 against their background. Field boundaries (`--border-field`) reach 3:1 on page, paper and tray in both themes (section 12).
- **Unit tests.** Existing tests keep passing. New tests cover data-modality, the fixed AI and attention colors (section 8.2), every digit fix, the read-only selector, the DatePicker trigger size, and the Alert and Badge tones.
- **Browser evidence.** A screenshot matrix per family: light and dark, Arabic RTL and English LTR, at defaults; plus radius 0 and 16, standard density, large typography, and 390 px width. Before and after pairs are saved under `docs/woven/`. The 21 computed font and radius assertions in `tests/browser` are updated. Stale scripts are fixed or marked retired: `documentation-groups.mjs` expects 32 buttons and a 190 px sidebar, and `ai-decisions.mjs:146` expects a 2 px radius the CSS cannot produce.
- **Forced colors.** Chromium's `forced-colors: active` emulation shows every control's boundary and focus.
- **Performance.** Only `transform` and `opacity` animate, with these documented exceptions:
  - the disclosure panels that animate their height through `grid-template-rows` today (Accordion, TaskRows `components.css:3583`, ThinkingState 3999, ToolCall 4285), kept so content does not snap;
  - Toast's stack height (549);
  - the sidebar width.

  All exceptions are skipped under keyboard modality and reduced motion. Progress stops animating `inline-size` (1645) and animates its fill with `transform: scaleX()` from the inline-start edge.
- **Fonts.** The network panel shows no remote font request, and the only faces in use are the bundled IBM Plex Sans Arabic weights and the system mono stack.

## 21. Build order

Each phase lands with its tests and screenshots and is reviewed before the next.

1. **Foundations.**
   - First, bring in the uncommitted work from `claude/numerals-config` (the `numerals` setting and `numberLocale()`) and from `claude/component-craft` (the `tests/browser` repairs). Apply each as its own commit on top of `claude/woven`, resolving conflicts with the commits it has not seen (it is based on `4b5650a`), and run the full suite.
   - Then the tokens (type, color roles including `--border-field`, surfaces, radii, states, motion), the Provider (modality), the contrast script, the shared `StatusIcon` and the remove-button variant.
2. **Forms:** Button, Input, Textarea, Select, Field, Checkbox, RadioGroup, Switch, Slider, OTPInput, DatePicker, TagInput, ColorPicker, InputCopy.
3. **Surfaces and overlays:** Card, Modal, Sheet, Toast, DropdownMenu, Tooltip, Alert, Badge, EmptyState, Accordion, Avatar, AvatarGroup.
4. **Navigation and data:** Sidebar, Tabs, Breadcrumbs, Pagination, Steps, Table, DataTable, Timeline, FilterBar, FileTree, FileDropzone, NotificationList.
5. **Feedback and charts:** Skeleton, Progress, Spinner, Tick, the four charts.
6. **AI parts:** the CSS-level changes in 17.8. The AI patterns spec then builds the new parts and anatomy on them.
7. **Docs, README and agent-facing documents:** token tables, sizes, motion values and font setup.

These steps slot into the one order shared by all three specs, written out in the [workbench docs spec, section 14a](2026-10-18-workbench-docs-design.md).

## 22. Decisions from review

Answered by Amjed on 18 October 2026:

1. **Fonts.** The font he liked is the one in the AI pattern examples: IBM Plex Sans Arabic, already Tiraz's. No face is added; the examples' type setting is adopted (section 7).
2. **Field borders** meet WCAG 1.4.11 at 3:1 (`--border-field`, section 12).
3. **Work in other worktrees** joins this branch: the `numerals` setting from `claude/numerals-config` and the browser-test repairs from `claude/component-craft` (section 21, step 1).

Decided by the author and listed for review rather than asked:

- the invalid shake is removed;
- the required asterisk is neutral;
- the active tab and the open accordion item use ink text with an accent indicator;
- the AI and attention colors are fixed for every accent;
- the radius scale is clamped (paper at most 24 px);
- the documented layout-animation exceptions.

## 23. Left to the builder

- Exact hex values within the contrast rules, as long as hue and role stay the same.
- Ordering and organization of `components.css`, as long as every family's rules sit in its own section and late overrides are folded in.
- Names of private helpers.
- The modality listener's implementation details (capture phase, which keys count), within section 15.
- Screenshot tooling, reusing the `TIRAZ_*` environment variables.
