import { useRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DecisionBar } from "./DecisionBar";
import { formatCount, formatElapsed, nounGender } from "./format";
import {
  AIMark,
  Countdown,
  StatusPill,
  SystemProvider,
  ThinkingIndicator,
  ThinkingState,
  defaultConfig,
} from "./index";
import type { StatusPillState } from "./index";

afterEach(() => vi.useRealTimers());

const ar = { direction: "rtl" as const },
  en = { direction: "ltr" as const };

it("agrees Arabic counts across the six plural categories and by gender", () => {
  expect(
    [0, 1, 2, 3, 10, 11, 99, 100].map((n) => formatCount(n, "source", ar)),
  ).toEqual([
    "لا مصادر",
    "مصدر واحد",
    "مصدران",
    "٣ مصادر",
    "١٠ مصادر",
    "١١ مصدرًا",
    "٩٩ مصدرًا",
    "١٠٠ مصدر",
  ]);
  expect([1, 2, 3, 11].map((n) => formatCount(n, "message", ar))).toEqual([
    "رسالة واحدة",
    "رسالتان",
    "٣ رسائل",
    "١١ رسالة",
  ]);
  expect(formatCount(3, "source", { ...ar, numerals: "latn" })).toBe("3 مصادر");
  expect(formatCount(1, "source", en)).toBe("1 source");
  expect(formatCount(3, "source", en)).toBe("3 sources");
  expect(nounGender("message")).toBe("f");
  expect(nounGender("source")).toBe("m");
});

it("formats elapsed time in Arabic and English", () => {
  expect(formatElapsed(6, ar)).toBe("٦ث");
  expect(formatElapsed(6, en)).toBe("6s");
  expect(formatElapsed(6.2, ar, { fractionDigits: 1 })).toBe("٦٫٢ث");
  expect(formatElapsed(6.2, en, { fractionDigits: 1 })).toBe("6.2s");
  expect(formatElapsed(72, ar)).toBe("١د ١٢ث");
  expect(formatElapsed(72, en)).toBe("1m 12s");
  expect(formatElapsed(220, ar)).toBe("٣د ٤٠ث");
  expect(formatElapsed(120, ar)).toBe("٢د");
  expect(formatElapsed(3720, ar)).toBe("١س ٢د");
  expect(formatElapsed(3720, en)).toBe("1h 2m");
  expect(formatElapsed(-3, ar)).toBe("٠ث");
  expect(formatElapsed(NaN, ar)).toBe("");
});

it("names each pill state in words and pings only on a change to needs-you", () => {
  const states: StatusPillState[] = [
    "idle",
    "running",
    "needs-you",
    "completed",
    "failed",
    "stopped",
  ];
  const words = {
    rtl: ["جاهز", "يعمل", "بانتظارك", "اكتمل", "تعثّر", "أُوقف"],
    ltr: ["Ready", "Working", "Needs you", "Done", "Failed", "Stopped"],
  };
  for (const direction of ["rtl", "ltr"] as const)
    states.forEach((state, index) => {
      const view = render(
        <SystemProvider config={{ ...defaultConfig, direction }}>
          <StatusPill state={state} />
        </SystemProvider>,
      );
      expect(screen.getByText(words[direction][index])).toBeInTheDocument();
      view.unmount();
    });

  const labelled = render(
    <StatusPill state="completed" label="اكتملت" elapsed={72} />,
  );
  expect(screen.getByText("اكتملت")).toBeInTheDocument();
  expect(screen.queryByText("اكتمل")).toBeNull();
  expect(screen.getByText("١د ١٢ث")).toBeInTheDocument();
  labelled.unmount();

  const waiting = render(<StatusPill state="needs-you" />);
  expect(
    waiting.container.querySelector(".tz-status-pill"),
  ).not.toHaveAttribute("data-changed");
  waiting.unmount();
  const view = render(<StatusPill state="running" />);
  view.rerender(<StatusPill state="needs-you" />);
  expect(view.container.querySelector(".tz-status-pill")).toHaveAttribute(
    "data-changed",
  );
});

