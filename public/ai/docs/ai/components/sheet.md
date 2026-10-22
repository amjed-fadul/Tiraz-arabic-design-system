# Sheet · اللوحة الجانبية

Generated from the public TypeScript API and authored guidance. Source digest: `7b4c22f134c086d72fefb61ed433fb19727481cffc5f75b9feed9dae02fbbc59`.

Details or editing without leaving the current page.

Avoid: A small contextual action menu or a navigation destination.

## Setup

Read [integration](../integration.md). Import `Sheet` from the installed manifest's entry; load its styles once and use SystemProvider.

## Common props

| Prop | Type | Required | Runtime default expression |
| --- | --- | --- | --- |
| trigger | `ReactElement<unknown, string \| import("react").JSXElementConstructor<any>>` | yes | — |
| title | `string` | yes | — |
| description | `string` | yes | — |
| closeLabel | `string` | yes | — |
| children | `ReactNode` | yes | — |
| footer | `ReactNode` | no | — |
| open | `boolean \| undefined` | no | — |
| onOpenChange | `((open: boolean) => void) \| undefined` | no | — |
| side | `"right" \| "left" \| undefined` | no | — |

Full inherited API and conditional branches: [contract](../../../knowledge/api/Sheet.json). Related types are included there. Do not interpret this concise table as the complete inherited API.

## Rules

- title, description and closeLabel are required accessible copy.
- side accepts physical left/right; omitted means right in RTL and left in LTR.
- trigger is one ReactElement; use Tiraz Button. Content and footer accept ReactNode.
- For asynchronous forms, close only after successful save and retain input on failure.
- Escape/backdrop/close restore focus. Nested overlays inherit the Sheet container.
- SheetClose is the public dismissal helper for footer buttons.

## Parts

- **trigger**: caller element
- **overlay**: managed backdrop
- **content**: modal dialog with nested portal context
- **footer**: caller ReactNode

## Example

See the [compiling examples](../../../src/examples/Components.tsx). The workbench editor is a demonstration model, not the runtime API.
