# Khayt in screen workspaces

22 October 2026. Checkout: `/Users/amjedfadul/Tiraz-worktrees/woven`, branch
`claude/woven`. Documentation preview: <http://127.0.0.1:5411>.

Khayt replaces the AI mark in existing working-area headers. There is no
separate mascot card. The existing Invoices and Customer profile panel headers
remain the identity headers for those panels. The control-room overview cards
and the opening activity line also use the same agent identity.

## Shared component API

`AgentPresentation` is exported as a type. AgentTask, DraftReview,
ImageGeneration, ChangeSummary, DataAnswer, CitedAnswer, TaskStarter,
AskUserQuestions, SuggestedEdits and AssistantControls accept the optional
`agentPresentation` prop. It supplies a decorative avatar, optional name,
identity controls and color. The shared components own header placement and
responsive layout; the screen supplies its task state. Without a presentation,
the original AI mark remains, including its small rewriting variant.

The portable source has no Khayt or example-screen dependency. Registry metadata
and the source-copy guide document the API. Identity color tints the tray while
preserving the result paper. Draft status and review navigation wrap below the
title at narrow widths instead of squeezing the heading.

## Identity and state

| Agent             | Workspaces                                        |
| ----------------- | ------------------------------------------------- |
| Finance           | Month-end close, control room, assistant settings |
| Collections       | Invoices, control room                            |
| Customer          | Customer profile, dashboard                       |
| Campaign designer | Content studio, caption edits, control room       |
| Support           | Help center                                       |
| Contract          | Contract review                                   |
| Sales             | Sales follow-up draft                             |
| Verification      | Onboarding questions                              |

Each identity has its own persisted color. The same agent keeps that color
across screens and reloads. The host maps the actual task to ready, thinking,
working, waiting, done or blocked. A failed campaign stays blocked while another
agent's opening presentation runs. Retry changes it to working. Pausing the
presentation pauses mascot motion; reduced motion keeps the state pose.

Identity controls do not submit, approve, retry or send. Existing abort and
confirmation handlers are unchanged. Avatars remain decorative and add no live
region. Visible status text continues to convey the result independently of
color or motion.

## Local verification

- `npm test -- --maxWorkers=2`: 1,813 tests in 144 files passed.
- Final attribution follow-up: the agent-presentation, image-generation and
  Content studio test files passed (32 tests); the supplied identity name also
  overrides image-result attribution.
- `npm run lint`: zero warnings.
- `npm run build`: passed; the existing large-chunk advisory remains.
- `npm run format:check`: passed.
- CSS audit: `[]`, including the shared identity styles.
- Focused component checks cover all ten header integrations, default marks,
  identity actions that never invoke task actions, shared colors and state
  transitions. The initial missing-slot tests failed before implementation.
- Throwaway Playwright scripts outside the repository: 30 layout/interaction
  scenario groups, 18 accessibility/embed checks, and six nested-flow checks.
  No browser page errors; axe reported no violations in the tested surfaces.

Browser checks covered all eleven screens at 1,280 px in Arabic and English,
six representative phone layouts in both languages/themes, invoice and sales
sheets, equal-height dashboard cards, support failure/retry/completion, finance
color persistence, campaign retry, reduced motion, and real documentation
iframes. Contract review's color popover preserves the review and returns focus.
Onboarding's color control does not submit; saving answers changes waiting to
working to done. The new slots add no polite live regions.

Accessibility review also corrected the control-room card names to follow their
visible content and put the dashboard inbox's visible count first in its name.
Entrance animations were allowed to settle before contrast checks.

Microinteraction checklist: **10/10 (eight of eight diagnostic rows)** in this
implementation review, not a user-study score. The initial failures were
predictable rules and contextual feedback: a global demo could override a
blocked agent, identities were inconsistent, and an extra card separated the
mascot from its task. Agent-specific states, persisted colors and the existing
header slots address those failures. Existing one-time hints and finite state
animations provide progressive reduction. No diagnostic rows remain failed.

Untested: Safari/Firefox, physical touch devices and assistive-technology user
sessions. Automated accessibility results do not replace those checks.

## Evidence

- [Task header, English](khayt-screen-task-en.png)
- [Dashboard headers, Arabic](khayt-screen-dashboard-ar.png)
- [Sales draft on phone](khayt-screen-draft-phone.png)
