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
    systemPanelOpen: false,
    inspectorOpen: true,
  });
  render(<Workbench />);
  const state = within(
    screen.getByRole("complementary", { name: "التخصيص" }),
  ).getByRole("combobox", { name: "الحالة" });
  await user.selectOptions(state, "running");
  expect(state).toHaveValue("running");
});
