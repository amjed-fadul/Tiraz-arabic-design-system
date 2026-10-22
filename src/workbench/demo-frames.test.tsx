import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import {
  navigationCatalog,
  navigationGroups,
  nestedParts,
  catalog,
} from "./catalog";
import { demoStates } from "./demo-states";
import { defaultPlaygrounds } from "./model";
import {
  DemoFrame,
  DemoNotes,
  type DemoFrameState,
} from "../system/ai/examples/DemoFrame";
import { SystemProvider, defaultConfig } from "../system";
import { persist, storageKeys } from "./storage";
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
it("gives static previews a matching frame with view tabs and a copy action only in the code's header", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "حقل النسخ" }));
  const frames = document.querySelectorAll(".tz-demo-frame");
  expect(frames).toHaveLength(1);
  const frame = frames[0] as HTMLElement;
  const write = vi.spyOn(navigator.clipboard, "writeText");
  const views = within(frame).getByRole("tablist", { name: "طريقة العرض" });
  expect(views).toBeVisible();
  // A static stage has nothing to replay, and Copy waits in the Code view.
  expect(
    within(frame).queryByRole("button", { name: "إعادة تشغيل المثال" }),
  ).toBeNull();
  expect(within(frame).queryByRole("button", { name: "نسخ الكود" })).toBeNull();
  await user.click(within(views).getByRole("tab", { name: "الكود" }));
  const copy = within(frame).getByRole("button", { name: "نسخ الكود" });
  await user.click(copy);
  expect(copy).toHaveAttribute("data-copy-state", "copied");
  expect(frame.querySelector(":scope > [role='status']")).toHaveTextContent(
    "نُسخ الكود",
  );
  const copied = String(write.mock.calls.at(-1)?.[0]);
  expect(copied).toContain("InputCopyExample");
  // The clipboard gets exactly the source the Code view shows.
  expect(
    screen
      .getByRole("region", { name: "الكود: src/Example.tsx" })
      .querySelector("pre")!.textContent,
  ).toBe(copied);
});
it("replays streaming text from the stage's corner, without a stop, keeping Replay's focus", async () => {
  vi.useFakeTimers();
  render(<Workbench />);
  // StreamingText is linked from ChatThread in the Ask section.
  fireEvent.click(screen.getByRole("link", { name: "اسأل" }));
  fireEvent.click(screen.getByRole("button", { name: "المحادثة" }));
  fireEvent.click(screen.getByRole("link", { name: "النص المتتابع" }));
  expect(screen.queryByRole("heading", { name: "أمثلة", level: 2 })).toBeNull();
  // The page's frame is the only one, and the text is complete at rest.
  const frames = document.querySelectorAll(".tz-demo-frame");
  expect(frames).toHaveLength(1);
  const frame = frames[0] as HTMLElement;
  const text = () => frame.querySelector(".tz-streaming-text");
  const content = () => frame.querySelector(".tz-stream-content")?.textContent;
  const pressed = () =>
    Array.from(
      frame.querySelectorAll(".tz-demo-states [aria-pressed='true']"),
      (button) => button.textContent,
    );
  await act(async () => vi.advanceTimersByTime(4000));
  expect(text()).toHaveAttribute("data-state", "completed");
  expect(content()).toContain("INV-1043");
  expect(pressed()).toEqual(["اكتمل"]);
  expect(within(frame).getByRole("tablist")).toBeVisible();
  expect(within(frame).queryByRole("button", { name: /إلغاء/ })).toBeNull();
  // Replay is the stage's first stop, ahead of the example.
  const stage = frame.querySelector(".tz-demo-stage") as HTMLElement;
  const replay = within(stage).getAllByRole("button")[0];
  expect(replay).toHaveAccessibleName("إعادة تشغيل المثال");
  replay.focus();
  fireEvent.click(replay);
  expect(replay).toHaveFocus();
  // Replay streams the text again from its first word...
  expect(pressed()).toEqual(["يصل تباعًا"]);
  expect(text()).toHaveAttribute("data-state", "streaming");
  expect(content()).toBe("");
  await act(async () => vi.advanceTimersByTime(160));
  expect(content()).toContain("اكتملت");
  expect(content()).not.toContain("INV-1043");
  // ...then shows it done, and says so once.
  await act(async () => vi.advanceTimersByTime(2440));
  expect(pressed()).toEqual(["اكتمل"]);
  expect(text()).toHaveAttribute("data-state", "completed");
  expect(content()).toContain("INV-1043");
  await act(async () => vi.advanceTimersByTime(800));
  expect(frame.querySelector(":scope > [role='status']")).toHaveTextContent(
    "الحالة: اكتمل",
  );
  expect(vi.getTimerCount()).toBe(0);
  expect(replay).toHaveFocus();
});
it("resets an interactive playground from the inspector without remounting the frame", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "مربع النص" }));
  const frame = document.querySelector(
    ".playground-region .tz-demo-frame",
  ) as HTMLElement;
  const bar = frame.querySelector(".tz-demo-bar") as HTMLElement;
  const filled = defaultPlaygrounds("ar").textarea.value;
  const notes = within(frame).getByRole("textbox", { name: "ملاحظات" });
  await user.type(notes, " وتفاصيل الطلب");
  expect(notes).toHaveValue(`${filled} وتفاصيل الطلب`);
  // Replay no longer resets a page; the inspector does.
  expect(
    within(frame).queryByRole("button", { name: "إعادة تشغيل المثال" }),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "تخصيص" }));
  await user.click(
    within(
      screen.getByRole("complementary", { name: "تخصيص المعاينة" }),
    ).getByRole("button", { name: "إعادة ضبط المعاينة" }),
  );
  expect(within(frame).getByRole("textbox", { name: "ملاحظات" })).toHaveValue(
    filled,
  );
  expect(frame.querySelector(".tz-demo-bar")).toBe(bar);
});

