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
for (const copy of [
  {
    language: "en",
    action: "Check form",
    notes: "Notes",
    helper: "Add a short note.",
    error: "Enter a note to complete the form check.",
    success: "Form check passed.",
    updates: "Receive updates",
    weekly: "Weekly",
    monthly: "Monthly",
    reset: "Reset",
  },
  {
    language: "ar",
    action: "تحقق من النموذج",
    notes: "ملاحظات",
    helper: "أضف ملاحظة قصيرة.",
    error: "أدخل ملاحظة لإكمال التحقق من النموذج.",
    success: "تم التحقق من النموذج بنجاح.",
    updates: "تلقي التحديثات",
    weekly: "أسبوعيًا",
    monthly: "شهريًا",
    reset: "إعادة الضبط",
  },
] as const) {
  it(`checks the ${copy.language} form accurately with associated errors, focus and native reset`, async () => {
    render(<FeedbackForm language={copy.language} />);
    const user = userEvent.setup(),
      notes = screen.getByRole("textbox", { name: copy.notes }),
      status = screen.getByRole("status");
    await user.click(screen.getByRole("button", { name: copy.action }));
    expect(notes).toHaveAccessibleDescription(`${copy.helper} ${copy.error}`);
    expect(notes).toHaveAttribute("aria-invalid", "true");
    expect(notes).toHaveFocus();
    expect(status).toBeEmptyDOMElement();
    await user.type(notes, "   ");
    await user.click(screen.getByRole("button", { name: copy.action }));
    expect(notes).toHaveFocus();
    expect(status).toBeEmptyDOMElement();
    await user.type(notes, "A useful note");
    await user.click(screen.getByLabelText(copy.updates));
    await user.click(screen.getByLabelText(copy.monthly));
    await user.click(screen.getByRole("button", { name: copy.action }));
    expect(status).toHaveTextContent(copy.success);
    expect(notes).toHaveAccessibleDescription(copy.helper);
    expect(notes).not.toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByRole("button", { name: copy.reset }));
    expect(notes).toHaveValue("");
    expect(screen.getByLabelText(copy.weekly)).toBeChecked();
    expect(screen.getByLabelText(copy.updates)).not.toBeChecked();
    expect(status).toBeEmptyDOMElement();
    await user.click(screen.getByRole("button", { name: copy.action }));
    await user.click(screen.getByRole("button", { name: copy.reset }));
    expect(notes).toHaveAccessibleDescription(copy.helper);
    expect(notes).not.toHaveAttribute("aria-invalid", "true");
  });
}
