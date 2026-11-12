# Changelog

What changed in each Tiraz release, and how to update source you copied into your app. Generated from `source/system/ai/changelog.json`; full notes at https://tiraz.dev/changelog.

## 28 October 2026

### 0.1.3-preview.5

- **ChatThread** accepts `ChatThreadMessage` parts as children. Existing use is unchanged. _(Added)_
- **ToolChips** accepts `ToolChip` parts as children. Existing use is unchanged. _(Added)_
- **TaskStarter** documents `onSubmit(value)`: the handler may take just the draft. Behavior is unchanged. _(Changed)_
- **Sidebar** accepts `iconName`, a plain string, instead of an `icon` node. Existing use is unchanged. _(Added)_

### 0.1.3-preview.4

- **FilterBar** has compound parts `FilterBarRoot`, `FilterBarSearch` and `FilterBarChip`. Existing use is unchanged. _(Added)_
- **Toast** can be declared as a `Toast` part inside `ToastProvider`. `toast()` is unchanged. _(Added)_
- **ToastProviderProps** is now exported. _(Added)_

## 27 October 2026

### 0.1.3-preview.3

- **Tabs** has compound parts such as `TabsRoot` and `TabsTrigger`. Existing use is unchanged. _(Added)_
- **Accordion** has compound parts such as `AccordionRoot` and `AccordionSection`. Existing use is unchanged. _(Added)_
- **TaskRows** has compound parts, with the empty state set by a `TaskRowsEmpty` child. Existing use is unchanged. _(Added)_

### 0.1.3-preview.2

- **Select, DatePicker** accept an optional `collisionBoundary` to keep popups inside an embedded surface. _(Added)_
- **Modal** has compound parts `Root`, `Trigger` and `Content`. Existing use is unchanged. _(Added)_
- **Sheet** has compound parts `Root`, `Trigger` and `Content`. Existing use is unchanged. _(Added)_
- **DropdownMenu** has compound parts `Root`, `Trigger` and `Content`. Existing use is unchanged. _(Added)_

### 0.1.3-preview.1

- **Tooltip** has compound parts `TooltipRoot`, `TooltipTrigger` and `TooltipContent`. Existing use is unchanged. _(Added)_
- **SystemProvider** accepts `portalContainer` to render popups and dialogs inside an embedded host. Omitted, nothing changes. _(Added)_

## 26 October 2026

### 0.1.3-preview.0

- **CLI** installs only the components you pick with `tiraz add`. _(Added)_
- **CLI** keeps your colors, fonts and radius in `tiraz.theme.css`, which it never overwrites. _(Added)_
- **CLI** updates copied components with `tiraz update`, merging new source and keeping your edits. _(Added)_
- **Chip** is a new component for filter and navigation chips. _(Added)_
- **SystemProvider** accepts `className`, `style` and `lang` on its root. Omitted, nothing changes. _(Added)_

## 24 October 2026

### 0.1.2

- **Button, Badge, Tabs, Input, Select, DropdownMenu, Sidebar, TagInput** no longer lift text above center. APIs are unchanged. _(Fixed)_
  - Manual step: Remove the old `--optical-lift` overrides from your copied `components.css`, keeping your own changes.

## 23 October 2026

### 0.1.1

- **Khayt** now weaves in the Mini loop while working. Props are unchanged. _(Changed)_
  - Manual step: If you copied the mascot source, port `source/mascot/khayt-motion.ts` and `khayt-renderer.ts` from the package, keeping your own changes.
- **Tabs** keeps its active indicator in place inside scaled or transformed parents. _(Fixed)_
- **Library** adds the `CustomerEditSheet`, `PreferenceSettings` and `InvoiceActions` business patterns. _(Added)_
- **Package** now ships an AI guide, a component registry and generated API facts. _(Added)_

## 22 October 2026

### 0.1.0

- **Library** is the first release: about 80 components and patterns, Khayt and a source installer. _(Added)_
