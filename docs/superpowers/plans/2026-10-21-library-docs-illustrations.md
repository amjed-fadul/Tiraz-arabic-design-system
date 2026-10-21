# Library, Docs, and Illustrations structure

Status: first implementation complete; final verification and review in progress. Approved by the owner on 21 Oct 2026.

## Intent

Let visitors discover what Tiraz offers visually, try an item immediately, and then find the guidance needed to use it. Keep Arabic and English equally complete, with Woven typography, tokens, and RTL behavior throughout.

The reference [Library](https://www.affectui.com/components) leads with preview cards and browsing categories; [Docs](https://www.affectui.com/docs) separates setup and system guidance; [Illustrations](https://www.affectui.com/illustrations) provides a visual gallery of scenes. Reuse this separation of jobs. Tiraz keeps its own components, assets, visual language, and source-copy installation model.

## Three primary destinations

| Destination                          | Contents                                                                               | First version                                                                                                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **المكتبة / Library**                | Browse screens and reusable components, then open a working preview and its reference. | Screens first, then Components. Search names in Arabic and English and filter by the existing jobs/categories.                                                             |
| **التوثيق / Docs**                   | Learn how to install and compose the system.                                           | Introduction, copying the source, providers and fonts, theming, RTL and numerals, accessibility, and using Tiraz with a coding assistant.                                  |
| **الرسوم التوضيحية / Illustrations** | Browse reusable decorative assets, understand their purpose, and copy their source.    | Start with the three existing EmptyState illustrations: no records, no search results, and getting started. Add original Woven scenes in a later, separately scoped batch. |

Keep the shared sticky brand/language/theme header. Add Library, Docs, and Illustrations as primary navigation, with a compact mobile treatment. Secondary navigation changes with the destination. Screens remains the first Library section. Component detail pages keep the layout delivered in this feedback pass: title, playground, copy prompt, usage guidance, API tables.

## Implementation sequence

1. **Routes and shared navigation.** Add explicit Library, Docs, and Illustrations routes and stable item URLs. Preserve current standalone example/playground routes and saved page selections. A direct URL takes precedence over a previous saved selection; browser Back/Forward restores the selected page. Keep language and theme shared across destinations.
2. **Library gallery.** Reuse `catalog`, `navigationGroups`, and the screen registry as the source of names and categories. Use a consistent preview area, a short item name, and one clear link to its page. Start with still previews; activate live examples only when opened. This avoids dozens of simultaneous iframe/demo lifecycles, accidental actions, and automatic animation. Show a useful empty-search result.
3. **Docs.** Build readable guide pages from the authoritative `src/system/ai` bundle, with curated bilingual copy. Keep API facts in component references rather than duplicating them in a second catalog. Do not invent a package installer or CLI: Tiraz currently travels as source.
4. **Illustrations.** Create a small token-aware gallery for the existing original SVG illustrations, with light/dark preview, intended use, sizing, accessible decorative usage, and source-copy examples. Previewing an asset must not require an EmptyState workflow. Original animated scenes can follow once their scope and motion behavior are agreed.
5. **Navigation curation.** Apply the approved [Parts audit](../../woven/workbench-navigation-audit.md): retain the ten useful independent pages and fold the five specialist entries into parent documentation. Preserve the underlying APIs and old entry points.

## Acceptance checks

- Arabic is the default. English mirrors the layout without reversing code, Latin identifiers, or the meaning of nondirectional icons.
- Keyboard users can reach each destination, search result, preview, and return link. Route changes have sensible focus and one h1 per page.
- Gallery browsing is quiet: no automatic sends, decisions, generation, video, or animation. Loading preview assets must not move surrounding cards.
- At 390, 768, 1,024, 1,280, and 1,440 px, navigation and content stay contained. Light, dark, reduced motion, long Arabic labels, and empty results are verified.
- Copy actions preserve current source paths, dependencies, and the source-owned installation guidance. Galleries link to real working examples, not duplicate implementations.
- Run focused route/search/copy tests, the existing full gate, and browser checks. Produce tracked evidence only in the intended evidence step.

## Scope boundary

No accounts, payments, pricing, content-management service, new package distribution, or copied third-party assets are needed for this first version. Plan 5's existing Task 8 evidence/review/fix wave remains a separate checkpoint; this proposal does not mark it complete or silently start the next milestone.

## Implementation notes

- Destinations are `/library`, `/docs`, and `/illustrations`; component, screen, guide, and illustration details have stable paths beneath them. The root `/` retains the previous saved-page behavior; the brand now opens the Library.
- The Library contains 83 entries with 332 generated still previews, covering Arabic/English and light/dark. `scripts/library-previews.mjs` regenerates these production assets without touching tracked test evidence.
- Seven guides and the three existing original SVG illustrations make up the first Docs and Illustrations release. The five folded Parts keep their detail pages and legacy playground routes.
