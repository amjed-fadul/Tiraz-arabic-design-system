import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
it.each([
  ["حالة التحميل", "LoadingState", "Variant", "orbit"],
  ["مؤشر النشاط", "ThinkingIndicator", "Label", "Preparing sample"],
  ["حالة النشاط", "ThinkingState", "Active", null],
])(
  "documents %s with contextual controls and portable copied code",
  async (ar, en, control, value) => {
    const user = userEvent.setup();
    render(<Workbench />);
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: "أمثلة" })).toBeVisible();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    const rail = within(
      screen.getByRole("complementary", { name: "Customization" }),
    );
    if (en === "LoadingState")
      await user.selectOptions(
        rail.getByRole("combobox", { name: control }),
        value!,
      );
    else if (en === "ThinkingIndicator") {
      await user.clear(rail.getByRole("textbox", { name: control }));
      await user.type(rail.getByRole("textbox", { name: control }), value!);
    } else await user.click(rail.getByRole("switch", { name: control }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    expect(code).toContain(
      en === "LoadingState"
        ? '"variant":"orbit"'
        : en === "ThinkingIndicator"
          ? '"label":"Preparing sample"'
          : '"active":false',
    );
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    expect(String(copy.mock.calls.at(-1)?.[0])).toContain(code);
  },
);
