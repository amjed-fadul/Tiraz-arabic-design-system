import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";

afterEach(() => window.history.replaceState({}, "", "/"));
function at(path: string) {
  window.history.replaceState({}, "", path);
  return render(<Workbench />);
}

it("opens a component URL instead of a saved page, with curated navigation and related helpers", async () => {
  persist(storageKeys.documentation, { language: "ar", active: "button" });
  at("/library/components/chat-composer");
  expect(
    screen.getByRole("heading", { level: 1, name: "محرر الرسائل" }),
  ).toBeVisible();
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  expect(nav.queryByRole("button", { name: "الأجزاء" })).toBeNull();
  expect(nav.queryByRole("button", { name: "شريط الطلب" })).toBeNull();
  const related = screen.getByRole("region", { name: "مكوّنات ذات صلة" });
  await userEvent.click(
    within(related).getByRole("link", { name: "شريط الطلب" }),
  );
  expect(window.location.pathname).toBe("/library/components/prompt-bar");
  expect(
    screen.getByRole("heading", { level: 1, name: "شريط الطلب" }),
  ).toBeVisible();
  expect(screen.getByRole("main")).toHaveFocus();
});

it("restores explicit routes on Back and keeps language/theme across destinations", async () => {
  persist(storageKeys.documentation, { language: "en", active: "button" });
  at("/library/components/chat-thread");
  const primary = within(
    screen.getByRole("navigation", { name: "Primary navigation" }),
  );
  await userEvent.click(primary.getByRole("link", { name: "Docs" }));
  expect(window.location.pathname).toBe("/docs");
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Built for Arabic. Ready for your app.",
    }),
  ).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "العربية" }));
  expect(document.documentElement).toHaveAttribute("dir", "rtl");
  act(() => {
    window.history.replaceState({}, "", "/library/components/chat-thread");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(
    screen.getByRole("heading", { level: 1, name: "المحادثة" }),
  ).toBeVisible();
  expect(screen.getByRole("main")).toHaveFocus();
});

it("restores the original root history entry without changing a fresh visit's saved page", async () => {
  const view = at("/");
  const initialEntry = window.history.state;
  await userEvent.click(
    within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
      "button",
      { name: "مربع الاختيار" },
    ),
  );
  act(() => {
    window.history.replaceState(initialEntry, "", "/");
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: initialEntry }),
    );
  });
  expect(
    screen.getByRole("heading", { level: 1, name: "الأزرار" }),
  ).toBeVisible();
  view.unmount();
  persist(storageKeys.documentation, { active: "checkbox" });
  at("/");
  expect(
    screen.getByRole("heading", { level: 1, name: "مربع الاختيار" }),
  ).toBeVisible();
});

it("searches the Library in both languages without mounting live examples", async () => {
  at("/library");
  expect(
    screen.getByRole("heading", { level: 1, name: "المكتبة" }),
  ).toBeVisible();
  expect(document.querySelector("iframe")).toBeNull();
  expect(document.querySelector(".playground-canvas")).toBeNull();
  const search = screen.getByRole("searchbox", { name: "ابحث في المكتبة" });
  await userEvent.type(search, "invoices");
  const results = within(screen.getByRole("region", { name: "نتائج المكتبة" }));
  expect(
    results.getByRole("link", { name: "الفواتير والتحصيل" }),
  ).toBeVisible();
  await userEvent.clear(search);
  await userEvent.type(search, "لا يوجد مثل هذا المكوّن");
  expect(results.getByText("لم نجد نتائج")).toBeVisible();
  await userEvent.click(results.getByRole("button", { name: "مسح البحث" }));
  expect(search).toHaveValue("");
  expect(search).toHaveFocus();
});

it("opens illustration details and copies decorative source without an EmptyState workflow", async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  persist(storageKeys.documentation, { language: "en" });
  at("/illustrations/no-records");
  expect(
    screen.getByRole("heading", { level: 1, name: "No records" }),
  ).toBeVisible();
  expect(document.querySelector(".tz-empty-state")).toBeNull();
  expect(document.querySelector(".illustration-stage svg")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await user.click(screen.getByRole("button", { name: "Copy example" }));
  expect(copy).toHaveBeenLastCalledWith(
    expect.stringContaining("NoRecordsIllustration"),
  );
  expect(copy).toHaveBeenLastCalledWith(expect.stringContaining("aria-hidden"));
});

it("renders unknown routes as a recoverable page", async () => {
  at("/library/components/missing");
  expect(
    screen.getByRole("heading", { level: 1, name: "الصفحة غير موجودة" }),
  ).toBeVisible();
  await userEvent.click(
    within(screen.getByRole("main")).getByRole("link", {
      name: "العودة إلى المكتبة",
    }),
  );
  expect(window.location.pathname).toBe("/library");
});

it("cancels pending demo work when navigating to a gallery", () => {
  vi.useFakeTimers();
  try {
    at("/library/components/button");
    fireEvent.click(
      within(
        screen.getByRole("region", { name: "المعاينة التفاعلية" }),
      ).getByRole("button", { name: "حفظ الفاتورة" }),
    );
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "التنقّل الرئيسي" }),
      ).getByRole("link", { name: "المكتبة" }),
    );
    act(() => vi.runOnlyPendingTimers());
    expect(document.querySelector(".playground-canvas")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "المكتبة", level: 1 }),
    ).toBeVisible();
  } finally {
    vi.useRealTimers();
  }
});

it("keeps keyboard focus on the Library filter when narrowing results", async () => {
  at("/library");
  const category = screen.getByRole("combobox", { name: "التصنيف" });
  category.focus();
  await userEvent.selectOptions(category, "forms");
  expect(category).toHaveFocus();
  expect(window.location.search).toBe("?category=forms");
  const results = within(screen.getByRole("region", { name: "نتائج المكتبة" }));
  expect(results.getByRole("link", { name: "الأزرار" })).toBeVisible();
  expect(results.queryByRole("link", { name: "الفواتير والتحصيل" })).toBeNull();
});
