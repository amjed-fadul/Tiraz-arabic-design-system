# Playground page layout: design

**Status:** approved direction (Amjed, 21 Oct 2026). Mockup, Button page: https://claude.ai/artifact/PAzxLnVrmbwhRcxpqC5Hia (Arabic light, Code view, English dark, phone). The mockup is final except for the new-tab icon, which §7 settles.

**Applies to:** every workbench page that renders the demo frame, meaning components, parts and patterns. The standalone screens (`/examples/dashboard`, `/examples/chat-app`) don't change.

## 1. Intent

Each page should name its component once, give the example more room, and keep the controls out of the stage, so the stage shows only the example.

## 2. Page, top to bottom

1. **Header:** the h1 title, then the description. The kicker above the title (`.component-kicker`, group · job) is removed.
2. **Playground:** the h2 «المعاينة التفاعلية» / "Interactive playground", the toolbar (§3), then the stage (§4) in Preview or the code block (§5) in Code.
3. **Usage guidelines** (§6).
4. **The page's other sections, unchanged and in their current order:** pattern pages' Anatomy, Placements, Copy and part tables, then the API reference.

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

- **Playground** (toolbar, stage, code): the full main column, up to about 1,160 px.
- **Header and guidelines:** a readable measure of about 760 px, on the same start edge.

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
