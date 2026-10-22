import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
it("opens a saved Table page, edits content, and copies the complete current example and prompt", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText");
  persist(storageKeys.documentation, {
    language: "en",
    active: "table",
    settingsOpen: true,
  });
  render(<Workbench />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Table" }),
  ).toBeInTheDocument();
  const canvas = document.querySelector(".playground-canvas") as HTMLElement;
  expect(
    within(canvas).getByRole("table", { name: "Customers" }),
  ).toHaveTextContent("Madar Technology");
  await user.clear(screen.getByLabelText("Caption", { exact: true }));
  await user.type(
    screen.getByLabelText("Caption", { exact: true }),
    "Team records",
  );
  await user.click(
    within(screen.getByRole("group", { name: "Content" })).getByRole("button", {
      name: "Empty",
    }),
  );
  expect(
    within(canvas).getByRole("table", { name: "Team records" }),
  ).toHaveTextContent("No customers yet.");
  expect(within(canvas).queryByText("Madar Technology")).toBeNull();
  await user.click(screen.getByRole("tab", { name: "Code" }));
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  const code = write.mock.calls.at(-1)![0];
  expect(code).toContain('<Table caption={"Team records"}');
  expect(code).toContain("colSpan={3}");
  await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
  const prompt = write.mock.calls.at(-1)![0];
  expect(prompt).toContain("Table.tsx");
  expect(prompt).toContain("ai/registry.json");
  expect(prompt.endsWith(code + "```")).toBe(true);
  expect(screen.queryByRole("button", { name: "Create customer" })).toBeNull();
});
