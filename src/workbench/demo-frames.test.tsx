import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { canReplayPlayground } from "./demo-capabilities";
import { defaultPlaygrounds } from "./model";
import {
  DemoFrame,
  type DemoFrameState,
} from "../system/ai/examples/DemoFrame";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
const source = 'import { Button } from "./system";\n  <Button />\n';
const stateList: DemoFrameState[] = [
  { id: "a", label: { ar: "فارغ", en: "Empty" } },
  { id: "b", label: { ar: "تحميل", en: "Loading" } },
  { id: "c", label: { ar: "تم", en: "Done" } },
];
function Draft() {
  const [value, setValue] = useState("");
  return (
    <input
      aria-label="Draft"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
    />
  );
}
it("gives static previews a matching frame with view tabs and only a copy-code header action", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "حقل النسخ" }));
  const frames = document.querySelectorAll(".tz-demo-frame");
  expect(frames).toHaveLength(1);
  const write = vi.spyOn(navigator.clipboard, "writeText");
  const header = frames[0].querySelector(".tz-demo-header") as HTMLElement;
  expect(
    within(header).getByRole("tablist", { name: "طريقة العرض" }),
  ).toBeVisible();
  expect(within(header).getAllByRole("button")).toHaveLength(1);
  const copy = within(header).getByRole("button", { name: "نسخ الكود" });
  await user.click(copy);
  expect(copy).toHaveAttribute("data-copy-state", "copied");
  expect(within(header).getByRole("status")).toHaveTextContent("نُسخ الكود");
  const copied = String(write.mock.calls.at(-1)?.[0]);
  expect(copied).toContain("InputCopyExample");
  // The clipboard gets exactly the source the Code view shows.
  await user.click(within(header).getByRole("tab", { name: "الكود" }));
  expect(
    screen
      .getByRole("region", { name: "الكود: src/Example.tsx" })
      .querySelector("pre")!.textContent,
  ).toBe(copied);
});
it("keeps streaming autoplay, replaces stop with copy, and replays without losing header focus", async () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.click(screen.getByRole("button", { name: "النص المتتابع" }));
  await act(async () => vi.advanceTimersByTime(640));
  expect(screen.queryByRole("heading", { name: "أمثلة", level: 2 })).toBeNull();
  // Streaming now lives only in the playground frame.
  const frames = document.querySelectorAll(".tz-demo-frame");
  expect(frames).toHaveLength(1);
  for (const frame of frames) {
    const header = frame.querySelector(".tz-demo-header") as HTMLElement;
    expect(within(header).getByRole("tablist")).toBeVisible();
    expect(within(header).getAllByRole("button")).toHaveLength(2);
    expect(within(header).queryByRole("button", { name: /إلغاء/ })).toBeNull();
    expect(
      within(header).getByRole("button", { name: "نسخ الكود" }),
    ).toBeVisible();
    const replay = within(header).getByRole("button", {
      name: "إعادة تشغيل المثال",
    });
    replay.focus();
    fireEvent.click(replay);
    expect(replay).toHaveFocus();
    expect(frame.querySelector(".tz-stream-content")?.textContent).toBe("");
  }
  await act(async () => vi.advanceTimersByTime(4000));
  for (const frame of frames)
    expect(frame.querySelector(".tz-streaming-text")).toHaveAttribute(
      "data-state",
      "completed",
    );
});
it("resets an interactive playground from the inspector without remounting the frame", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "مربع النص" }));
  const frame = document.querySelector(
    ".playground-region .tz-demo-frame",
  ) as HTMLElement;
  const header = frame.querySelector("header") as HTMLElement;
  const filled = defaultPlaygrounds("ar").textarea.value;
  const notes = within(frame).getByRole("textbox", { name: "ملاحظات" });
  await user.type(notes, " وتفاصيل الطلب");
  expect(notes).toHaveValue(`${filled} وتفاصيل الطلب`);
  // Replay no longer resets a page; the inspector does.
  expect(
    within(header).queryByRole("button", { name: "إعادة تشغيل المثال" }),
  ).toBeNull();
  await user.click(
    within(screen.getByRole("complementary", { name: "التخصيص" })).getByRole(
      "button",
      { name: "إعادة ضبط المعاينة" },
    ),
  );
  expect(within(frame).getByRole("textbox", { name: "ملاحظات" })).toHaveValue(
    filled,
  );
  expect(frame.querySelector("header")).toBe(header);
});

