# Parts navigation audit — 21 Oct 2026

## Recommendation

Keep ten of the fifteen Parts as independent component pages. Move five specialist entries into the documentation of their closest parent component, then retire the generic Parts section. Applied on 21 Oct 2026 after approval: ten pages now live in their job/category groups, and five specialist pages are linked from parent documentation. The Parts section is retired.

All fifteen currently have public exports and accept application-owned data or callbacks. They do not require an enclosing AI pattern to render. The distinction is usefulness and discoverability, not whether they can technically work alone. The existing Field reference under Input is a useful precedent for documenting a helper without giving it another menu item.

The audit checked [the navigation catalog](../../src/workbench/catalog.ts), [public exports](../../src/system/index.ts), the source files below, and their `kind`, `props`, and `usedBy` records in [the registry](../../src/system/ai/registry.json).

## Keep as independent pages

| Component                                                 | Why it earns a page                                                                                            | Suggested home         |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| [ChatComposer](../../src/system/ChatComposer.tsx)         | Complete message input with submit, busy, failure, and stop behavior. Useful without a whole assistant screen. | Ask                    |
| [ChatThread](../../src/system/ChatThread.tsx)             | A message list with roles and message states, useful in any chat layout.                                       | Ask                    |
| [ModelSelector](../../src/system/ModelSelector.tsx)       | A focused choice of models, including unavailable options. Useful in settings as well as a composer.           | Understand and control |
| [ContextMeter](../../src/system/ContextMeter.tsx)         | Usage and capacity feedback with details, useful in a toolbar or settings page.                                | Understand and control |
| [SelectionActions](../../src/system/SelectionActions.tsx) | Actions on selected text with callbacks and offsets. Useful in editors beyond SuggestedEdits.                  | Create                 |
| [ImageResult](../../src/system/ImageResult.tsx)           | An image result with loading, failure, retry, and caption behavior; no generation workflow required.           | Display & feedback     |
| [Sources / InlineCitation](../../src/system/Sources.tsx)  | Linked evidence and citations are useful in reports, search results, and answers.                              | Data                   |
| [InsightCards](../../src/system/InsightCards.tsx)         | Supplied findings or metrics in a compact set of cards, independent of an assistant workflow.                  | Data                   |
| [TaskRows](../../src/system/TaskRows.tsx)                 | Application-owned execution states and expandable task details. Useful for an activity list without AgentTask. | Delegate               |
| [ToolCall](../../src/system/ToolCall.tsx)                 | One named operation with status, input/output, disclosure, and retry. Useful in logs and activity views.       | Delegate               |

## Fold into another page

| Remove from the primary menu                                | Keep its documentation under                                         | Reason                                                                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [PromptBar](../../src/system/PromptBar.tsx)                 | ChatComposer → compact entry and suggestions; cross-link TaskStarter | Shares the entry foundation and adds a compact presentation/suggestions. It is a useful variation, but a competing starting point in navigation. |
| [ThinkingIndicator](../../src/system/ThinkingIndicator.tsx) | LoadingState → assistant activity indicator                          | A small visual status treatment. Show it beside the other loading choices, including when it is appropriate to use an AI mark.                   |
| [ThinkingState](../../src/system/ThinkingState.tsx)         | AgentTask → expandable activity summaries; cross-link CitedAnswer    | A specialist disclosure for host-supplied progress details. Keep the examples and keyboard contract near the workflows that need them.           |
| [ToolChips](../../src/system/ToolChips.tsx)                 | ToolCall → compact operation summaries                               | A compact list of tool states, best compared directly with the detailed tool-call view.                                                          |
| [StreamingText](../../src/system/StreamingText.tsx)         | ChatThread → streaming messages; cross-link Markdown                 | Rendering supplied text and stream state is part of composing a message. The application still owns the stream.                                  |

These changes would remove menu entries, not exports, source files, examples, tests, or supported APIs. Existing saved selections and direct playground URLs should continue to resolve, and parent pages should link to the detailed reference. The applied change retains all five detailed pages and their standalone playground URLs.

## Already correctly hidden

AIMark, StatusPill, Tray, Countdown, StatusIcon, ThinkingPanel, FeedbackBar, FollowUps, InlineDiff, and WeaveCanvas are support exports rather than primary navigation pages. Keep them in the source/API composition guidance and the relevant parent examples. They do not need ten more menu items.
