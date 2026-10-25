import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";

afterEach(() => vi.restoreAllMocks());
function open(
  path = "/library/components/button",
  language: "ar" | "en" = "en",
) {
  persist(storageKeys.documentation, { language });
  window.history.replaceState({}, "", path);
  render(<Workbench />);
  return within(
    screen.getByRole("navigation", {
      name: language === "ar" ? "المكوّنات" : "Components",
    }),
  );
}

it.each(["ar", "en"] as const)(
  "searches aliases across the system without leaving the page in %s",
  async (language) => {
    const nav = open(undefined, language);
    const user = userEvent.setup();
    const search = nav.getByRole("searchbox", {
      name: language === "ar" ? "ابحث في طِراز" : "Search Tiraz",
    });
    await user.type(search, "chip");
    expect(
      nav.getByRole("link", {
        name: language === "ar" ? "خيارات التصفية" : "Chip",
      }),
    ).toHaveAttribute("href", "/library/components/chip");
    expect(
      nav.getByRole("link", {
        name: language === "ar" ? "إدخال الوسوم" : "TagInput",
      }),
    ).toHaveAttribute("href", "/library/components/tag-input");
    expect(window.location.pathname).toBe("/library/components/button");
    await user.keyboard("{Escape}");
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(
      screen.getByRole("button", {
        name: language === "ar" ? "إخفاء القائمة الجانبية" : "Hide navigation",
      }),
    ).toHaveAttribute("aria-expanded", "true");
    await user.type(search, "وَسْم");
    expect(
      nav.getByRole("link", { name: language === "ar" ? "الشارة" : "Badge" }),
    ).toBeVisible();
    await user.clear(search);
    await user.type(search, "no-such-control");
    expect(
      nav.getByText(language === "ar" ? "لم نجد نتائج" : "No results found"),
    ).toBeVisible();
    await user.click(
      nav.getByRole("button", {
        name: language === "ar" ? "مسح البحث" : "Clear search",
      }),
    );
    expect(search).toHaveFocus();
    expect(
      nav.getByRole("link", { name: language === "ar" ? "الأزرار" : "Button" }),
    ).toHaveAttribute("aria-current", "page");
  },
);

it("keeps a matching collection, collapsing the title without navigation", async () => {
  const nav = open("/library");
  const user = userEvent.setup();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Components",
  );
  expect(nav.getByRole("link", { name: "Button" })).toHaveAttribute(
    "href",
    "/library/components/button",
  );
  expect(nav.queryByRole("link", { name: "AgentTask" })).toBeNull();
  await user.click(nav.getByRole("button", { name: "AI interfaces" }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "AI interfaces",
  );
  expect(nav.getByRole("link", { name: "Agent task" })).toBeVisible();
  const title = nav.getByRole("button", { name: "AI interfaces" });
  const path = window.location.href;
  await user.click(title);
  expect(title).toHaveAttribute("aria-expanded", "false");
  expect(title).toHaveFocus();
  expect(nav.queryByRole("link", { name: "Agent task" })).toBeNull();
  expect(window.location.href).toBe(path);
  await user.keyboard("{Enter}");
  expect(nav.getByRole("link", { name: "Agent task" })).toBeVisible();
  expect(title).toHaveFocus();
  expect(nav.getByRole("button", { name: "Screens" })).toBeVisible();
  expect(nav.getByRole("button", { name: "Components" })).toBeVisible();
});

