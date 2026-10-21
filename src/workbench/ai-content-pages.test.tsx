import { StrictMode } from "react";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import {
  CodeBlockExample,
  MarkdownExample,
  StreamingDemo,
  StreamingTextExample,
} from "../system/ai/examples/AIContentExamples";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
it.each([
  // Content blocks moved to Display; StreamingText is one of the AI parts.
  ["كتلة الكود", "CodeBlock", "العرض والتنبيهات"],
  ["ماركداون", "Markdown", "العرض والتنبيهات"],
  ["النص المتتابع", "StreamingText", "الأجزاء"],
] as const)(
  "keeps %s in its group and copies portable examples and dependency guidance",
  async (ar, en, group) => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.click(screen.getByRole("button", { name: "الأجزاء" }));
    await user.click(
      within(screen.getByRole("group", { name: group })).getByRole("button", {
        name: ar,
      }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    for (const name of ["Examples", "Usage example"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    // Code blocks in the preview have their own Copy code; use the frame's,
    // in its Code view's header.
    await user.click(
      within(screen.getByRole("tablist", { name: "View" })).getByRole("tab", {
        name: "Code",
      }),
    );
    await user.click(
      within(
        document.querySelector(
          ".playground-region .tz-demo-source",
        ) as HTMLElement,
      ).getByRole("button", { name: "Copy code" }),
    );
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    // The code renders only what the preview shows.
    expect(code).not.toContain("markdown autoStart/>");
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
  expect(content()).toContain("214 invoices");
  expect(screen.queryByRole("button", { name: "Cancel demo" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  await act(async () => vi.advanceTimersByTime(320));
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  expect(content()).toBe("");
  await act(async () => vi.advanceTimersByTime(320));
  expect(content()).toBe("Reconciliation summary");
  await act(async () => vi.advanceTimersByTime(4000));
  expect(
    document.querySelector(".tz-streaming-text > [role=status]"),
  ).toHaveTextContent("Response complete");
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
    "October",
  );
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  await act(async () => vi.advanceTimersByTime(4000));
  expect(
    document.querySelector(".tz-streaming-text > [role=status]"),
  ).toHaveTextContent("Response complete");
  expect(vi.getTimerCount()).toBe(0);
  view.rerender(wrap("ar", true));
  await act(async () => vi.advanceTimersByTime(320));
  expect(document.querySelector(".tz-stream-content")).toHaveTextContent(
    "ملخص المطابقة",
  );
  expect(document.querySelector(".tz-stream-content")).not.toHaveTextContent(
    "October",
  );
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("shows the complete response at once under reduced motion, including on replay", async () => {
  vi.useFakeTimers();
  render(
    <SystemProvider
      config={{ ...defaultConfig, direction: "ltr", reducedMotion: true }}
    >
      <StreamingDemo language="en" markdown autoStart />
    </SystemProvider>,
  );
  await act(async () => vi.advanceTimersByTime(0));
  expect(document.querySelector(".tz-streaming-text")).toHaveAttribute(
    "data-state",
    "completed",
  );
  expect(screen.getByRole("table")).toBeVisible();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Replay local demo" }));
  expect(screen.getByRole("table")).toBeVisible();
  expect(vi.getTimerCount()).toBe(0);
});
it.each(["ar", "en"] as const)(
  "renders %s content examples as product content only",
  async (language) => {
    vi.useFakeTimers();
    const view = render(
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        {["ts", "python", "json", "text", "unsupported"].map((code) => (
          <CodeBlockExample
            key={code}
            language={language}
            codeLanguage={code}
            longContent
          />
        ))}
        <MarkdownExample language={language} longContent />
        <StreamingDemo language={language} markdown autoStart />
        <StreamingTextExample language={language} />
      </SystemProvider>,
    );
    await act(async () => vi.advanceTimersByTime(4000));
    expect(view.container).not.toHaveTextContent(
      /\b(sample|example|local|demo|simulat\w*|fictional|scripted|greet)\b|تجريبي|عينة|محلي|نموذجي|محاكاة/i,
    );
  },
);

it("uses the page's frame for the streaming demo: view tabs above, an icon Replay in the stage and an icon Copy in the code's header", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "الأجزاء" }));
  await user.click(screen.getByRole("button", { name: "النص المتتابع" }));
  await user.click(screen.getByRole("button", { name: "English" }));
  const playground = document.querySelector(
    ".playground-region",
  ) as HTMLElement;
  expect(document.querySelector(".examples-canvas")).toBeNull();
  // No title beside the view switch: the page's h1 names the example.
  expect(within(playground).queryByText("Default")).toBeNull();
  const views = within(playground).getByRole("tablist", { name: "View" });
  expect(
    within(views)
      .getAllByRole("tab")
      .map((tab) => tab.textContent),
  ).toEqual(["Preview", "Code"]);
  // Replay and Copy are icons alone, each with a name and a tooltip.
  const play = within(playground).getByRole("button", {
    name: "Replay example",
  });
  expect(play.textContent).toBe("");
  expect(play).toHaveAttribute("title", "Replay example");
  expect(play.querySelector("svg")).not.toBeNull();
  play.focus();
  await user.keyboard("{Enter}");
  expect(play).toHaveFocus();
  expect(
    within(playground).queryByRole("button", { name: "Cancel demo" }),
  ).toBeNull();
  await user.click(within(views).getByRole("tab", { name: "Code" }));
  const copy = within(playground).getByRole("button", { name: "Copy code" });
  expect(copy.textContent).toBe("");
  expect(copy).toHaveAttribute("title", "Copy code");
  expect(copy.querySelector("svg")).not.toBeNull();
});

it("opens the documentation demo complete, without autoplay, local footer or empty event scaffolding", async () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.click(screen.getByRole("button", { name: "الأجزاء" }));
  fireEvent.click(screen.getByRole("button", { name: "النص المتتابع" }));
  await act(async () => vi.advanceTimersByTime(0));
  expect(screen.queryByRole("heading", { name: "أمثلة", level: 2 })).toBeNull();
  // The page rests on Done; nothing streams until Replay.
  const texts = document.querySelectorAll(
    ".playground-region .tz-streaming-text",
  );
  expect(texts).toHaveLength(1);
  expect(texts[0]).toHaveAttribute("data-state", "completed");
  expect(texts[0]).toHaveTextContent("INV-1043");
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
  // Announced to assistive tech; the stage itself stays visually clean.
  expect(region).toHaveClass("tz-visually-hidden");
  expect(region).not.toBeEmptyDOMElement();
});
