import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
it.each([
  ["استدعاء الأداة", "ToolCall", "Long output"],
  ["ملخص الأدوات", "ToolChips", "Counts"],
])(
  "documents %s with portable copied code and connected demo",
  async (ar, en, control) => {
    const user = userEvent.setup();
    render(<Workbench />);
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { level: 1, name: ar })).toBeVisible();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { level: 1, name: en })).toBeVisible();
    const inspector = within(
      screen.getByRole("complementary", { name: "Customization" }),
    );
    await user.click(inspector.getByRole("switch", { name: control }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).toContain("ToolActivityDemo");
    expect(code).not.toContain("workbench/");
    expect(code).toContain(
      en === "ToolCall" ? '"longContent":true' : '"counts":false',
    );
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    expect(String(copy.mock.calls.at(-1)?.[0])).toContain(code);
    const chip = screen.getByRole("button", { name: /Read notes/ });
    await user.click(chip);
    const detail = document.getElementById(
      chip.getAttribute("aria-controls")!,
    )!;
    expect(within(detail).getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(within(detail).getByRole("button")).toHaveFocus();
  },
);
