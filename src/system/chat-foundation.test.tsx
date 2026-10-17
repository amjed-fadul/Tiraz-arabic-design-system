import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { useState } from "react";
import { ChatComposer } from "./ChatComposer";
import { PromptBar } from "./PromptBar";
import { ChatThread } from "./ChatThread";
import { StreamingText } from "./StreamingText";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const wrap = (node: React.ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {node}
  </SystemProvider>
);
it.each([ChatComposer, PromptBar])(
  "guards whitespace and IME, preserves exact text and controlled draft",
  async (Entry) => {
    const submit = vi.fn();
    const change = vi.fn();
    const view = render(
      wrap(<Entry value={" \n "} onValueChange={change} onSubmit={submit} />),
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
    view.rerender(
      wrap(
        <Entry
          value={"  مرحبًا / Hello\n "}
          onValueChange={change}
          onSubmit={submit}
        />,
      ),
    );
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(submit).not.toHaveBeenCalled();
    await act(async () => fireEvent.keyDown(input, { key: "Enter" }));
    expect(submit).toHaveBeenCalledExactlyOnceWith("  مرحبًا / Hello\n ");
    expect(input).toHaveValue("  مرحبًا / Hello\n ");
    expect(change).not.toHaveBeenCalled();
  },
);
it("inserts a real newline with Shift+Enter and retains focus on rejected submission", async () => {
  const user = userEvent.setup();
  const submit = vi.fn().mockRejectedValue(new Error("offline"));
  function Host() {
    const [value, setValue] = useState("Hello");
    return (
      <ChatComposer value={value} onValueChange={setValue} onSubmit={submit} />
    );
  }
  render(wrap(<Host />));
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("{End}{Shift>}{Enter}{/Shift}world");
  expect(input).toHaveValue("Hello\nworld");
  await user.keyboard("{Enter}");
  expect(input).toHaveFocus();
  expect(input).toHaveValue("Hello\nworld");
  expect(screen.getByRole("status")).toHaveTextContent("Could not send");
  await user.keyboard("{Enter}");
  expect(submit).toHaveBeenCalledTimes(2);
});
it("locks duplicate sends while awaiting host, never steals deliberately moved focus", async () => {
  let resolve!: () => void;
  const submit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
  render(
    wrap(
      <>
        <ChatComposer
          value="hello"
          onValueChange={() => {}}
          onSubmit={submit}
        />
        <button>Elsewhere</button>
      </>,
    ),
  );
  const input = screen.getByRole("textbox");
  input.focus();
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(submit).toHaveBeenCalledTimes(1);
  screen.getByRole("button", { name: "Elsewhere" }).focus();
  await act(async () => resolve());
  expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
});
it("busy state permits draft editing but prevents sending; stop is host-owned", () => {
  const stop = vi.fn(),
    send = vi.fn(),
    change = vi.fn();
  render(
    wrap(
      <ChatComposer
        value="next"
        onValueChange={change}
        onSubmit={send}
        state="streaming"
        onStop={stop}
      />,
    ),
  );
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "next draft" } });
  expect(change).toHaveBeenCalledWith("next draft");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(send).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Stop generating" }));
  expect(stop).toHaveBeenCalledTimes(1);
});
it("suggestions populate only through the host callback", () => {
  const select = vi.fn(),
    send = vi.fn();
  render(
    wrap(
      <PromptBar
        value=""
        onValueChange={() => {}}
        onSubmit={send}
        suggestions={["Explain RTL"]}
        onSuggestionSelect={select}
      />,
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Explain RTL" }));
  expect(select).toHaveBeenCalledWith("Explain RTL");
  expect(send).not.toHaveBeenCalled();
});
it("preserves keyed message, action focus and settled text selection across streaming updates", () => {
  const messages = (text: string) => [
    { id: "u", role: "user" as const, content: "مرحبا" },
    {
      id: "a",
      role: "assistant" as const,
      identity: "Assistant",
      content: (
        <StreamingText text={text} state="streaming" announcement="off" />
      ),
      actions: <button>Copy reply</button>,
    },
  ];
  const view = render(wrap(<ChatThread messages={messages("Hello world")} />));
  const row = view.container.querySelector('[data-message-id="a"]');
  const word = view.container.querySelector(".tz-stream-word")!;
  const copy = screen.getByRole("button", { name: "Copy reply" });
  copy.focus();
  const range = document.createRange();
  range.selectNodeContents(word);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
  view.rerender(wrap(<ChatThread messages={messages("Hello world مرحبًا")} />));
  expect(view.container.querySelector('[data-message-id="a"]')).toBe(row);
  expect(view.container.querySelector(".tz-stream-word")).toBe(word);
  expect(copy).toHaveFocus();
  expect(window.getSelection()?.toString()).toBe("Hello");
  expect(view.container.querySelector('[aria-live="polite"]')).toBeNull();
  window.getSelection()?.removeAllRanges();
});
it("follows only near bottom when explicitly enabled; preserves older reader position", () => {
  const view = render(wrap(<ChatThread followOutput messages={[]} />));
  const thread = screen.getByRole("region");
  Object.defineProperties(thread, {
    scrollHeight: { configurable: true, value: 1000 },
    clientHeight: { configurable: true, value: 200 },
  });
  thread.scrollTop = 200;
  fireEvent.scroll(thread);
  view.rerender(
    wrap(
      <ChatThread
        followOutput
        messages={[{ id: "1", role: "assistant", content: "new" }]}
      />,
    ),
  );
  expect(thread.scrollTop).toBe(200);
  thread.scrollTop = 790;
  fireEvent.scroll(thread);
  view.rerender(
    wrap(
      <ChatThread
        followOutput
        messages={[{ id: "1", role: "assistant", content: "newer" }]}
      />,
    ),
  );
  expect(thread.scrollTop).toBe(1000);
});
it("PromptBar preserves native accessible name and disables suggestions during a pending submission", async () => {
  let finish!: () => void;
  function Host() {
    const [value, setValue] = useState("send me");
    return (
      <PromptBar
        aria-label="Search project"
        value={value}
        onValueChange={setValue}
        onSubmit={() => {
          setValue("");
          return new Promise<void>((resolve) => (finish = resolve));
        }}
        suggestions={["Search again"]}
        onSuggestionSelect={() => {
          throw new Error("must stay disabled");
        }}
      />
    );
  }
  render(wrap(<Host />));
  const input = screen.getByRole("textbox", { name: "Search project" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.getByRole("button", { name: "Search again" })).toBeDisabled();
  await act(async () => finish());
  expect(screen.getByRole("button", { name: "Search again" })).toBeEnabled();
});
it.each([ChatComposer, PromptBar])(
  "keeps the entry base direction at the interface start for empty and mixed-script drafts",
  (Entry) => {
    const entry = (direction: "rtl" | "ltr", value: string) => (
      <SystemProvider config={{ ...defaultConfig, direction }}>
        <Entry value={value} onValueChange={() => {}} onSubmit={() => {}} />
      </SystemProvider>
    );
    const view = render(entry("rtl", ""));
    const input = screen.getByRole("textbox");
    for (const direction of ["rtl", "ltr"] as const) {
      for (const value of [
        "",
        "مرحبا",
        "Hello",
        "Tiraz / العربية",
        "العربية / Tiraz",
      ]) {
        view.rerender(entry(direction, value));
        expect(input).toHaveAttribute("dir", direction);
        expect(input).toHaveValue(value);
      }
    }
  },
);
it.each([ChatComposer, PromptBar])(
  "preserves an explicit host direction override",
  (Entry) => {
    const view = render(
      <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
        <Entry
          dir="ltr"
          value="Hello"
          onValueChange={() => {}}
          onSubmit={() => {}}
        />
      </SystemProvider>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("dir", "ltr");
    view.rerender(
      <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
        <Entry
          dir="auto"
          value="Hello"
          onValueChange={() => {}}
          onSubmit={() => {}}
        />
      </SystemProvider>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("dir", "auto");
  },
);
it.each(
  [
    { name: "ChatComposer", Entry: ChatComposer },
    { name: "PromptBar", Entry: PromptBar },
  ].flatMap((item) =>
    (["rtl", "ltr"] as const).map((direction) => ({ ...item, direction })),
  ),
)(
  "edits and selects mixed scripts with keyboard and IME guards in $name/$direction",
  async ({ Entry, direction }) => {
    const submit = vi.fn();
    function Host() {
      const [value, setValue] = useState("Hello العربية");
      return (
        <SystemProvider config={{ ...defaultConfig, direction }}>
          <Entry value={value} onValueChange={setValue} onSubmit={submit} />
        </SystemProvider>
      );
    }
    const user = userEvent.setup();
    render(<Host />);
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;
    await user.click(input);
    input.setSelectionRange(6, 13);
    expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe(
      "العربية",
    );
    await user.keyboard("مرحبًا");
    expect(input).toHaveValue("Hello مرحبًا");
    input.setSelectionRange(0, 5);
    await user.keyboard("Tiraz");
    expect(input).toHaveValue("Tiraz مرحبًا");
    input.setSelectionRange(input.value.length, input.value.length);
    await user.keyboard("{Shift>}{Enter}{/Shift}سطر / line");
    const expected = "Tiraz مرحبًا\nسطر / line";
    expect(input).toHaveValue(expected);
    expect(input).toHaveAttribute("dir", direction);
    expect(submit).not.toHaveBeenCalled();
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: /^(Send|إرسال)$/ }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(submit).not.toHaveBeenCalled();
    await act(async () => fireEvent.keyDown(input, { key: "Enter" }));
    expect(submit).toHaveBeenCalledExactlyOnceWith(expected);
    expect(input).toHaveValue(expected);
    expect(input).toHaveFocus();
  },
);
