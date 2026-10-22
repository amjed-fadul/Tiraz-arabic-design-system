# Matched demo frames and example autoplay — 17 October 2026

The padding/border mismatch came from separate workbench wrappers: the playground added its own border and 34px padding, while Examples used 20px/22px padding without a border. StreamingDemo now owns a portable token-based frame, shared by both documentation sections. Streaming-specific wrappers add no second border or padding; other families keep their existing frame styles.

Both documentation demos now run automatically once on entry and language/mode changes. The generated example also passes autoStart to its Markdown demo. Replay/cancel/unmount behavior is unchanged. Removed the visible local-demo footer everywhere this demo is used, retaining concise local provenance in the group's accessible name and portable guidance. No network or model connection was introduced.

The empty Latest event/Interact placeholder was removed throughout the workbench. Real recorded action feedback remains. An unnamed, visually hidden empty status owner stays mounted so the first actual event can be announced without showing placeholder text; its same node receives the real event content. Independent review identified this announcement requirement in the initial cleanup, and a failing-then-passing regression covers it.

Verified locally on the user's Mac in `/Users/amjedfadul/.codex/worktrees/ai-content/Tiraz`, branch `codex/ai-content`, with bundled Node 24.19.0:

- Focused AI-page and Workbench tests: 28/28 passed. Independent final re-review and its separate 28-test rerun passed with no unresolved findings.
- Full `npm test -- --maxWorkers=2 --testTimeout=15000`: **69 files, 612 tests passed**, including generated examples, portable prompts and source-only compilation.
- Build, lint and formatting passed; existing bundle-size advisory remains.
- Browser: both blocks observed streaming automatically on entry. Same desktop width 675.755px, padding 24px, surface, border, radius and header inset. Both outer wrappers have zero border/padding.
- Browser Arabic/dark at 320px: both frames width 288px, padding 16px, border 1px and the same surface. Document width remains 320px.
- Browser: no visible local-demo footer or empty event row; initial Button page keeps an empty announcement owner without the placeholder. Real event feedback and stable owner identity are covered by Workbench regressions.
- [Desktop screenshot](english-desktop.jpg), [Arabic mobile screenshot](arabic-dark-320.jpg), [browser measurements](browser.json).

Preview remains running at <http://127.0.0.1:5291/>. Temporary viewport emulation was reset. No push, merge, deployment, landing edit or unrelated-server change. In-app browser inspection does not establish manual VoiceOver or physical-device behavior. Full-suite output is saved alongside this report.