it("offers replay only on pages with a lifecycle to play", () => {
  const playgrounds = defaultPlaygrounds("en");
  // A page with states replays only a sequence it has, so Textarea has none.
  for (const component of [
    "context-meter",
    "model-selector",
    "input-copy",
    "alert",
    "empty-state",
    "textarea",
  ] as const)
    expect(canReplayPlayground(component, playgrounds[component])).toBe(false);
  for (const component of [
    "chat-thread",
    "chat-composer",
    "steps",
    "tool-chips",
    "progress",
    "thinking-state",
  ] as const)
    expect(canReplayPlayground(component, playgrounds[component])).toBe(true);
});
it("switches between preview and code by click and keyboard, keeping the preview's state", async () => {
  const user = userEvent.setup();
  render(
    <SystemProvider config={defaultConfig}>
      <DemoFrame language="en" code={source} fileName="src/Draft.tsx">
        <Draft />
      </DemoFrame>
    </SystemProvider>,
  );
  const views = screen.getByRole("tablist", { name: "View" });
  const preview = within(views).getByRole("tab", { name: "Preview" });
  const code = within(views).getByRole("tab", { name: "Code" });
  expect(preview).toHaveAttribute("aria-selected", "true");
  expect(preview).toHaveAttribute("tabindex", "0");
  expect(code).toHaveAttribute("aria-selected", "false");
  expect(code).toHaveAttribute("tabindex", "-1");
  const [previewPanel, codePanel] = screen.getAllByRole("tabpanel", {
    hidden: true,
  });
  expect(preview).toHaveAttribute("aria-controls", previewPanel.id);
  expect(code).toHaveAttribute("aria-controls", codePanel.id);
  expect(previewPanel).toBeVisible();
  expect(codePanel).not.toBeVisible();
  expect(screen.queryByRole("region")).toBeNull();
  await user.type(screen.getByRole("textbox", { name: "Draft" }), "kept");

  await user.click(code);
  expect(code).toHaveAttribute("aria-selected", "true");
  expect(preview).toHaveAttribute("tabindex", "-1");
  // The example stays mounted, only hidden, while its code is shown.
  expect(previewPanel).not.toBeVisible();
  expect(within(previewPanel).getByDisplayValue("kept")).toBeInTheDocument();
  const region = screen.getByRole("region", { name: "Code: src/Draft.tsx" });
  expect(region.querySelector("pre")!.textContent).toBe(source);
  const gutter = region.querySelector(".tz-demo-source-lines");
  expect(gutter).toHaveAttribute("aria-hidden", "true");
  expect(gutter?.textContent).toBe("1\n2\n3");

  code.focus();
  await user.keyboard("{ArrowLeft}");
  expect(preview).toHaveFocus();
  expect(preview).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByRole("region")).toBeNull();
  expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("kept");
  await user.keyboard("{End}");
  expect(code).toHaveFocus();
  expect(code).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{Home}");
  expect(preview).toHaveFocus();
  expect(preview).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{ArrowRight}");
  expect(code).toHaveFocus();
  expect(code).toHaveAttribute("aria-selected", "true");
});
it("names the view switch, copy action and code region in Arabic", async () => {
  const user = userEvent.setup();
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <DemoFrame language="ar" code={source}>
        <p>مثال</p>
      </DemoFrame>
    </SystemProvider>,
  );
  const views = screen.getByRole("tablist", { name: "طريقة العرض" });
  expect(
    within(views)
      .getAllByRole("tab")
      .map((tab) => tab.textContent),
  ).toEqual(["معاينة", "الكود"]);
  await user.click(within(views).getByRole("tab", { name: "الكود" }));
  expect(
    screen.getByRole("region", { name: "الكود: src/Example.tsx" }),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "نسخ الكود" })).toBeVisible();
});
it("hides replay while the code is shown and replays from the preview", async () => {
  const user = userEvent.setup();
  const replay = vi.fn();
  render(
    <SystemProvider config={defaultConfig}>
      <DemoFrame language="en" code={source} onReplay={replay}>
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>,
  );
  expect(screen.getByRole("button", { name: "Replay example" })).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.queryByRole("button", { name: "Replay example" })).toBeNull();
  expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Preview" }));
  await user.click(screen.getByRole("button", { name: "Replay example" }));
  expect(replay).toHaveBeenCalledTimes(1);
});
it("shows only its title, without tabs or copy, when there is no code", () => {
  render(
    <SystemProvider config={defaultConfig}>
      <DemoFrame title="Default" language="en">
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>,
  );
  expect(screen.getByText("Default")).toBeVisible();
  expect(screen.getByText("Example")).toBeVisible();
  expect(screen.queryByRole("tablist")).toBeNull();
  expect(screen.queryByRole("tabpanel")).toBeNull();
  expect(screen.queryByRole("button", { name: "Copy code" })).toBeNull();
});
it("announces copy failure honestly, supports retry, and ignores stale clipboard completions", async () => {
  const user = userEvent.setup();
  const write = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockRejectedValueOnce(new Error("Denied"));
  const wrap = (code: string) => (
    <SystemProvider config={defaultConfig}>
      <DemoFrame language="en" code={code}>
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>
  );
  const view = render(wrap("source\n  with whitespace\n"));
  const copy = screen.getByRole("button", { name: "Copy code" });
  expect(copy).toHaveAttribute("data-copy-state", "idle");
  await user.click(copy);
  expect(copy).toHaveAttribute("data-copy-state", "failed");
  expect(screen.getByRole("status")).toHaveTextContent(
    "Could not copy the code. Try again.",
  );
  write.mockResolvedValueOnce();
  await user.click(copy);
  expect(write).toHaveBeenLastCalledWith("source\n  with whitespace\n");
  expect(copy).toHaveAttribute("data-copy-state", "copied");
  expect(screen.getByRole("status")).toHaveTextContent("Code copied");
  expect(copy).toHaveTextContent("");
  let finish!: () => void;
  write.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await user.click(copy);
  view.rerender(wrap("new code"));
  await act(async () => finish());
  expect(copy).toHaveAttribute("data-copy-state", "idle");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  write.mockResolvedValueOnce();
  await user.click(copy);
  expect(write).toHaveBeenLastCalledWith("new code");
  expect(copy).toHaveAttribute("data-copy-state", "copied");
});

