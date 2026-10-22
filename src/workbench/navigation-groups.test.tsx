import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { catalog, nestedParts, navigationGroups } from "./catalog";
import { screens } from "../examples/frame/screen";
import { persist, storageKeys } from "./storage";

afterEach(() => vi.restoreAllMocks());

it.each(["ar", "en"] as const)(
  "toggles the list on repeated title clicks without moving focus in %s",
  async (language) => {
    persist(storageKeys.documentation, { language });
    render(<Workbench />);
    const user = userEvent.setup();
    const nav = within(
      screen.getByRole("navigation", {
        name: language === "ar" ? "المكوّنات" : "Components",
      }),
    );
    const title = nav.getByRole("heading", {
      level: 2,
      name: language === "ar" ? "شاشات" : "Screens",
    });
    await user.click(
      within(title).getByText(language === "ar" ? "شاشات" : "Screens"),
    );
    const toggle = within(title).getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveFocus();
    expect(window.location.pathname + window.location.search).toBe(
      "/library?category=screens",
    );
    await user.click(
      within(title).getByText(language === "ar" ? "شاشات" : "Screens"),
    );
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
    expect(
      nav.queryByRole("button", {
        name: language === "ar" ? "لوحة العملاء" : "Customer dashboard",
      }),
    ).toBeNull();
    expect(
      nav.getByRole("button", {
        name: language === "ar" ? "الأزرار" : "Button",
      }),
    ).toBeVisible();
    expect(window.location.pathname + window.location.search).toBe(
      "/library?category=screens",
    );
  },
);

