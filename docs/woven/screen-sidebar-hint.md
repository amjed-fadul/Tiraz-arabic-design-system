# Screen sidebar first-visit guide

22 October 2026 · `/Users/amjedfadul/Tiraz-worktrees/woven` · `claude/woven`

The shared example-screen frame now starts with navigation closed. This keeps the
main content above the 960px layout threshold in the 1280px desktop docs preview,
so Invoices, Customer profile, and Agent control room show their agent panel
beside the main content on arrival. Phone and tablet keep their existing
responsive layouts and navigation drawer.

A first-visit ink annotation points to the original sidebar toggle. Its label is
«افتح القائمة من هنا» / “Open the sidebar”. Clicking the annotation activates the
same toggle. Opening navigation directly, dismissing the annotation, or pressing
an unconsumed Escape remembers the acknowledgement under
`tiraz.screen-navigation-hint.v1`. A later screen starts closed without repeating
the guide. If browser storage is unavailable, dismissal remains in memory for
the mounted frame.

The annotation shares its presentation, dismissal, and storage behavior with the
existing Customize guide through internal `src/first-visit` helpers. Their
storage keys remain independent. No public library API or dependencies changed.
The guide adds no live region, never autofocuses, and restores focus to the
original toggle when its focused control disappears. Its reserved space avoids
covering content or toolbar controls. The arrow mirrors in Arabic.

## Verification

- New behavior tests first failed (four failures), then passed.
- Full suite: `npm test -- --maxWorkers=2` — 142 files, 1800 tests passed.
- Final focused frame, customization, Workbench, and screen CSS run — 57 tests passed.
- Dashboard navigation tests now explicitly open the initially closed sidebar;
  both outdated assumptions were reproduced alone before updating their setup.
  All 13 dashboard tests pass.
- `npm run lint` — zero errors and warnings.
- `npm run build` — TypeScript and Vite pass; existing large-bundle advisory remains.
- `npm run format:check` and `git diff --check` — pass.
- CSS audits for the frame, shared hint, and Customize layout — `[]`.
- 15 browser scenarios pass with no JavaScript errors: Arabic/English,
  light/dark, 1280px desktop and 390px phone, direct and hint-triggered opening,
  Escape/focus return, persisted dismissal, independent customization storage,
  both other agent-panel screens, embedded screen navigation, and the original
  Customize guide. Screen-bar axe checks return no violations.
- Inspected the narrow Arabic Agent control room in the in-app browser.

Browser checks used throwaway scripts in `/tmp/tiraz-screen-sidebar-20261022/`.
Saved desktop docs evidence:
[Arabic](screen-sidebar-hint-ar.png) · [English](screen-sidebar-hint-en.png).
Native mobile hardware, Safari, and Firefox were not tested.

Both documentation (5411) and landing (5243) preview servers remain running.
