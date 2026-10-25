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
function openNavigation() {
  fireEvent.click(
    screen.getByRole("button", {
      name: /إظهار القائمة الجانبية|Show navigation/,
    }),
  );
}
afterEach(() => window.history.replaceState(null, "", "/"));

it("carries a valid preview accent through screen navigation and ignores unknown accents", () => {
  window.history.replaceState(
    null,
    "",
    "/examples/invoices?lang=en&theme=dark&accent=plum",
  );
  const view = render(
    <ScreenFrame slug="invoices">
      <Probe />
    </ScreenFrame>,
  );
  expect(view.container.querySelector(".tiraz-system")).toHaveStyle({
    "--action": "var(--tiraz-action, #D6B6E5)",
  });
  openNavigation();
  expect(
    sidebar().getByRole("link", { name: "Sales pipeline" }),
  ).toHaveAttribute(
    "href",
    "/examples/sales-pipeline?lang=en&theme=dark&accent=plum",
  );
  view.unmount();
  window.history.replaceState(null, "", "/examples/invoices?accent=unknown");
  const fallback = render(
    <ScreenFrame slug="invoices">
      <Probe />
    </ScreenFrame>,
  );
  expect(fallback.container.querySelector(".tiraz-system")).toHaveStyle({
    "--action": "var(--tiraz-action, #355E4C)",
  });
});

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
  openNavigation();
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
  const media = window.matchMedia;
  const mobile = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...media(query),
    matches: query === "(max-width: 767px)",
  }));
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
  mobile.mockRestore();
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
    openNavigation();
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

it.each([
  ["ar", "إخفاء القائمة الجانبية", "إظهار القائمة الجانبية"],
  ["en", "Hide navigation", "Show navigation"],
])(
  "hides the whole navigation accessibly without remounting %s content",
  async (language, hide, show) => {
    window.history.replaceState(
      null,
      "",
      `/examples/invoices?lang=${language}`,
    );
    const user = userEvent.setup();
    render(
      <ScreenFrame slug="invoices">
        <ScreenHeader />
        <input aria-label="Draft" defaultValue="" />
      </ScreenFrame>,
    );
    const draft = screen.getByRole("textbox", { name: "Draft" });
    await user.type(draft, "Keep this draft");
    openNavigation();
    const trigger = screen.getByRole("button", { name: hide });
    const panel = document.getElementById(
      trigger.getAttribute("aria-controls")!,
    );
    await user.click(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAccessibleName(show);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("inert");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.queryByRole("navigation", { name: /الشاشات|Screens/ }),
    ).toBeNull();
    expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
    expect(draft).toHaveValue("Keep this draft");
    await user.click(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("inert");
    expect(panel).not.toHaveAttribute("aria-hidden");
    expect(sidebar().getAllByRole("link")).toHaveLength(11);
  },
);

it("Escape in navigation hides it and restores focus without capturing content Escape", async () => {
  const user = userEvent.setup();
  render(
    <ScreenFrame slug="invoices">
      <ScreenHeader />
      <input aria-label="Draft" />
    </ScreenFrame>,
  );
  openNavigation();
  const trigger = screen.getByRole("button", {
    name: "إخفاء القائمة الجانبية",
  });
  await user.click(screen.getByRole("textbox", { name: "Draft" }));
  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  sidebar().getByRole("link", { name: "الفواتير والتحصيل" }).focus();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("navigation", { name: "الشاشات" })).toBeNull();
});

it.each([
  [
    "ar",
    "إظهار القائمة الجانبية",
    "افتح القائمة من هنا",
    "إخفاء تلميح القائمة",
  ],
  ["en", "Show navigation", "Open the sidebar", "Dismiss sidebar hint"],
])(
  "starts %s screens closed and opens from the first-visit guide without losing focus",
  async (language, show, note, dismiss) => {
    window.history.replaceState(
      null,
      "",
      `/examples/invoices?lang=${language}&embed=1`,
    );
    const user = userEvent.setup();
    const { unmount, container } = render(
      <ScreenFrame slug="invoices">
        <ScreenHeader />
      </ScreenFrame>,
    );
    const trigger = screen.getByRole("button", { name: show });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("navigation", { name: /الشاشات|Screens/ }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: note })).toBeVisible();
    expect(
      container.querySelector(".screen-navigation-hint [aria-live]"),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: note }));
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveFocus();
    expect(sidebar().getAllByRole("link")).toHaveLength(11);
    expect(screen.queryByRole("button", { name: dismiss })).toBeNull();
    unmount();
    render(
      <ScreenFrame slug="customer-profile">
        <ScreenHeader />
      </ScreenFrame>,
    );
    expect(screen.getByRole("button", { name: show })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: note })).toBeNull();
    // Learning the sidebar must not consume the separate customization guide.
    expect(localStorage.getItem("tiraz.customize-hint.v1")).toBeNull();
  },
);

it("dismisses the sidebar guide without opening navigation and remembers it", async () => {
  localStorage.setItem("tiraz.customize-hint.v1", "seen");
  window.history.replaceState(null, "", "/examples/invoices?lang=en");
  const user = userEvent.setup();
  const { unmount } = render(
    <ScreenFrame slug="invoices">
      <ScreenHeader />
    </ScreenFrame>,
  );
  await user.click(
    screen.getByRole("button", { name: "Dismiss sidebar hint" }),
  );
  const trigger = screen.getByRole("button", { name: "Show navigation" });
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  unmount();
  render(
    <ScreenFrame slug="invoices">
      <ScreenHeader />
    </ScreenFrame>,
  );
  expect(screen.queryByRole("button", { name: "Open the sidebar" })).toBeNull();
});

it("the guide opens the mobile drawer and returns focus to its real trigger on Escape", async () => {
  const media = window.matchMedia;
  const mobile = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...media(query),
    matches: query === "(max-width: 767px)",
  }));
  try {
    const user = userEvent.setup();
    render(
      <ScreenFrame slug="invoices">
        <ScreenHeader />
      </ScreenFrame>,
    );
    const trigger = screen.getByRole("button", { name: "فتح القائمة" });
    await user.click(
      screen.getByRole("button", { name: "افتح القائمة من هنا" }),
    );
    expect(screen.getByRole("dialog", { name: "الشاشات" })).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "افتح القائمة من هنا" }),
    ).toBeNull();
  } finally {
    mobile.mockRestore();
  }
});
