import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { catalog, nestedParts, navigationGroups } from "./catalog";
import { screens } from "../examples/frame/screen";
import { persist, storageKeys } from "./storage";

it("lists each curated page once, with Screens first and no Parts section", () => {
  render(<Workbench />);
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  expect(
    nav.getAllByRole("heading", { level: 2 }).map((item) => item.textContent),
  ).toEqual(navigationGroups.map((group) => group.name[0]));
  expect(nav.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(
    "شاشات",
  );
  expect(nav.queryByText("الأجزاء")).toBeNull();
  expect(nav.queryByText("أنماط الذكاء الاصطناعي")).toBeNull();
  expect(
    nav
      .getAllByRole("button")
      .map((item) => item.textContent)
      .sort(),
  ).toEqual(
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
