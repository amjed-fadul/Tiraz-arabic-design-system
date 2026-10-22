# Independent review

The separate reviewer inspected the uncommitted implementation against baseline
`5f53b9c8949884ed1faa14eacd220739e81826ad`, exercised native selection and
keyboard focus in the local preview, and ran focused tests independently.

Findings and resolution:

- P2: semantic controls remained selectable. Excluded native summary and ARIA
  interactive roles, including link and scrollbar; added custom button/link tests.
- P2: model option details were visible but unassociated with the accessible
  option. Added stable `aria-describedby` IDs for supplied tags, description,
  context, price and availability. Added an accessible description assertion.
- P2: a non-DOM scroll event target could throw in `contains`. Guarded the target;
  the existing scroll regression now exits cleanly.

Re-review caught the missing `role=link` case; it was fixed and reviewed again.
Final independent result: no remaining actionable source findings; 2 focused
files / 17 tests passed, exit 0. Reviewer inspected the final main browser
artifact: 22 checks, zero failures and zero errors. The final review covered
focus capture/restoration, genuine selection clearing while actions have focus,
and retaining the expanded action state for unchanged selections.

Short-viewport harness timeouts were traced separately: instrumentation showed
an asynchronous native scroll event arriving after the DOM-created range.
Waiting two animation frames after test scrolling fixes the simulated setup;
the implementation still dismisses immediately on actual scrolling.

No physical touch-device or manual screen-reader verification was performed.

## Final geometry review

Visual inspection of the recorded native drag revealed that a stable virtual
measurable left Popper at the first few selected characters. Instrumentation
showed a 246.515625px current Range but a 15.96875px stale anchor. The fix memoizes
a new measurable per changed selection snapshot. The same toolbar stays mounted,
retaining focus and expanded state. The native-drag browser regression now checks
that Popper's measured anchor width matches the current Range within one pixel.
Independent re-review confirmed the installed primitive's identity contract,
matching geometry through focus/action, and no lifecycle/focus regressions.
Its separate focused rerun passed 12 tests with exit 0.

## Automated accessibility diagnostic

A full-provider axe scan with Radix Select open reports `aria-hidden-focus` on
the hidden background `main`. The installed Select hides its background through
`hideOthers` and traps focus with its existing FocusScope. The independent
reviewer inspected that source and judged this an inherited primitive/tooling
limitation rather than a scoped ModelSelector defect. The browser harness records
the full diagnostic and separately checks Tab, Shift+Tab and attempted
programmatic background focus remain on an option. It scans the active popup
separately. No full-tree axe cleanliness or screen-reader conformance is claimed;
no `aria-modal` or new background/global manager was added to the listbox.
