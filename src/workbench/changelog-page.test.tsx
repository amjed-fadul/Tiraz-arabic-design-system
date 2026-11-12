import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
import { readSiteRoute, routePath } from "./site-routes";

afterEach(() => window.history.replaceState({}, "", "/"));
function at(path: string, language: "ar" | "en" = "en") {
  persist(storageKeys.documentation, { language });
  window.history.replaceState({}, "", path);
  return render(<Workbench />);
}
const release = (version: string) =>
  document.getElementById(version) as HTMLElement;

it("parses and prints the /changelog route", () => {
  expect(routePath({ kind: "changelog" })).toBe("/changelog");
  expect(
    readSiteRoute(new URL("http://x/changelog/"), {
      active: "button",
    } as never),
  ).toEqual({ kind: "changelog" });
});

it("opens the page from the Getting started sidebar link", async () => {
  at("/start");
  const nav = screen.getByRole("navigation", { name: "Getting started" });
  await userEvent.click(within(nav).getByRole("link", { name: "Changelog" }));
  expect(window.location.pathname).toBe("/changelog");
  expect(within(nav).getByRole("link", { name: "Changelog" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Changelog" }),
  ).toBeVisible();
});

it("groups releases under date headings, linking component names", () => {
  at("/changelog");
  const day = document.getElementById("2026-10-28") as HTMLElement;
  expect(within(day).getByRole("heading", { level: 2 }).textContent).toBe(
    "28 October 2026",
  );
  const newest = release("0.1.3-preview.5");
  expect(day).toContainElement(newest);
  expect(within(newest).getByRole("heading", { level: 3 }).textContent).toBe(
    "0.1.3-preview.5",
  );
  expect(
    within(newest).getByRole("link", { name: "ChatThread" }),
  ).toHaveAttribute("href", "/library/components/chat-thread");
  expect(newest.querySelector("code")).not.toBeNull();
});

it("puts the three releases of 27 October under one date, newest first", () => {
  at("/changelog");
  const day = document.getElementById("2026-10-27") as HTMLElement;
  expect(
    within(day)
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent),
  ).toEqual(["27 October 2026"]);
  expect(
    within(day)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent),
  ).toEqual(["0.1.3-preview.3", "0.1.3-preview.2", "0.1.3-preview.1"]);
});

it("renders changes as list items and drops channel and update lines", () => {
  at("/changelog");
  const items = release("0.1.3-preview.5").querySelectorAll("li");
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) expect(item.parentElement?.tagName).toBe("UL");
  const text = document.querySelector(".changelog-page")!.textContent!;
  expect(text).not.toMatch(/Preview|Latest|Stable|Not on npm/);
  expect(text).not.toContain("Run tiraz update");
  expect(text).not.toMatch(/manual steps?\./);
});

it("keeps the manual step notes of 0.1.2", () => {
  at("/changelog");
  expect(release("0.1.2").querySelector(".changelog-step")).not.toBeNull();
});

it("renders Arabic labels in a right-to-left page", () => {
  at("/changelog", "ar");
  expect(
    screen.getByRole("heading", { level: 1, name: "سجل التغييرات" }),
  ).toBeVisible();
  const page = document.querySelector(".changelog-page")!;
  expect(page).toHaveAttribute("dir", "rtl");
  expect(page.textContent).toContain("أُضيف");
  expect(page.textContent).toContain("٢٨ أكتوبر ٢٠٢٦");
  expect(page.textContent).not.toContain("نفّذ");
});
