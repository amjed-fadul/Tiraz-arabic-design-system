# Toast · التنبيهات

Generated from the public TypeScript API and authored guidance. Source digest: `9765b7dc6bc3df7734e533c06e0d25e3f0bf5d05888a88e8abbe9dee331795a0`.

Brief success, error or information feedback after an action.

Avoid: The only presentation of a persistent form error or information requiring a decision.

## Setup

Read [integration](../integration.md). Import `ToastProvider` from the installed manifest's entry; load its styles once and use SystemProvider.

## Common props

| Prop | Type | Required | Runtime default expression |
| --- | --- | --- | --- |
| children | `ReactNode` | yes | — |
| label | `string` | yes | — |
| closeLabel | `string` | yes | — |

Full inherited API and conditional branches: [contract](../../../knowledge/api/ToastProvider.json). Related types are included there. Do not interpret this concise table as the complete inherited API.

## Rules

- Wrap callers in ToastProvider inside SystemProvider; invoke useToast within that provider.
- Supply translated provider label and closeLabel; toast() accepts ToastMessage.
- At most three active entries are retained. Default duration is 5000 ms; hover/focus pauses expiry.
- Events and business state belong to the application. No string-evaluated callbacks.

## Parts

- **provider**: notification lifecycle
- **viewport**: scoped notification region
- **message**: title, optional description, tone and duration

## Example

See the [compiling examples](../../../src/examples/Components.tsx). The workbench editor is a demonstration model, not the runtime API.