it("shows Replay only where a sequence exists", () => {
  render(<Workbench />);
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  // Each page opens its section; specialist pages remain linked from parents.
  const replaying: string[] = [];
  // Every page of the catalog: Replay needs a sequence of states to play.
  for (const page of navigationCatalog) {
    const parent = nestedParts[page.id as keyof typeof nestedParts];
    const group = navigationGroups.find((section) =>
      section.items.some((item) => item.id === (parent ?? page.id)),
    )!;
    const sectionLink = nav.getByRole("link", { name: group.name[0] });
    if (
      nav
        .getByRole("button", { name: new RegExp(`^${group.name[0]}:`) })
        .getAttribute("aria-expanded") !== "true"
    )
      fireEvent.click(sectionLink);
    if (parent) {
      fireEvent.click(
        nav.getByRole("button", {
          name: catalog.find((item) => item.id === parent)!.name[0],
        }),
      );
      fireEvent.click(screen.getByRole("link", { name: page.name[0] }));
    } else fireEvent.click(nav.getByRole("button", { name: page.name[0] }));
    if (screen.queryByRole("button", { name: "إعادة تشغيل المثال" }))
      replaying.push(page.id);
  }
  expect(replaying.sort()).toEqual([
    "agent-task",
    "button",
    "change-summary",
    "chat-thread",
    "cited-answer",
    "data-answer",
    "draft-review",
    "image-generation",
    "progress",
    "skeleton",
    "steps",
    "streaming-text",
    "suggested-edits",
    "task-rows",
    "terminal",
    "thinking-state",
    "toast",
    "tool-call",
    "tool-chips",
  ]);
  expect(replaying.sort()).toEqual(
    navigationCatalog
      .filter((page) => demoStates[page.id]?.replay)
      .map((page) => page.id)
      .sort(),
  );
}, 30000);
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
it("shows only the example, without tabs or copy, when there is no code", () => {
  render(
    <SystemProvider config={defaultConfig}>
      <DemoFrame language="en">
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>,
  );
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
  await user.click(screen.getByRole("tab", { name: "Code" }));
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
  await user.click(screen.getByRole("link", { name: "العرض والتنبيهات" }));
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
    within(frame).queryByRole("button", { name: "إعادة تشغيل المثال" }),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "تخصيص" }));
  await user.clear(
    within(
      screen.getByRole("complementary", { name: "تخصيص المعاينة" }),
    ).getByRole("textbox", { name: "زر الإجراء" }),
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
  // The group sits in the toolbar above the stage, not in it.
  expect(group.closest(".tz-demo-stage")).toBeNull();
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
  await user.click(screen.getByRole("tab", { name: "Code" }));
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

it("names the corner Replay icon and gives it a tooltip", () => {
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
  for (const [language, name] of [
    ["ar", "إعادة تشغيل المثال"],
    ["en", "Replay example"],
  ] as const) {
    const view = render(frame(language));
    const icon = screen.getByRole("button", { name });
    expect(icon).toHaveAttribute("title", name);
    expect(icon.textContent).toBe("");
    expect(icon.querySelector("svg")).not.toBeNull();
    view.unmount();
  }
  // A caller's own label names it instead.
  render(frame("ar", "تشغيل المثال"));
  expect(screen.getByRole("button", { name: "تشغيل المثال" })).toHaveAttribute(
    "title",
    "تشغيل المثال",
  );
});

it("renders the usage guidelines with their three labels", () => {
  const notes = {
    useWhen: ["أولًا"],
    instead: ["ثانيًا"],
    notice: ["ثالثًا", "رابعًا"],
  };
  const frame = (language: "ar" | "en", extra = {}) => (
    <SystemProvider config={defaultConfig}>
      <DemoNotes language={language} notes={{ ...notes, ...extra }} />
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

it("reads the switch, the states and the new-tab link, then Replay and the example", () => {
  const after = (before: Node, next: Node) =>
    Boolean(
      before.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
  const names = {
    ar: {
      views: "طريقة العرض",
      states: "حالات المثال",
      open: "فتح المعاينة في تبويب جديد",
      replay: "إعادة تشغيل المثال",
    },
    en: {
      views: "View",
      states: "Example states",
      open: "Open the playground in a new tab",
      replay: "Replay example",
    },
  };
  for (const language of ["ar", "en"] as const) {
    const view = render(
      <SystemProvider config={defaultConfig}>
        <DemoFrame
          language={language}
          code={source}
          states={stateList}
          onReplay={() => {}}
          openHref="/examples/playground/button"
        >
          <button type="button">Example</button>
        </DemoFrame>
      </SystemProvider>,
    );
    // Tab order: the toolbar above the stage, then Replay, then the example.
    const order = [
      screen.getByRole("tablist", { name: names[language].views }),
      screen.getByRole("group", { name: names[language].states }),
      screen.getByRole("link", { name: names[language].open }),
      screen.getByRole("button", { name: names[language].replay }),
      screen.getByRole("button", { name: "Example" }),
    ];
    order.slice(1).forEach((node, index) => {
      expect(after(order[index], node)).toBe(true);
    });
    view.unmount();
  }
});

it("names the page once, in its h1, with no kicker above it", () => {
  persist(storageKeys.documentation, { language: "ar", active: "agent-task" });
  render(<Workbench />);
  const title = screen.getByRole("heading", { level: 1 });
  expect(title).toHaveTextContent("مهمة الوكيل");
  // The header is the title and its description, nothing above them.
  expect(
    Array.from(title.parentElement!.children, (child) => child.tagName),
  ).toEqual(["H1", "P"]);
  // The frame names nothing: the h1 is the one place the name appears.
  expect(within(screen.getByRole("main")).getAllByText("مهمة الوكيل")).toEqual([
    title,
  ]);
  const frame = document.querySelector(".tz-demo-frame") as HTMLElement;
  expect(within(frame).queryByText("Agent task")).toBeNull();
});

it("copies from the Code view's header, shows a check for 2 s and says so once", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <SystemProvider config={defaultConfig}>
      <DemoFrame language="en" code={source}>
        <p>Example</p>
      </DemoFrame>
    </SystemProvider>,
  );
  // The preview shows the example alone.
  expect(screen.queryByRole("button", { name: "Copy code" })).toBeNull();
  await user.click(screen.getByRole("tab", { name: "Code" }));
  const copy = within(screen.getByRole("tabpanel")).getByRole("button", {
    name: "Copy code",
  });
  // It shares the code's header row with the file name, and has a tooltip.
  expect(copy.parentElement).toHaveTextContent("src/Example.tsx");
  expect(copy).toHaveAttribute("title", "Copy code");
  await user.click(copy);
  expect(copy).toHaveAttribute("data-copy-state", "copied");
  expect(
    screen
      .getAllByRole("status")
      .filter((status) => status.textContent === "Code copied"),
  ).toHaveLength(1);
  await act(async () => vi.advanceTimersByTime(2000));
  expect(copy).toHaveAttribute("data-copy-state", "idle");
  expect(copy).toHaveAccessibleName("Copy code");
});

it("puts the usage guidelines under their own heading, after the playground", () => {
  persist(storageKeys.documentation, { language: "en", active: "button" });
  render(<Workbench />);
  const guidelines = screen.getByRole("region", { name: "Usage guidelines" });
  expect(
    within(guidelines)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["Use it when", "Use something else when", "What to notice"]);
  // Outside the frame, after the prompt that follows the playground.
  const frame = document.querySelector(".tz-demo-frame") as HTMLElement;
  expect(within(frame).queryByRole("heading", { level: 3 })).toBeNull();
  expect(document.querySelector(".agent-section")?.nextElementSibling).toBe(
    guidelines,
  );
});

it("mirrors the new-tab arrow in RTL, never Replay or Copy", async () => {
  const user = userEvent.setup();
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <DemoFrame
        language="ar"
        code={source}
        onReplay={() => {}}
        openHref="/examples/playground/button"
      >
        <p>مثال</p>
      </DemoFrame>
    </SystemProvider>,
  );
  const icon = (control: HTMLElement) => control.querySelector("svg");
  expect(
    icon(screen.getByRole("link", { name: "فتح المعاينة في تبويب جديد" })),
  ).toHaveClass("tz-mirror-rtl");
  expect(
    icon(screen.getByRole("button", { name: "إعادة تشغيل المثال" })),
  ).not.toHaveClass("tz-mirror-rtl");
  await user.click(screen.getByRole("tab", { name: "الكود" }));
  expect(
    icon(screen.getByRole("button", { name: "نسخ الكود" })),
  ).not.toHaveClass("tz-mirror-rtl");
});

it("shows the API reference open, as a table with column headers and LTR code", () => {
  persist(storageKeys.documentation, { language: "ar", active: "button" });
  render(<Workbench />);
  const reference = screen
    .getByRole("heading", { level: 2, name: "دليل الخصائص" })
    .closest("section") as HTMLElement;
  // Always open: nothing to expand.
  expect(reference.querySelector("details, summary")).toBeNull();
  const table = within(reference).getByRole("table", { name: "دليل الخصائص" });
  expect(table).toBeVisible();
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((header) => header.textContent),
  ).toEqual(["الخاصية", "النوع", "الافتراضي", "الوصف"]);
  for (const code of table.querySelectorAll("code"))
    expect(code).toHaveAttribute("dir", "ltr");
  // A row: the props, their types, their defaults and what they do.
  const row = within(table)
    .getByRole("rowheader", { name: "variant / state / size" })
    .closest("tr") as HTMLElement;
  expect(
    within(row)
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  ).toEqual([
    "ButtonVariant / ButtonState / sm | md",
    '"primary" / "idle" / "sm"',
    "الحجم الافتراضي sm. في حالة loading يبقى الزر قابلًا للتركيز لكنه لا يستجيب: يضبط aria-disabled وaria-busy ويتجاهل الضغط، فلا يسقط التركيز إلى الصفحة أثناء العملية.",
  ]);
});

it("shows only real literals in the API table's defaults", () => {
  const defaultOf = (active: string, row: string) => {
    persist(storageKeys.documentation, { language: "ar", active });
    const { unmount } = render(<Workbench />);
    const table = screen.getByRole("table", { name: "دليل الخصائص" });
    const cells = within(
      within(table).getByRole("rowheader", { name: row }).closest("tr")!,
    ).getAllByRole("cell");
    const text = cells[1].textContent;
    unmount();
    return text;
  };
  // A description is not a value: the registry says Slider starts at its
  // "midpoint", which is no number.
  expect(defaultOf("slider", "value / defaultValue / onValueChange")).toBe("—");
  // The registry writes Tooltip's 500 as a string, but the prop is a number.
  expect(defaultOf("tooltip", "delayDuration")).toBe("500");
  // A real default keeps its quotes.
  expect(defaultOf("button", "variant / state / size")).toBe(
    '"primary" / "idle" / "sm"',
  );
});

it("leads with the playground, then the prompt, guidelines and a table-only API reference", () => {
  persist(storageKeys.documentation, { language: "ar", active: "button" });
  render(<Workbench />);
  const main = screen.getByRole("main");
  expect(main.firstElementChild).toHaveClass("component-heading");
  const playground = main.children[1];
  expect(playground).toHaveClass("playground-section");
  expect(playground.nextElementSibling).toHaveClass("agent-section");
  expect(within(playground as HTMLElement).queryByRole("heading")).toBeNull();
  const reference = main.querySelector(".reference-section")!;
  expect(reference.querySelector("p")).toBeNull();
  expect(within(reference as HTMLElement).getByRole("table")).toBeVisible();
  expect(
    within(main)
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent),
  ).toEqual(["استخدمه في تطبيقك", "إرشادات الاستخدام", "دليل الخصائص"]);
});

it("keeps the prompt English on an Arabic page, under an Arabic heading", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, { language: "ar", active: "button" });
  render(<Workbench />);
  const section = screen
    .getByRole("heading", { level: 2, name: "استخدمه في تطبيقك" })
    .closest("section") as HTMLElement;
  await user.click(within(section).getByRole("button", { name: "راجع الطلب" }));
  const preview = within(section).getByRole("textbox", {
    name: "الطلب الكامل للمساعد البرمجي",
  }) as HTMLTextAreaElement;
  expect(preview).toHaveAttribute("lang", "en");
  expect(preview).toHaveAttribute("dir", "ltr");
  expect(preview.value).toMatch(/^First locate Tiraz/);
  await user.click(within(section).getByRole("button", { name: "نسخ الطلب" }));
  const copied = await navigator.clipboard.readText();
  expect(copied).toMatch(/^First locate Tiraz/);
  expect(copied).not.toContain("اعثر أولًا");
  // The example code in it keeps the page's own content.
  expect(copied).toContain("حفظ الفاتورة");
});
