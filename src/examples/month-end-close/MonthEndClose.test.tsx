import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { MonthEndClose } from "./MonthEndClose";

afterEach(() => vi.restoreAllMocks());

const waiting = (count: string) => `صندوق القرارات، بانتظارك: ${count}`;
const step = (title: string) => screen.getByText(title).closest("li")!;
const dialog = () => screen.getByRole("dialog", { name: "صندوق القرارات" });
const accruals = "تسجيل قيود الاستحقاق";
const reminders = "إرسال تذكيرات الدفع للعملاء الثلاثة";

it("completes step 3 after the host's moment, then waits on step 4 and its three drafts", async () => {
  const user = userEvent.setup();
  render(<MonthEndClose />);
  const inbox = screen.getByRole("button", { name: waiting("١") });
  expect(step(accruals)).toHaveAttribute("data-state", "needs-you");
  expect(step(reminders)).toHaveAttribute("data-state", "pending");
  // The end panel: What changed, with the three figures all bad, then the run.
  expect(
    screen
      .getAllByRole("listitem")
      .filter((item) => item.matches(".tz-change-summary-row")),
  ).toHaveLength(3);
  expect(
    document.querySelectorAll('.tz-change-summary-badge[data-tone="bad"]'),
  ).toHaveLength(3);

  await user.click(
    within(step(accruals)).getByRole("button", { name: /^ترحيل القيود/ }),
  );
  // Recorded after the moment, not at the click.
  expect(step(accruals)).toHaveAttribute("data-state", "needs-you");
  await waitFor(
    () => expect(step(accruals)).toHaveAttribute("data-state", "completed"),
    { timeout: 3000 },
  );
  expect(step(reminders)).toHaveAttribute("data-state", "needs-you");
  expect(step(reminders)).toHaveTextContent(
    "٣ مسودات تنتظر مراجعتك · افتح الفواتير",
  );
  expect(
    within(step(reminders)).getByRole("link", { name: "افتح الفواتير" }),
  ).toHaveAttribute("href", "/examples/invoices");
  // The task takes the focus the decided card left, and one region says so.
  expect(screen.getByRole("region", { name: "مهمة الإقفال" })).toHaveFocus();
  expect(
    screen.getByText(
      "اكتملت الخطوة ٣. تنتظرك الخطوة ٤: ٣ مسودات في صندوق القرارات. التركيز على مهمة الإقفال.",
    ),
  ).toBeInTheDocument();
  // The inbox gained the three drafts, and the run counts step 3's operations.
  expect(screen.getByRole("button", { name: waiting("٤") })).toBe(inbox);
  expect(screen.getByText("استدعاءات الأدوات").nextSibling).toHaveTextContent(
    "٦",
  );
  // The run's facts: who started it is Laila, so its label is feminine.
  expect(screen.getByText("بدأتها").nextSibling).toHaveTextContent("ليلى");
  // Arabic-Indic digits everywhere on the page.
  expect(screen.getByRole("main").textContent).not.toMatch(/[0-9]/);
  await user.click(inbox);
  expect(
    within(dialog()).getAllByRole("button", { name: /^راجع / }),
  ).toHaveLength(3);
}, 15000);

it("closes the inbox on Escape while an answer records, and records nothing", async () => {
  const user = userEvent.setup();
  render(<MonthEndClose />);
  const inbox = screen.getByRole("button", { name: waiting("١") });
  const question = "هل أستثني فرع جدة؟";
  await user.click(inbox);
  await user.click(within(dialog()).getByRole("button", { name: question }));
  await user.click(
    within(dialog()).getByRole("radio", { name: /نعم، استثنِه/ }),
  );
  await user.click(
    within(dialog()).getByRole("button", { name: "إرسال الإجابات" }),
  );
  // Escape while the answer records closes the Sheet and hands focus back.
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(inbox).toHaveFocus();
  await new Promise((resolve) => setTimeout(resolve, 800));
  expect(screen.getByRole("button", { name: waiting("١") })).toBe(inbox);
  // The question still waits: nothing was recorded.
  await user.click(inbox);
  expect(
    within(dialog()).getByRole("button", { name: `أجب ${question}` }),
  ).toBeInTheDocument();
}, 15000);

