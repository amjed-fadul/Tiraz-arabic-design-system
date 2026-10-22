# Dropdown menu · القائمة المنسدلة

Generated from the public TypeScript API and authored guidance. Source digest: `7b4c22f134c086d72fefb61ed433fb19727481cffc5f75b9feed9dae02fbbc59`.

Contextual actions for a record or page.

Avoid: Form value selection; use a suitable select control instead.

## Setup

Read [integration](../integration.md). Import `DropdownMenu` from the installed manifest's entry; load its styles once and use SystemProvider.

## Common props

| Prop | Type | Required | Runtime default expression |
| --- | --- | --- | --- |
| trigger | `ReactElement<unknown, string \| import("react").JSXElementConstructor<any>>` | yes | — |
| items | `MenuItem[]` | yes | — |
| align | `"end" \| "start" \| undefined` | no | "start" |
| open | `boolean \| undefined` | no | — |
| onOpenChange | `((open: boolean) => void) \| undefined` | no | — |

Full inherited API and conditional branches: [contract](../../../knowledge/api/DropdownMenu.json). Related types are included there. Do not interpret this concise table as the complete inherited API.

## Rules

- trigger is one ReactElement capable of receiving Radix trigger props; use Tiraz Button.
- Items have unique IDs, string labels and application onSelect callbacks. Disabled actions cannot run.
- Controlled open requires onOpenChange. Uncontrolled opening is managed internally.
- No children, className, side or ref prop is exposed. align uses logical start/end.
- Reuse the provider portal context, including menus nested in Sheet.

## Parts

- **trigger**: caller element
- **menu**: managed non-modal portal
- **item**: configured through MenuItem

## Example

See the [compiling examples](../../../src/examples/Components.tsx). The workbench editor is a demonstration model, not the runtime API.
