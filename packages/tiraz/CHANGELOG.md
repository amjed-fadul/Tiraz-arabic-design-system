# Changelog

What changed in each Tiraz release, and how to update source you copied into your app. Generated from `source/system/ai/changelog.json`; full notes at https://tiraz.dev/changelog.

## 0.1.3-preview.5 — 2026-10-28

_Preview · Run `tiraz update`. No manual steps._

- **ChatThread** ChatThread accepts ChatThreadMessage parts as children, with plain-value props such as id, role, status and onRetry, as an alternative to the messages array; the existing messages form is unchanged. _(Added)_
- **ToolChips** ToolChips accepts ToolChip parts as children, each with its own onActivate, as an alternative to the items array; the existing items form is unchanged. _(Added)_
- **TaskStarter** TaskStarter documents that onSubmit may take only the draft, as onSubmit(value); the type and behavior are unchanged. _(Changed)_
- **Sidebar** SidebarItem, SidebarAction and SidebarDisclosure accept iconName, a plain string from the sidebarIconNames list, as an alternative to icon; existing icon usage is unchanged. _(Added)_

## 0.1.3-preview.4 — 2026-10-28

_Preview · Run `tiraz update`. No manual steps._

- **FilterBar** FilterBar gains compound parts FilterBarRoot, FilterBarSearch and FilterBarChip with plain-value props; the existing FilterBar props are unchanged. _(Added)_
- **ToastProvider** A declarative Toast part takes open, onOpenChange, title, description, tone and duration and works anywhere inside ToastProvider; ToastProviderProps is now exported and toast() is unchanged. _(Added)_

## 0.1.3-preview.3 — 2026-10-27

_Not on npm · Run `tiraz update`. No manual steps._

- **Tabs** Tabs gains compound parts TabsRoot, TabsList, TabsTrigger and TabsContent; the existing Tabs props and markup are unchanged. _(Added)_
- **Accordion** Accordion gains compound parts AccordionRoot, AccordionSection, AccordionTrigger and AccordionContent; the existing Accordion props and markup are unchanged. _(Added)_
- **TaskRows** TaskRows gains compound parts TaskRowsRoot, TaskRowsRow and TaskRowsEmpty; the new TaskRowsRoot takes its empty state as a TaskRowsEmpty child rather than an emptyState prop, and the existing TaskRows is unchanged. _(Added)_

## 0.1.3-preview.2 — 2026-10-27

_Not on npm · Run `tiraz update`. No manual steps._

- **Select, DatePicker** Select and DatePicker accept an optional collisionBoundary that limits their popup size and placement to an embedded surface; omitted, behavior is unchanged. _(Added)_
- **Modal** Modal gains compound parts (Root, Trigger, Content, Body and Footer); the existing Modal props and markup are unchanged. _(Added)_
- **Sheet** Sheet gains compound parts (Root, Trigger, Content, Body and Footer); the existing Sheet props and markup are unchanged. _(Added)_
- **DropdownMenu** DropdownMenu gains compound parts (Root, Trigger, Content, Item and Separator); the existing DropdownMenu props and markup are unchanged. _(Added)_

## 0.1.3-preview.1 — 2026-10-27

_Not on npm · Run `tiraz update`. No manual steps._

- **Tooltip** Tooltip gains compound parts TooltipRoot, TooltipTrigger and TooltipContent, with open, defaultOpen and onOpenChange; the existing Tooltip trigger and content props still work. _(Added)_
- **Provider** SystemProvider accepts portalContainer so popups and dialogs render inside an embedded host element; omitted, overlays keep their original destination. _(Added)_

## 0.1.3-preview.0 — 2026-10-26

_Not on npm · Run `tiraz update`. No manual steps._

- **CLI** tiraz add installs selected components instead of the whole library, and a user-owned tiraz.theme.css holds your colors, fonts and radius and is never overwritten. _(Added)_
- **CLI** tiraz update previews, prepares and applies reviewed merges of new Tiraz source into your copied components, keeping your local edits. _(Added)_
- **Chip** New Chip component for shared filter and navigation chips. _(Added)_
- **Provider** SystemProvider accepts className, style and lang on its root for application layout and section language; omitted, the root is unchanged. _(Added)_

## 0.1.2 — 2026-10-24

_Latest · Run `tiraz update`. 1 manual step._

- **Button, Badge, Tabs, Input, Select, DropdownMenu, Sidebar, TagInput** Text no longer sits slightly above center in buttons, badges, tabs, inputs, selects, menu items, sidebar labels and tags; component APIs are unchanged. _(Fixed)_
  - Manual step: In your copied components.css, remove the old --optical-lift overrides, keeping your own changes.

## 0.1.1 — 2026-10-23

_Stable · Run `tiraz update`. 1 manual step._

- **Mascot** The Khayt working state is now the Mini weaving loop; agent colors, pause behavior and reduced motion work with the same props. _(Changed)_
  - Manual step: If you copied the mascot source, compare and port source/mascot/khayt-motion.ts and khayt-renderer.ts from the package, keeping your own changes.
- **Tabs** The Tabs active indicator is placed correctly inside scaled or transformed ancestors. _(Fixed)_
- **Library** Business patterns CustomerEditSheet, PreferenceSettings and InvoiceActions (with nested invoice actions) and the useAsyncAction hook. _(Added)_
- **Package** The package ships an AI guide, a component registry and generated API and source-hash facts with its editable source. _(Added)_

## 0.1.0 — 2026-10-22

_Stable · Run `tiraz update`. No manual steps._

- **Library** First release: about 80 components and patterns (forms, data, navigation, overlays, feedback, charts, AI parts and task-level AI patterns), an Arabic numerals setting, the Khayt mascot and a source installer. _(Added)_
