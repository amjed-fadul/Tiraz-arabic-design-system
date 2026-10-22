import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CustomerProfile } from "./CustomerProfile";

const question = "كم تأخّرت مدار في السداد كل شهر هذا العام؟";

it("keeps the visible opening prompt on focus and the saved draft on replay takeover", () => {
  vi.useFakeTimers();
  const view = render(<CustomerProfile />);
  try {
    act(() => vi.advanceTimersByTime(800));
    fireEvent.click(screen.getByRole("button", { name: "إيقاف العرض مؤقتًا" }));
    const input = screen.getByRole("combobox", { name: "طلبك" });
    const visible = (input as HTMLTextAreaElement).value;
    expect(visible.length).toBeGreaterThan(0);
    fireEvent.focus(input);
    expect(input).toHaveValue(visible);
    fireEvent.change(input, { target: { value: "Keep my customer question" } });
    fireEvent.click(screen.getByRole("button", { name: "إعادة العرض" }));
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole("button", { name: /^إرسال/ }));
    expect(input).toHaveValue("Keep my customer question");
    expect(screen.getByRole("region", { name: question })).toHaveAttribute(
      "data-status",
      "completed",
    );
  } finally {
    view.unmount();
    vi.useRealTimers();
  }
});

it("lists Madar's two invoices and keeps the activity in the order it happened", async () => {
  const user = userEvent.setup();
  render(<CustomerProfile />);
  // The header gives the three facts, and the breadcrumb leads back to the
  // invoices.
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "شركة مدار",
  );
  expect(
    screen.getByText(
      "١٥٬٦٠٠ ر.س مستحقة · فاتورتان متأخرتان · جهة الاتصال: سارة العتيبي",
    ),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("navigation", { name: "مسار التنقل" })).getByRole(
      "link",
      { name: "الفواتير والتحصيل" },
    ),
  ).toHaveAttribute("href", "/examples/invoices");

  // The overview's activity runs oldest first: the two invoices, the first
  // reminder and Sara's promise.
  const activity = screen.getByRole("list", { name: "سجل نشاط العميل" });
  expect(
    within(activity)
      .getAllByRole("listitem")
      .map((item) => item.querySelector(".tz-timeline-title")?.textContent),
  ).toEqual([
    "صدرت الفاتورة INV-1043",
    "صدرت الفاتورة INV-1046",
    "أُرسل أول تذكير بالسداد",
    "وعدت سارة العتيبي بالسداد قبل ٢٥ أكتوبر",
  ]);

  await user.click(screen.getByRole("tab", { name: "الفواتير" }));
  const table = screen.getByRole("table", { name: "فواتير شركة مدار" });
  const rows = within(table).getAllByRole("row").slice(1);
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent("INV-1043");
  expect(rows[0]).toHaveTextContent("٩٬٤٠٠ ر.س");
  expect(rows[1]).toHaveTextContent("INV-1046");
  expect(rows[1]).toHaveTextContent("٦٬٢٠٠ ر.س");
});

it("answers the suggested question with the customer attached: bars, and the citations 2 and 4", async () => {
  const user = userEvent.setup();
  render(<CustomerProfile />);
  const starter = within(
    screen.getByRole("region", { name: "اسأل عن شركة مدار" }),
  );
  // Madar is attached as a record; choosing the suggestion fills the draft,
  // and sending it asks the answer again.
  expect(
    starter.getByRole("button", { name: "إزالة شركة مدار" }),
  ).toBeInTheDocument();
  await user.click(starter.getByRole("button", { name: question }));
  expect(starter.getByRole("combobox", { name: "طلبك" })).toHaveValue(question);
  await user.click(starter.getByRole("button", { name: /^إرسال/ }));
  // The heading is always the sample question; it thinks, then completes.
  const answer = () => screen.getByRole("region", { name: question });
  expect(answer()).toHaveAttribute("data-status", "thinking");
  await waitFor(
    () => expect(answer()).toHaveAttribute("data-status", "completed"),
    { timeout: 4000 },
  );
  expect(starter.getByRole("combobox", { name: "طلبك" })).toHaveValue("");

  // Bars of the ten months, and the explanation's two citations.
  expect(within(answer()).getByRole("radio", { name: "أعمدة" })).toBeChecked();
  expect(
    within(answer()).getByRole("radio", { name: "خطوط" }),
  ).not.toBeChecked();
  expect(
    within(answer()).getByRole("region", { name: "أيام تأخّر مدار كل شهر" }),
  ).toHaveTextContent("يناير ٣، فبراير ٥");
  expect(
    [...answer().querySelectorAll(".tz-inline-citation")].map(
      (chip) => chip.textContent,
    ),
  ).toEqual(["٢", "٤"]);
}, 15_000);
