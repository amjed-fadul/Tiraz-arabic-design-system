import { createRef, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileDropzone } from "./FileDropzone";
import { ColorPicker } from "./ColorPicker";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const mount = (node: React.ReactNode) =>
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      {node}
    </SystemProvider>,
  );
const file = (name = "notes.txt", text = "abc", type = "text/plain") =>
  new File([text], name, { type, lastModified: 1 });
const picker = () => screen.getByLabelText("Files", { selector: "input" });
const drop = (files: File[]) =>
  fireEvent.drop(document.querySelector(".tz-file-drop")!, {
    dataTransfer: { files, types: ["Files"] },
  });
describe("FileDropzone", () => {
  it.each(["browse", "drop"])(
    "applies type/size/count checks with partial rejection on %s",
    (source) => {
      const change = vi.fn();
      mount(
        <FileDropzone
          label="Files"
          multiple
          accept=".txt,image/*"
          maxFileSize={4}
          maxFiles={2}
          onValueChange={change}
        />,
      );
      const files = [
        file(),
        file("bad.pdf", "a", "application/pdf"),
        file("big.txt", "12345"),
        file("photo.png", "a", "image/png"),
        file("extra.txt"),
      ];
      if (source === "browse")
        fireEvent.change(picker(), { target: { files } });
      else drop(files);
      expect(change).toHaveBeenLastCalledWith([files[0], files[3]]);
      expect(screen.getByRole("status")).toHaveTextContent(
        /bad.pdf.*type.*big.txt.*size.*extra.txt.*maximum/i,
      );
      expect(screen.getAllByRole("button", { name: /Remove/ })).toHaveLength(2);
    },
  );
  it("ignores same-metadata duplicates across and within batches, supports reselection after removal and forwards ref", async () => {
    const ref = createRef<HTMLInputElement>(),
      change = vi.fn();
    mount(
      <FileDropzone ref={ref} label="Files" multiple onValueChange={change} />,
    );
    expect(ref.current).toBe(picker());
    drop([file(), file()]);
    expect(change).toHaveBeenLastCalledWith([file()]);
    drop([file()]);
    expect(change).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(/already selected/i);
    await userEvent.click(
      screen.getByRole("button", { name: "Remove notes.txt" }),
    );
    expect(screen.getByRole("button", { name: /Browse files/ })).toHaveFocus();
    drop([file()]);
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    expect(picker()).toHaveValue("");
  });
  it("single selection replaces with the first valid file and preserves old selection on total rejection", () => {
    mount(<FileDropzone label="Files" defaultValue={[file()]} accept=".txt" />);
    drop([file("bad.pdf")]);
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    drop([file("new.txt"), file("extra.txt")]);
    expect(screen.queryByText("notes.txt")).toBeNull();
    expect(screen.getByText("new.txt")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/maximum/i);
  });
  it("disabled blocks browse, drop and removal; nested drag state does not flicker", () => {
    const change = vi.fn();
    const view = mount(
      <FileDropzone
        label="Files"
        disabled
        defaultValue={[file()]}
        onValueChange={change}
      />,
    );
    expect(picker()).toBeDisabled();
    expect(screen.getByRole("button", { name: /Browse files/ })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove notes.txt" }),
    ).toBeDisabled();
    drop([file("new.txt")]);
    expect(change).not.toHaveBeenCalled();
    view.rerender(
      <SystemProvider config={defaultConfig}>
        <FileDropzone label="Files" />
      </SystemProvider>,
    );
    const zone = document.querySelector(".tz-file-drop")!,
      child = zone.querySelector("button")!;
    fireEvent.dragEnter(zone, { dataTransfer: { types: ["Files"] } });
    fireEvent.dragEnter(child, { dataTransfer: { types: ["Files"] } });
    fireEvent.dragLeave(child);
    expect(zone).toHaveAttribute("data-dragging", "true");
    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute("data-dragging");
  });
  it("resets uncontrolled selections only after uncanceled reset, including external forms", async () => {
    const change = vi.fn();
    mount(
      <>
        <form id="files-form">
          <button type="reset">Reset</button>
        </form>
        <FileDropzone
          label="Files"
          form="files-form"
          defaultValue={[file()]}
          onValueChange={change}
        />
      </>,
    );
    drop([file("new.txt")]);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() =>
      expect(screen.getByText("notes.txt")).toBeInTheDocument(),
    );
    expect(change).toHaveBeenCalledTimes(1);
    drop([file("later.txt")]);
    const form = document.querySelector("form")!;
    form.addEventListener("reset", (e) => e.preventDefault(), { once: true });
    fireEvent.reset(form);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByText("later.txt")).toBeInTheDocument();
  });
  it("controlled selection remains authoritative through changes and reset", async () => {
    const change = vi.fn();
    mount(
      <form>
        <FileDropzone label="Files" value={[file()]} onValueChange={change} />
        <button type="reset">Reset</button>
      </form>,
    );
    drop([file("new.txt")]);
    expect(change).toHaveBeenCalled();
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Reset"));
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });
});
describe("ColorPicker", () => {
  const swatches = [
    { label: "Plum", value: "#a3c" },
    { label: "Blue", value: "#123456" },
  ];
  it("normalizes HEX on Enter/blur, preserves incomplete text and explains invalid commits without changing color", async () => {
    const change = vi.fn();
    mount(
      <ColorPicker label="Color" defaultValue="#abc" onValueChange={change} />,
    );
    const hex = screen.getByRole("textbox", { name: "Color" });
    expect(hex).toHaveValue("#AABBCC");
    fireEvent.change(hex, { target: { value: "#1" } });
    expect(hex).toHaveValue("#1");
    expect(change).not.toHaveBeenCalled();
    fireEvent.blur(hex);
    expect(hex).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("status")).toHaveTextContent(/#RGB.*#RRGGBB/);
    expect(document.querySelector("input[type=color]")).toHaveValue("#aabbcc");
    fireEvent.change(hex, { target: { value: "#a3c" } });
    fireEvent.keyDown(hex, { key: "Enter" });
    expect(hex).toHaveValue("#AA33CC");
    expect(change).toHaveBeenLastCalledWith("#AA33CC");
    expect(hex).not.toHaveAttribute("aria-invalid", "true");
    fireEvent.change(hex, { target: { value: "#12345678" } });
    fireEvent.blur(hex);
    expect(change).toHaveBeenCalledTimes(1);
  });
  it("synchronizes named swatches, native chooser, HEX and submitted value, with selection distinct from focus", async () => {
    mount(<ColorPicker label="Color" name="color" swatches={swatches} />);
    const blue = screen.getByRole("button", { name: "Blue" });
    await userEvent.click(blue);
    expect(blue).toHaveAttribute("aria-pressed", "true");
    expect(blue.querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("textbox")).toHaveValue("#123456");
    expect(document.querySelector("input[type=hidden]")).toHaveValue("#123456");
    fireEvent.change(document.querySelector("input[type=color]")!, {
      target: { value: "#aa33cc" },
    });
    expect(screen.getByRole("button", { name: "Plum" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("textbox")).toHaveValue("#AA33CC");
  });
  it("controlled parent can accept or reject commits; external value changes clear stale draft", async () => {
    const change = vi.fn();
    const view = mount(
      <ColorPicker label="Color" value="#123" onValueChange={change} />,
    );
    const hex = screen.getByRole("textbox");
    fireEvent.change(hex, { target: { value: "#fff" } });
    fireEvent.blur(hex);
    expect(change).toHaveBeenLastCalledWith("#FFFFFF");
    expect(hex).toHaveValue("#112233");
    view.rerender(
      <SystemProvider config={defaultConfig}>
        <ColorPicker label="Color" value="#abc" />
      </SystemProvider>,
    );
    expect(hex).toHaveValue("#AABBCC");
  });
  it("updates controlled values in a working parent, forwards ref/associations and disables every action", async () => {
    const ref = createRef<HTMLInputElement>();
    function Demo() {
      const [value, setValue] = useState("#123");
      return (
        <ColorPicker
          label="Color"
          helper="Opaque only"
          ref={ref}
          value={value}
          onValueChange={setValue}
          swatches={swatches}
        />
      );
    }
    const view = mount(<Demo />);
    expect(ref.current).toBe(screen.getByRole("textbox"));
    expect(ref.current).toHaveAccessibleDescription("Opaque only");
    await userEvent.click(screen.getByRole("button", { name: "Plum" }));
    expect(ref.current).toHaveValue("#AA33CC");
    view.rerender(
      <SystemProvider config={defaultConfig}>
        <ColorPicker label="Color" disabled swatches={swatches} name="color" />
      </SystemProvider>,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(document.querySelector("input[type=color]")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Plum" })).toBeDisabled();
    expect(document.querySelector("input[type=hidden]")).toBeDisabled();
  });
  it("reset restores initial uncontrolled color/draft without callback, honors cancellation and controlled ownership", async () => {
    const change = vi.fn();
    mount(
      <form>
        <ColorPicker label="Color" defaultValue="#abc" onValueChange={change} />
        <button type="reset">Reset</button>
      </form>,
    );
    const hex = screen.getByRole("textbox");
    fireEvent.change(hex, { target: { value: "#fff" } });
    fireEvent.blur(hex);
    await userEvent.click(screen.getByText("Reset"));
    await waitFor(() => expect(hex).toHaveValue("#AABBCC"));
    expect(change).toHaveBeenCalledTimes(1);
    fireEvent.change(hex, { target: { value: "#1" } });
    const form = document.querySelector("form")!;
    form.addEventListener("reset", (e) => e.preventDefault(), { once: true });
    fireEvent.reset(form);
    await new Promise((r) => setTimeout(r, 10));
    expect(hex).toHaveValue("#1");
  });
});

it("clears stale invalid feedback on external ColorPicker replacement", () => {
  const view = mount(<ColorPicker label="Color" value="#123" />);
  const hex = screen.getByRole("textbox");
  fireEvent.change(hex, { target: { value: "#1" } });
  fireEvent.blur(hex);
  expect(hex).toHaveAttribute("aria-invalid", "true");
  view.rerender(
    <SystemProvider config={defaultConfig}>
      <ColorPicker label="Color" value="#abc" />
    </SystemProvider>,
  );
  expect(hex).toHaveValue("#AABBCC");
  expect(hex).not.toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});
it("file example reports the currently selected list after changing selection mode", async () => {
  // Component remounts are a caller responsibility; changing multiple alone must not silently clear files.
  const view = mount(<FileDropzone label="Files" multiple />);
  drop([file()]);
  view.rerender(
    <SystemProvider config={defaultConfig}>
      <FileDropzone label="Files" multiple={false} />
    </SystemProvider>,
  );
  expect(screen.getByText("notes.txt")).toBeInTheDocument();
});

it("names each keyboard Browse control with its Field context", () => {
  mount(
    <>
      <FileDropzone label="Invoice" />
      <FileDropzone label="Reference" />
    </>,
  );
  expect(
    screen.getByRole("button", { name: "Invoice Browse files" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Reference Browse files" }),
  ).toBeInTheDocument();
});
it("preserves native required on HEX independently of committed hidden submission", async () => {
  mount(
    <form>
      <ColorPicker label="Color" name="color" required defaultValue="#abc" />
    </form>,
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "" } });
  fireEvent.blur(input);
  expect(input.validity.valueMissing).toBe(true);
  expect(new FormData(document.querySelector("form")!).get("color")).toBe(
    "#AABBCC",
  );
});
it("names the native color chooser with its Field context", () => {
  mount(<ColorPicker label="Illustration" />);
  expect(screen.getByLabelText("Illustration Choose color")).toHaveAttribute(
    "type",
    "color",
  );
});
it("carries standalone aria-label into the keyboard Browse name", () => {
  mount(<FileDropzone aria-label="Attachments" />);
  expect(
    screen.getByRole("button", { name: "Attachments Browse files" }),
  ).toBeInTheDocument();
});
