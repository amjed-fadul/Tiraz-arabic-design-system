# Customer dashboard example

Open `/examples/dashboard` from the documentation header's **Dashboard example**
link. The full-page Arabic-first example lives outside the documentation rails.
Its overview, orders and customers navigation links all target sections on the
same page. English changes copy and direction together; one theme applies to the
whole dashboard and its portals.

## Run or reuse

Use the repository's existing Node/npm toolchain:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5211 --strictPort
```

Open `http://127.0.0.1:5211/examples/dashboard`. Choose a different free port if
5211 is occupied. The documentation remains at `/` on that same server.

`src/examples/dashboard/Dashboard.tsx` owns layout and UI state;
`CreateCustomer.tsx` owns the draft/validation/submit guard; `data.ts` contains the
sample records and shared calculations; `dashboard.css` contains logical,
responsive application layout. These are application examples, not library
exports or another component family. There are no new dependencies or public
component changes.

To reuse, copy the dashboard directory alongside the complete `src/system`
bundle, adjust its relative imports, load `tokens.css`/`components.css` and local
IBM Plex Sans Arabic 400/500/600 as in `src/main.tsx`, and mount `<Dashboard />`
in your host entry or route. The host should reset the body margin and use
border-box sizing. No documentation code is needed. Replace the `/`
documentation return link for your host.

## Behavior

All records are deterministic fictional sample data. Dates are fixed to
1–14 October 2026, with the period ending on 14 October; this is not a live clock.
The 7/14-day selector computes both charts, order count and AED order revenue
from the same inclusive period. Revenue sums sample order amounts; the customer
metric counts the entire directory independently of period and filters.

Search matches names or emails and combines with status. DataTable owns sorting
and pagination; application filter changes reset its page. Saving requires a
nonblank name, validates optional email, guards repeated submissions, adds one
customer and displays a Toast. It never creates orders. Every dismissal discards
the draft and restores the mounted create trigger. A persistent message explains
when filters hide the new customer; **Show customer** isolates that record and
**Clear filters** returns to everyone.

The secondary **Preview state** control demonstrates sample, loading, empty
dataset and error. Loading is explicit and makes no network request. Empty
starts with no customers or orders and allows creating the first customer.
Filter misses have a separate message/action. Error's **Retry**, or choosing
Sample, restores sample records and clears filters. Choosing Empty also resets
the directory. Loading and error hide data and disable create/search/status.
Reloading resets records, language, theme, filters and period: there is no
backend, authentication, storage or persistence.

Chart summaries and expandable native data tables retain exact values; tables
scroll inside keyboard-focusable containers on narrow screens. Motion uses
existing Tiraz controls and OS reduced-motion handling. Screen-reader speech
and touch-device hardware have not been manually verified.

## Verification

Focused tests: `npm test -- src/examples/dashboard --maxWorkers=2`.
Full tests, build, lint and formatting use the existing package scripts.
`tests/browser/dashboard.mjs` exercises the local Chrome dashboard and saves
screenshots/results in [browser/](browser/). It uses an externally available
Playwright runtime via `TIRAZ_PLAYWRIGHT`; none is added to this project.
See [verification.md](verification.md) for final results and independent review.
