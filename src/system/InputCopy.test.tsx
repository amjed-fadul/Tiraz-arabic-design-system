import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InputCopy } from "./InputCopy";
import { defaultConfig } from "./config";
import { SystemProvider } from "./Provider";
const mount = (node: React.ReactNode) =>
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      {node}
    </SystemProvider>,
  );
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const clipboard = (writeText: unknown) =>
  Object.defineProperty(navigator, "clipboard", {
    value: writeText === undefined ? undefined : { writeText },
    configurable: true,
  });
describe("InputCopy", () => {
  it("copies the exact full value only announcing success after resolution, then clears success", async () => {
    let finish!: () => void;
    const write = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    clipboard(write);
    const value =
      "https://example.test/very-long/مسار?key=hello&other=full-value";
    mount(<InputCopy label="Link" value={value} helper="Select or copy" />);
    expect(screen.getByRole("textbox")).toHaveValue(value);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
    expect(write).toHaveBeenCalledWith(value);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await act(async () => finish());
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await waitFor(
      () => expect(screen.getByRole("status")).toBeEmptyDOMElement(),
      { timeout: 3000 },
    );
  });
  it.each(["rejected", "unavailable"])(
    "reports %s clipboard honestly and leaves selectable text",
    async (kind) => {
      clipboard(
        kind === "rejected"
          ? vi.fn().mockRejectedValue(new Error("Denied"))
          : undefined,
      );
      mount(<InputCopy label="Code" value="Full code" error="Host error" />);
      fireEvent.click(screen.getByRole("button", { name: "Copy Code" }));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          /could not copy.*select/i,
        ),
      );
      expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
        expect.stringContaining("Host error"),
      );
      const input = screen.getByRole("textbox") as HTMLInputElement;
      input.focus();
      input.select();
      expect(input.selectionEnd).toBe(9);
    },
  );
  it("cancels pending results and timers when value changes or unmounts", async () => {
    let resolve!: () => void;
    clipboard(vi.fn(() => new Promise<void>((r) => (resolve = r))));
    const { rerender, unmount } = mount(<InputCopy label="Code" value="old" />);
    fireEvent.click(screen.getByRole("button"));
    rerender(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <InputCopy label="Code" value="new" />
      </SystemProvider>,
    );
    await act(async () => resolve());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy", "true");
    fireEvent.click(screen.getByRole("button"));
    unmount();
    await act(async () => resolve());
  });
  it("clears resolved feedback on value replacement and disables copy when disabled", async () => {
    clipboard(vi.fn().mockResolvedValue(undefined));
    const { rerender } = mount(<InputCopy label="Code" value="old" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Copied"),
    );
    rerender(<InputCopy label="Code" value="new" disabled />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

it("clears success timers on replacement/unmount and never revives old feedback", async () => {
  vi.useFakeTimers();
  clipboard(vi.fn().mockResolvedValue(undefined));
  const { rerender, unmount } = mount(<InputCopy label="Code" value="old" />);
  await act(async () => fireEvent.click(screen.getByRole("button")));
  expect(vi.getTimerCount()).toBe(1);
  rerender(<InputCopy label="Code" value="new" />);
  expect(vi.getTimerCount()).toBe(0);
  rerender(<InputCopy label="Code" value="old" />);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await act(async () => fireEvent.click(screen.getByRole("button")));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
