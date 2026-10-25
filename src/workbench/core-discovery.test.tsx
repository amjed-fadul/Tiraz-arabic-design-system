import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { defaultConfig, SystemProvider } from "../system";
import { LibraryPage } from "./LibraryPage";
import {
  essentialIds,
  galleryGroups,
  galleryEntries,
  searchEntries,
} from "./navigation-model";

it("leads with everyday components while covering the complete core catalog exactly once", () => {
  const groups = galleryGroups(undefined, "en", "");
  expect(groups[0].id).toBe("essentials");
  expect(groups[0].entries.slice(0, 3).map((item) => item.key)).toEqual([
    "button",
    "input",
    "badge",
  ]);
  const ids = groups.flatMap((group) => group.entries.map((item) => item.key));
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.sort()).toEqual(
    galleryEntries("components", "en")
      .map((item) => item.key)
      .sort(),
  );
  expect(galleryEntries("essentials", "ar").map((item) => item.key)).toEqual([
    ...essentialIds,
  ]);
});

it.each(["radio buttons", "اختيار واحد", "خِيَار واحد"])(
  "finds familiar names with %s",
  (query) => {
    expect(searchEntries(query, "ar")[0].key).toBe("radio-group");
  },
);

it.each(["ar", "en"] as const)(
  "shows readable, noninteractive core previews and clear links in %s",
  (language) => {
    render(
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        <LibraryPage language={language} theme="light" navigate={vi.fn()} />
      </SystemProvider>,
    );
    const basics = screen.getByRole("region", {
      name: language === "ar" ? "مكوّنات أساسية" : "Everyday components",
    });
    expect(within(basics).getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/library/components/button",
    );
    const preview = basics.querySelector('[data-component="button"]');
    expect(preview).toHaveAttribute("inert");
    expect(preview).toHaveAttribute("aria-hidden", "true");
    expect(preview?.querySelector(".tz-button")).toBeTruthy();
    expect(preview?.querySelector("img")).toBeNull();
  },
);

it("searches inside a collection and clears without leaving it or losing focus", async () => {
  const navigate = vi.fn();
  const user = userEvent.setup();
  render(
    <SystemProvider>
      <LibraryPage
        category="forms"
        language="en"
        theme="light"
        navigate={navigate}
      />
    </SystemProvider>,
  );
  const search = screen.getByRole("searchbox", { name: "Search components" });
  await user.type(search, "chips");
  const results = within(
    screen.getByRole("region", { name: "Library results" }),
  );
  expect(results.getByRole("link", { name: "TagInput" })).toHaveAttribute(
    "href",
    "/library/components/tag-input",
  );
  expect(results.queryByRole("link", { name: "Badge" })).toBeNull();
  await user.clear(search);
  await user.type(search, "nothing-matches");
  expect(results.getByText("No results found")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear search" }));
  expect(search).toHaveFocus();
  expect(search).toHaveValue("");
  expect(results.getByRole("link", { name: "Button" })).toBeVisible();
  expect(navigate).not.toHaveBeenCalled();
  await user.type(search, "input");
  await user.keyboard("{Escape}");
  expect(search).toHaveFocus();
  expect(search).toHaveValue("");
});

it("filters with navigable collection links and retains legacy categories", () => {
  render(
    <SystemProvider>
      <LibraryPage language="en" theme="dark" navigate={vi.fn()} />
    </SystemProvider>,
  );
  const collections = within(
    screen.getByRole("navigation", { name: "Component collections" }),
  );
  expect(collections.getByRole("link", { name: "Essentials" })).toHaveAttribute(
    "href",
    "/library?category=essentials",
  );
  expect(collections.getByRole("link", { name: "Forms" })).toHaveAttribute(
    "href",
    "/library?category=forms",
  );
  expect(
    collections.getByRole("link", { name: "All components" }),
  ).toHaveAttribute("aria-current", "page");
  expect(galleryGroups("charts", "en", "")[0].entries).toHaveLength(4);
  expect(
    galleryGroups("screens", "en", "")
      .flatMap((group) => group.entries)
      .every((item) => item.route.kind === "screen"),
  ).toBe(true);
});

it("clears a previous collection's query without replacing the focused collection link", async () => {
  const user = userEvent.setup();
  const page = (category?: string) => (
    <SystemProvider>
      <LibraryPage
        category={category}
        language="en"
        theme="light"
        navigate={vi.fn()}
      />
    </SystemProvider>
  );
  const { rerender } = render(page());
  await user.type(
    screen.getByRole("searchbox", { name: "Search components" }),
    "chips",
  );
  const forms = screen.getByRole("link", { name: "Forms" });
  forms.focus();
  rerender(page("forms"));
  expect(
    screen.getByRole("searchbox", { name: "Search components" }),
  ).toHaveValue("");
  expect(forms).toHaveFocus();
  rerender(page());
  expect(
    screen.getByRole("searchbox", { name: "Search components" }),
  ).toHaveValue("");
});
