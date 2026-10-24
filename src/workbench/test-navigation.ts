import { fireEvent, screen, within } from "@testing-library/react";

/** Find a documentation destination through the same global search a reader uses.
 * Keep page-behavior tests independent of which collection is currently open. */
export function navigationLink(name: string) {
  const nav = within(
    screen.getByRole("navigation", { name: /^(المكوّنات|Components)$/ }),
  );
  const existing = nav.queryByRole("link", { name });
  if (existing) return existing;
  fireEvent.change(nav.getByRole("searchbox"), { target: { value: name } });
  return nav.getByRole("link", { name });
}
