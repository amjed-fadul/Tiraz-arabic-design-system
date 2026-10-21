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
  expect(nav.getByRole("button", { name: "محرر الرسائل" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(nav.queryByRole("button", { name: "الأزرار" })).toBeNull();
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
  expect(nav.getByRole("button", { name: "محرر الرسائل" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("restores explicit routes on Back and keeps language/theme across destinations", async () => {
  persist(storageKeys.documentation, { language: "en", active: "button" });
  at("/library/components/chat-thread");
  await userEvent.click(screen.getByRole("link", { name: "Start here" }));
  expect(window.location.pathname).toBe("/start");
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Start from source",
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
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  expect(nav.getByRole("button", { name: "المحادثة" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(nav.queryByRole("button", { name: "الأزرار" })).toBeNull();
});

it("starts a newly selected section with its complete gallery after a search", async () => {
  persist(storageKeys.documentation, { language: "en" });
  at("/library?category=forms");
  const user = userEvent.setup();
  const search = screen.getByRole("searchbox", { name: "Search the Library" });
  await user.type(search, "checkbox");
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  await user.click(nav.getByRole("link", { name: "Screens" }));
  expect(search).toHaveValue("");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Screens",
  );
  expect(
    within(screen.getByRole("region", { name: "Library results" })).getByRole(
      "link",
      { name: "Customer dashboard" },
    ),
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
      within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
        "link",
        { name: "النماذج" },
      ),
    );
    act(() => vi.runOnlyPendingTimers());
    expect(document.querySelector(".playground-canvas")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "النماذج", level: 1 }),
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
  ["/start", "Components"],
  ["/illustrations", "Components"],
  ["/library", "Components"],
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
  at("/library/components/missing");
  await userEvent.click(
    screen.getByRole("button", { name: "إخفاء القائمة الجانبية" }),
  );
  await userEvent.click(
    within(screen.getByRole("main")).getByRole("link", {
      name: "العودة إلى المكتبة",
    }),
  );
  expect(window.location.pathname).toBe("/library");
  expect(
    screen.getByRole("button", { name: "إظهار القائمة الجانبية" }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("main")).toHaveFocus();
});

it("puts Start here first, all section links next and Illustrations last, with no Library row or top navigation", async () => {
  persist(storageKeys.documentation, { language: "en" });
  at("/start");
  expect(
    screen.queryByRole("navigation", { name: "Primary navigation" }),
  ).toBeNull();
  const header = screen.getByRole("link", { name: "Tiraz" }).closest("header")!;
  expect(within(header).getAllByRole("link")).toHaveLength(1);
  const side = screen.getByRole("complementary", { name: "Components" });
  const links = within(side).getAllByRole("link");
  expect(links[0]).toHaveTextContent("Start here");
  expect(links[1]).toHaveTextContent("Screens");
  expect(within(side).queryByRole("link", { name: "Library" })).toBeNull();
  expect(links.at(-1)).toHaveTextContent("Illustrations");
  expect(
    within(side).queryByRole("button", { name: "Assistant workspace" }),
  ).toBeNull();
  expect(within(side).queryByRole("button", { current: "page" })).toBeNull();
  await userEvent.click(links[1]);
  expect(window.location.pathname + window.location.search).toBe(
    "/library?category=screens",
  );
  expect(screen.getByRole("main")).toHaveFocus();
});

it.each([
  ["/library", "ar", "المكوّنات", "ابدأ هنا"],
  ["/library", "en", "Components", "Start here"],
  ["/illustrations", "ar", "المكوّنات", "ابدأ هنا"],
  ["/illustrations", "en", "Components", "Start here"],
] as const)(
  "keeps the same text-only section navigation on %s in %s",
  (path, language, name, startName) => {
    persist(storageKeys.documentation, { language });
    at(path);
    const nav = screen.getByRole("navigation", { name });
    expect(within(nav).getAllByRole("link").length).toBeGreaterThan(1);
    expect(nav.querySelector("svg, img")).toBeNull();
    const start = screen.getByRole("navigation", {
      name: language === "ar" ? "البداية" : "Getting started",
    });
    expect(
      within(start).getByRole("link", { name: startName }),
    ).toHaveAttribute("href", "/start");
    expect(start.querySelector("svg, img")).toBeNull();
    expect(
      screen
        .getByRole("button", {
          name:
            language === "ar" ? "إخفاء القائمة الجانبية" : "Hide navigation",
        })
        .querySelector("svg"),
    ).not.toBeNull();
  },
);

it.each(["/docs", "/docs/installation", "/docs/rtl"])(
  "sends old guide URL %s to Start here",
  (path) => {
    at(path);
    expect(window.location.pathname).toBe("/start");
    expect(
      screen.getByRole("heading", { level: 1, name: "ابدأ من المصدر" }),
    ).toBeVisible();
  },
);

it.each([
  "/library/components/chat-app",
  "/examples/chat-app",
  "/examples/playground/chat-app",
])("recovers removed workspace URL %s through Screens", (path) => {
  persist(storageKeys.documentation, { language: "en" });
  at(path);
  expect(window.location.pathname + window.location.search).toBe(
    "/library?category=screens",
  );
  const results = within(
    screen.getByRole("region", { name: "Library results" }),
  );
  expect(
    results.getByRole("link", { name: "Customer dashboard" }),
  ).toBeVisible();
  expect(
    results.queryByRole("link", { name: "Assistant workspace" }),
  ).toBeNull();
  expect(results.queryByRole("link", { name: "Button" })).toBeNull();
});

it("recovers a saved Assistant workspace preference through the Screens catalog", () => {
  persist(storageKeys.documentation, { language: "en", active: "chat-app" });
  at("/");
  expect(
    screen.getByRole("heading", { level: 1, name: "Screens" }),
  ).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Category" })).toHaveValue(
    "screens",
  );
  expect(
    screen.queryByRole("heading", { level: 1, name: "Button" }),
  ).toBeNull();
});
