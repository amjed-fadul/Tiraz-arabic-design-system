import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";
import { Markdown } from "./Markdown";
import { StreamingText } from "./StreamingText";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const wrap = (node: React.ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {node}
  </SystemProvider>
);
const clipboard = (writeText?: unknown) =>
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
afterEach(() => vi.useRealTimers());
it("copies exact source whitespace, keeps focus and gives check-only accessible success", async () => {
  vi.useFakeTimers();
  const write = vi.fn().mockResolvedValue(undefined);
  clipboard(write);
  const code = "\tconst اسم = 'value';  \r\n\n";
  const { container } = render(wrap(<CodeBlock code={code} language="ts" />));
  const button = screen.getByRole("button", { name: "Copy code" });
  button.focus();
  await act(async () => fireEvent.click(button));
  expect(write).toHaveBeenCalledWith(code);
  expect(button).toHaveFocus();
  expect(button.querySelector(".lucide-check")).not.toBeNull();
  expect(button).not.toHaveTextContent(/Copied/);
  expect(screen.getByRole("status")).toHaveTextContent("Copied");
  expect(screen.getByRole("status")).toHaveClass("tz-visually-hidden");
  expect(container.querySelector("code")?.textContent).toBe(code);
  expect(screen.getByRole("region")).toHaveAttribute("dir", "ltr");
  expect(screen.getByRole("region")).toHaveAttribute("tabindex", "0");
  await act(async () => vi.advanceTimersByTime(2000));
  expect(button.querySelector(".lucide-check")).toBeNull();
});
it.each(["rejected", "missing"])(
  "reports %s clipboard failure honestly",
  async (kind) => {
    clipboard(
      kind === "missing"
        ? undefined
        : vi.fn().mockRejectedValue(new Error("denied")),
    );
    render(wrap(<CodeBlock code=" unchanged " language="unknown" />));
    await act(async () => fireEvent.click(screen.getByRole("button")));
    expect(screen.getByRole("status")).toHaveTextContent("Could not copy");
    expect(screen.getByRole("status")).toBeVisible();
    expect(document.querySelector(".tz-code-token")).toBeNull();
    expect(document.querySelector("code")).toHaveTextContent("unchanged");
  },
);
it("invalidates a pending clipboard request after source change or unmount", async () => {
  let finish!: () => void;
  clipboard(() => new Promise<void>((resolve) => (finish = resolve)));
  const view = render(wrap(<CodeBlock code="old" />));
  fireEvent.click(screen.getByRole("button"));
  view.rerender(wrap(<CodeBlock code="new" />));
  await act(async () => finish());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  fireEvent.click(screen.getByRole("button"));
  view.unmount();
  await act(async () => finish());
});
it("renders Markdown structure, tables and shared fenced code, with safe URLs and no HTML", () => {
  const text =
    "# عنوان / Heading\n\nنص **strong** *emphasis* ~~old~~ [link](https://example.com) و `const x`\n\n- item\n  - nested\n\n1. ordered\n\n> quote\n\n| الاسم | Value |\n| --- | --- |\n| مدار | 42 |\n\n```ts\nconst x = 42;\n```\n\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29) ![bad](data:image/svg+xml,test)";
  render(wrap(<Markdown text={text} />));
  expect(
    screen.getByRole("heading", { name: "عنوان / Heading" }),
  ).toBeVisible();
  expect(screen.getAllByRole("list")).toHaveLength(3);
  expect(screen.getByRole("table")).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Value" })).toHaveAttribute(
    "scope",
    "col",
  );
  expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible();
  expect(
    document.querySelector(
      "script, [onerror], img[src^='data:'], a[href^='javascript:']",
    ),
  ).toBeNull();
  expect(screen.getByRole("link", { name: "link" })).toHaveAttribute(
    "href",
    "https://example.com",
  );
  expect(
    document.querySelector(".tz-markdown code:not(pre code)"),
  ).toHaveAttribute("dir", "ltr");
});
it.each([
  "javascript:alert(1)",
  "vbscript:evil",
  "data:text/html,evil",
  "file:///tmp/x",
  "JaVaScRiPt:evil",
])("rejects unsafe link and image %s", (url) => {
  render(wrap(<Markdown text={`[unsafe](<${url}>) ![unsafe](<${url}>)`} />));
  expect(document.querySelector("a[href], img[src]")).toBeNull();
});
it("reparses unfinished Markdown fences and partial syntax without remounting settled code", () => {
  const view = render(
    wrap(
      <StreamingText
        text={"# Notes\n\n```ts\nconst"}
        state="streaming"
        markdown
      />,
    ),
  );
  const pre = document.querySelector("pre"),
    button = screen.getByRole("button");
  button.focus();
  view.rerender(
    wrap(
      <StreamingText
        text={"# Notes\n\n```ts\nconst x = 1;\n```\n\n**Done**"}
        state="completed"
        markdown
      />,
    ),
  );
  expect(document.querySelector("pre")).toBe(pre);
  expect(button).toHaveFocus();
  expect(document.querySelector("pre code")).toHaveTextContent("const x = 1;");
  expect(document.querySelector("strong")).toHaveTextContent("Done");
  expect(document.querySelector(".tz-stream-cursor")).toBeNull();
});
it("shows host text immediately, retains existing text nodes, announces only state and stops decorations", () => {
  const view = render(wrap(<StreamingText text="Hello " state="streaming" />));
  const first = document.querySelector(".tz-stream-word"),
    text = first?.firstChild;
  expect(screen.getByRole("status")).toHaveTextContent("Receiving response");
  view.rerender(wrap(<StreamingText text="Hello عالم" state="streaming" />));
  expect(document.querySelector(".tz-stream-word")).toBe(first);
  expect(first?.firstChild).toBe(text);
  expect(document.querySelector(".tz-stream-content")?.textContent).toBe(
    "Hello عالم",
  );
  expect(document.querySelector(".tz-stream-content")).not.toHaveAttribute(
    "aria-live",
  );
  view.rerender(wrap(<StreamingText text="Hello عالم" state="completed" />));
  expect(screen.getByRole("status")).toHaveTextContent("Response complete");
  expect(document.querySelector(".tz-stream-cursor")).toBeNull();
  expect(document.querySelector(".tz-stream-word")).toBe(first);
});
it.each(["constructor", "toString", "__proto__"])(
  "treats inherited language name %s as unsupported",
  (language) => {
    const { container } = render(
      wrap(
        <CodeBlock
          code={'const x = "value"; // comment\n42'}
          language={language}
        />,
      ),
    );
    expect(container.querySelector(".tz-code-token")).toBeNull();
  },
);
it("highlights actual keyword, comment, number and string tokens while retaining exact text", () => {
  const code = 'const x = "value"; // comment\nreturn 42;';
  const { container } = render(wrap(<CodeBlock code={code} language="ts" />));
  expect(container.querySelector('[data-kind="keyword"]')).toHaveTextContent(
    "const",
  );
  expect(container.querySelector('[data-kind="comment"]')).toHaveTextContent(
    "// comment",
  );
  expect(container.querySelector('[data-kind="number"]')).toHaveTextContent(
    "42",
  );
  expect(container.querySelector('[data-kind="string"]')).toHaveTextContent(
    '"value"',
  );
  expect(container.querySelector("code")?.textContent).toBe(code);
});
it("retains selection of received words when appending an open Markdown paragraph", () => {
  const view = render(
    wrap(
      <StreamingText text="Hello existing words " state="streaming" markdown />,
    ),
  );
  const p = document.querySelector(".tz-markdown p")!;
  const text = document.createTreeWalker(p, NodeFilter.SHOW_TEXT).nextNode()!;
  const range = document.createRange();
  range.setStart(text, 0);
  range.setEnd(text, 5);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  view.rerender(
    wrap(
      <StreamingText
        text="Hello existing words and more"
        state="streaming"
        markdown
      />,
    ),
  );
  expect(selection.toString()).toBe("Hello");
});
it.each([false, true])(
  "preserves selected word on whitespace-only append (markdown=%s)",
  (markdown) => {
    const view = render(
      wrap(
        <StreamingText text="Hello " state="streaming" markdown={markdown} />,
      ),
    );
    const span = document.querySelector(
      markdown ? ".tz-markdown-word" : ".tz-stream-word",
    )!;
    const range = document.createRange();
    range.setStart(span.firstChild!, 0);
    range.setEnd(span.firstChild!, 5);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    view.rerender(
      wrap(
        <StreamingText
          text="Hello  \n"
          state="streaming"
          markdown={markdown}
        />,
      ),
    );
    expect(selection.toString()).toBe("Hello");
  },
);
