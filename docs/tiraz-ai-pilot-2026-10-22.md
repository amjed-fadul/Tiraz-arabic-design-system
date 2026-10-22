# Tiraz real-screen AI pilot — 22 October 2026

Tiraz supported three realistic business screens on the first generation: customer management, account preferences and invoice operations. The generated app compiled and passed all 33 valid browser checks. The pilot exposed one composition gap: the invoice pattern could not place its actions inside its details Sheet, so the agent assembled that workflow and imported an internal async helper.

That gap is fixed. `InvoiceActions` now supports optional `actionsInDetails`, sharing pending state, cancellation and feedback between the toolbar and Sheet. The default remains unchanged. A guided repair moved the invoice screen onto this public pattern, bringing pattern adoption from two of three screens to all three and removing the internal import.

## What we ran

One fresh-context agent received the [product brief](../evals/pilot/prompt.md), an installed Tiraz manifest, provider/bootstrap code and a deterministic asynchronous service. It built a single application with three related screens. We froze its first output before supplying compiler or browser feedback, evaluated it independently, fixed the library gap, then allowed one guided repair. The agent did not run the evaluator itself.

The consumer used a custom installation path containing spaces and only declared dependencies. Evaluation compiled strict TypeScript, linted the consumer and exercised a production Vite build in Chromium. Long Arabic company names, email addresses and descriptions were included.

| Evidence                                 | Initial generation  | After library fix and guided repair |
| ---------------------------------------- | ------------------- | ----------------------------------- |
| TypeScript and production build          | Pass, first attempt | Pass                                |
| Consumer lint                            | Pass                | Pass                                |
| Browser checks                           | 33/33               | 33/33                               |
| Public business patterns used            | 2/3                 | 3/3                                 |
| Internal async helper imported by screen | Yes                 | No                                  |
| Browser runtime errors                   | 0                   | 0                                   |

The 33 checks comprise 14 interaction scenarios, 18 screen/configuration combinations and one runtime-error check. They cover failure/retry, retained drafts, duplicate submissions, cancellation, navigation during pending work, invoice status updates, disabled menu items, nested Escape behavior and focus return. The matrix covers English LTR, Arabic RTL and Arabic LTR, each in light/dark mode at desktop and 390px mobile widths. It checks overflow, dialog bounds, provider scope, locale formatting and automated axe accessibility rules. Screenshots were also inspected visually.

## Changes made

- Added `InvoiceActions.actionsInDetails` with a regression test for nested menu behavior, shared pending/error state, retry, cancellation, late completion and focus return. The test failed before the implementation and passed afterward.
- Documented the public composition route, cancellation behavior and callback responsibilities. Updated the AI entry point, generated contracts and installable registry.
- Preserved the first generated output and both sets of results. Added `npm run test:pilot` to reproduce the final consumer checks and wired it into CI.

Closing the invoice Sheet leaves an action running; the explicit cancel control or component unmount cancels it. Applications still own their service calls, translated copy, formatting and domain-state updates.

## Validation and artifacts

Local validation passed: 90 component/pattern tests, 10 tooling tests, knowledge/registry freshness, lint, production build, formatting, the standalone consumer suite and all 33 final pilot checks. The updated CI workflow has not been run remotely as part of this pilot.

- [Initial frozen source](../evals/pilot/initial/Pilot.tsx) and [final source](../evals/pilot/app/Pilot.tsx)
- [Initial results](../evals/pilot/results/initial/results.json) and [final results](../evals/pilot/results/final/results.json)
- [Run provenance](../evals/pilot/run.json) and [reproduction notes](../evals/pilot/README.md)
- [Customer desktop screenshot](../evals/pilot/results/final/customers-desktop.png), [preferences mobile screenshot](../evals/pilot/results/final/preferences-mobile.png), [invoice mobile dark screenshot](../evals/pilot/results/final/invoice-mobile-dark.png)

The first evaluator attempt incorrectly reused browser state between scenarios. Its false failures are retained in `results/harness-debug`; they are excluded from the results above. Giving each scenario a fresh URL and scoping a status selector corrected the harness. The unchanged frozen initial output then passed 33/33 checks. These were evaluator defects, not Tiraz defects.

## What this proves, and what it does not

This is evidence that an agent can build these three workflows using Tiraz and that the final public patterns support them. It is not a general model success rate, a comparison with other systems or evidence that every screen is AI-ready. There was one application, no baseline arm and no repeated sampling. The successful repair was guided, so it does not independently establish improved cold-start generation.

The service uses local fixtures, not a production backend. Browser coverage is Chromium; automated accessibility checks do not replace assistive-technology review. Providers and service scaffolding were supplied, so this pilot does not evaluate whether an agent can bootstrap them unaided.

Usage was bounded to one builder and one repair turn, with approximately six and two tool calls respectively as reported by the builder. Exact model/token/billing counters were unavailable and are not estimated. Future pilots can target a new workflow or another browser when needed; repeating this same generation would add little evidence for the cost.
