import { createRef, useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TagInput } from "./TagInput";
import { defaultConfig } from "./config";
import { SystemProvider } from "./Provider";
const mount = (node: React.ReactNode) =>
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      {node}
    </SystemProvider>,
  );
describe("TagInput", () => {
  it("trims Enter tags, rejects empty/duplicate input and prevents form submission", async () => {
    const user = userEvent.setup(),
      change = vi.fn(),
      submit = vi.fn((e) => e.preventDefault());
    mount(
      <form onSubmit={submit}>
        <TagInput
          label="Tags"
          helper="Enter to add"
          error="Application error"
          defaultValue={["Design"]}
          onValueChange={change}
        />
      </form>,
    );
    const input = screen.getByRole("textbox", { name: "Tags" });
    expect(input).toHaveAccessibleDescription("Enter to add Application error");
    await user.type(input, "  Arabic  {Enter}");
    expect(change).toHaveBeenLastCalledWith(["Design", "Arabic"]);
    expect(input).toHaveValue("");
    await user.type(input, "Arabic{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent(/already added/i);
    expect(change).toHaveBeenCalledTimes(1);
    await user.clear(input);
    await user.type(input, " {Enter}");
    expect(submit).not.toHaveBeenCalled();
  });
  it("respects IME Enter and plain paste/editing", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    mount(<TagInput label="Tags" onValueChange={change} />);
    const input = screen.getByRole("textbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "日本語" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true, keyCode: 229 });
    expect(change).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    await user.click(input);
    await user.paste("alpha, beta\ngamma");
    expect(change).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toContain("alpha, beta");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(change).toHaveBeenCalledTimes(1);
  });
  it("removes only on empty Backspace, keeps input focus after each remove and forwards refs", async () => {
    const user = userEvent.setup(),
      ref = createRef<HTMLInputElement>();
    mount(
      <TagInput
        ref={ref}
        label="Tags"
        defaultValue={["One", "Two"]}
        data-example="tags"
      />,
    );
    const input = screen.getByRole("textbox");
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("data-example", "tags");
    await user.type(input, "x{Backspace}");
    expect(
      screen.getByRole("button", { name: "Remove Two" }),
    ).toBeInTheDocument();
    await user.keyboard("{Backspace}");
    expect(
      screen.queryByRole("button", { name: "Remove Two" }),
    ).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Remove One" }));
    expect(input).toHaveFocus();
  });
  it("honors maximum, disabled/read-only and controlled values", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    const { rerender } = mount(
      <TagInput
        label="Tags"
        value={["One"]}
        maxTags={1}
        onValueChange={change}
      />,
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "Two{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent(/maximum.*1/i);
    expect(change).not.toHaveBeenCalled();
    rerender(
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        <TagInput
          label="Tags"
          value={["One"]}
          readOnly
          onValueChange={change}
        />
      </SystemProvider>,
    );
    expect(input).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Remove One" })).toBeDisabled();
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(change).not.toHaveBeenCalled();
    rerender(<TagInput label="Tags" disabled defaultValue={["One"]} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
  it("submits repeated names, omits the draft and disabled tags, resets uncontrolled state without callbacks and respects cancellation", async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    const { container, rerender } = mount(
      <form id="tags-form">
        <TagInput
          label="Tags"
          name="tags"
          defaultValue={["One"]}
          onValueChange={change}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByRole("textbox"),
      form = container.querySelector("form")!;
    await user.type(input, "Two{Enter}draft");
    expect(new FormData(form).getAll("tags")).toEqual(["One", "Two"]);
    await user.click(screen.getByText("Reset"));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Remove Two" }),
      ).not.toBeInTheDocument(),
    );
    expect(input).toHaveValue("");
    expect(change).toHaveBeenCalledTimes(1);
    form.addEventListener("reset", (e) => e.preventDefault(), { once: true });
    await user.type(input, "Two{Enter}");
    await user.click(screen.getByText("Reset"));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(
      screen.getByRole("button", { name: "Remove Two" }),
    ).toBeInTheDocument();
    rerender(
      <form>
        <TagInput label="Tags" name="tags" defaultValue={["One"]} disabled />
      </form>,
    );
    expect(
      new FormData(container.querySelector("form")!).getAll("tags"),
    ).toEqual([]);
  });
  it("controlled reset belongs to the caller; external form association works", async () => {
    const user = userEvent.setup();
    function Example() {
      const [value, setValue] = useState(["One"]);
      return (
        <>
          <form id="external" onReset={() => setValue(["One"])}>
            <button type="reset">Reset</button>
          </form>
          <TagInput
            label="Tags"
            name="tags"
            form="external"
            value={value}
            onValueChange={setValue}
          />
        </>
      );
    }
    mount(<Example />);
    await user.type(screen.getByRole("textbox"), "Two{Enter}");
    expect(
      new FormData(
        document.getElementById("external") as HTMLFormElement,
      ).getAll("tags"),
    ).toEqual(["One", "Two"]);
    await user.click(screen.getByText("Reset"));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Remove Two" }),
      ).not.toBeInTheDocument(),
    );
  });
});
