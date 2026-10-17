import { StrictMode } from "react";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import {
  StreamingDemo,
  StreamingTextExample,
} from "../system/ai/examples/AIContentExamples";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
it.each([
  ["كتلة الشيفرة", "CodeBlock"],
  ["ماركداون", "Markdown"],
  ["النص المتدفق", "StreamingText"],
] as const)(
  "keeps %s within AI patterns and copies portable examples and dependency guidance",
  async (ar, en) => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Examples" })).toBeVisible();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(document.querySelector(".code-example") as HTMLElement).getByRole(
        "button",
        { name: "Copy code" },
      ),
    );
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    const prompt = String(copy.mock.calls.at(-1)?.[0]);
    expect(prompt).toContain(code);
    expect(prompt).toContain("react-markdown@10.1.0");
    expect(prompt).toContain("remark-gfm@4.0.1");
  },
);
it("explicitly starts fixed chunks and invalidates replay/unmount callbacks", async () => {
  vi.useFakeTimers();
  const view = render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <StreamingDemo language="en" markdown />
    </SystemProvider>,
  );
  const content = () =>
    document.querySelector(".tz-stream-content")?.textContent;
  expect(vi.getTimerCount()).toBe(0);
  expect(content()).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Start local demo" }));
  await act(async () => vi.advanceTimersByTime(960));
  expect(content()).toContain("Tiraz");
  expect(screen.queryByRole("button", { name: "Cancel demo" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  await act(async () => vi.advanceTimersByTime(320));
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  expect(content()).toBe("");
  await act(async () => vi.advanceTimersByTime(320));
  expect(content()).toBe("Local summary");
  await act(async () => vi.advanceTimersByTime(4000));
  expect(
    document.querySelector(".tz-streaming-text > [role=status]"),
  ).toHaveTextContent("Local sample complete");
  expect(screen.getByRole("table")).toBeVisible();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("automatically streams the playground once, preserving replay and invalidating configuration changes", async () => {
  vi.useFakeTimers();
  const wrap = (language: "ar" | "en", markdown = false) => (
    <StrictMode>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        <StreamingTextExample language={language} markdown={markdown} />
      </SystemProvider>
    </StrictMode>
  );
  const view = render(wrap("en"));
  await act(async () => vi.advanceTimersByTime(0));
  expect(document.querySelector(".tz-streaming-text")).toHaveAttribute(
    "data-state",
    "streaming",
  );
  expect(
    screen.getByRole("button", { name: "Replay local demo" }),
  ).toBeVisible();
  await act(async () => vi.advanceTimersByTime(160));
  expect(document.querySelector(".tz-stream-content")).toHaveTextContent(
    "This",
  );
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  await act(async () => vi.advanceTimersByTime(4000));
  expect(
    document.querySelector(".tz-streaming-text > [role=status]"),
  ).toHaveTextContent("Local sample complete");
  expect(vi.getTimerCount()).toBe(0);
  view.rerender(wrap("ar", true));
  await act(async () => vi.advanceTimersByTime(320));
  expect(document.querySelector(".tz-stream-content")).toHaveTextContent(
    "ملخص محلي",
  );
  expect(document.querySelector(".tz-stream-content")).not.toHaveTextContent(
    "This",
  );
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("uses compact titled headers and named icon-only playback controls in both demos", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "النص المتدفق" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "لغة التوثيق" }),
    "en",
  );
  const playground = document.querySelector(
    ".playground-region",
  ) as HTMLElement;
  const example = document.querySelector(".examples-canvas") as HTMLElement;
  for (const [block, title] of [
    [playground, "Default"],
    [example, "Markdown"],
  ] as const) {
    const header = within(block).getByText(title).closest("header")!;
    expect(header).not.toBeNull();
    const controls = within(header).getAllByRole("button");
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      expect(control).toHaveAccessibleName();
      expect(control.textContent).toBe("");
      expect(control.querySelector("svg")).not.toBeNull();
    }
  }
  const play = within(example).getByRole("button", {
    name: "Replay local demo",
  });
  play.focus();
  await user.keyboard("{Enter}");
  expect(play).toHaveAccessibleName("Replay local demo");
  expect(play).toHaveFocus();
  expect(
    within(example).getByRole("button", { name: "Copy example prompt" }),
  ).toBeVisible();
  expect(
    within(example).queryByRole("button", { name: "Cancel demo" }),
  ).toBeNull();
});

it("automatically runs both documentation demos without local footer or empty event scaffolding", async () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.click(screen.getByRole("button", { name: "النص المتدفق" }));
  await act(async () => vi.advanceTimersByTime(0));
  const demos = document.querySelectorAll(".tz-stream-demo");
  expect(demos).toHaveLength(2);
  for (const demo of demos)
    expect(demo.querySelector(".tz-streaming-text")).toHaveAttribute(
      "data-state",
      "streaming",
    );
  expect(document.querySelector(".tz-stream-demo-note")).toBeNull();
  expect(
    screen.queryByText("عرض محلي بقطع ثابتة؛ دون طلب شبكة أو ذكاء اصطناعي."),
  ).toBeNull();
  expect(screen.queryByRole("status", { name: "آخر حدث" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "الأزرار" }));
  expect(screen.queryByRole("status", { name: "آخر حدث" })).toBeNull();
});
it("keeps an empty announcement owner mounted before the first real action, without placeholder text", () => {
  render(<Workbench />);
  const region = document.querySelector(
    '.playground-section > [role="status"]',
  );
  expect(region).not.toBeNull();
  expect(region).toBeEmptyDOMElement();
  expect(region).toHaveClass("tz-visually-hidden");
  fireEvent.click(
    within(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    ).getByRole("button"),
  );
  expect(document.querySelector('.playground-section > [role="status"]')).toBe(
    region,
  );
  expect(region).toHaveAccessibleName("آخر حدث");
  expect(region).not.toHaveClass("tz-visually-hidden");
  expect(region).not.toBeEmptyDOMElement();
});
