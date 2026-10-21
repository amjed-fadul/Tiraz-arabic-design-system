import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
it("documents FileTree in Files with a minimal inspector and portable copied activation example", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  const copy = vi.spyOn(navigator.clipboard, "writeText");
  await user.click(
    within(
      within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
        "group",
        { name: "الملفات" },
      ),
    ).getByRole("button", { name: "شجرة الملفات" }),
  );
  expect(
    screen.getByRole("heading", { name: "شجرة الملفات", level: 1 }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "English" }));
  await user.click(screen.getByRole("button", { name: "Customize" }));
  await user.click(
    within(screen.getByRole("group", { name: "State mode" })).getByRole(
      "button",
      { name: "Controlled" },
    ),
  );
  const preview = within(
    screen.getByRole("region", { name: "Interactive playground" }),
  );
  await user.click(preview.getByRole("treeitem", { name: "tokens.css" }));
  expect(
    preview.getByRole("region", { name: "File preview" }),
  ).toHaveTextContent("--space: 8px");
  await user.click(screen.getByRole("tab", { name: "Code" }));
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  const code = String(copy.mock.calls.at(-1)?.[0]);
  expect(code).toContain("FileTreeExample");
  expect(code).toContain('"mode":"controlled"');
  expect(code).toContain("onActivate");
  expect(code).not.toContain("workbench/");
  await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
  expect(String(copy.mock.calls.at(-1)?.[0])).toContain(code);
  await user.click(screen.getByRole("switch", { name: "Empty state" }));
  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(preview.getByRole("heading", { name: "No files" })).toBeVisible();
});
