# Playground page layout: design

**Status:** approved direction (Amjed, 21 Oct 2026). Mockup, Button page: https://claude.ai/artifact/PAzxLnVrmbwhRcxpqC5Hia (Arabic light, Code view, English dark, phone). The mockup is final except for the new-tab icon, which §7 settles.

**Applies to:** every workbench page that renders the demo frame, meaning components, parts and patterns. The standalone screens (`/examples/dashboard`, `/examples/chat-app`) don't change.

## 1. Intent

Each page should name its component once, give the example more room, and keep the controls out of the stage, so the stage shows only the example.

## 2. Page, top to bottom

1. **Header:** the h1 title, then the description. The kicker above the title (`.component-kicker`, group · job) is removed.
2. **Use it in your app** (§6c): the h2 «استخدمه في تطبيقك» / "Use it in your app" and its prompt row. It moved from below the guidelines to sit right after the header (Amjed, 21 Oct).
3. **Playground:** the h2 «المعاينة التفاعلية» / "Interactive playground", the toolbar (§3), then the stage (§4) in Preview or the code block (§5) in Code.
4. **Usage guidelines** (§6).
5. **API reference** (§6b).

**Nothing else.** Amjed decided on 21 Oct that, below the header, a page has only these parts: the prompt, the playground, the usage guidelines and the API reference. The pattern-page sections Plan 4 Task 8 added are removed: Anatomy, Placements, Copy and the part tables (`src/workbench/pattern-pages.tsx`). This supersedes the workbench docs spec's pattern-page sections (Docs §6, §7 and §9) and the AI patterns spec's matching page sections. The «يحل محل» / "Replaces" column stays, because it is one of the usage-guidelines columns on pattern pages. The registry `?raw` import goes too if nothing else uses it.

**Removed from the frame:**
- the Arabic + English name strip (`.tz-demo-title`, `.tz-demo-name`)
- the large Replay button
- the frame's copy button

The page says the component's name in its h1 only.

## 3. Toolbar

- **Position:** one row directly above the stage and outside it, as wide as the playground. It uses `justify-content: space-between` and wraps on narrow screens.
- **Start:** the view switch, «معاينة» (eye icon) and «الكود» (code icon). It is a tray with the selected item as a paper chip. Its semantics and names are unchanged from today (`طريقة العرض` / "View", `aria-pressed`).
- **End:** the state chips (unchanged: «حالات المثال», tray with a paper chip for the selected state), then the open-in-new-tab link (§7). A page without states shows only the switch and the link.
- **Tab order:** switch → states → new-tab link → stage.
- **RTL:** the row mirrors as a whole, so the switch sits on the right in Arabic.

## 4. Stage

- **Look:** paper with warp lines, unchanged. Radius `--radius-paper`. Minimum height about 440 px on desktop and about 280 px under 640 px.
- **Replay:** a 36 px round icon button at the stage's top-end corner (`inset-block-start` and `inset-inline-end`, 12 px).
  - Icon: lucide `rotate-ccw`, not mirrored. A circular arrow shows rotation, and clock direction doesn't change in RTL.
  - Name: «إعادة تشغيل المثال» / "Replay example", with a tooltip.
  - It shows only on pages with a replay.
  - The Replay engine, `replaying`, focus handling and announcements are unchanged.
  - It is the first stop in the stage, before the example's own controls.
- **Mirror icons:** the old play icon's `:dir(rtl)` mirror rule goes away with the old button.

## 5. Code view

- **Header row:** a header row sits on the code well. The file name is at the start (`dir="ltr"`). A 36 px round copy icon button (lucide `copy`, not mirrored) is at the end, in the same corner Replay takes in Preview.
- **Copy feedback:** the button keeps its name «نسخ الكود» / "Copy code". After copying, it shows a check for 2 s, and a polite region says «نُسخ الكود» / "Code copied" once.
- **Code lines:** they stay LTR.

## 6. Usage guidelines

- **Placement:** the frame's notes become their own section after the playground. It has the h2 «إرشادات الاستخدام» / "Usage guidelines" and a hairline above it.
- **Columns:** the three existing columns become h3s:
  - «استخدمه عندما» / "Use it when"
  - «استخدم غيره عندما» / "Use something else when", or «يحل محل» / "Replaces" on pattern pages
  - «لاحظ» / "What to notice"
- **Grid:** `repeat(auto-fit, minmax(240px, 1fr))`, so the columns stack on phones.
- **Content:** the text and the links to other pages don't change.

## 6b. API reference

- **Always visible.** It is no longer a collapsible `<details>`; it is a section with an h2 that uses the existing `api` label.
- **A real table.** Use `<table>` with a caption or `aria-labelledby` pointing at the h2, `<thead>`, and `<th scope="col">`:
  - «الخاصية» / "Prop": the prop name, in `<code dir="ltr">`; a required prop is marked in words, not only with an asterisk;
  - «النوع» / "Type": `<code dir="ltr">`;
  - «الافتراضي» / "Default": `<code dir="ltr">`, or «—» when there is none;
  - «الوصف» / "Description": the existing text, in the page language.
