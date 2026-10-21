import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ScreenFrame, ScreenHeader } from "./ScreenFrame";
import { useScreen } from "./screen";

/** A screen's content, showing two of the frame's figures. */
function Probe() {
  const { number, money } = useScreen();
  return (
    <p data-testid="probe">
      {number(48_300)} · {money(9_400)}
    </p>
  );
}
const sidebar = () =>
  within(screen.getByRole("navigation", { name: /الشاشات|Screens/ }));
afterEach(() => window.history.replaceState(null, "", "/"));

it("opens in Arabic and switches everything to English", async () => {
  const user = userEvent.setup();
  render(
    <ScreenFrame slug="invoices">
      <ScreenHeader />
      <Probe />
    </ScreenFrame>,
  );
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(document.documentElement).toHaveAttribute("dir", "rtl");
  expect(document.title).toBe("طِراز · الفواتير والتحصيل");
  expect(
    screen.getByRole("heading", { level: 1, name: "الفواتير والتحصيل" }),
  ).toBeInTheDocument();
  expect(
    sidebar().getByRole("link", { name: "الفواتير والتحصيل" }),
  ).toHaveAttribute("aria-current", "page");
  expect(sidebar().getByRole("link", { name: "خط المبيعات" })).toHaveAttribute(
    "href",
    "/examples/sales-pipeline",
  );
  expect(screen.getByTestId("probe")).toHaveTextContent("٤٨٬٣٠٠ · ٩٬٤٠٠ ر.س");
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(document.documentElement).toHaveAttribute("lang", "en");
  expect(document.documentElement).toHaveAttribute("dir", "ltr");
  expect(document.title).toBe("Tiraz · Invoices and collections");
  expect(screen.getByTestId("probe")).toHaveTextContent("48,300 · SAR 9,400");
  expect(
    sidebar().getByRole("link", { name: "Invoices and collections" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    sidebar().getByRole("link", { name: "Sales pipeline" }),
  ).toHaveAttribute("href", "/examples/sales-pipeline?lang=en");
});

it("opens the screens menu from the start edge and returns focus", async () => {
  const user = userEvent.setup();
  render(
    <ScreenFrame slug="onboarding">
      <ScreenHeader />
    </ScreenFrame>,
  );
  const trigger = screen.getByRole("button", { name: "فتح القائمة" });
  await user.click(trigger);
  const menu = screen.getByRole("dialog", { name: "الشاشات" });
  expect(menu).toHaveAttribute("data-edge", "start");
  expect(
    within(menu).getByRole("link", { name: "التسجيل والتوثيق" }),
  ).toHaveAttribute("aria-current", "page");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(trigger).toHaveFocus();
});

it("hands a screen link to the docs when embedded", () => {
  window.history.replaceState(null, "", "/examples/month-end-close?embed=1");
  const post = vi.spyOn(window, "postMessage").mockImplementation(() => {});
  try {
    render(
      <ScreenFrame slug="month-end-close">
        <ScreenHeader />
      </ScreenFrame>,
    );
    expect(screen.queryByRole("button", { name: "English" })).toBeNull();
    expect(screen.queryByRole("button", { name: "الوضع الداكن" })).toBeNull();
    expect(screen.queryByRole("link", { name: "توثيق طِراز" })).toBeNull();
    const link = sidebar().getByRole("link", { name: "الفواتير والتحصيل" });
    // The link keeps its standalone href; a plain click stays in the docs.
    expect(link).toHaveAttribute("href", "/examples/invoices");
    expect(fireEvent.click(link)).toBe(false);
    expect(post).toHaveBeenCalledExactlyOnceWith(
      { type: "tiraz:open-screen", slug: "invoices" },
      window.location.origin,
    );
  } finally {
    post.mockRestore();
  }
});
