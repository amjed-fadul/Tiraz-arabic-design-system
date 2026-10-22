# Switch · مفتاح التبديل

Generated from the public TypeScript API and authored guidance. Source digest: `7b4c22f134c086d72fefb61ed433fb19727481cffc5f75b9feed9dae02fbbc59`.

A labeled on/off preference.

Avoid: Choosing among multiple mutually exclusive options.

## Setup

Read [integration](../integration.md). Import `Switch` from the installed manifest's entry; load its styles once and use SystemProvider.

## Common props

| Prop | Type | Required | Runtime default expression |
| --- | --- | --- | --- |
| label | `string` | yes | — |
| description | `string \| undefined` | no | — |
| checked | `boolean \| undefined` | no | — |
| defaultChecked | `boolean \| undefined` | no | — |
| onCheckedChange | `((checked: boolean) => void) \| undefined` | no | — |
| disabled | `boolean \| undefined` | no | — |
| required | `boolean \| undefined` | no | — |
| name | `string \| undefined` | no | — |
| value | `string \| number \| readonly string[] \| undefined` | no | — |
| id | `string \| undefined` | no | — |
| className | `string \| undefined` | no | "" |
| style | `CSSProperties \| undefined` | no | — |
| ref | `Ref<HTMLButtonElement> \| undefined` | no | — |

Full inherited API and conditional branches: [contract](../../../knowledge/api/Switch.json). Related types are included there. Do not interpret this concise table as the complete inherited API.

## Rules

- label is required and linked to the control. description is combined with caller aria-describedby.
- Choose controlled checked/onCheckedChange or uncontrolled defaultChecked.
- Native Radix Switch.Root props are inherited except children and asChild; the wrapper owns Thumb markup.
- className targets the label wrapper; style, ref and native attributes target the control.

## Parts

- **wrapper**: label and control layout; className target
- **control**: Radix root; style/ref/native attributes target
- **thumb**: managed internally

## Example

See the [compiling examples](../../../src/examples/Components.tsx). The workbench editor is a demonstration model, not the runtime API.
