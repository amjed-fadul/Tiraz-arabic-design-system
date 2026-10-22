import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import { AgentControlRoom } from "./AgentControlRoom";

// These tests exercise decisions in the settled screen; the demo clock has its own tests.
beforeEach(() => window.history.replaceState(null, "", "?demo=off"));
afterEach(() => window.history.replaceState(null, "", "/"));

// A row of the inbox: the panel's task rows can carry the same title.
const row = (title: string) =>
  within(screen.getByRole("tabpanel")).getByText(title).closest("li")!;
// The header's own sentence: the inbox's hidden region says the same one when
// its counts change.
const summary = () => document.querySelector(".screen-description");
const counts = () => screen.getAllByRole("tab").map((tab) => tab.textContent);
const strip = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) });
const accruals = "ترحيل قيود الاستحقاق الأربعة";
const cover = "غلاف حملة رمضان";

it("leaves a picked agent's own items and shows its panel", async () => {
  const user = userEvent.setup();
  render(<AgentControlRoom />);
  // Every agent's items remain visible; Finance's workspace is useful at mount.
  expect(counts()).toEqual(["الكل ٨", "بانتظارك ٦", "يعمل ١", "اكتملت ١"]);
  expect(summary()).toHaveTextContent("٦ طلبات بانتظارك · مهمة واحدة تعمل");
  expect(
    screen.getByRole("heading", { level: 2, name: "وكيل المالية" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("progressbar", { name: "٢ من ٣ مهام مكتملة" }),
  ).toHaveAttribute("aria-valuetext", "٦٧٪؜");
  const overview = screen.getByRole("region", {
    name: "نشاط وكلاء الذكاء الاصطناعي",
  });
  expect(within(overview).getAllByRole("button")).toHaveLength(3);
  expect(overview.textContent).not.toMatch(/[0-9]/);
  expect(document.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement();

  await user.click(
    within(overview).getByRole("button", {
      name: /وكيل التحصيل.*عرض مساحة العمل/,
    }),
  );
  expect(strip("وكيل التحصيل")).toHaveAttribute("aria-pressed", "true");
  // Its three drafts, and nothing of the Finance agent's.
  const titles = [
    ...screen.getByRole("tabpanel").querySelectorAll("li > h3, li > h4"),
  ].map((heading) => heading.textContent);
  expect(titles).toEqual([
    "تذكير بالدفع إلى شركة مدار",
    "تذكير بالدفع إلى مؤسسة الندى",
    "تذكير بالدفع إلى الرواد للتجارة",
  ]);
  expect(screen.queryByText(accruals)).toBeNull();
  expect(counts()).toEqual(["الكل ٣", "بانتظارك ٣", "يعمل ٠", "اكتملت ٠"]);
  // The header still counts every agent.
  expect(summary()).toHaveTextContent("٦ طلبات بانتظارك · مهمة واحدة تعمل");
  // The page keeps its one polite region, the inbox's: the panel adds none.
  expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
  // Its panel: the name, its context ring, its tasks, and no running step.
  expect(
    screen.getByRole("heading", { level: 2, name: "وكيل التحصيل" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^السياق/ })).toBeInTheDocument();
  const tasks = screen.getByRole("list", { name: "مهام وكيل التحصيل" });
  expect(tasks).toHaveTextContent("تجميع الفواتير المتأخرة");
  expect(tasks).toHaveTextContent("٣ مسودات");
  expect(screen.getByText("لا توجد خطوة تعمل الآن.")).toBeInTheDocument();
  expect(tasks.textContent).not.toMatch(/[0-9]/);

  // Picking it again lets go of it.
  await user.click(strip("وكيل التحصيل"));
  expect(counts()).toEqual(["الكل ٨", "بانتظارك ٦", "يعمل ١", "اكتملت ١"]);
  expect(
    screen.getByRole("heading", { level: 2, name: "وكيل المالية" }),
  ).toBeInTheDocument();
}, 15000);

it("records the accruals quick Approve after the host's moment, with a receipt", async () => {
  const user = userEvent.setup();
  render(<AgentControlRoom />);
  // Nothing in the inbox offers to settle several requests at once.
  for (const button of screen.getAllByRole("button"))
    expect(button.textContent).not.toMatch(/الكل|جميع/);
  // A reversible request decides from its closed row, with no card opened.
  await user.click(
    within(row(accruals)).getByRole("button", { name: /^ترحيل القيود/ }),
  );
  expect(row(accruals)).not.toHaveTextContent("تمت الموافقة");
  await waitFor(
    () => expect(row(accruals)).toHaveTextContent("تمت الموافقة · الآن"),
    { timeout: 3000 },
  );
  // The row keeps the focus its button held, and the counts follow.
  expect(
    within(row(accruals)).getByRole("heading", { name: accruals }),
  ).toHaveFocus();
  expect(counts()).toEqual(["الكل ٨", "بانتظارك ٥", "يعمل ١", "اكتملت ٢"]);
  expect(summary()).toHaveTextContent("٥ طلبات بانتظارك · مهمة واحدة تعمل");
}, 15000);

it("starts the failed cover again, and its agent's panel shows the running step", async () => {
  const user = userEvent.setup();
  render(<AgentControlRoom />);
  await user.click(strip("مصمّم الحملات"));
  expect(strip("مصمّم الحملات")).toHaveTextContent("تعثّر");
  expect(
    document.querySelector(
      '.screen-agent-heading[data-agent="campaigns"] .khayt',
    ),
  ).toHaveAttribute("data-state", "blocked");
  expect(screen.getByText("لا توجد خطوة تعمل الآن.")).toBeInTheDocument();
  await user.click(
    within(row(cover)).getByRole("button", { name: `أعد المحاولة ${cover}` }),
  );
  // Running, it leaves «بانتظارك» for «يعمل», and its step is on show.
  expect(strip("مصمّم الحملات")).toHaveTextContent("يعمل");
  expect(
    document.querySelector(
      '.screen-agent-heading[data-agent="campaigns"] .khayt',
    ),
  ).toHaveAttribute("data-state", "working");
  expect(
    screen.getByRole("button", { name: /^توليد غلاف حملة رمضان/ }),
  ).toBeInTheDocument();
  expect(screen.queryByText("لا توجد خطوة تعمل الآن.")).toBeNull();
  expect(summary()).toHaveTextContent("٥ طلبات بانتظارك · مهمتان تعملان");
}, 15000);

it("opens the picked agent's panel in a Sheet from the header when the page is narrower", async () => {
  // A ResizeObserver that reports a 700px column, so the frame says `medium`.
  const original = globalThis.ResizeObserver;
  class Medium {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.callback(
        [{ target, contentRect: { width: 700 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = Medium as unknown as typeof ResizeObserver;
  try {
    const user = userEvent.setup();
    render(<AgentControlRoom />);
    // Finance's workspace remains available before filtering the inbox.
    expect(screen.queryByRole("heading", { name: "اختر وكيلًا" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "مهام وكيل المالية" }),
    ).toBeInTheDocument();
    await user.click(strip("مصمّم الحملات"));
    const button = screen.getByRole("button", { name: "مهام مصمّم الحملات" });
    await user.click(button);
    const sheet = screen.getByRole("dialog", { name: "مهام مصمّم الحملات" });
    expect(sheet).toHaveAttribute("data-edge", "end");
    expect(
      within(sheet).getByRole("heading", { level: 3, name: "مصمّم الحملات" }),
    ).toBeInTheDocument();
    expect(within(sheet).getAllByText(cover).length).toBeGreaterThan(0);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(button).toHaveFocus();
  } finally {
    globalThis.ResizeObserver = original;
  }
}, 15000);

it("opens an agent workspace directly from its phone card and restores focus", async () => {
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback(
        [{ contentRect: { width: 358 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  };
  try {
    const user = userEvent.setup();
    render(<AgentControlRoom />);
    const card = screen.getByRole("button", {
      name: /وكيل التحصيل.*عرض مساحة العمل/,
    });
    await user.click(card);
    expect(
      screen.getByRole("dialog", { name: "مهام وكيل التحصيل" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(card).toHaveFocus();
  } finally {
    globalThis.ResizeObserver = original;
  }
});
