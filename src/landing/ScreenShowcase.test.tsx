import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SystemProvider, defaultConfig } from "../system";
import { ScreenShowcase } from "./ScreenShowcase";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1100);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(640);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function preview(ar = false, theme: "light" | "dark" = "dark") {
  return (
    <SystemProvider
      config={{
        ...defaultConfig,
        direction: ar ? "rtl" : "ltr",
        theme,
        accent: "plum",
      }}
    >
      <ScreenShowcase ar={ar} />
    </SystemProvider>
  );
}

it("switches between the two real screen routes with keyboard tabs", async () => {
  const user = userEvent.setup();
  const { container } = render(preview());
  const dashboard = screen.getByTitle(
    "Interactive preview: Customer dashboard",
  );
  expect(dashboard).toHaveAttribute(
    "src",
    "/examples/dashboard?lang=en&theme=dark&accent=plum&embed=1",
  );
  expect(dashboard).toHaveStyle({ "--lp-screen-width": "1280px" });
  screen.getByRole("tab", { name: "Customer dashboard" }).focus();
  await user.keyboard("{ArrowRight}");
  expect(
    screen.getByRole("tab", { name: "Invoices and collections" }),
  ).toHaveAttribute("aria-selected", "true");
  expect(container.querySelectorAll("iframe")).toHaveLength(1);
  expect(
    screen.getByTitle("Interactive preview: Invoices and collections"),
  ).toHaveAttribute(
    "src",
    "/examples/invoices?lang=en&theme=dark&accent=plum&embed=1",
  );
  expect(
    screen.getByRole("link", { name: /Open full screen/ }),
  ).toHaveAttribute(
    "href",
    "/examples/invoices?lang=en&theme=dark&accent=plum",
  );
});

it("preserves the selected screen when language and theme change", async () => {
  const user = userEvent.setup();
  const { rerender } = render(preview());
  await user.click(
    screen.getByRole("tab", { name: "Invoices and collections" }),
  );
  rerender(preview(true, "light"));
  expect(
    screen.getByRole("tab", { name: "الفواتير والتحصيل" }),
  ).toHaveAttribute("aria-selected", "true");
  expect(
    screen.getByTitle("معاينة تفاعلية: الفواتير والتحصيل"),
  ).toHaveAttribute(
    "src",
    "/examples/invoices?lang=ar&theme=light&accent=plum&embed=1",
  );
});

it("uses a phone viewport immediately in a narrow stage and lets keyboard users skip it", async () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(354);
  const user = userEvent.setup();
  render(preview());
  expect(
    screen.getByTitle("Interactive preview: Customer dashboard"),
  ).toHaveStyle({ "--lp-screen-width": "354px", "--lp-screen-scale": "1" });
  const skip = screen.getByRole("link", { name: "Skip screen preview" });
  skip.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("link", { name: /Open full screen/ })).toHaveFocus();
});

it("waits until the screen stage enters view before loading its route", () => {
  let enter: IntersectionObserverCallback = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        enter = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const { container } = render(preview());
  expect(container.querySelector("iframe")).toBeNull();
  expect(within(screen.getByRole("tablist")).getAllByRole("tab")).toHaveLength(
    2,
  );
  act(() =>
    enter(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
  expect(
    screen.getByTitle("Interactive preview: Customer dashboard"),
  ).toBeInTheDocument();
  expect(disconnect).toHaveBeenCalled();
});
