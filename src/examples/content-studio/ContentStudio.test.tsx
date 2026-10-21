import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ContentStudio } from "./ContentStudio";

// The generation and the assistant's answer run on the host's moments, so
// these tests move a fake clock. It also ticks with real time, which Testing
// Library's waits need to settle.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());
/** Moves the clock in steps, each in its own act: a beat re-arms the next one. */
async function pass(ms: number) {
  for (let left = ms; left > 0; left -= 100)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(Math.min(100, left));
    });
}
function setup() {
  render(<ContentStudio />);
  return userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
    delay: null,
  });
}
const canvas = () => screen.getByRole("region", { name: "توليد صورة" });
/** Runs the host's moments one after another until the canvas is `status`. */
async function until(status: string) {
  for (
    let beat = 0;
    beat < 100 && canvas().getAttribute("data-status") !== status;
    beat += 1
  )
    await act(async () => {
      await vi.advanceTimersToNextTimerAsync();
    });
  expect(canvas()).toHaveAttribute("data-status", status);
}
const versions = () =>
  within(
    within(canvas()).getByRole("radiogroup", { name: "اختر نسخة" }),
  ).getAllByRole("radio");
const generate = () =>
  screen.getByRole("button", { name: "ولّد ٤ صور · نحو ١٢ ثانية" });

it("weaves four versions and puts the one used above the caption", async () => {
  const user = setup();
  // It starts on four finished versions, and no caption until one is used.
  expect(canvas()).toHaveAttribute("data-status", "completed");
  expect(versions()).toHaveLength(4);
  expect(
    versions().every((radio) => !(radio as HTMLInputElement).disabled),
  ).toBe(true);
  expect(screen.queryByRole("heading", { name: "النص المرافق" })).toBeNull();

  // Generate goes through queued and weaving, the button loading and the
  // versions waiting; the progress climbs by 20.
  await user.click(generate());
  expect(canvas()).toHaveAttribute("data-status", "queued");
  expect(generate()).toHaveAttribute("aria-busy", "true");
  await pass(700);
  expect(canvas()).toHaveAttribute("data-status", "weaving");
  expect(
    versions().every((radio) => (radio as HTMLInputElement).disabled),
  ).toBe(true);
  await pass(1400);
  const progress = Number(
    within(canvas()).getByRole("progressbar").getAttribute("aria-valuenow"),
  );
  expect(progress).toBeGreaterThanOrEqual(20);
  expect(progress % 20).toBe(0);
  await until("completed");
  expect(generate()).not.toHaveAttribute("aria-busy");
  expect(
    versions().every((radio) => !(radio as HTMLInputElement).disabled),
  ).toBe(true);

  // Using the third version brings the caption, with the version above it.
  await user.click(screen.getByRole("radio", { name: "النسخة ٣" }));
  await user.click(screen.getByRole("button", { name: "استخدم الصورة" }));
  const caption = screen.getByRole("heading", {
    level: 2,
    name: "النص المرافق",
  }).parentElement!;
  expect(caption).toHaveTextContent("مختارة للحملة · النسخة ٣");
  expect(document.body).toHaveTextContent("مختارة للحملة · النسخة ٣");
  expect(
    screen.getByRole("region", { name: "النص المرافق" }),
  ).toHaveTextContent("أهلًا بكم! حبّينا نذكّركم");
});

