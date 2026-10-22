# Button · الأزرار

Generated from the public TypeScript API and authored guidance. Source digest: `7b4c22f134c086d72fefb61ed433fb19727481cffc5f75b9feed9dae02fbbc59`.

Trigger an action in the current workflow.

Avoid: Navigation requiring an anchor or router link.

## Setup

Read [integration](../integration.md). Import `Button` from the installed manifest's entry; load its styles once and use SystemProvider.

## Common props

| Prop | Type | Required | Runtime default expression |
| --- | --- | --- | --- |
| variant | `ButtonVariant \| undefined` | no | "primary" |
| state | `ButtonState \| undefined` | no | "idle" |
| size | `"sm" \| "md" \| undefined` | no | "sm" |
| iconOnly | `boolean \| undefined` | no | false |
| aria-label | `string \| undefined` | no | — |
| disabled | `boolean \| undefined` | no | — |
| type | `"submit" \| "reset" \| "button" \| undefined` | no | "button" |
| children | `ReactNode` | no | — |
| onClick | `MouseEventHandler<HTMLButtonElement> \| undefined` | no | — |
| className | `string \| undefined` | no | "" |

Full inherited API and conditional branches: [contract](../../../knowledge/api/Button.json). Related types are included there. Do not interpret this concise table as the complete inherited API.

## Rules

- iconOnly=true requires a meaningful aria-label.
- Loading disables repeated clicks and exposes aria-busy. The application owns async work and state transitions.
- Use type=submit for form submission; the default is button.
- Native button attributes are supported; no asChild prop is exposed.

## Parts

- **root**: button; className and native attributes target this element
- **label**: internal span; state icons are managed by the component

## Example

See the [compiling examples](../../../src/examples/Components.tsx). The workbench editor is a demonstration model, not the runtime API.
