import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { SalesPipeline } from "./SalesPipeline";

type User = ReturnType<typeof userEvent.setup>;
/** A stage's section, found by its h2. */
const lane = (name: string) => within(screen.getByRole("region", { name }));
/** Opens a card's «نقل إلى» menu and chooses a stage. */
async function moveTo(user: User, customer: string, stage: string) {
  await user.click(
    screen.getByRole("button", { name: `نقل إلى · ${customer}` }),
  );
  await user.click(await screen.findByRole("menuitem", { name: stage }));
}

it("moves شركة مدار to تفاوض from the keyboard: both columns change, its button has focus, and the move is announced once", async () => {
  const user = userEvent.setup();
  render(<SalesPipeline />);
  // The header counts the ten deals and what they are worth; Madar's deal is
  // a quote, and negotiation holds three.
  expect(
    screen.getByText("أكتوبر ٢٠٢٦ · ١٠ صفقات · ١٬٤٠٥٬٠٠٠ ر.س"),
  ).toBeInTheDocument();
  expect(
    lane("عرض سعر").getByRole("button", { name: "شركة مدار" }),
  ).toBeInTheDocument();
  expect(lane("تفاوض").getByText("٣ صفقات")).toBeInTheDocument();
  expect(lane("تفاوض").getByText("٧٣٠٬٠٠٠ ر.س")).toBeInTheDocument();

  // The menu opens from the keyboard onto the first of the other four stages;
  // two arrows reach «تفاوض».
  screen.getByRole("button", { name: "نقل إلى · شركة مدار" }).focus();
  await user.keyboard("{Enter}");
  await waitFor(() =>
    expect(screen.getByRole("menuitem", { name: "جديد" })).toHaveFocus(),
  );
  expect(screen.getAllByRole("menuitem")).toHaveLength(4);
  await user.keyboard("{ArrowDown}{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "تفاوض" })).toHaveFocus();
  await user.keyboard("{Enter}");

  // The quote column lost the deal, and negotiation has it first, on a new day.
  expect(
    lane("عرض سعر").queryByRole("button", { name: "شركة مدار" }),
  ).toBeNull();
  expect(lane("عرض سعر").getByText("صفقة واحدة")).toBeInTheDocument();
  expect(lane("تفاوض").getByText("٤ صفقات")).toBeInTheDocument();
  const moved = lane("تفاوض").getByRole("button", { name: "شركة مدار" });
  expect(moved.closest("li")).toHaveTextContent("انتقلت اليوم");
  expect(lane("تفاوض").getAllByRole("listitem")[0]).toContainElement(moved);
  await waitFor(() => expect(moved).toHaveFocus());
  // The screen's region says it once.
  expect(screen.getAllByText("نُقلت صفقة شركة مدار إلى تفاوض")).toHaveLength(1);
}, 15_000);

it("opens a deal's follow-up in a Sheet from the end edge; Escape returns focus and nothing is sent", async () => {
  const user = userEvent.setup();
  render(<SalesPipeline />);
  const button = screen.getByRole("button", { name: "شركة مدار" });
  await user.click(button);
  const dialog = () =>
    screen.getByRole("dialog", { name: "متابعة صفقة شركة مدار" });
  expect(dialog()).toHaveAttribute("data-edge", "end");
  // The draft is for Sara, and says what a deal at the quote stage needs.
  expect(dialog()).toHaveTextContent("سارة العتيبي");
  const message = () =>
    within(dialog()).getByRole("textbox", { name: "نص الرسالة" });
  expect((message() as HTMLTextAreaElement).value).toContain("عرض السعر");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(button).toHaveFocus();

  // Closing while Send records aborts it: past the host's moment, the draft is
  // still waiting, with no receipt.
  await user.click(button);
  await user.click(within(dialog()).getByRole("button", { name: /^إرسال/ }));
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await new Promise((resolve) => setTimeout(resolve, 800));
  await user.click(button);
  expect(
    within(dialog()).getByRole("button", { name: /^إرسال/ }),
  ).toBeInTheDocument();
  expect(dialog()).not.toHaveTextContent("أُرسلت الرسالة");
}, 15_000);

it("cancels a sending follow-up when resizing removes its stage's Sheet", async () => {
  const observer = globalThis.ResizeObserver;
  let resizeMain: ((width: number) => void) | undefined;
  globalThis.ResizeObserver = class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(element: Element) {
      if (element.id === "screen-main")
        resizeMain = (width) =>
          this.callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
    }
    unobserve() {}
    disconnect() {}
  };
  try {
    const user = userEvent.setup();
    render(<SalesPipeline />);
    await user.click(screen.getByRole("button", { name: "شركة مدار" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^إرسال/,
      }),
    );
    act(() => resizeMain!(500));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // The host's recording moment must expire without sending the hidden draft.
    await act(() => new Promise((resolve) => setTimeout(resolve, 800)));
    expect(screen.getByRole("tab", { name: "جديد ٢" })).toHaveFocus();
    await user.click(screen.getByRole("tab", { name: "عرض سعر ٢" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "شركة مدار" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("button", { name: /^إرسال/ })).toBeInTheDocument();
    expect(dialog.queryByText("أُرسلت الرسالة")).toBeNull();
  } finally {
    globalThis.ResizeObserver = observer;
  }
}, 15_000);

it("uses one initially empty live region for sending and sent transitions", async () => {
  const user = userEvent.setup();
  render(<SalesPipeline />);
  const regionCounts = new Set<number>();
  const live = () => {
    const regions = document.querySelectorAll(
      '[aria-live="polite"], [role="status"]',
    );
    regionCounts.add(regions.length);
    return document.querySelector(".sales-pipeline-announcement");
  };
  expect(live()).toBeEmptyDOMElement();
  await user.click(screen.getByRole("combobox", { name: "المسؤول" }));
  await user.click(screen.getByRole("option", { name: "ريم الكعبي" }));
  expect(live()).toBeEmptyDOMElement();
  await user.click(screen.getByRole("button", { name: "إزالة تصفية المسؤول" }));
  expect(live()).toBeEmptyDOMElement();
  await user.click(screen.getByRole("button", { name: "شركة مدار" }));
  expect(live()).toBeEmptyDOMElement();
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: /^إرسال/ }),
  );
  expect(live()).toHaveTextContent("تُرسَل رسالة متابعة شركة مدار");
  await waitFor(() =>
    expect(live()).toHaveTextContent("أُرسلت رسالة متابعة شركة مدار"),
  );
  await user.keyboard("{Escape}");
  expect(live()).toBeEmptyDOMElement();
  expect(regionCounts).toEqual(new Set([1]));
}, 15_000);

