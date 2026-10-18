import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { defaultPlaygrounds } from "./model";
import { generateCode, generatePrompt } from "./generate";
import { defaultConfig } from "../system";
it.each([
  ["slider", "شريط التمرير", "Slider"],
  ["otp-input", "إدخال الرمز", "OTPInput"],
  ["date-picker", "اختيار التاريخ", "DatePicker"],
] as const)(
  "documents %s under Forms with complete code and portable prompt",
  async (id, ar, en) => {
    render(<Workbench />);
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    const nav = screen.getByRole("navigation", { name: "المكوّنات" });
    await user.click(
      within(within(nav).getByRole("group", { name: "النماذج" })).getByRole(
        "button",
        { name: ar },
      ),
    );
    expect(
      screen.getByRole("heading", { name: ar, level: 1 }),
    ).toBeInTheDocument();
    // The code lives behind the playground's Code tab, not in a usage section.
    for (const name of ["مثال الاستخدام", "أمثلة"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(
      screen.getByRole("tablist", { name: "طريقة العرض" }),
    ).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(
      screen.getByRole("heading", { name: en, level: 1 }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(`${en}Example`);
    expect(code).toContain("onValueChange={");
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    const prompt = String(copy.mock.calls.at(-1)?.[0]);
    expect(prompt).toContain(code);
    expect(prompt).toContain("ai/README.md");
    for (const mode of ["controlled", "uncontrolled"] as const) {
      const model = { ...defaultPlaygrounds("en")[id], mode };
      expect(generatePrompt(id, model, defaultConfig, "en")).toContain(
        generateCode(id, model, defaultConfig, "en"),
      );
    }
  },
);