- **Rows.** Hairline rows. The header row sits on the tray.
- **Groups.** Where the reference today groups props under a part name or a heading, keep the groups. Use one table per group, each with its own small heading.
- **Width.** It uses the shared page width (§8). Inside an `overflow-x: auto` box it scrolls inline on phones and never makes the page scroll sideways.
- **Direction.** RTL by default: the columns run from the right in Arabic, and the code cells stay LTR.

## 6c. Use it in your app

- **Placement:** right after the header (§2), with its existing prompt row: the preview text and the icon-only copy control.
- **Language:** the prompt is always English, on Arabic and English pages alike. `generatePrompt` uses its English text whatever the page language, and the preview paragraph is `lang="en" dir="ltr"`.
- **What stays localized:** the section heading and the copy control's name follow the page language.
- **The example code:** where the full prompt includes the example code, the code keeps the page's sample content and language, as the copied code does today. Only the instructions are English.

## 7. Open in new tab

- **Element:** a link (`<a>`, not a button) with `target="_blank"` and `rel="noopener"`. It is styled as a 36 px round chip like the other icon buttons.
- **Name:** «فتح المعاينة في تبويب جديد» / "Open the playground in a new tab", with a tooltip.
- **Icon: lucide `arrow-up-right` (↗).** The round chip is already the frame, so the usual external-link square would draw a box inside a box. A single diagonal arrow stays clear at 18 px and matches the Woven icon weight.
- **RTL: mirrored, pointing ↖ in Arabic.**
  - The arrow means "out and forward", and forward follows the reading direction. Apple's `arrow.up.forward` does the same for "open elsewhere".
  - Use the system's existing `.tz-mirror-rtl` rule (`:dir(rtl)` → `scaleX(-1)`). It survives the production build since Plan 3 Task 8 fixed the CSS target.
  - The eye, code, Replay and copy icons don't mirror.
- **Destination:** a standalone route following `main.tsx`'s existing `/examples/…` routing, for example `/examples/playground/<page-id>`. It renders only that page's example at full width:
  - with the current props and state, read from the stored playground model (`tiraz.playgrounds.v2`), so what opens is what was on screen;
  - with the system settings from `preferences.ts`: language, theme, density, accent, radius, typography, numerals and reduced motion.
- **The standalone page:**
  - no workbench chrome;
  - a document title "<name> · Tiraz";
  - an h1 with the component's name, visually hidden;
  - a small link back to the docs page.
- **No live sync:** later changes in the workbench tab don't follow the new tab.

## 8. Widths

- **One width for every section** (Amjed, 21 Oct): the header, Use it in your app, the playground, the usage guidelines and the API reference all use the full main column, up to about 1,160 px. They share one start and end edge.
- **No narrower measure:** the earlier ~760 px reading width for the header and guidelines is dropped.

## 9. Accessibility

- **Region name:** the frame region is labelled by the playground h2.
- **Icon controls:** every icon control has a name and a tooltip.
  - Targets are 36 px for a fine pointer and grow to 44 px on a coarse pointer.
  - Focus rings follow the system rule.
- **Forced colours:** icon chips keep a transparent border so they draw. Focus rings use CanvasText. Selected chips use Highlight, as today.
- **Unchanged:** reduced motion, keyboard modality, scroll-to-top on page change, and Plan 2's phase contract.

## 10. Tests

- The header has no kicker, and the name appears only in the h1.
- The copy button exists only in Code view, in the code header, and it announces once.
- The notes render outside the frame region, under the "Usage guidelines" h2.
- A pattern page has no Anatomy, Placements, Copy or part-table sections. Its h2s are exactly: the playground, the usage guidelines and the API reference.
- The API reference is open with no toggle. It is a `<table>` with column headers, and the code cells are `dir="ltr"`.
- Below the header the sections come in this order: Use it in your app, the playground, the usage guidelines, the API reference.
- On an Arabic page, the prompt preview and the copied prompt are English (`lang="en"`, `dir="ltr"`), and the heading is Arabic.
- The new-tab link has `target="_blank"`, `rel="noopener"` and its name. The standalone route renders the page's example with the stored props and settings.
- In RTL, the new-tab icon carries the mirror rule, and the Replay and copy icons don't.
- Existing tests that assert the moved parts are updated, and the commit names them.
- Browser scripts that depend on the old structure are refreshed with Plan 4 Task 11's script pass.

## 11. Out of scope

- Third-party "copy prompt" buttons, such as the brand icons in the reference screenshot.
- Changes to the notes' content.
- Changes to the standalone screens.

## 12. Left to the builder

- The exact route name and how the standalone page reads stored state.
- The exact breakpoint for the shorter stage.
- Whether the toolbar groups share one tray or keep two.
