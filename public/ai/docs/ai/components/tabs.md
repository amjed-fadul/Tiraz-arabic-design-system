# Tabs · التبويبات

Generated from the public TypeScript API and authored guidance. Source digest: `9765b7dc6bc3df7734e533c06e0d25e3f0bf5d05888a88e8abbe9dee331795a0`.

Switch between related panels within one context.

Avoid: Site navigation or unrelated routed pages.

## Setup

Read [integration](../integration.md). Import `Tabs` from the installed manifest's entry; load its styles once and use SystemProvider.

## Common props

| Prop | Type | Required | Runtime default expression |
| --- | --- | --- | --- |
| items | `TabItem[]` | yes | — |
| label | `string` | yes | — |
| value | `string \| undefined` | no | — |
| defaultValue | `string \| undefined` | no | items.find((item) => !item.disabled)?.value |
| onValueChange | `((value: string) => void) \| undefined` | no | — |
| variant | `"underline" \| "segment" \| undefined` | no | "underline" |
| className | `string \| undefined` | no | "" |

Full inherited API and conditional branches: [contract](../../../knowledge/api/Tabs.json). Related types are included there. Do not interpret this concise table as the complete inherited API.

## Rules

- Provide a descriptive label for the tab list and unique item values.
- Controlled value requires onValueChange to update application state; otherwise use defaultValue.
- Item label and content accept ReactNode. The workbench's string editor and collection limit are not runtime API restrictions.
- Direction comes from SystemProvider; preserve keyboard navigation.

## Parts

- **root**: className targets Tabs root
- **list**: managed tablist and active indicator
- **panel**: content supplied through items

## Example

See the [compiling examples](../../../src/examples/Components.tsx). The workbench editor is a demonstration model, not the runtime API.
