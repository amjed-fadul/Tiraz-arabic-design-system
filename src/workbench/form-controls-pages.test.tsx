import { render, screen, waitFor, within } from "@testing-library/react";
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
    ["textarea", "مربع النص"],
  ] as const) {
    if (!nav.queryByRole("button", { name: label }))
      await user.click(
        nav.getByRole("button", {
          name: id === "badge" ? "العرض والتنبيهات" : "النماذج",
        }),
      );
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
    action: "Send feedback",
    notes: "Notes",
    helper: "Tell us what we could improve.",
    error: "Write your note before sending.",
    success: "Thanks — we received your note.",
    updates: "Receive updates",
    weekly: "Weekly",
    monthly: "Monthly",
  },
  {
    language: "ar",
    action: "إرسال الملاحظات",
    notes: "ملاحظات",
    helper: "أخبرنا بما يمكننا تحسينه.",
    error: "اكتب ملاحظتك قبل الإرسال.",
    success: "شكرًا لك، وصلتنا ملاحظتك.",
    updates: "تلقّي التحديثات",
    weekly: "أسبوعيًا",
    monthly: "شهريًا",
  },
] as const) {
  it(`validates the ${copy.language} form with associated errors and focus, then resets natively after sending`, async () => {
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
    await waitFor(() => expect(notes).toHaveValue(""));
    await waitFor(() =>
      expect(screen.getByLabelText(copy.weekly)).toBeChecked(),
    );
    expect(screen.getByLabelText(copy.updates)).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: copy.action }));
    expect(notes).toHaveAttribute("aria-invalid", "true");
    expect(status).toBeEmptyDOMElement();
  });
}
