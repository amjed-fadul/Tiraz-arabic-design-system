import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Avatar,
  Button,
  ContextMeter,
  SystemProvider,
  Tabs,
  ToastProvider,
  Tooltip,
  defaultConfig,
  useToast,
} from "./index";
import type { SystemConfig } from "./config";

function wrap(children: ReactNode, config: Partial<SystemConfig> = {}) {
  return render(
    <SystemProvider config={{ ...defaultConfig, ...config }}>
      {children}
    </SystemProvider>,
  );
}

describe("Arabic initials", () => {
  it("keeps Arabic initials apart and skips a family name's article", () => {
    wrap(
      <>
        <Avatar name="سارة العتيبي" />
        <Avatar name="Sara Ali" />
      </>,
    );
    const [arabic, latin] = screen.getAllByRole("img");
    expect(arabic).toHaveTextContent("س‌ع");
    expect(latin).toHaveTextContent("SA");
  });
});

describe("state-driven motion", () => {
  it("animates a Button label only after its state first changes", () => {
    const { container, rerender } = wrap(<Button>حفظ</Button>);
    const label = () => container.querySelector(".tz-button-label")!;
    expect(label()).not.toHaveAttribute("data-changed");
    rerender(
      <SystemProvider config={defaultConfig}>
        <Button state="loading">حفظ</Button>
      </SystemProvider>,
    );
    expect(label()).toHaveAttribute("data-changed");
    rerender(
      <SystemProvider config={defaultConfig}>
        <Button>حفظ</Button>
      </SystemProvider>,
    );
    expect(label()).toHaveAttribute("data-changed");
  });

  it("animates Tabs panels only after the first switch", async () => {
    const { container } = wrap(
      <Tabs
        label="الفترة"
        items={[
          { value: "week", label: "أسبوع", content: "أسبوعي" },
          { value: "month", label: "شهر", content: "شهري" },
        ]}
      />,
    );
    const root = container.querySelector(".tz-tabs")!;
    expect(root).not.toHaveAttribute("data-changed");
    await userEvent.click(screen.getByRole("tab", { name: "شهر" }));
    expect(root).toHaveAttribute("data-changed");
  });
});

describe("Toast pile", () => {
  function Demo() {
    const { toast } = useToast();
    const [count, setCount] = useState(0);
    return (
      <Button
        onClick={() => {
          setCount(count + 1);
          toast({ title: `تنبيه ${count + 1}` });
        }}
      >
        إرسال
      </Button>
    );
  }
  it("puts the newest toast in front and steps older ones back", async () => {
    wrap(
      <ToastProvider closeLabel="إغلاق" label="التنبيهات">
        <Demo />
      </ToastProvider>,
    );
    const send = screen.getByRole("button", { name: "إرسال" });
    for (let i = 0; i < 3; i++) await userEvent.click(send);
    const depth = (title: string) =>
      screen.getByText(title).closest(".tz-toast")!.getAttribute("data-depth");
    expect(depth("تنبيه 3")).toBe("0");
    expect(depth("تنبيه 2")).toBe("1");
    expect(depth("تنبيه 1")).toBe("2");
  });
});

describe("Tooltip group", () => {
  it("opens a neighbouring tooltip at once while one is showing", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      wrap(
        <>
          <Tooltip
            content="أول"
            delayDuration={300}
            trigger={<button>واحد</button>}
          />
          <Tooltip
            content="ثانٍ"
            delayDuration={300}
            trigger={<button>اثنان</button>}
          />
        </>,
      );
      const [first, second] = screen.getAllByRole("button");
      fireEvent.pointerEnter(first, { pointerType: "mouse" });
      expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
        "أول",
      );
      fireEvent.pointerLeave(first, { pointerType: "mouse" });
      fireEvent.pointerEnter(second, { pointerType: "mouse" });
      const warm = screen
        .getAllByRole("tooltip", { hidden: true })
        .find((tip) => tip.textContent === "ثانٍ");
      expect(warm).toBeDefined();
      expect(warm).toHaveAttribute("data-instant");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Arabic numerals", () => {
  it("formats ContextMeter usage with the system's Arabic digits", () => {
    wrap(<ContextMeter used={64} capacity={100} />, { direction: "rtl" });
    expect(screen.getByRole("button")).toHaveAccessibleName(/٦٤٪/);
  });
});
