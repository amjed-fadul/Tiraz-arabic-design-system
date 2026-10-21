import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { defaultConfig } from "../system";
import { defaultPlaygrounds } from "./model";
import { generateCode, generatePrompt } from "./generate";
it.each([
  ["file-dropzone", "اختيار الملفات", "FileDropzone"],
  ["color-picker", "اختيار اللون", "ColorPicker"],
] as const)(
  "documents %s continuously with working examples and portable full prompts",
  async (id, ar, en) => {
    render(<Workbench />);
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    const nav = screen.getByRole("navigation", { name: "المكوّنات" });
    if (id === "file-dropzone")
      await user.click(within(nav).getByRole("link", { name: "الملفات" }));
    await user.click(within(nav).getByRole("button", { name: ar }));
    expect(
      screen.getByRole("heading", { level: 1, name: ar }),
    ).toBeInTheDocument();
    // The code lives behind the playground's Code tab, not in a usage section.
    for (const name of ["مثال الاستخدام", "أمثلة"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(
      screen.getByRole("tablist", { name: "طريقة العرض" }),
    ).toBeInTheDocument();
    if (id === "file-dropzone")
      expect(
        within(nav).getByRole("group", { name: "الملفات" }),
      ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(
      screen.getByRole("heading", { level: 1, name: en }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Code" }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const copiedCode = String(copy.mock.calls.at(-1)?.[0]);
    expect(copiedCode).toContain(
      id === "file-dropzone"
        ? "onValueChange={setFiles}"
        : "onValueChange={setColor}",
    );
    expect(copiedCode).toContain("export default function Example()");
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    const copiedPrompt = String(copy.mock.calls.at(-1)?.[0]);
    expect(copiedPrompt).toContain(copiedCode);
    expect(copiedPrompt).toContain("ai/README.md");
    const model = defaultPlaygrounds("en")[id],
      code = generateCode(id, model, defaultConfig, "en");
    expect(code).toContain(
      id === "file-dropzone" ? "FileDropzoneExample" : "ColorPickerExample",
    );
    expect(generatePrompt(id, model, defaultConfig, "en")).toContain(code);
  },
);