it("hides the AI mark unless it is named", () => {
  const view = render(<AIMark />);
  expect(view.container.querySelector(".tz-ai-mark")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  view.rerender(<AIMark label="المساعد" />);
  expect(screen.getByRole("img", { name: "المساعد" })).toHaveClass(
    "tz-ai-mark",
  );
  view.unmount();
  const state = render(
    <ThinkingState label="مطابقة المبالغ" active>
      <p>قراءة الفواتير</p>
    </ThinkingState>,
  );
  expect(state.container.querySelector(".tz-ai-mark")).not.toBeNull();
  state.unmount();
  const indicator = render(<ThinkingIndicator label="مطابقة المبالغ" />);
  expect(indicator.container.querySelector(".tz-ai-mark")).not.toBeNull();
});

it("runs a Mod+Enter action once, only from inside its scope, never on repeat or within 500 ms of a change", () => {
  vi.useFakeTimers();
  const approve = vi.fn();
  function Request({
    contentKey,
    loading,
    disabled,
  }: {
    contentKey: string;
    loading?: boolean;
    disabled?: boolean;
  }) {
    const scope = useRef<HTMLElement>(null);
    return (
      <>
        <section ref={scope} aria-label="طلب موافقة">
          <input aria-label="ملاحظة" />
          <div role="menu" aria-label="خيارات">
            <div role="menuitem" tabIndex={-1}>
              نسخ
            </div>
          </div>
          <DecisionBar
            scope={scope}
            contentKey={contentKey}
            actions={[
              {
                id: "approve",
                label: "موافقة",
                tone: "primary",
                shortcut: "Mod+Enter",
                loading,
                disabled,
                onSelect: approve,
              },
            ]}
          />
        </section>
        <button type="button">خارج النطاق</button>
      </>
    );
  }
  const view = render(<Request contentKey="a" />);
  const note = screen.getByRole("textbox", { name: "ملاحظة" });
  note.focus();
  act(() => vi.advanceTimersByTime(500));
  fireEvent.keyDown(note, { key: "Enter", ctrlKey: true });
  expect(approve).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(note, { key: "Enter", metaKey: true });
  expect(approve).toHaveBeenCalledTimes(2);
  fireEvent.keyDown(note, { key: "Enter", ctrlKey: true, repeat: true });
  expect(approve).toHaveBeenCalledTimes(2);

  view.rerender(<Request contentKey="b" />);
  fireEvent.keyDown(note, { key: "Enter", ctrlKey: true });
  expect(approve).toHaveBeenCalledTimes(2);
  act(() => vi.advanceTimersByTime(500));
  fireEvent.keyDown(note, { key: "Enter", ctrlKey: true });
  expect(approve).toHaveBeenCalledTimes(3);

  view.rerender(<Request contentKey="b" loading />);
  fireEvent.keyDown(note, { key: "Enter", ctrlKey: true });
  view.rerender(<Request contentKey="b" disabled />);
  fireEvent.keyDown(note, { key: "Enter", ctrlKey: true });
  expect(approve).toHaveBeenCalledTimes(3);

  view.rerender(<Request contentKey="b" />);
  fireEvent.keyDown(screen.getByRole("button", { name: "خارج النطاق" }), {
    key: "Enter",
    ctrlKey: true,
  });
  fireEvent.keyDown(screen.getByRole("menuitem", { name: "نسخ" }), {
    key: "Enter",
    ctrlKey: true,
  });
  expect(approve).toHaveBeenCalledTimes(3);
});

it("shows key hints only on real shortcuts, in the accessible description, primary last", () => {
  function Request() {
    const scope = useRef<HTMLElement>(null);
    return (
      <section ref={scope} aria-label="طلب موافقة">
        <DecisionBar
          scope={scope}
          actions={[
            {
              id: "approve",
              label: "موافقة",
              tone: "primary",
              shortcut: "Mod+Enter",
              onSelect: () => {},
            },
            {
              id: "reject",
              label: "رفض",
              shortcut: "Escape",
              onSelect: () => {},
            },
            { id: "messages", label: "عرض الرسائل", onSelect: () => {} },
          ]}
        />
      </section>
    );
  }
  render(<Request />);
  const reject = screen.getByRole("button", { name: "رفض" });
  expect(reject).toHaveAccessibleDescription("اختصار لوحة المفاتيح: Esc");
  expect(reject.querySelector("kbd")).toHaveAttribute("aria-hidden", "true");
  const messages = screen.getByRole("button", { name: "عرض الرسائل" });
  expect(messages.querySelector("kbd")).toBeNull();
  expect(messages).not.toHaveAccessibleDescription();
  expect(screen.getAllByRole("button").at(-1)).toHaveAccessibleName("موافقة");
});

it("counts down, pauses and announces only once", () => {
  vi.useFakeTimers();
  const onComplete = vi.fn(),
    label = (time: string) => `تبدأ تلقائيًا خلال ${time}`;
  const view = render(
    <Countdown seconds={5} label={label} onComplete={onComplete} />,
  );
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("تبدأ تلقائيًا خلال ٥ث");
  act(() => vi.advanceTimersByTime(2000));
  expect(status).toHaveTextContent("تبدأ تلقائيًا خلال ٥ث");
  view.rerender(
    <Countdown seconds={5} label={label} onComplete={onComplete} paused />,
  );
  act(() => vi.advanceTimersByTime(10000));
  expect(onComplete).not.toHaveBeenCalled();
  view.rerender(
    <Countdown seconds={5} label={label} onComplete={onComplete} />,
  );
  act(() => vi.advanceTimersByTime(3000));
  expect(onComplete).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("holds the countdown's width with its widest value, not its start", () => {
  const { container } = render(
    <Countdown seconds={60} onComplete={() => {}} />,
  );
  // A 60 s start reads «خلال ١د», but at 59 s it reads «خلال ٥٩ث».
  const copy = container.querySelector(".tz-countdown-label > span");
  expect(copy?.textContent).toBe("خلال ٣د ٣٣ث");
});
