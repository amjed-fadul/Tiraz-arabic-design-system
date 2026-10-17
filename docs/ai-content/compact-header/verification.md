# Compact streaming demo headers — 17 October 2026

Both the interactive playground and standalone Markdown example now match the supplied header direction: a quiet Default/Markdown title at inline-start and small icon-only playback controls at inline-end. Removed the large text buttons. Play starts or replays; Square stops the active local sample while preserving received content. The local-demo provenance remains visible below the response. Existing autoplay and timer behavior are unchanged.

Uses existing Tiraz Button, tokens, installed Lucide icons and shared source-copy CSS. Native targets remain 32px; localized aria-label and title describe each action. Stop remains mounted after cancellation with aria-disabled and a guarded handler, preserving keyboard focus. Arabic headers use IBM Plex Sans Arabic. No public component API, dependency, category or additional family was added.

Verified locally on the user's Mac in `/Users/amjedfadul/.codex/worktrees/ai-content/Tiraz`, branch `codex/ai-content`:

- Regression was red against the old text controls, then passed for both titled headers, icon-only text, accessible names, Enter activation, retained replay focus and retained stop focus.
- Focused component/page tests: 25/25 passed. Independent focused/prompt rerun: 134/134 passed with no actionable findings.
- Full `npm test -- --maxWorkers=2 --testTimeout=15000`: **69 files, 610 tests passed**, including generated examples, source-only compilation and portable prompts.
- Build passed, with the existing bundle-size advisory. Lint and formatting passed without errors or warnings.
- Browser checked English/light desktop and Arabic/dark at 320px. Document width stayed 320px; both header directions were RTL, and both Arabic titles resolved to the library font. Icon buttons had accessible names, no visible button text and 32px targets. Cancellation stopped the cursor and retained focus on Stop.
- [Desktop screenshot](english-desktop.jpg), [Arabic mobile screenshot](arabic-dark-320.jpg), [browser measurements](browser.json).

Preview remains running at <http://127.0.0.1:5291/>. Temporary viewport emulation was reset. No push, merge, deployment, landing edit or unrelated-server change. Browser inspection used the in-app browser; no manual screen-reader or physical-device testing was performed. Full-suite results are saved in tests.txt alongside this report.