it("keeps every section heading visible and lists each curated page once when its section opens", async () => {
  render(<Workbench />);
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  expect(
    nav.getAllByRole("heading", { level: 2 }).map((item) => item.textContent),
  ).toEqual([
    ...navigationGroups.map((group) => group.name[0]),
    "الرسوم التوضيحية",
  ]);
  expect(nav.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(
    "شاشات",
  );
  expect(nav.queryByText("الأجزاء")).toBeNull();
  expect(nav.queryByText("أنماط الذكاء الاصطناعي")).toBeNull();
  const names: (string | null)[] = [];
  for (const group of navigationGroups) {
    const toggle = nav.getByRole("button", { name: group.name[0] });
    if (toggle.getAttribute("aria-expanded") === "false")
      await userEvent.click(toggle);
    const buttons = within(nav.getByRole("group", { name: group.name[0] }))
      .getAllByRole("button")
      .filter((button) => !button.hasAttribute("aria-expanded"));
    expect(buttons.map((item) => item.textContent)).toEqual(
      (group.id === "screens" ? screens : group.items).map(
        (item) => item.name[0],
      ),
    );
    names.push(...buttons.map((item) => item.textContent));
    expect(nav.getByRole("button", { name: group.name[0] })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }
  expect(names.sort()).toEqual(
    [
      ...catalog.filter(
        (item) =>
          item.id !== "field" &&
          item.id !== "chat-app" &&
          !(item.id in nestedParts),
      ),
      ...screens,
    ]
      .map((item) => item.name[0])
      .sort(),
  );
});

it("opens section galleries without removing other expanded lists", async () => {
  persist(storageKeys.documentation, { language: "en" });
  render(<Workbench />);
  const user = userEvent.setup();
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  const screensToggle = nav.getByRole("button", { name: "Screens" });
  screensToggle.focus();
  await user.keyboard("{Enter}");
  expect(window.location.pathname + window.location.search).toBe(
    "/library?category=screens",
  );
  expect(screensToggle).toHaveAttribute("aria-current", "page");
  expect(screensToggle).toHaveFocus();
  expect(nav.getByRole("button", { name: "Button" })).toBeVisible();
  expect(nav.getByRole("button", { name: "Customer dashboard" })).toBeVisible();
  await user.click(nav.getByRole("button", { name: "Forms" }));
  expect(nav.getByRole("button", { name: "Forms" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await user.click(nav.getByRole("button", { name: "Forms" }));
  expect(nav.getByRole("button", { name: "Customer dashboard" })).toBeVisible();
  const results = within(
    screen.getByRole("region", { name: "Library results" }),
  );
  expect(results.getByRole("link", { name: "Button" })).toBeVisible();
  expect(
    results.queryByRole("link", { name: "Customer dashboard" }),
  ).toBeNull();
});

it.each(["ar", "en"] as const)(
  "keeps keyboard focus and other lists open while toggling a section in %s",
  async (language) => {
    persist(storageKeys.documentation, { language });
    render(<Workbench />);
    const user = userEvent.setup();
    const nav = within(
      screen.getByRole("navigation", {
        name: language === "ar" ? "المكوّنات" : "Components",
      }),
    );
    const main = screen.getByRole("main");
    const toggle = nav.getByRole("button", {
      name: language === "ar" ? "شاشات" : "Screens",
    });
    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveFocus();
    expect(
      nav.getByRole("button", {
        name: language === "ar" ? "الأزرار" : "Button",
      }),
    ).toBeVisible();
    expect(
      nav.getByRole("button", {
        name: language === "ar" ? "لوحة العملاء" : "Customer dashboard",
      }),
    ).toBeVisible();
    const target = document.getElementById(
      toggle.getAttribute("aria-controls")!,
    );
    expect(target).not.toBeNull();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
    expect(
      nav.queryByRole("button", {
        name: language === "ar" ? "لوحة العملاء" : "Customer dashboard",
      }),
    ).toBeNull();
    expect(window.location.pathname + window.location.search).toBe(
      "/library?category=screens",
    );
    expect(screen.getByRole("main")).toBe(main);
  },
);

it("keeps section choices when closing and reopening the mobile drawer", async () => {
  const media = window.matchMedia;
  const mobile = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...media(query),
    matches: query === "(max-width: 760px)",
  }));
  persist(storageKeys.documentation, { language: "en" });
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  let drawer = within(screen.getByRole("dialog", { name: "Components" }));
  await user.click(drawer.getByRole("button", { name: "Screens" }));
  await user.click(drawer.getByRole("button", { name: "Forms" }));
  expect(screen.getByRole("dialog", { name: "Components" })).toBeVisible();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  drawer = within(screen.getByRole("dialog", { name: "Components" }));
  expect(drawer.getByRole("button", { name: "Screens" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(drawer.getByRole("button", { name: "Forms" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await user.click(drawer.getByRole("button", { name: "Forms" }));
  expect(screen.getByRole("dialog", { name: "Components" })).toBeVisible();
  expect(drawer.getByRole("button", { name: "Forms" })).toHaveFocus();
  await user.click(drawer.getByRole("button", { name: "Button" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(window.location.pathname).toBe("/library/components/button");
  expect(screen.getByRole("main")).toHaveFocus();
  mobile.mockRestore();
});

it("keeps the curated page and URL when switching languages with the keyboard", async () => {
  render(<Workbench />);
  const user = userEvent.setup();
  await user.click(
    within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
      "button",
      { name: "الأزرار" },
    ),
  );
  const pageUrl = window.location.href;
  await user.click(screen.getByRole("button", { name: "English" }));
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  expect(nav.getByRole("button", { name: "Button" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(nav.queryByText("Parts")).toBeNull();
  expect(window.location.href).toBe(pageUrl);
  expect(screen.getByRole("button", { name: "العربية" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(screen.getByRole("button", { name: "English" })).toHaveFocus();
});

it("restores saved specialist pages and makes their parent current", async () => {
  const media = window.matchMedia;
  const mobile = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...media(query),
    matches: query === "(max-width: 760px)",
  }));
  persist(storageKeys.documentation, {
    active: "prompt-bar",
    aiPartsOpen: true,
  });
  render(<Workbench />);
  expect(
    screen.getByRole("heading", { level: 1, name: "شريط الطلب" }),
  ).toBeVisible();
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  expect(nav.queryByRole("button", { name: "شريط الطلب" })).toBeNull();
  expect(nav.getByRole("button", { name: "محرر الرسائل" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await userEvent.click(screen.getByRole("button", { name: "فتح القائمة" }));
  const drawer = within(screen.getByRole("dialog", { name: "المكوّنات" }));
  expect(drawer.queryByText("الأجزاء")).toBeNull();
  expect(drawer.getByRole("button", { name: "محرر الرسائل" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  mobile.mockRestore();
});
