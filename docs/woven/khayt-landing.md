# Khayt in the landing examples

22 October 2026. Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch
`claude/woven`. Preview: <http://127.0.0.1:5411/landing.html#explore>.

TaskStarter, AgentTask and ImageGeneration now supply the existing
`agentPresentation` slot with the shared animated Khayt avatar at 48 px. The
identity uses Khayt's violet color. The public components and mascot runtime
retain their existing APIs; the landing adds no separate avatar card or live
region. TaskStarter's identity label is localized.

| Example         | Mascot state                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TaskStarter     | Ready while composing; done when the synchronous local preview is recorded. Editing the request, selecting a suggestion or changing context clears the old receipt and returns to ready. |
| AgentTask       | Waiting for the proposed plan to start; working during execution; done on completion; ready after Stop. Replay returns to working.                                                       |
| ImageGeneration | Ready before generation is requested; working during generation; done when images are available. Variations repeat working and done.                                                     |

The ready image example intentionally uses the ready pose, since its queued
label says "Ready to try" and no generation has started. TaskStarter records a
local preview synchronously, so it does not invent a busy period. Reduced motion
uses each state's still pose through the existing Khayt runtime.

## Verification

- Extended the existing interaction tests; the three mascot checks failed
  before connection, then all six landing showcase tests passed.
- `npm test -- --maxWorkers=2`: 1,829 tests in 146 files passed.
- `npm run lint`: passed with zero warnings.
- `npm run build`: passed; the existing large-chunk advisory remains.
- `npm run format:check` and `git diff --check`: passed.
- The registered-family CSS audit returned `[]`.
- Eight Chrome browser scenarios cover Arabic and English, desktop and phone,
  light and dark themes, and reduced motion at tablet width. Interaction checks
  cover edited requests, context changes, Stop, Replay and image variations.
  Working-state canvas frames change; avatars fit inside their headers, with
  no horizontal overflow or page errors in the checked examples.
- The existing TaskStarter textarea `aria-allowed-role` observation remains.
  Two initial scans also observed image-action contrast during re-enabling;
  settled checks in light and dark themes pass with and without the identity
  tint. The button's existing opacity transition is unchanged.
- Four follow-up Chrome scenarios confirm settled scans and that reduced-motion
  working-state canvas frames stay identical in Arabic and English.
- Screenshots and throwaway scripts are outside the repository under
  `/tmp/tiraz-landing-mascot-update/`.

The older landing at port 5243 was not edited. Both preview servers responded
with HTTP 200. Safari, Firefox, physical touch devices and manual screen-reader
sessions remain untested.
