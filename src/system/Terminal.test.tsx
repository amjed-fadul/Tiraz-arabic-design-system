import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Terminal } from "./Terminal";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const view = (output: string, followOutput = false) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    <Terminal
      command="  npm run build"
      output={output}
      state="running"
      followOutput={followOutput}
    />
  </SystemProvider>
);
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.getSelection()?.removeAllRanges();
});
it("keeps supplied text safe, whitespace exact and direction LTR inside Arabic", async () => {
  const user = userEvent.setup(),
    writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  const output =
    "  a\t b\n<img src=x onerror=alert(1)>\n\u001b[31mred\u001b[0m\n";
  render(
    <SystemProvider>
      <Terminal
        command="  npm run build"
        output={output}
        state="failed"
        exitCode={1}
      />
    </SystemProvider>,
  );
  const region = screen.getByRole("region");
  expect(region).toHaveAttribute("dir", "ltr");
  expect(region).toHaveAttribute("tabindex", "0");
  expect(region.querySelector("img")).toBeNull();
  expect(region.textContent).toBe("  npm run build\n" + output);
  await user.click(screen.getByRole("button", { name: "نسخ المخرجات" }));
  expect(writeText).toHaveBeenCalledWith("  npm run build\n" + output);
  expect(screen.getByRole("status")).toHaveTextContent("تم النسخ");
  expect(
    screen.getByRole("button").querySelector(".lucide-check"),
  ).not.toBeNull();
});
it("reports clipboard failure accessibly and ignores stale completion", async () => {
  let finish!: () => void;
  const writeText = vi
    .fn()
    .mockRejectedValueOnce(new Error("denied"))
    .mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          finish = r;
        }),
    );
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  const { rerender, unmount } = render(view("first"));
  await user.click(screen.getByRole("button", { name: "Copy output" }));
  expect(screen.getByRole("status")).toHaveTextContent("Could not copy");
  await user.click(screen.getByRole("button", { name: "Copy output" }));
  rerender(view("second"));
  await act(async () => finish());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  unmount();
});
it("follows only near the bottom and never moves a selection or older reading", () => {
  const { rerender } = render(view("one", true));
  const node = screen.getByRole("region");
  Object.defineProperties(node, {
    scrollHeight: { configurable: true, value: 1000 },
    clientHeight: { configurable: true, value: 200 },
  });
  rerender(view("two", true));
  expect(node.scrollTop).toBe(1000);
  node.scrollTop = 100;
  fireEvent.scroll(node);
  rerender(view("three", true));
  expect(node.scrollTop).toBe(100);
  node.scrollTop = 800;
  fireEvent.scroll(node);
  const range = document.createRange();
  range.selectNodeContents(node.querySelector("code")!);
  const selection = window.getSelection()!;
  selection.addRange(range);
  rerender(view("four", true));
  expect(node.scrollTop).toBe(800);
  expect(selection.isCollapsed).toBe(false);
  selection.removeAllRanges();
  rerender(view("five", true));
  expect(node.scrollTop).toBe(1000);
});
it.each(["running", "completed", "failed"] as const)(
  "shows supplied %s state without execution actions",
  (state) => {
    render(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <Terminal
          output="text"
          state={state}
          duration="2s"
          exitCode={
            state === "running" ? undefined : state === "failed" ? 1 : 0
          }
        />
      </SystemProvider>,
    );
    expect(
      screen.getByText(
        { running: "Running", completed: "Completed", failed: "Failed" }[state],
      ),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: /run|stop/i })).toBeNull();
  },
);
it("preserves a substring selection across append-only output updates", () => {
  const { rerender } = render(view("first line\nsecond line\n", true));
  const region = screen.getByRole("region"),
    code = region.querySelector("code")!;
  const text = code.lastChild!.firstChild as Text;
  const range = document.createRange();
  range.setStart(text, 2);
  range.setEnd(text, 9);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  const selected = selection.toString();
  rerender(view("first line\nsecond line\nthird line\n", true));
  expect(selection.toString()).toBe(selected);
  expect(selection.isCollapsed).toBe(false);
});
