import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { catalog, nestedParts } from "./catalog";
import { screens } from "../examples/frame/screen";
import { persist, storageKeys } from "./storage";

afterEach(() => vi.restoreAllMocks());

it.each(["ar", "en"] as const)(
  "toggles the whole section title without moving focus in %s",
  async (language) => {
    persist(storageKeys.documentation, { language });
    render(<Workbench />);
    const user = userEvent.setup();
    const nav = within(
      screen.getByRole("navigation", {
        name: language === "ar" ? "المكوّنات" : "Components",
      }),
    );
    const name = language === "ar" ? "شاشات" : "Screens";
    const title = nav.getByRole("heading", { level: 2, name });
    await user.click(within(title).getByText(name));
    const toggle = within(title).getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveFocus();
    expect(window.location.pathname + window.location.search).toBe(
      "/library?category=screens",
    );
    expect(
      nav.getByRole("link", {
        name: language === "ar" ? "لوحة العملاء" : "Customer dashboard",
      }),
    ).toBeVisible();
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
    expect(
      nav.queryByRole("link", {
        name: language === "ar" ? "لوحة العملاء" : "Customer dashboard",
      }),
    ).toBeNull();
    expect(
      nav.getByRole("button", {
        name: language === "ar" ? "المكوّنات" : "Components",
      }),
    ).toBeVisible();
    expect(window.location.pathname + window.location.search).toBe(
      "/library?category=screens",
    );
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveFocus();
  },
);

it("keeps section headings in the sidebar and lists every curated page exactly once across its collections", async () => {
  persist(storageKeys.documentation, { language: "en" });
  render(<Workbench />);
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  for (const name of [
    "Start here",
    "Screens",
    "Components",
    "AI interfaces",
    "Illustrations",
  ])
    expect(
      nav.getByRole("heading", { name: new RegExp(`^${name}`), level: 2 }),
    ).toBeVisible();
  expect(nav.queryByText("Parts")).toBeNull();
  const names: string[] = [];
  for (const name of ["Screens", "Components", "AI interfaces"]) {
    const toggle = nav.getByRole("button", { name });
    if (toggle.getAttribute("aria-expanded") !== "true")
      await userEvent.click(toggle);
    const list = nav.getByRole("region", { name: `${name} list` });
    const links = within(list).getAllByRole("link");
    names.push(...links.map((link) => link.textContent!));
    expect(nav.getAllByRole("button", { expanded: true })).toHaveLength(1);
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
      .map((item) => item.name[1])
      .sort(),
  );
});

it("keeps section choices when closing and reopening the mobile drawer", async () => {
  const media = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...media(query),
    matches: query === "(max-width: 760px)",
  }));
  persist(storageKeys.documentation, { language: "en" });
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  let drawer = within(screen.getByRole("dialog", { name: "Components" }));
  await user.click(drawer.getByRole("button", { name: "Screens" }));
  await user.click(drawer.getByRole("button", { name: "Components" }));
  await user.click(drawer.getByRole("button", { name: "Components" }));
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  drawer = within(screen.getByRole("dialog", { name: "Components" }));
  expect(drawer.getByRole("button", { name: "Components" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await user.click(drawer.getByRole("button", { name: "Components" }));
  expect(drawer.getByRole("button", { name: "Components" })).toHaveFocus();
  await user.click(drawer.getByRole("link", { name: "Button" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(window.location.pathname).toBe("/library/components/button");
  expect(screen.getByRole("main")).toHaveFocus();
});

it("keeps the page and URL when switching languages with the keyboard", async () => {
  render(<Workbench />);
  const user = userEvent.setup();
  const pageUrl = window.location.href;
  await user.click(screen.getByRole("button", { name: "English" }));
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  expect(nav.getByRole("link", { name: "Button" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(window.location.href).toBe(pageUrl);
  expect(screen.getByRole("button", { name: "العربية" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(screen.getByRole("button", { name: "English" })).toHaveFocus();
});

it("restores specialist pages and makes their parent current in the mobile list", async () => {
  const media = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
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
  await userEvent.click(screen.getByRole("button", { name: "فتح القائمة" }));
  const drawer = within(screen.getByRole("dialog", { name: "المكوّنات" }));
  expect(drawer.queryByRole("link", { name: "شريط الطلب" })).toBeNull();
  expect(drawer.getByRole("link", { name: "محرر الرسائل" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
