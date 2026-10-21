import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Invoices } from "./Invoices";

const table = () => screen.getByRole("table", { name: "الفواتير" });
const rows = () => within(table()).getAllByRole("row").slice(1);
const ids = () =>
  rows().map((row) => within(row).getByRole("rowheader").textContent);
const row = (id: string) =>
  rows().find((item) => item.textContent?.includes(id))!;
const draft = () => screen.getByRole("region", { name: "تذكير بالسداد" });

it("finds invoices by customer, sorts the late ones by amount and lists all sixteen without the status", async () => {
  const user = userEvent.setup();
  render(<Invoices />);
  // The header counts the twelve late invoices and what they owe.
  expect(screen.getByText("١٢ فاتورة متأخرة · ٤٨٬٣٠٠ ر.س")).toBeInTheDocument();
  expect(screen.getByText("١–٨ من ١٢ فاتورة")).toBeInTheDocument();

  const search = screen.getByRole("searchbox", {
    name: "ابحث بالعميل أو رقم الفاتورة",
  });
  await user.type(search, "مدار");
  expect(ids()).toEqual(["INV-1043", "INV-1046"]);
  await user.clear(search);

  // The default filter is late: sorting by amount, largest first, starts with
  // Al Nada's INV-1039 (11,200).
  await user.click(
    screen.getByRole("button", { name: "ترتيب المبلغ تصاعديًا" }),
  );
  await user.click(
    screen.getByRole("button", { name: "ترتيب المبلغ تنازليًا" }),
  );
  expect(ids()[0]).toBe("INV-1039");

  // Without the status chip every invoice shows, on two pages.
  await user.click(screen.getByRole("button", { name: "إزالة الحالة" }));
  expect(screen.getByText("١–٨ من ١٦ فاتورة")).toBeInTheDocument();
});

it("shows INV-1043's draft for سارة العتيبي and marks the row once it is sent", async () => {
  const user = userEvent.setup();
  render(<Invoices />);
  // The panel starts on the story's reminder, and its row says so.
  expect(draft()).toHaveTextContent("سارة العتيبي");
  expect(draft()).toHaveTextContent("٩٬٤٠٠ ر.س");
  expect(draft()).toHaveTextContent("INV-1043");
  expect(
    within(row("INV-1043")).getByRole("button", {
      name: "راجع التذكير · INV-1043",
    }),
  ).toHaveAttribute("aria-current", "true");
  expect(
    within(row("INV-1033")).getByRole("button", {
      name: "اكتب تذكيرًا · INV-1033",
    }),
  ).toBeInTheDocument();

  await user.click(within(draft()).getByRole("button", { name: /^إرسال/ }));
  await waitFor(
    () => expect(row("INV-1043")).toHaveTextContent("أُرسل التذكير"),
    {
      timeout: 3000,
    },
  );
  // The button stays, now to view it, and only this row changed.
  expect(
    within(row("INV-1043")).getByRole("button", {
      name: "عرض التذكير · INV-1043",
    }),
  ).toBeInTheDocument();
  expect(row("INV-1039")).not.toHaveTextContent("أُرسل التذكير");
}, 15_000);

it("has no panel below 960px: a row's button opens its own draft in a Sheet from the end edge", async () => {
  const observer = globalThis.ResizeObserver;
  // The frame reads main's width from its ResizeObserver: 700px is medium.
  globalThis.ResizeObserver = class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback(
        [{ contentRect: { width: 700 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  };
  try {
    const user = userEvent.setup();
    render(<Invoices />);
    expect(screen.queryByRole("region", { name: "تذكير بالسداد" })).toBeNull();
    const button = screen.getByRole("button", {
      name: "اكتب تذكيرًا · INV-1033",
    });
    await user.click(button);
    const dialog = screen.getByRole("dialog", { name: "مراجعة التذكير" });
    expect(dialog).toHaveAttribute("data-edge", "end");
    // The assistant writes the reminder, then hands it over for review.
    await waitFor(
      () =>
        expect(
          (
            within(dialog).getByRole("textbox", {
              name: "نص الرسالة",
            }) as HTMLTextAreaElement
          ).value,
        ).toContain("INV-1033"),
      { timeout: 5000 },
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleName("راجع التذكير · INV-1033");
  } finally {
    globalThis.ResizeObserver = observer;
  }
}, 15_000);
