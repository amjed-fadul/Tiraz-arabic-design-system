# Compose and validate

## Before JSX

- Identify the user's task, information to show, primary action and outcome.
  Map each need to the six registry families. Prefer an inline task and a
  clear primary Button; reserve Sheets for focused modal detail/editing.
- Use Tabs for related views, Switch for a boolean preference, DropdownMenu
  for contextual commands, and Toast for transient outcomes. These are not
  Select, navigation links, Alert, Table, chart, date picker or rich form APIs.
  For an unavailable request, name the gap and propose a concrete alternative:
  for example, an application-owned semantic HTML table styled with shared
  tokens, with Tiraz Button/menu actions. Do not import an invented `Table`,
  silently add a family, or describe ordinary HTML as a Tiraz component.

## Content and configuration

- Start with useful Arabic copy and compact defaults. Use IBM Plex Sans Arabic
  and the shared title/heading/body/meta tokens for clear hierarchy. Animate
  whole labels; never split Arabic into independently animated characters or
  insert letter spacing that breaks shaping. Labels are caller-owned.
- Coordinate `lang` on a host ancestor **above SystemProvider** (or the document)
  and `SystemConfig.direction`: Arabic/RTL,
  English/LTR. Changing direction does not translate copy; changing copy does
  not set direction. A `lang` only on `<main>` misses sibling portal/Toast
  content; SystemProvider has no `lang` prop. Use `<bdi dir="ltr">INV-42</bdi>` (or equivalent isolation)
  for Latin identifiers within Arabic, keeping punctuation correctly ordered.
- Use logical CSS (`padding-inline`, `margin-block`, `inset-inline-end`, etc.)
  and shared spacing, radius, typography, surface/text/border/action tokens.
  Inspect `tokens.css`; do not introduce arbitrary colors or dimensions for
  the library controls. Theme/accent settings propagate through the provider.
  Let content columns shrink with `minmax(0, 1fr)` and `min-inline-size: 0`;
  contain long tables/code in scrolling wrappers rather than overflowing the page.
- Keep success/error/destructive meanings distinct from accent colors. Honor
  both the application reduced-motion setting and OS preference; false in
  config cannot force motion when the OS asks for reduction.
- Keep persistent configuration separate from transient action state. Button
  `state` is supplied by the application: await the real operation, show its
  result and return to the intended state. Clear any application timers on
  unmount; use error handling. Tiraz does not save data or simulate requests.

## Interaction contracts

- Read required and conditional props in the registry before composition.
  Icon-only Button needs a meaningful `aria-label`; Sheet needs title,
  description and closeLabel; Tabs needs label and valid enabled values.
- Controlled `value`, `checked` or `open` requires its change callback to update
  caller state. Use documented defaults for uncontrolled mode; wrappers do
  not invent `defaultOpen` or forward every Radix Root prop.
- Give overlay triggers accessible names and preserve injected Radix props/ref.
  Keep nested menus in Sheet's descendant scope; do not move them to body or
  replace keyboard/focus handlers. Test navigation during opening motion as
  well as after settling, genuine pointer hover, scrolling and Escape/Tab.
- Put ToastProvider inside the intended SystemProvider. Invoke useToast from
  below ToastProvider; otherwise it throws. At most three active notices are
  shown. Hover/focus pauses expiry; essential errors must also remain available
  in persistent, associated application text. Avoid immediately removing the
  trigger that should receive restored focus. An active Toast is a Radix
  dismissable layer: Escape can close it before an open Sheet even when focus
  is in the Sheet. Verify one layer at a time and check actual dismissal/DOM
  removal and focus restoration; do not assume the first Escape closes the Sheet.

## Validate the rendered application

1. Type-check real imports, props, examples and callback arguments. Ensure CSS
   and local font files load; inspect the scope of provider and portal nodes.
2. Exercise the primary action with success/error paths and rapid repetition.
   Verify transient feedback does not overwrite shared configuration.
3. Inspect Arabic/RTL and English/LTR, light/dark, compact/standard density,
   typography/radius/accent changes, narrow/short viewports and reduced motion.
   Check readable shaping, isolated identifiers, wrapping and internal scroll.
4. Use keyboard only: names, visible focus, Tabs arrows, Switch Space, menu
   ArrowDown/Home/End/Enter/typeahead, nested overlays, Escape/Tab dismissal and
   focus restoration. Move the pointer after keyboard navigation; repeat Toast
   dismissal/expiry. Check modal focus stays within its Sheet.
5. Inspect accessible names, roles, descriptions and announcements, including
   representative screen-reader checks where available. Automated type, DOM,
   axe or browser assertions are evidence, not a guarantee of accessibility.
6. Report verified behavior, unavailable capabilities and untested conditions
   honestly. Keep source-copy checks independent of workbench entry files.
