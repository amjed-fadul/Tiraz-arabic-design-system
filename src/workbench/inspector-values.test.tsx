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
