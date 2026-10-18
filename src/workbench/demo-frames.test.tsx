import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { canReplayPlayground } from "./demo-capabilities";
import { defaultPlaygrounds } from "./model";
import { DemoFrame } from "../system/ai/examples/DemoFrame";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
const source = 'import { Button } from "./system";\n  <Button />\n';
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
it("provides replay for an interactive playground and clears its local state without remounting the header", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "مربع النص" }));
  const frame = document.querySelector(
    ".playground-region .tz-demo-frame",
  ) as HTMLElement;
  const notes = within(frame).getByRole("textbox", { name: "ملاحظات" });
  await user.type(notes, "تفاصيل الطلب");
  expect(notes).toHaveValue("تفاصيل الطلب");
  const replay = within(frame.querySelector("header")!).getByRole("button", {
    name: "إعادة تشغيل المثال",
  });
  await user.click(replay);
  expect(replay).toHaveFocus();
  expect(within(frame).getByRole("textbox", { name: "ملاحظات" })).toHaveValue(
    "",
  );
});

it("offers replay only when the actual section has state or motion to restart", () => {
  const playgrounds = defaultPlaygrounds("en");
  for (const component of [
    "context-meter",
    "model-selector",
    "input-copy",
    "alert",
    "empty-state",
  ] as const)
    expect(canReplayPlayground(component, playgrounds[component])).toBe(false);
  for (const component of [
    "chat-thread",
    "chat-composer",
    "steps",
    "tool-chips",
    "textarea",
  ] as const)
    expect(canReplayPlayground(component, playgrounds[component])).toBe(true);
  const progress = playgrounds.progress;
  expect(
    canReplayPlayground("progress", { ...progress, indeterminate: false }),
  ).toBe(false);
  expect(
    canReplayPlayground("progress", { ...progress, indeterminate: true }),
  ).toBe(true);
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