it("skips step 3 on Reject, and hands each draft to the invoices", async () => {
  window.history.replaceState(
    null,
    "",
    "/examples/month-end-close?lang=en&embed=1",
  );
  const post = vi.spyOn(window, "postMessage").mockImplementation(() => {});
  try {
    const user = userEvent.setup();
    render(<MonthEndClose />);
    const accrualsStep = "Record the accrual entries";
    await user.click(
      within(step(accrualsStep)).getByRole("button", { name: /^Reject/ }),
    );
    await waitFor(
      () => expect(step(accrualsStep)).toHaveAttribute("data-state", "skipped"),
      { timeout: 3000 },
    );
    expect(step(accrualsStep)).toHaveTextContent("Skipped at your request");
    const next = step("Send payment reminders to the three customers");
    expect(next).toHaveAttribute("data-state", "needs-you");
    expect(next).toHaveTextContent(
      "3 drafts waiting for your review · Open Invoices",
    );
    expect(within(next).getByRole("link")).toHaveAttribute(
      "href",
      "/examples/invoices?lang=en",
    );
    expect(
      screen.getByText(
        "Step 3 was skipped. Step 4 needs you: 3 drafts in the decision inbox. Focus is on the close task.",
      ),
    ).toBeInTheDocument();
    // A skipped step has no operations to count: only steps 1 and 2 ran.
    expect(screen.getByText("Tool calls").nextSibling).toHaveTextContent("4");

    await user.click(
      screen.getByRole("button", { name: "Decision inbox, needs you: 4" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Decision inbox" });
    await user.click(
      within(dialog).getByRole("button", {
        name: "Review Payment reminder to Madar Company",
      }),
    );
    expect(post).toHaveBeenCalledExactlyOnceWith(
      { type: "tiraz:open-screen", slug: "invoices" },
      window.location.origin,
    );
  } finally {
    post.mockRestore();
    window.history.replaceState(null, "", "/");
  }
}, 15000);

it("records nothing when the inbox closes while its exit animation still holds it", async () => {
  // The Sheet stays mounted after it closes, as it does through its exit
  // animation. jsdom computes no animations, so say that a closed element has
  // one, and Radix waits for an animationend that nothing sends. An abort that
  // only an unmount delivers would come after the host's moment.
  const computed = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const style = computed(element, pseudo);
    return new Proxy(style, {
      get(target, property) {
        if (property === "animationName")
          return element.getAttribute("data-state") === "closed"
            ? "hold"
            : "none";
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  });
  const user = userEvent.setup();
  render(<MonthEndClose />);
  const inbox = screen.getByRole("button", { name: waiting("١") });
  const question = "هل أستثني فرع جدة؟";
  await user.click(inbox);
  await user.click(within(dialog()).getByRole("button", { name: question }));
  await user.click(
    within(dialog()).getByRole("radio", { name: /نعم، استثنِه/ }),
  );
  await user.click(
    within(dialog()).getByRole("button", { name: "إرسال الإجابات" }),
  );
  await user.keyboard("{Escape}");
  // Closed, yet still mounted.
  const held = screen.getByRole("dialog", {
    name: "صندوق القرارات",
    hidden: true,
  });
  expect(held).toHaveAttribute("data-state", "closed");
  // Past the host's moment, with the Sheet still mounted: nothing recorded.
  await new Promise((resolve) => setTimeout(resolve, 800));
  expect(screen.getByRole("button", { name: waiting("١"), hidden: true })).toBe(
    inbox,
  );
  // Let the animation end, and the question still waits.
  fireEvent(
    held,
    Object.assign(new Event("animationend", { bubbles: true }), {
      animationName: "hold",
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await user.click(inbox);
  expect(
    within(dialog()).getByRole("button", { name: `أجب ${question}` }),
  ).toBeInTheDocument();
}, 15000);
