import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Avatar,
  Button,
  ChatComposer,
  ContextMeter,
  SystemProvider,
  TagInput,
  TaskRows,
  Tabs,
  ToastProvider,
  Tooltip,
  defaultConfig,
  useToast,
} from "./index";
import type { SystemConfig } from "./config";
import type { TaskState } from "./TaskRows";
import { Tick } from "./Tick";
import { useGlide } from "./useGlide";

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
  it("gives the pile its gap from the one TOAST_GAP the geometry uses", async () => {
    wrap(
      <ToastProvider closeLabel="إغلاق" label="التنبيهات">
        <Demo />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "إرسال" }));
    const viewport = screen
      .getByText("تنبيه 1")
      .closest<HTMLElement>(".tz-toast-viewport")!;
    expect(viewport.style.getPropertyValue("--toast-gap")).toBe("8px");
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

describe("gliding highlight", () => {
  function List() {
    const glide = useGlide();
    return (
      <div ref={glide} data-testid="list">
        <div data-testid="copy">نسخ</div>
        <div data-testid="delete" data-destructive="">
          حذف
        </div>
      </div>
    );
  }
  it("follows the highlighted row and takes a destructive row's tone", async () => {
    render(<List />);
    const list = screen.getByTestId("list");
    expect(list).toHaveAttribute("data-glide");
    expect(list.style.getPropertyValue("--glide-opacity")).toBe("0");
    await act(async () => {
      screen.getByTestId("copy").setAttribute("data-highlighted", "");
    });
    expect(list.style.getPropertyValue("--glide-opacity")).toBe("1");
    expect(list).not.toHaveAttribute("data-glide-tone");
    await act(async () => {
      screen.getByTestId("copy").removeAttribute("data-highlighted");
      screen.getByTestId("delete").setAttribute("data-highlighted", "");
    });
    expect(list).toHaveAttribute("data-glide-tone", "danger");
    await act(async () => {
      screen.getByTestId("delete").removeAttribute("data-highlighted");
    });
    expect(list.style.getPropertyValue("--glide-opacity")).toBe("0");
  });
});

describe("live values", () => {
  it("rolls a count in from the direction it moved, never on first render", () => {
    const { container, rerender } = render(<Tick value={3} />);
    const tick = () => container.querySelector(".tz-tick")!;
    expect(tick()).not.toHaveAttribute("data-changed");
    rerender(<Tick value={5} />);
    expect(tick()).toHaveAttribute("data-changed");
    expect(tick()).toHaveAttribute("data-dir", "up");
    rerender(<Tick value={2} />);
    expect(tick()).toHaveAttribute("data-dir", "down");
    expect(tick()).toHaveTextContent("2");
  });

  it("swaps a task's state badge with motion only after the state changes", () => {
    const task = (state: TaskState) => (
      <SystemProvider config={defaultConfig}>
        <TaskRows
          label="المهام"
          items={[{ id: "a", title: "قراءة العقود", state, content: null }]}
        />
      </SystemProvider>
    );
    const { container, rerender } = render(task("running"));
    const badge = () => container.querySelector(".tz-agent-task-state")!;
    expect(badge()).not.toHaveAttribute("data-changed");
    rerender(task("completed"));
    expect(badge()).toHaveAttribute("data-changed");
  });
});

describe("arrivals", () => {
  it("pops in only tags added after mount", async () => {
    const user = userEvent.setup();
    const { container } = wrap(
      <TagInput label="الوسوم" defaultValue={["تصميم"]} />,
    );
    await user.type(screen.getByRole("textbox"), "عاجل{Enter}");
    const tags = Array.from(container.querySelectorAll(".tz-tag"));
    expect(tags.map((tag) => tag.hasAttribute("data-fresh"))).toEqual([
      false,
      true,
    ]);
  });

  it("morphs send into stop only once streaming starts", () => {
    const entry = (state: "idle" | "streaming") => (
      <SystemProvider config={defaultConfig}>
        <ChatComposer
          value="مرحبا"
          onValueChange={() => {}}
          onSubmit={() => {}}
          onStop={() => {}}
          state={state}
        />
      </SystemProvider>
    );
    const { rerender } = render(entry("idle"));
    expect(screen.getByRole("button")).not.toHaveAttribute("data-morph");
    rerender(entry("streaming"));
    expect(screen.getByRole("button")).toHaveAttribute("data-morph");
  });
});
