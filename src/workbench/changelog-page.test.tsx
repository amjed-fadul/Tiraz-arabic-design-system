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

it("lists the newest release with channel and date, linking component names", () => {
  at("/changelog");
  const newest = release("0.1.3-preview.5");
  expect(within(newest).getByRole("heading", { level: 2 }).textContent).toMatch(
    /0\.1\.3-preview\.5\s*28 Oct 2026 · Preview/,
  );
  expect(newest.textContent).toContain("Run tiraz update. No manual steps.");
  expect(
    within(newest).getByRole("link", { name: "ChatThread" }),
  ).toHaveAttribute("href", "/library/components/chat-thread");
  expect(newest.querySelector("code")).not.toBeNull();
});

it("shows the manual step of 0.1.2 and no update line for the oldest release", () => {
  at("/changelog");
  expect(release("0.1.2").textContent).toContain(
    "Run tiraz update. 1 manual step.",
  );
  expect(release("0.1.2").querySelector(".changelog-step")).not.toBeNull();
  expect(release("0.1.0").querySelector(".changelog-update")).toBeNull();
});

it("renders Arabic labels in a right-to-left page", () => {
  at("/changelog", "ar");
  expect(
    screen.getByRole("heading", { level: 1, name: "سجل التغييرات" }),
  ).toBeVisible();
  const page = document.querySelector(".changelog-page")!;
  expect(page).toHaveAttribute("dir", "rtl");
  expect(page.textContent).toContain("أُضيف");
  expect(release("0.1.2").textContent).toContain("خطوة يدوية واحدة");
});
