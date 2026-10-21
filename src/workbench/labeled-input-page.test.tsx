import { aiParts, navigationCatalog } from "./catalog";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { defaultPlaygrounds } from "./model";
import {
  persist,
  readDocumentation,
  readPlaygrounds,
  storageKeys,
} from "./storage";
import { defaultConfig } from "../system";
import { generateCode } from "./generate";
it("redirects the saved Field page without losing Input customization", () => {
  persist(storageKeys.documentation, { language: "en", active: "field" });
  persist(storageKeys.playgrounds, {
    ...defaultPlaygrounds("en"),
    input: {
      ...defaultPlaygrounds("en").input,
      label: "Saved label",
      helper: "Saved help",
      value: "Saved value",
      size: "md",
      readOnly: true,
    },
  });
  expect(readDocumentation().active).toBe("input");
  expect(readPlaygrounds("en").input).toMatchObject({
    label: "Saved label",
    helper: "Saved help",
    value: "Saved value",
    size: "md",
    readOnly: true,
  });
});
it("makes Input the complete entry page while retaining Field in its API disclosure", async () => {
  persist(storageKeys.documentation, {
    language: "en",
    active: "input",
    settingsOpen: true,
  });
  render(<Workbench />);
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  expect(nav.queryByRole("button", { name: "Field" })).toBeNull();
  // Every page, less the fifteen folded AI parts, and their disclosure.
  expect(nav.getAllByRole("button")).toHaveLength(
    navigationCatalog.length - aiParts.length + 1,
  );
  await userEvent.click(nav.getByRole("button", { name: "Parts" }));
  expect(nav.getAllByRole("button")).toHaveLength(navigationCatalog.length + 1);
  const rail = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  );
  for (const name of [
    "Label",
    "Placeholder",
    "Helper text",
    "Error message",
    "Size",
  ])
    expect(rail.getByLabelText(name, { exact: true })).toBeInTheDocument();
  expect(rail.getByRole("switch", { name: "Required" })).toBeInTheDocument();
  expect(rail.queryByRole("switch", { name: "Invalid" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Create customer" })).toBeNull();
  await userEvent.click(screen.getByText("API reference", { exact: true }));
  expect(
    screen.getByText("Field · composition helper", { exact: true }),
  ).toBeVisible();
  await userEvent.click(nav.getByRole("button", { name: "Select" }));
  expect(screen.queryByRole("button", { name: "Create customer" })).toBeNull();
});
it("copies complete direct Input code and guidance despite the collapsed prompt row", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText");
  const model = {
    ...defaultPlaygrounds("en").input,
    label: "Invoice name",
    helper: "Invoice helper",
    error: "Invoice error",
    required: true,
  };
  persist(storageKeys.documentation, { language: "en", active: "input" });
  persist(storageKeys.playgrounds, {
    ...defaultPlaygrounds("en"),
    input: model,
  });
  render(<Workbench />);
  const code = generateCode(
    "input",
    model,
    { ...defaultConfig, direction: "ltr" },
    "en",
  );
  expect(code).toContain('<Input label={"Invoice name"}');
  expect(code).not.toContain("<Field");
  await user.click(screen.getByRole("tab", { name: "Code" }));
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  expect(write).toHaveBeenLastCalledWith(code);
  await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
  const prompt = write.mock.calls.at(-1)![0];
  expect(prompt).toContain(code);
  expect(prompt).toContain("ai/registry.json");
  expect(prompt).toContain("ai/composition.md");
  expect(prompt.endsWith(code + "```")).toBe(true);
  expect(JSON.parse(prompt.match(/SystemProvider: (.*)\n/)![1])).toEqual({
    ...defaultConfig,
    direction: "ltr",
  });
});

it("redirects legacy saved Field preferences and carries the old invalid preset into editable error text", () => {
  persist("tiraz.documentation.v1", { language: "en", active: "field" });
  persist(storageKeys.playgrounds, {
    input: {
      ...defaultPlaygrounds("en").input,
      invalid: true,
      value: "Saved",
      size: "md",
    },
  });
  expect(readDocumentation().active).toBe("input");
  expect(readPlaygrounds("en").input).toMatchObject({
    error: "Check the entered value.",
    value: "Saved",
    size: "md",
  });
});
for (const mode of ["controlled", "uncontrolled"] as const)
  it(`keeps ${mode} Input node, associations and value while inspector errors change`, async () => {
    persist(storageKeys.documentation, {
      language: "en",
      active: "input",
      settingsOpen: true,
    });
    persist(storageKeys.playgrounds, {
      input: { ...defaultPlaygrounds("en").input, mode, value: "Draft" },
    });
    render(<Workbench />);
    const preview = within(
      screen.getByRole("region", { name: "Interactive playground" }),
    );
    const input = preview.getByRole("textbox");
    const id = input.id;
    const rail = within(
      screen.getByRole("complementary", { name: "Customize the preview" }),
    );
    await userEvent.type(input, " updated");
    await userEvent.type(rail.getByLabelText("Error message"), "Correct this");
    expect(preview.getByRole("textbox")).toBe(input);
    expect(input.id).toBe(id);
    expect(input).toHaveValue("Draft updated");
    expect(input).toHaveAccessibleDescription("Correct this");
    await userEvent.clear(rail.getByLabelText("Error message"));
    expect(preview.getByRole("textbox")).toBe(input);
    expect(input.id).toBe(id);
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });
