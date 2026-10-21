import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Dashboard } from "./Dashboard";

async function setup() {
  render(<Dashboard />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "English" }));
  return user;
}
const customerTable = () =>
  screen.getByRole("table", { name: "Customer directory" });
async function select(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(screen.getByRole("option", { name: option }));
}

it("resets pagination for combined filters and distinguishes no results from an empty dataset", async () => {
  const user = await setup();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("7–12 of 18 customers")).toBeInTheDocument();
  await user.type(screen.getByRole("searchbox"), "madar");
  expect(customerTable()).toHaveTextContent("شركة مدار");
  await select(user, "Customer status", "Paused");
  expect(customerTable()).toHaveTextContent("No matching customers");
  await user.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByText("1–6 of 18 customers")).toBeInTheDocument();
  await select(user, "Preview state", "Empty dataset");
  expect(customerTable()).toHaveTextContent("No customers yet");
  expect(screen.getByTestId("customer-count")).toHaveTextContent("0");
});

it("validates, saves once, updates only customers, and reveals a customer hidden by filters", async () => {
  const user = await setup();
  const orderCount = screen.getByTestId("order-count").textContent;
  const revenue = screen.getByTestId("revenue").textContent;
  await user.type(screen.getByRole("searchbox"), "unmatched");
  await select(user, "Customer status", "Paused");
  const trigger = screen.getByRole("button", { name: "Create customer" });
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveFocus();
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "  مدار New  ",
  );
  await user.type(screen.getByLabelText("Email"), "invalid");
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  expect(screen.getByLabelText("Email")).toHaveFocus();
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "new@madar.example");
  await user.dblClick(screen.getByRole("button", { name: "Save customer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(trigger).toHaveFocus();
  expect(screen.getByTestId("customer-count")).toHaveTextContent("19");
  expect(screen.getByTestId("order-count").textContent).toBe(orderCount);
  expect(screen.getByTestId("revenue").textContent).toBe(revenue);
  expect(screen.getByText("Customer created")).toBeInTheDocument();
  expect(
    screen.getByText("Your filters hide the new customer."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Show customer" }));
  expect(customerTable()).toHaveTextContent("مدار New");
  expect(within(customerTable()).getAllByRole("row")).toHaveLength(2);
});

it("discards drafts and restores trigger focus after cancel, close and Escape", async () => {
  const user = await setup();
  const trigger = screen.getByRole("button", { name: "Create customer" });
  for (const dismiss of ["Cancel", "Close customer form", "Escape"]) {
    await user.click(trigger);
    await user.type(
      screen.getByRole("textbox", { name: "Customer name" }),
      "Unsaved",
    );
    if (dismiss === "Escape") await user.keyboard("{Escape}");
    else await user.click(screen.getByRole("button", { name: dismiss }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveValue(
      "",
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  }
  expect(screen.getByTestId("customer-count")).toHaveTextContent("18");
});

it("changes order metrics with the shared period and restores sample data on Retry", async () => {
  const user = await setup();
  const count = screen.getByTestId("order-count").textContent;
  // The average order is the period's revenue over its orders: 22,160 / 71.
  expect(screen.getByTestId("average-order")).toHaveTextContent("AED 312");
  await select(user, "Period", "14 days");
  expect(screen.getByTestId("order-count").textContent).not.toBe(count);
  expect(screen.getByTestId("average-order")).toHaveTextContent("AED 310");
  await select(user, "Preview state", "Loading");
  expect(customerTable()).toHaveAttribute("aria-busy", "true");
  expect(
    screen.getByText("Loading preview — no request is running."),
  ).toBeInTheDocument();
  await select(user, "Preview state", "Error");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(screen.getByTestId("customer-count")).toHaveTextContent("18");
  expect(customerTable()).toHaveTextContent("شركة مدار");
});

it("creates in the empty dataset without orders and keeps data through live language/theme changes", async () => {
  const user = await setup();
  await select(user, "Preview state", "Empty dataset");
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "First customer",
  );
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByTestId("customer-count")).toHaveTextContent("1");
  expect(screen.getByTestId("order-count")).toHaveTextContent("0");
  expect(screen.getByTestId("revenue")).toHaveTextContent("0");
  await user.click(screen.getByRole("button", { name: "Dark mode" }));
  await user.click(screen.getByRole("button", { name: "العربية" }));
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(document.documentElement).toHaveAttribute("dir", "rtl");
  expect(document.querySelector(".tiraz-system")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  expect(screen.getByRole("table", { name: "دليل العملاء" })).toHaveTextContent(
    "First customer",
  );
});

it("hands mobile navigation focus to the destination after the Sheet restores its trigger", async () => {
  const user = await setup();
  const trigger = screen.getByRole("button", { name: "Open navigation" });
  for (const name of ["Customers", "Orders", "Overview"]) {
    await user.click(trigger);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("link", { name }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(document.getElementById(name.toLowerCase())).toHaveFocus(),
    );
  }
  await user.click(trigger);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(trigger).toHaveFocus();
});

it("uses Sidebar links for the three real sections and retains connected data through collapse", async () => {
  const user = await setup();
  const navigation = screen.getByRole("navigation", {
    name: "Dashboard navigation",
  });
  expect(within(navigation).getAllByRole("link")).toHaveLength(3);
  expect(
    within(navigation).getByRole("link", { name: "Overview" }),
  ).toHaveAttribute("aria-current", "page");
  await user.click(within(navigation).getByRole("link", { name: "Customers" }));
  expect(
    within(navigation).getByRole("link", { name: "Customers" }),
  ).toHaveAttribute("aria-current", "page");
  await user.type(screen.getByRole("searchbox"), "madar");
  await user.click(screen.getByRole("button", { name: "Collapse navigation" }));
  expect(
    screen.getByRole("button", { name: "Expand navigation" }),
  ).toBeInTheDocument();
  expect(customerTable()).toHaveTextContent("شركة مدار");
  expect(screen.getByRole("searchbox")).toHaveValue("madar");
});

it("preserves the current dashboard destination and focus on modified native links", async () => {
  window.history.replaceState(null, "", "/");
  await setup();
  const nav = screen.getByRole("navigation", { name: "Dashboard navigation" });
  const overview = within(nav).getByRole("link", { name: "Overview" });
  const orders = within(nav).getByRole("link", { name: "Orders" });
  orders.focus();
  fireEvent.click(orders, { metaKey: true });
  expect(overview).toHaveAttribute("aria-current", "page");
  expect(orders).toHaveFocus();
});

it("uses FilterBar to remove individual customer filters while preserving sorting and page reset", async () => {
  const user = await setup();
  const filters = within(
    screen.getByRole("group", { name: "Customer filters" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Sort Customer ascending" }),
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByRole("searchbox"), "madar");
  await select(user, "Customer status", "Paused");
  expect(customerTable()).toHaveTextContent("No matching customers");
  await user.click(
    filters.getByRole("button", { name: "Remove customer status" }),
  );
  expect(customerTable()).toHaveTextContent("شركة مدار");
  expect(customerTable().querySelector("th[aria-sort]")).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await user.click(
    filters.getByRole("button", { name: "Remove customer search" }),
  );
  expect(screen.getByRole("searchbox")).toHaveFocus();
  expect(screen.getByText("1–6 of 18 customers")).toBeInTheDocument();
  expect(filters.queryByRole("button", { name: "Clear filters" })).toBeNull();
});

it("starts from the address and, embedded in the docs, leaves language, theme and the docs link to them", () => {
  try {
    window.history.replaceState(
      null,
      "",
      "/examples/dashboard?embed=1&lang=en&theme=dark",
    );
    const { unmount } = render(<Dashboard />);
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(document.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Everything, in one place.",
    );
    // Neither button, and no link that would nest the docs in their iframe.
    expect(screen.queryByRole("button", { name: "العربية" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Dark mode" })).toBeNull();
    expect(document.querySelector('a[href="/"]')).toBeNull();
    // Everything else stays.
    expect(
      screen.getByRole("button", { name: "Decision inbox, needs you: 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Preview state" }),
    ).toBeInTheDocument();
    unmount();

    // Standalone, the same address starts the page the same way, with both
    // buttons and the docs link.
    window.history.replaceState(null, "", "/examples/dashboard?theme=dark");
    render(<Dashboard />);
    expect(document.documentElement).toHaveAttribute("lang", "ar");
    expect(document.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "الوضع الداكن" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector('a[href="/"]')).not.toBeNull();
  } finally {
    window.history.replaceState(null, "", "/");
  }
});

it("shows Arabic-Indic digits in the Arabic dashboard", () => {
  render(<Dashboard />);
  const note = (id: string) =>
    screen
      .getByTestId(id)
      .closest("div")!
      .querySelector(".dashboard-metric-note")!;
  // The order count, the order revenue, the average order and the period note
  // under each.
  for (const element of [
    screen.getByTestId("order-count"),
    screen.getByTestId("revenue"),
    screen.getByTestId("average-order"),
    note("order-count"),
    note("revenue"),
    note("average-order"),
  ]) {
    expect(element).toHaveTextContent(/[٠-٩]/);
    expect(element).not.toHaveTextContent(/[0-9]/);
  }
});

it("sets What changed beside the orders trend with rows from the orders", async () => {
  render(<Dashboard />);
  const orders = document.getElementById("orders")!;
  const summary = () =>
    within(orders).getByRole("region", {
      name: /^(ما الذي تغيّر|What changed)$/,
    });
  // The trend and What changed share the first row of cards, the trend first.
  const trend = within(orders).getByRole("region", {
    name: "الطلبات اليومية",
  });
  const row = summary().parentElement!;
  expect(row).toHaveClass("dashboard-row");
  expect(row).toContainElement(trend);
  expect(
    trend.compareDocumentPosition(summary()) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  // Orders, revenue and the average order: the last seven days (71 orders,
  // 22,160 AED) against the seven before (45 orders, 13,815 AED). More is good.
  // The money rows name their unit once.
  const rows = () => [...summary().querySelectorAll(".tz-change-summary-row")];
  expect(rows()).toHaveLength(3);
  expect(
    rows().map(
      (row) => row.querySelector(".tz-change-summary-metric")!.textContent,
    ),
  ).toEqual(["الطلبات", "إيرادات الطلبات (د.إ.)", "متوسط قيمة الطلب (د.إ.)"]);
  for (const row of rows()) {
    const badge = row.querySelector(".tz-change-summary-badge")!;
    expect(badge).toHaveAttribute("data-direction", "up");
    expect(badge).toHaveAttribute("data-tone", "good");
  }
  for (const [row, figures] of [
    [0, ["٥٧٫٨٪", "٤٥", "٧١"]],
    [1, ["٦٠٫٤٪", "١٣٬٨١٥", "٢٢٬١٦٠"]],
    [2, ["١٫٧٪", "٣٠٧", "٣١٢"]],
  ] as const)
    for (const figure of figures) expect(rows()[row]).toHaveTextContent(figure);
  // Arabic-Indic digits everywhere in it, and Western ones in English.
  expect(summary().textContent).toMatch(/[٠-٩]/);
  expect(summary().textContent).not.toMatch(/[0-9]/);
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "English" }));
  expect(summary()).toHaveTextContent("57.8%");
  expect(summary().textContent).not.toMatch(/[٠-٩]/);
});

it("opens the decision inbox from the header and asks the orders a question", async () => {
  const user = userEvent.setup();
  render(<Dashboard />);
  const waiting = (count: string) => `صندوق القرارات، بانتظارك: ${count}`;
  const dialog = () => screen.getByRole("dialog", { name: "صندوق القرارات" });
  const rows = () => within(dialog()).getAllByRole("listitem");
  const closed = () =>
    waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const layla = () =>
    within(screen.getByRole("table", { name: "دليل العملاء" })).getByRole(
      "row",
      { name: /ليلى أحمد/ },
    );
  const reminder = "إرسال تذكير بالدفع إلى شركة مدار للتقنية";

  // Two requests wait on the person: the count is in the reader's digits, in a
  // button that comes before the language button.
  const inbox = screen.getByRole("button", { name: waiting("٢") });
  expect(inbox).toHaveTextContent("صندوق القرارات بانتظارك: ٢");
  expect(inbox).not.toHaveTextContent(/[0-9]/);
  expect(
    inbox.compareDocumentPosition(
      screen.getByRole("button", { name: "English" }),
    ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(layla()).toHaveTextContent("متوقف");

  // It opens a Sheet with both requests from the assistant, and focus does not
  // start on a decision.
  await user.click(inbox);
  expect(rows()).toHaveLength(2);
  expect(rows()[0]).toHaveTextContent("إعادة تفعيل حساب ليلى أحمد");
  expect(rows()[1]).toHaveTextContent(reminder);
  expect(rows()[0]).toHaveTextContent("مساعد العملاء");
  expect(
    within(dialog()).getByRole("button", { name: "إغلاق صندوق القرارات" }),
  ).toHaveFocus();

  // Escape while the reminder is being recorded closes the Sheet, hands focus
  // back to the button and records nothing.
  await user.click(within(dialog()).getByRole("button", { name: reminder }));
  await user.click(
    within(dialog()).getByRole("button", { name: "أرسل التذكير" }),
  );
  await user.keyboard("{Escape}");
  await closed();
  expect(inbox).toHaveFocus();
  await new Promise((resolve) => setTimeout(resolve, 800));
  expect(screen.getByRole("button", { name: waiting("٢") })).toBe(inbox);
  await user.click(inbox);
  expect(rows()).toHaveLength(2);

  // Approving the reactivation records it after the host's moment: one request
  // is left and Layla is active.
  await user.click(
    within(dialog()).getByRole("button", { name: /^أعد التفعيل/ }),
  );
  await waitFor(
    () =>
      expect(within(dialog()).getByRole("status")).toHaveTextContent(
        "طلب واحد بانتظارك",
      ),
    { timeout: 3000 },
  );
  await user.keyboard("{Escape}");
  await closed();
  expect(screen.getByRole("button", { name: waiting("١") })).toHaveFocus();
  expect(layla()).toHaveTextContent("نشط");

  // Beside the channels' orders, the question asks what the donut doesn't:
  // each channel's revenue. Chart, caption and sentences share the figures
  // (web 11,545 of 22,160 AED), in Arabic-Indic digits.
  const orders = document.getElementById("orders")!;
  const ask = () =>
    within(orders).getByRole("region", {
      name: "كم جلبت كل قناة من الإيرادات هذه الفترة؟",
    });
  const donut = within(orders).getByRole("region", {
    name: "الطلبات حسب القناة",
  });
  expect(ask().parentElement).toHaveClass("dashboard-row");
  expect(ask().parentElement).toContainElement(donut);
  expect(
    donut.compareDocumentPosition(ask()) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const bars = within(ask()).getByRole("region", { name: "إيرادات كل قناة" });
  expect(bars).toHaveTextContent(
    "الإيرادات (د.إ.): الموقع ١١٬٥٤٥، المتجر ٥٬٠٦٠، الشركاء ٥٬٥٥٥.",
  );
  const explanation = ask().querySelector(".tz-data-answer-explanation")!;
  for (const words of ["جلب الموقع", "١١٬٥٤٥", "٥٢٫١٪", "١٠٬٦١٥", "٤٧٫٩٪"])
    expect(explanation).toHaveTextContent(words);
  expect(explanation).not.toHaveTextContent(/[0-9]/);
  expect(explanation.querySelectorAll(".tz-inline-citation")).toHaveLength(2);

  // The donut is the second type.
  await user.click(within(ask()).getByRole("radio", { name: "حلقي" }));
  expect(within(ask()).getByRole("radio", { name: "حلقي" })).toBeChecked();
  expect(
    within(ask()).getByRole("region", { name: "حصة كل قناة من الإيرادات" }),
  ).toBeInTheDocument();

  // The error preview fails the answer, and trying again brings it back.
  await select(user, "معاينة الحالة", "خطأ");
  expect(ask().querySelector(".tz-data-answer-note")).toHaveTextContent(
    "تعذّر إكمال الإجابة",
  );
  await user.click(within(ask()).getByRole("button", { name: "أعد المحاولة" }));
  expect(ask().querySelector(".tz-data-answer-explanation")).not.toBeNull();
  expect(
    within(ask()).getByRole("region", { name: "حصة كل قناة من الإيرادات" }),
  ).toBeInTheDocument();

  // The sample data is back, so the inbox is too; English has Western digits.
  expect(layla()).toHaveTextContent("متوقف");
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("button", { name: "Decision inbox, needs you: 2" }),
  ).toBeInTheDocument();
}, 15000);
