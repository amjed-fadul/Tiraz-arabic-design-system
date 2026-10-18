import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
it("documents DataTable with minimal controls and copies the connected portable application", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText");
  persist(storageKeys.documentation, { language: "en", active: "data-table" });
  render(<Workbench />);
  expect(
    screen.getByRole("heading", { level: 1, name: "DataTable" }),
  ).toBeInTheDocument();
  const canvas = document.querySelector(".playground-canvas") as HTMLElement;
  expect(within(canvas).getByRole("searchbox")).toBeInTheDocument();
  expect(within(canvas).getByRole("table")).toHaveTextContent("hello@madar.sa");
  await user.clear(screen.getByLabelText("Caption", { exact: true }));
  await user.type(
    screen.getByLabelText("Caption", { exact: true }),
    "Team records",
  );
  await user.selectOptions(
    screen.getByLabelText("Example state", { exact: true }),
    "error",
  );
  expect(
    within(canvas).getByRole("button", { name: "Retry" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  const code = write.mock.calls.at(-1)![0];
  expect(code).toContain('caption={"Team records"}');
  expect(code).toContain("function CustomerDataTable");
  expect(code).toContain("function CreateCustomer");
  expect(code).not.toContain("workbench");
  await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
  expect(write.mock.calls.at(-1)![0].endsWith(code + "```")).toBe(true);
});