it("shows one stage at a time below 640px, and a move leaves focus on the next card, else the previous, else the tab", async () => {
  const observer = globalThis.ResizeObserver;
  // The frame reads main's width from its ResizeObserver: 500px is narrow.
  globalThis.ResizeObserver = class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback(
        [{ contentRect: { width: 500 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  };
  try {
    const user = userEvent.setup();
    render(<SalesPipeline />);
    // Tabs carry the counts; only the shown stage's cards are in the page.
    expect(screen.getByRole("tab", { name: "جديد ٢" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "تفاوض ٣" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "شركة مدار" })).toBeNull();
    expect(
      document.querySelector(".sales-pipeline-announcement"),
    ).toBeEmptyDOMElement();

    // Next: the first of two new deals moves, and focus goes to the second.
    await moveTo(user, "شركة تقنية الغد", "مؤهَّل");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "مؤسسة بوابة الشرق" }),
      ).toHaveFocus(),
    );
    expect(
      screen.getAllByText("نُقلت صفقة شركة تقنية الغد إلى مؤهَّل"),
    ).toHaveLength(1);
    // Tab: the last new deal moves, and focus goes to the stage's tab.
    await moveTo(user, "مؤسسة بوابة الشرق", "مؤهَّل");
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "جديد ٠" })).toHaveFocus(),
    );
    expect(
      screen.getAllByText("نُقلت صفقة مؤسسة بوابة الشرق إلى مؤهَّل"),
    ).toHaveLength(1);
    // Previous: the second of two quotes moves, and focus goes to the first.
    await user.click(screen.getByRole("tab", { name: "عرض سعر ٢" }));
    expect(
      document.querySelector(".sales-pipeline-announcement"),
    ).toHaveTextContent("نُقلت صفقة مؤسسة بوابة الشرق إلى مؤهَّل");
    await moveTo(user, "مستشفى النور الأهلي", "تفاوض");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "شركة مدار" })).toHaveFocus(),
    );
  } finally {
    globalThis.ResizeObserver = observer;
  }
}, 15_000);
