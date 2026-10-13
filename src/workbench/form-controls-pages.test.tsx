import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { defaultConfig } from "../system";
import { defaultPlaygrounds } from "./model";
import { generateCode, generatePrompt } from "./generate";
import { FeedbackForm } from "../system/ai/examples/FeedbackForm";

it("adds four continuous documentation pages with complete prompt/code and preserves Field under Input", async () => {
  render(<Workbench />);
  const user = userEvent.setup();
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  for (const [id, label] of [
    ["badge", "الشارة"],
    ["checkbox", "مربع الاختيار"],
    ["radio-group", "مجموعة الخيارات"],
    ["textarea", "النص المتعدد"],
  ] as const) {
    await user.click(nav.getByRole("button", { name: label }));
    expect(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    ).not.toBeEmptyDOMElement();
    const p = defaultPlaygrounds("ar")[id],
      code = generateCode(id, p, defaultConfig, "ar");
    expect(generatePrompt(id, p, defaultConfig, "ar")).toContain(code);
    expect(code).toContain("./system");
    if (id === "badge")
      expect(
        screen.queryByRole("status", { name: "آخر حدث" }),
      ).not.toBeInTheDocument();
  }
  expect(nav.queryByRole("button", { name: "الحقل" })).not.toBeInTheDocument();
});
it("demonstrates application-owned validation and native reset in the small composed form", async () => {
  render(<FeedbackForm language="en" />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Save preferences" }));
  expect(
    screen.getByRole("textbox", { name: "Notes" }),
  ).toHaveAccessibleDescription(
    "Add a short note. Enter a note before saving.",
  );
  expect(screen.getByRole("textbox", { name: "Notes" })).toHaveFocus();
  await user.type(
    screen.getByRole("textbox", { name: "Notes" }),
    "A useful note",
  );
  await user.click(screen.getByLabelText("Receive updates"));
  await user.click(screen.getByLabelText("Monthly"));
  await user.click(screen.getByRole("button", { name: "Save preferences" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Saved for this session.",
  );
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue("");
  expect(screen.getByLabelText("Weekly")).toBeChecked();
  expect(screen.getByLabelText("Receive updates")).not.toBeChecked();
});