it("records the EmptyState playground action without offering a replay", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "الحالة الفارغة" }));
  const frame = document.querySelector(
    ".playground-region .tz-demo-frame",
  ) as HTMLElement;
  expect(within(frame).getByText("لا توجد سجلات بعد")).toBeVisible();
  await user.click(within(frame).getByRole("button", { name: "إضافة سجل" }));
  expect(screen.getByRole("status", { name: "آخر حدث" })).toHaveTextContent(
    "onClick",
  );
  // A static stage has nothing to restart.
  expect(
    within(frame.querySelector("header")!).queryByRole("button", {
      name: "إعادة تشغيل المثال",
    }),
  ).toBeNull();
  await user.clear(
    within(screen.getByRole("complementary", { name: "التخصيص" })).getByRole(
      "textbox",
      { name: "زر الإجراء" },
    ),
  );
  expect(within(frame).queryByRole("button", { name: "إضافة سجل" })).toBeNull();
});

it("renders the states group and reports a press", async () => {
  const user = userEvent.setup();
  const onStateChange = vi.fn();
  const frame = (state: string) => (
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <DemoFrame
        language="ar"
        code={source}
        states={stateList}
        state={state}
        onStateChange={onStateChange}
      >
        <p>مثال</p>
      </DemoFrame>
    </SystemProvider>
  );
  const view = render(frame("a"));
  const group = screen.getByRole("group", { name: "حالات المثال" });
  const buttons = within(group).getAllByRole("button");
  expect(buttons.map((button) => button.textContent)).toEqual([
    "فارغ",
    "تحميل",
    "تم",
  ]);
  for (const button of buttons)
    expect(button).toHaveAttribute("type", "button");
  const pressed = () =>
    buttons.map((button) => button.getAttribute("aria-pressed"));
  expect(pressed()).toEqual(["true", "false", "false"]);
  // The group sits beside the header's buttons, not among them.
  const header = document.querySelector(".tz-demo-header") as HTMLElement;
  expect(group.closest(".tz-demo-header")).toBeNull();
  expect(within(header).getAllByRole("button")).toHaveLength(1);
  await user.click(buttons[1]);
  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith("b");
  expect(buttons[1]).toHaveFocus();
  view.rerender(frame("b"));
  expect(pressed()).toEqual(["false", "true", "false"]);
  expect(buttons[1]).toHaveFocus();
  // Plain Tab moves to the next state: the group has no roving focus.
  await user.tab();
  expect(buttons[2]).toHaveFocus();
});

