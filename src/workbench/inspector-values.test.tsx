import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";

it("keeps a page-specific state chosen in the inspector", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, {
    language: "ar",
    active: "terminal",
    settingsOpen: true,
  });
  render(<Workbench />);
  const state = within(
    within(
      screen.getByRole("complementary", { name: "تخصيص المعاينة" }),
    ).getByRole("group", { name: "الحالة" }),
  );
  await user.click(state.getByRole("button", { name: "يعمل" }));
  expect(state.getByRole("button", { name: "يعمل" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

it("associates collection validation errors with the editor", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, {
    language: "en",
    active: "select",
    settingsOpen: true,
  });
  render(<Workbench />);
  const settings = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  );
  const editor = settings.getByRole("textbox", { name: "Options" });
  await user.clear(editor);
  await user.paste("invalid JSON");
  await user.click(settings.getByRole("button", { name: "Apply collection" }));
  expect(editor).toHaveAttribute("aria-invalid", "true");
  expect(editor).toHaveAccessibleDescription(
    "Invalid collection. Check types and unique identifiers.",
  );
});

it("keeps Apply focused after valid edits and reset focused after discarding a draft", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, {
    language: "en",
    active: "select",
    settingsOpen: true,
  });
  render(<Workbench />);
  const settings = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  );
  const editor = settings.getByRole("textbox", { name: "Options" });
  await user.clear(editor);
  await user.paste('[{"value":"active","label":"Available"}]');
  const apply = settings.getByRole("button", { name: "Apply collection" });
  await user.click(apply);
  expect(apply).toHaveFocus();
  expect(
    within(
      screen.getByRole("region", { name: "Interactive playground" }),
    ).getByRole("combobox"),
  ).toHaveTextContent("Available");
  await user.clear(editor);
  await user.paste("unfinished draft");
  const reset = settings.getByRole("button", { name: "Reset playground" });
  await user.click(reset);
  expect(reset).toHaveFocus();
  expect(settings.getByRole("textbox", { name: "Options" })).not.toHaveValue(
    "unfinished draft",
  );
});
