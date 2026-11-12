# Foundations section in the docs

Status: approved mockups (2026-11-12). Lean build: four coarse tasks, Sonnet
implementers, Opus reviews and checks in the browser.

## Why

The docs jump straight from install to components. Leading systems (Palermo,
Atlassian, Carbon, Primer, Material) open with Foundations: an overview, then the
tokens everything is built on. Tiraz also needs a page no one else has but
Apple: Arabic and right-to-left.

## Sidebar

The top group becomes **Foundations / الأسس**, in this order:

1. Get started / ابدأ هنا — new overview page (`/foundations/get-started`)
2. Installation / التثبيت — the existing Start here page, renamed; `/start` stays
3. Colors / الألوان (`/foundations/colors`)
4. Typography / الخطوط (`/foundations/typography`)
5. Spacing and layout / المسافات والتخطيط (`/foundations/spacing`)
6. Shape and elevation / الأشكال والظلال (`/foundations/shape`)
7. Arabic and RTL / العربية والاتجاه (`/foundations/arabic-rtl`)
8. Changelog / سجل التغييرات (unchanged route `/changelog`)

A small muted "Library / المكتبة" label sits above the existing Screens,
Components, AI interfaces and Illustrations sections. Nothing else in the sidebar
changes.

## Page shape (all foundation pages)

Plain document pages like the Changelog (not the component playground layout):
title, one-line lede, sections (h2), and a Previous/Next footer following the
sidebar order above (Installation and Changelog take part). Same container and
type as the Changelog page (`max-inline-size: 52rem`, Tiraz tokens, logical
properties). Arabic RTL and English LTR, light and dark, 320px with no
horizontal scroll, visible focus. Arabic copy natural and concise.

## Live token values

Swatch values are never hard-coded. A shared reader renders two hidden scopes —
light and dark — built the way `SystemProvider` builds its root (same class,
`data-theme`, and the provider's inline custom properties for the visitor's
accent/radius/density) and reads `getComputedStyle` for each token. Values
shown as hex when opaque, otherwise as the computed `rgb()/color()` string.
Contrast ratios (WCAG 2.x relative luminance) are computed from those values.

Token rows: token name (copy) · light swatch + value (copy) · dark swatch +
value (copy) · "Use for" text. Copy uses the existing `CopyControl`. On phones a
row stacks.

## Pages

- **Get started:** lede; "What is Tiraz?"; "Two ways to use it" (two cards:
  install the package / own the source, linking Installation); "What's inside"
  (live counts of components, AI interfaces and screens from the catalog — the
  same numbers the sidebar shows); "Principles" (Arabic first, you own it, ready
  for agents, accessible); Next.
- **Colors:** accent strip (all presets from `accentColors`, current one marked,
  read-only); sections Text (with contrast badge vs `--surface`, e.g. "AA 14.7:1",
  AAA ≥ 7, AA ≥ 4.5, "AA large" ≥ 3), Surfaces, Borders, Action (accent-driven),
  Status (success/danger/info/attention/ai and their soft pairs), Focus, Charts.
- **Typography:** font family and weights (400/500/600); a specimen per role
  (display, title, heading, subheading, reading, body, label, meta, micro,
  figure, figure-small): an Arabic line and an English line at real size, with
  token, size, line height, weight and use. Note the Large type setting.
- **Spacing and layout:** the `--space-*` scale as bars with values; control
  sizes (`--control-height`, `--control-small`, paddings); density
  (compact/comfortable) and what it changes.
- **Shape and elevation:** radius scale derived from `--radius` (small, item,
  control, paper, tray, pill) shown as shapes with values; shadows shown on
  paper samples with token names.
- **Arabic and RTL** (modelled on Apple's headings): direction and logical
  layout; mirrored and non-mirrored icons; numbers and digits (the `numerals`
  setting, live `numberLocale` examples for numbers, percentages, currency and
  dates); mixed Arabic/English text and `bdi`; Arabic typography (IBM Plex Sans
  Arabic, leading). Each with a small live example.

## Non-goals

Motion and Icons pages (next wave); editing tokens from these pages (the
settings panel already does that); a playground or API table on foundation pages.

## Tasks

1. **Shell (Sonnet):** route kind, sidebar group + Library label, rename Start
   here → Installation, Vercel rewrite, shared `FoundationPage` layout with
   Previous/Next, live token reader + contrast util + `TokenRow`, Get started
   page, placeholder files for the other five pages, tests.
2. **Colors (Sonnet).**
3. **Typography, Spacing and layout, Shape and elevation (Sonnet).**
4. **Arabic and RTL (Sonnet).**

Tasks 2–4 run in parallel after task 1, each editing only its own page files.
Focused tests per task; the controller runs the full suite, build and browser
checks.