it("announces a state change, but not the first render or replay steps", () => {
  const frame = (language: "ar" | "en", state: string, replaying?: boolean) => (
    <SystemProvider config={defaultConfig}>
      <DemoFrame
        language={language}
        code={source}
        states={stateList}
        state={state}
        replaying={replaying}
      >
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>
  );
  const view = render(frame("ar", "a"));
  const status = screen.getByRole("status");
  expect(status).toBeEmptyDOMElement();
  view.rerender(frame("ar", "b"));
  expect(status).toHaveTextContent("الحالة: تحميل");
  // Replay steps through the states in silence...
  view.rerender(frame("ar", "a", true));
  expect(status).toBeEmptyDOMElement();
  view.rerender(frame("ar", "b", true));
  expect(status).toBeEmptyDOMElement();
  view.rerender(frame("ar", "c", true));
  expect(status).toBeEmptyDOMElement();
  // ...and says the state it ended on, once.
  view.rerender(frame("ar", "c", false));
  expect(status).toHaveTextContent("الحالة: تم");
  view.unmount();
  const english = render(frame("en", "a"));
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  english.rerender(frame("en", "b"));
  expect(screen.getByRole("status")).toHaveTextContent("State: Loading");
});

it("keeps one status for a copy and a state change, saying the latest", async () => {
  const user = userEvent.setup();
  const frame = (state: string) => (
    <SystemProvider config={defaultConfig}>
      <DemoFrame language="en" code={source} states={stateList} state={state}>
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>
  );
  const view = render(frame("a"));
  const status = screen.getByRole("status");
  const copy = screen.getByRole("button", { name: "Copy code" });
  await user.click(copy);
  expect(status).toHaveTextContent("Code copied");
  view.rerender(frame("b"));
  expect(status).toHaveTextContent("State: Loading");
  await user.click(copy);
  expect(status).toHaveTextContent("Code copied");
});

it("reports view changes", async () => {
  const user = userEvent.setup();
  const onViewChange = vi.fn();
  render(
    <SystemProvider config={defaultConfig}>
      <DemoFrame language="en" code={source} onViewChange={onViewChange}>
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>,
  );
  const code = screen.getByRole("tab", { name: "Code" });
  await user.click(code);
  expect(onViewChange).toHaveBeenCalledTimes(1);
  expect(onViewChange).toHaveBeenLastCalledWith("code");
  // Pressing the view that is already shown is not a change.
  await user.click(code);
  expect(onViewChange).toHaveBeenCalledTimes(1);
  await user.keyboard("{ArrowLeft}");
  expect(onViewChange).toHaveBeenCalledTimes(2);
  expect(onViewChange).toHaveBeenLastCalledWith("preview");
});

