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

it("filters the expanded illustration gallery without losing focus or starting motion on mount", async () => {
  persist(storageKeys.documentation, { language: "en" });
  at("/illustrations");
  const main = within(screen.getByRole("main"));
  expect(main.getAllByRole("article")).toHaveLength(6);
  expect(
    document.querySelectorAll('[data-illustration][data-animated="true"]'),
  ).toHaveLength(0);
  const filter = main.getByRole("button", { name: "Agents & connections" });
  await userEvent.click(filter);
  expect(filter).toHaveFocus();
  expect(filter).toHaveAttribute("aria-pressed", "true");
  expect(main.getAllByRole("article")).toHaveLength(2);
  const preview = main.getByRole("link", { name: "Agent handoff" });
  fireEvent.focus(preview);
  expect(preview.querySelector("[data-illustration]")).toHaveAttribute(
    "data-animated",
    "true",
  );
  fireEvent.blur(preview);
  expect(preview.querySelector("[data-illustration]")).toHaveAttribute(
    "data-animated",
    "false",
  );
});

it("replays a product scene and copies the matching self-contained source", async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  persist(storageKeys.documentation, { language: "en" });
  at("/illustrations/agent-handoff");
  const initial = document.querySelector("[data-illustration='agent-handoff']");
  expect(initial).toHaveAttribute("data-animated", "true");
  const replay = screen.getByRole("button", { name: "Replay animation" });
  await user.click(replay);
  expect(replay).toHaveFocus();
  const played = document.querySelector("[data-illustration='agent-handoff']");
  expect(played).not.toBe(initial);
  expect(played).toHaveAttribute("data-animated", "true");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await user.click(screen.getByRole("button", { name: "Copy example" }));
  expect(copy).toHaveBeenLastCalledWith(
    expect.stringContaining('from "./illustrations/AgentHandoff"'),
  );
  await user.click(screen.getByRole("button", { name: "Copy source file" }));
  expect(copy).toHaveBeenLastCalledWith(
    expect.stringContaining("export function AgentHandoff"),
  );
  expect(copy.mock.lastCall?.[0]).not.toContain("export function VoiceField");
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

it.each([
  ["/docs", "Docs"],
  ["/illustrations", "Illustrations"],
  ["/library", "Library categories"],
])(
  "fully hides and reopens %s navigation without changing the page",
  async (path, name) => {
    persist(storageKeys.documentation, { language: "en" });
    const user = userEvent.setup();
    at(path);
    const main = screen.getByRole("main");
    const title = within(main).getByRole("heading", { level: 1 }).textContent;
    const toggle = screen.getByRole("button", { name: "Hide navigation" });
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls")!,
    );
    expect(screen.getByRole("navigation", { name })).toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAccessibleName("Show navigation");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("inert");
    expect(screen.queryByRole("navigation", { name })).toBeNull();
    expect(screen.getByRole("main")).toBe(main);
    expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent(
      title!,
    );
    await user.click(toggle);
    expect(screen.getByRole("navigation", { name })).toBeInTheDocument();
    expect(panel).not.toHaveAttribute("inert");
    expect(window.location.pathname).toBe(path);
  },
);

it("keeps navigation hidden when moving between destinations", async () => {
  at("/docs");
  await userEvent.click(
    screen.getByRole("button", { name: "إخفاء القائمة الجانبية" }),
  );
  await userEvent.click(
    within(
      screen.getByRole("navigation", { name: "التنقّل الرئيسي" }),
    ).getByRole("link", { name: "الرسوم التوضيحية" }),
  );
  expect(window.location.pathname).toBe("/illustrations");
  expect(
    screen.getByRole("button", { name: "إظهار القائمة الجانبية" }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("main")).toHaveFocus();
});