it("ranks exact names first and follows search results with real links and main focus", async () => {
  const nav = open();
  const user = userEvent.setup();
  const search = nav.getByRole("searchbox");
  await user.type(search, "input");
  const results = within(
    nav.getByRole("region", { name: "Search results" }),
  ).getAllByRole("link");
  expect(results[0]).toHaveAccessibleName("Input");
  await user.click(results[0]);
  expect(window.location.pathname).toBe("/library/components/input");
  expect(screen.getByRole("main")).toHaveFocus();
  expect(search).toHaveValue("");
  expect(nav.getByRole("link", { name: "Input" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await user.type(search, "Khayt");
  await user.click(nav.getByRole("link", { name: "Khayt" }));
  expect(window.location.pathname).toBe("/illustrations/khayt");
  act(() => window.history.back());
  await screen.findByRole("heading", { name: "Input", level: 1 });
  expect(nav.getByRole("link", { name: "Input" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("opens hidden navigation and focuses its search with Control K", async () => {
  open();
  await userEvent.click(
    screen.getByRole("button", { name: "Hide navigation" }),
  );
  fireEvent.keyDown(document, { key: "k", ctrlKey: true });
  expect(screen.getByRole("searchbox", { name: "Search Tiraz" })).toHaveFocus();
  expect(
    screen.getByRole("button", { name: "Hide navigation" }),
  ).toHaveAttribute("aria-expanded", "true");
});

it("opens one mobile search, keeps it open on query Escape, then selects a result", async () => {
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...original(query),
    matches: query === "(max-width: 760px)",
  }));
  persist(storageKeys.documentation, { language: "en" });
  window.history.replaceState({}, "", "/library/components/button");
  render(<Workbench />);
  const user = userEvent.setup();
  fireEvent.keyDown(document, { key: "k", metaKey: true });
  const drawer = within(await screen.findByRole("dialog"));
  const search = drawer.getByRole("searchbox", { name: "Search Tiraz" });
  expect(screen.getAllByRole("searchbox")).toHaveLength(1);
  expect(search).toHaveFocus();
  await user.type(search, "chip");
  await user.keyboard("{Escape}");
  expect(search).toHaveValue("");
  expect(screen.getByRole("dialog")).toBeVisible();
  await user.type(search, "badge");
  await user.click(drawer.getByRole("link", { name: "Badge" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(window.location.pathname).toBe("/library/components/badge");
  expect(screen.getByRole("main")).toHaveFocus();
});

it("clears a desktop query from a focused result before Escape closes navigation", async () => {
  const nav = open();
  const user = userEvent.setup();
  const search = nav.getByRole("searchbox");
  await user.type(search, "chip");
  nav.getByRole("link", { name: "Chip" }).focus();
  await user.keyboard("{Escape}");
  expect(search).toHaveValue("");
  expect(search).toHaveFocus();
  expect(
    screen.getByRole("button", { name: "Hide navigation" }),
  ).toHaveAttribute("aria-expanded", "true");
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Show navigation" })).toHaveFocus();
});

it("starts a new collection at the top while repeated disclosure leaves page scroll alone", async () => {
  const nav = open();
  const scroll = vi.spyOn(window, "scrollTo");
  scroll.mockClear();
  const title = nav.getByRole("button", { name: "Screens" });
  await userEvent.click(title);
  expect(scroll).toHaveBeenCalledExactlyOnceWith(0, 0);
  expect(title).toHaveFocus();
  scroll.mockClear();
  await userEvent.click(title);
  expect(scroll).not.toHaveBeenCalled();
});

it("shows each search from the top and restores the collection scroll after clearing", async () => {
  const nav = open();
  const search = nav.getByRole("searchbox");
  const list = nav
    .getByRole("region", { name: "Components list" })
    .closest(".docs-navigation-scroll")!;
  list.scrollTop = 600;
  fireEvent.scroll(list);
  fireEvent.change(search, { target: { value: "a" } });
  expect(list.scrollTop).toBe(0);
  list.scrollTop = 150;
  fireEvent.scroll(list);
  fireEvent.change(search, { target: { value: "input" } });
  expect(list.scrollTop).toBe(0);
  await userEvent.click(nav.getByRole("button", { name: "Clear search" }));
  expect(list.scrollTop).toBe(600);
});

it.each(["ar", "en"] as const)(
  "places every collection directly under its title in one flowing list in %s",
  async (language) => {
    const nav = open("/library", language);
    const names =
      language === "ar"
        ? ["شاشات", "المكوّنات", "واجهات المساعد", "الرسوم التوضيحية"]
        : ["Screens", "Components", "AI interfaces", "Illustrations"];
    for (const name of names) {
      const title = nav.getByRole("button", { name });
      if (title.getAttribute("aria-expanded") !== "true")
        await userEvent.click(title);
      const region = document.getElementById(
        title.getAttribute("aria-controls")!,
      );
      expect(region?.previousElementSibling).toContainElement(title);
      expect(region).toBeVisible();
      const flow = title.closest(".docs-navigation-scroll");
      expect(flow).toContainElement(
        nav.getByRole("link", {
          name: language === "ar" ? "ابدأ هنا" : "Start here",
        }),
      );
      for (const sectionName of names)
        expect(flow).toContainElement(
          nav.getByRole("button", { name: sectionName }),
        );
    }
  },
);

it("opens the selected collection when its title is clicked during a search", async () => {
  const nav = open();
  const search = nav.getByRole("searchbox");
  await userEvent.type(search, "chip");
  const title = nav.getByRole("button", { name: "Components" });
  expect(title).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(title);
  expect(search).toHaveValue("");
  expect(title).toHaveAttribute("aria-expanded", "true");
  expect(title).toHaveFocus();
  expect(nav.getByRole("link", { name: "Button" })).toBeVisible();
});