it("keeps the visible Replay word inside its name", () => {
  const frame = (language: "ar" | "en", replayLabel?: string) => (
    <SystemProvider config={defaultConfig}>
      <DemoFrame
        language={language}
        code={source}
        onReplay={() => {}}
        replayLabel={replayLabel}
      >
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>
  );
  for (const [language, word, name] of [
    ["ar", "إعادة تشغيل", "إعادة تشغيل المثال"],
    ["en", "Replay", "Replay example"],
  ] as const) {
    const view = render(frame(language));
    const pill = screen.getByRole("button", { name });
    expect(pill).toHaveTextContent(word);
    // WCAG 2.5.3: the name holds the word that is on the button.
    expect(name).toContain(pill.textContent);
    view.unmount();
  }
  // A caller's own label names the pill, and then it shows only its icon.
  render(frame("ar", "تشغيل المثال"));
  const icon = screen.getByRole("button", { name: "تشغيل المثال" });
  expect(icon.textContent).toBe("");
  expect(icon.querySelector("svg")).not.toBeNull();
});

it("renders the notes row with its three labels", () => {
  const notes = {
    useWhen: ["أولًا"],
    instead: ["ثانيًا"],
    notice: ["ثالثًا", "رابعًا"],
  };
  const frame = (language: "ar" | "en", extra = {}) => (
    <SystemProvider config={defaultConfig}>
      <DemoFrame language={language} notes={{ ...notes, ...extra }}>
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>
  );
  const labels = {
    ar: ["استخدمه عندما", "استخدم غيره عندما", "لاحظ"],
    en: ["Use it when", "Use something else when", "What to notice"],
  };
  for (const language of ["ar", "en"] as const) {
    const view = render(frame(language));
    const row = document.querySelector(".tz-demo-notes") as HTMLElement;
    const headings = within(row).getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(
      labels[language],
    );
    // Each label names its own language, so English-only styling can find it.
    for (const heading of headings)
      expect(heading).toHaveAttribute("lang", language);
    expect(
      within(row)
        .getAllByRole("list")
        .map((list) => within(list).getAllByRole("listitem").length),
    ).toEqual([1, 1, 2]);
    view.unmount();
  }
  // A pattern lists what it replaces in the middle column.
  render(frame("ar", { replaces: ["الأول", "الثاني"] }));
  const row = document.querySelector(".tz-demo-notes") as HTMLElement;
  expect(
    within(row)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["استخدمه عندما", "يحل محل", "لاحظ"]);
  expect(within(row).getByText("الأول")).toBeInTheDocument();
  expect(within(row).queryByText("ثانيًا")).toBeNull();
});

it("shows both names, interface language first", () => {
  const name = { ar: "الزر", en: "Button" };
  const after = (before: Node, next: Node) =>
    Boolean(
      before.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
  const names = {
    ar: {
      states: "حالات المثال",
      replay: "إعادة تشغيل المثال",
      views: "طريقة العرض",
      copy: "نسخ الكود",
    },
    en: {
      states: "Example states",
      replay: "Replay example",
      views: "View",
      copy: "Copy code",
    },
  };
  for (const language of ["ar", "en"] as const) {
    const view = render(
      <SystemProvider config={defaultConfig}>
        <DemoFrame
          language={language}
          code={source}
          name={name}
          states={stateList}
          onReplay={() => {}}
        >
          <p>Example</p>
        </DemoFrame>
      </SystemProvider>,
    );
    const arabic = screen.getByText("الزر");
    const english = screen.getByText("Button");
    expect(arabic).toHaveAttribute("lang", "ar");
    expect(english).toHaveAttribute("lang", "en");
    const [first, second] =
      language === "ar" ? [arabic, english] : [english, arabic];
    // The header reads: the names, the states, Replay, the View tablist, Copy.
    const order = [
      first,
      second,
      screen.getByRole("group", { name: names[language].states }),
      screen.getByRole("button", { name: names[language].replay }),
      screen.getByRole("tablist", { name: names[language].views }),
      screen.getByRole("button", { name: names[language].copy }),
    ];
    order.slice(1).forEach((node, index) => {
      expect(after(order[index], node)).toBe(true);
    });
    view.unmount();
  }
});