it("polishes the caption: the selection opens the review, and Accept all then Apply replaces it", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "استخدم الصورة" }));
  const text = screen
    .getByRole("region", { name: "النص المرافق" })
    .querySelector("p")!.firstChild!;
  act(() => {
    window
      .getSelection()!
      .setBaseAndExtent(text, 0, text, text.textContent!.length);
    fireEvent(document, new Event("selectionchange"));
  });
  const shorter = (await screen.findByText("أقصر")).closest("button")!;
  expect(screen.getByText("أكثر رسمية")).toBeInTheDocument();
  fireEvent.pointerDown(shorter);
  fireEvent.click(shorter);

  // The assistant takes a moment, then the review opens on three changes.
  expect(screen.queryByRole("dialog")).toBeNull();
  await pass(1600);
  const review = screen.getByRole("dialog", { name: /اجعله أقصر/ });
  expect(within(review).getAllByRole("group")).toHaveLength(3);
  await user.click(within(review).getByRole("button", { name: "قبول الكل" }));
  await user.click(within(review).getByRole("button", { name: "تطبيق" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(
    screen.getByRole("region", { name: "النص المرافق" }),
  ).toHaveTextContent(
    "أهلًا بكم! موعد سداد فاتورتكم قد حان، ونرجو التكرّم بتحويل المبلغ في أقرب وقت. شكرًا لتعاونكم.",
  );
  // Undo brings the words back.
  await user.click(screen.getByRole("button", { name: "تراجع" }));
  expect(
    screen.getByRole("region", { name: "النص المرافق" }),
  ).toHaveTextContent("حبّينا نذكّركم بأن موعد سداد فاتورتكم");
});

it("makes the brief the only input: the canvas follows it only once Generate is pressed", async () => {
  const user = setup();
  const prompt = "بطاقة تذكير بتقويم وجرس";
  const field = screen.getByRole("textbox", { name: "وصف الصورة" });
  await user.clear(field);
  await user.type(field, prompt);
  await user.type(
    screen.getByRole("textbox", { name: "وسوم الأسلوب" }),
    "عاجل{Enter}",
  );
  await user.click(screen.getByRole("radio", { name: "عمودي" }));
  // Until then the canvas keeps what its versions were made from.
  expect(canvas()).not.toHaveTextContent(prompt);
  expect(canvas()).toHaveTextContent("١٥٣٦×١٠٢٤");

  await user.click(generate());
  await until("completed");
  expect(canvas()).toHaveTextContent(prompt);
  expect(
    within(canvas()).getByRole("list", { name: "خيارات التوليد" }),
  ).toHaveTextContent("عمودي · ٢:٣");
  expect(
    within(canvas()).getByRole("list", { name: "خيارات التوليد" }),
  ).toHaveTextContent("عاجل");
  expect(canvas()).toHaveTextContent("١٠٢٤×١٥٣٦");
  // English says the same things, with Western digits.
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("button", {
      name: "Generate 4 images · about 12 seconds",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Image generation" }),
  ).toHaveTextContent("Portrait · 2:3");
});

it("puts the brief above the canvas below 960 px", () => {
  const wide = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    report: ResizeObserverCallback;
    constructor(report: ResizeObserverCallback) {
      this.report = report;
    }
    observe() {
      this.report(
        [{ contentRect: { width: 700, height: 0 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  };
  try {
    setup();
    const brief = screen.getByRole("heading", { level: 2, name: "الموجز" });
    expect(
      brief.compareDocumentPosition(
        screen.getByRole("heading", { level: 2, name: "توليد صورة" }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  } finally {
    globalThis.ResizeObserver = wide;
  }
});

it("keeps Generate focused and inert while the new images weave", async () => {
  const user = setup();
  await user.click(generate());
  expect(generate()).toHaveFocus();
  expect(generate()).toHaveAttribute("aria-disabled", "true");
  await pass(700);
  await user.click(generate());
  expect(canvas()).toHaveAttribute("data-status", "weaving");
  expect(generate()).toHaveFocus();
  await until("completed");
  expect(generate()).toHaveFocus();
});

it("announces host transitions once and never speaks progress", async () => {
  const user = setup();
  expect(
    document.querySelectorAll('[role="status"], [aria-live="polite"]'),
  ).toHaveLength(1);
  const live = document.querySelector(".content-studio > span[role='status']")!;
  expect(live).toBeEmptyDOMElement();
  await user.click(generate());
  expect(live).toHaveTextContent("أُضيف طلب توليد الصور إلى الانتظار.");
  await pass(700);
  expect(live).toHaveTextContent("بدأ توليد الصور.");
  const changes: string[] = [];
  const observer = new MutationObserver(() => changes.push(live.textContent!));
  observer.observe(live, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  await pass(700);
  expect(changes).toEqual([]);
  await until("completed");
  expect(live).toHaveTextContent("الصور جاهزة للاختيار.");
  observer.disconnect();
});

it("dismisses a pending caption rewrite without applying it or reopening review", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "استخدم الصورة" }));
  const scope = screen.getByRole("region", { name: "النص المرافق" });
  const text = scope.querySelector("p")!.firstChild!;
  act(() => {
    window
      .getSelection()!
      .setBaseAndExtent(text, 0, text, text.textContent!.length);
    fireEvent(document, new Event("selectionchange"));
  });
  const shorter = (await screen.findByText("أقصر")).closest("button")!;
  fireEvent.pointerDown(shorter);
  fireEvent.click(shorter);
  scope.focus();
  await user.keyboard("{Escape}");
  await pass(1700);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(scope).toHaveTextContent("حبّينا نذكّركم بأن موعد سداد فاتورتكم");
  expect(scope).toHaveFocus();
});

it("clears host work when leaving during generation", async () => {
  const view = render(<ContentStudio />);
  fireEvent.click(generate());
  await pass(700);
  expect(canvas()).toHaveAttribute("data-status", "weaving");
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
  await pass(3000);
  expect(document.querySelector(".content-studio")).toBeNull();
});

it("aborts the caption request when leaving the screen", async () => {
  const view = render(<ContentStudio />);
  fireEvent.click(screen.getByRole("button", { name: "استخدم الصورة" }));
  const text = screen
    .getByRole("region", { name: "النص المرافق" })
    .querySelector("p")!.firstChild!;
  act(() => {
    window
      .getSelection()!
      .setBaseAndExtent(text, 0, text, text.textContent!.length);
    fireEvent(document, new Event("selectionchange"));
  });
  const shorter = (await screen.findByText("أقصر")).closest("button")!;
  fireEvent.pointerDown(shorter);
  fireEvent.click(shorter);
  expect(document.querySelector(".tz-suggested-edits")).toHaveAttribute(
    "data-status",
    "rewriting",
  );
  view.unmount();
  // Let Popper’s already scheduled geometry frame finish. A leaked host
  // request would still be waiting for its longer answer delay.
  await pass(100);
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps the initial English prompt while controls follow the page language", async () => {
  const user = setup();
  expect(screen.getByRole("textbox", { name: "وصف الصورة" })).toHaveValue(
    "A friendly reminder card for an invoice due date: a calendar, a crescent and a geometric pattern, in calm colors",
  );
  expect(canvas()).toHaveTextContent(
    "A friendly reminder card for an invoice due date:",
  );
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("textbox", { name: "Describe the image" }),
  ).toHaveValue(
    "A friendly reminder card for an invoice due date: a calendar, a crescent and a geometric pattern, in calm colors",
  );
});
