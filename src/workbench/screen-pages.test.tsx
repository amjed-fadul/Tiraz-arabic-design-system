import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { screens } from "../examples/frame/screen";
import { Workbench } from "./Workbench";
import { persist, readDocumentation, storageKeys } from "./storage";

const nav = () =>
  within(screen.getByRole("navigation", { name: /المكوّنات|Components/ }));
const heading = () => screen.getByRole("heading", { level: 1 });
const frame = () => document.querySelector("iframe")!;
const stage = () => frame().parentElement!;
const realResizeObserver = globalThis.ResizeObserver;
afterEach(() => {
  globalThis.ResizeObserver = realResizeObserver;
});

it("lists the screens as buttons, with no new-tab links", () => {
  render(<Workbench />);
  const section = within(
    nav().getByRole("heading", { level: 3, name: "شاشات" }).parentElement!,
  );
  expect(
    section.getAllByRole("button").map((item) => item.textContent),
  ).toEqual(["مساحة عمل المساعد", ...screens.map((item) => item.name[0])]);
  expect(nav().queryAllByRole("link")).toEqual([]);
});

it("opens a screen's page with the screen in an iframe", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(nav().getByRole("button", { name: "لوحة العملاء" }));
  expect(heading()).toHaveTextContent("لوحة العملاء");
  expect(document.title).toBe("طِراز · لوحة العملاء");
  expect(frame()).toHaveAttribute("title", "لوحة العملاء");
  expect(frame()).toHaveAttribute("src", "/examples/dashboard?embed=1");
  // The screen is current, and no docs page is.
  expect(nav().getByRole("button", { name: "لوحة العملاء" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(nav().getByRole("button", { name: "الأزرار" })).not.toHaveAttribute(
    "aria-current",
  );
  // A screen page has no prompt, code view or settings.
  expect(
    screen.queryByRole("heading", { name: "استخدمه في تطبيقك" }),
  ).toBeNull();
  expect(screen.queryByRole("tab", { name: "الكود" })).toBeNull();
  expect(screen.queryByRole("button", { name: "تخصيص" })).toBeNull();
  const widths = within(screen.getByRole("group", { name: "عرض المعاينة" }));
  await user.click(widths.getByRole("button", { name: "هاتف" }));
  expect(widths.getByRole("button", { name: "هاتف" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(stage()).toHaveAttribute("data-width", "phone");
  // «على هذه الشاشة» opens the pages the screen is built from.
  const uses = within(screen.getByRole("region", { name: "على هذه الشاشة" }));
  await user.click(uses.getByRole("button", { name: "شريط التصفية" }));
  expect(heading()).toHaveTextContent("شريط التصفية");
  expect(document.querySelector("iframe")).toBeNull();
});

it("scales the Desktop screen's 1,280px window to the stage", async () => {
  // The stage reports 1,000px, its width at a 1,280px window.
  globalThis.ResizeObserver = class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      const entry = { target, contentRect: { width: 1000 } };
      this.callback(
        [entry as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  };
  const user = userEvent.setup();
  persist(storageKeys.documentation, { active: "button", screen: "invoices" });
  render(<Workbench />);
  expect(stage()).toHaveAttribute("data-width", "desktop");
  expect(stage().style.getPropertyValue("--screen-scale")).toBe("0.78125");
  // Tablet and Phone are never scaled.
  await user.click(screen.getByRole("button", { name: "جهاز لوحي" }));
  expect(stage()).toHaveAttribute("data-width", "tablet");
  expect(stage().style.getPropertyValue("--screen-scale")).toBe("");
});

it("reloads the screen in the docs' language and theme", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, { active: "button", screen: "invoices" });
  render(<Workbench />);
  expect(frame()).toHaveAttribute("src", "/examples/invoices?embed=1");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "لغة التوثيق" }),
    "en",
  );
  expect(frame()).toHaveAttribute("title", "Invoices and collections");
  expect(frame()).toHaveAttribute("src", "/examples/invoices?embed=1&lang=en");
  await user.click(screen.getByRole("button", { name: "Toggle theme" }));
  expect(frame()).toHaveAttribute(
    "src",
    "/examples/invoices?embed=1&lang=en&theme=dark",
  );
});

it("opens the screen on its own in a new tab", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, { active: "button", screen: "invoices" });
  render(<Workbench />);
  const link = () =>
    screen.getByRole("link", { name: /افتح في نافذة جديدة|Open in a new tab/ });
  expect(link()).toHaveAttribute("href", "/examples/invoices");
  expect(link()).toHaveAttribute("target", "_blank");
  expect(link()).toHaveAttribute("rel", "noopener");
  expect(link().querySelector("svg")).toHaveClass("tz-mirror-rtl");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "لغة التوثيق" }),
    "en",
  );
  await user.click(screen.getByRole("button", { name: "Toggle theme" }));
  expect(link()).toHaveAttribute(
    "href",
    "/examples/invoices?lang=en&theme=dark",
  );
});

it("opens a screen from a same-origin message only", () => {
  render(<Workbench />);
  const post = (data: unknown, origin = window.location.origin) =>
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data, origin }));
    });
  post({ type: "tiraz:open-screen", slug: "invoices" }, "https://example.com");
  post({ type: "tiraz:open-screen", slug: "nowhere" });
  post({ type: "tiraz:open", slug: "invoices" });
  expect(heading()).toHaveTextContent("الأزرار");
  post({ type: "tiraz:open-screen", slug: "invoices" });
  expect(heading()).toHaveTextContent("الفواتير والتحصيل");
});

it("restores a saved screen, and forgets an unknown one", async () => {
  const user = userEvent.setup();
  const view = render(<Workbench />);
  await user.click(nav().getByRole("button", { name: "خط المبيعات" }));
  expect(readDocumentation().screen).toBe("sales-pipeline");
  view.unmount();
  render(<Workbench />);
  expect(heading()).toHaveTextContent("خط المبيعات");
  expect(frame()).toHaveAttribute("src", "/examples/sales-pipeline?embed=1");
  persist(storageKeys.documentation, { active: "button", screen: "nowhere" });
  expect(readDocumentation().screen).toBeNull();
});
