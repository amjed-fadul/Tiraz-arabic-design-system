import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { defaultConfig } from "../system";
import { defaultPlaygrounds } from "./model";
import { generateCode, generatePrompt } from "./generate";
it("adds five focused continuous pages with complete generated prompts", async () => {
  render(<Workbench />);
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText");
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  for (const [id, label] of [
    ["avatar", "الصورة الشخصية"],
    ["avatar-group", "مجموعة الصور"],
    ["tooltip", "التلميح"],
    ["modal", "النافذة الحوارية"],
    ["empty-state", "الحالة الفارغة"],
  ] as const) {
    if (!nav.queryByRole("button", { name: label }))
      await user.click(
        nav.getByRole("link", {
          name:
            id === "tooltip" || id === "modal" ? "النوافذ" : "العرض والتنبيهات",
        }),
      );
    await user.click(nav.getByRole("button", { name: label }));
    expect(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    ).not.toBeEmptyDOMElement();
    const code = generateCode(
      id,
      defaultPlaygrounds("ar")[id],
      defaultConfig,
      "ar",
    );
    expect(
      generatePrompt(id, defaultPlaygrounds("ar")[id], defaultConfig, "ar"),
    ).toContain(code);
    await user.click(screen.getByRole("tab", { name: "الكود" }));
    await user.click(screen.getByRole("button", { name: "نسخ الكود" }));
    const copiedCode = write.mock.calls.at(-1)![0];
    expect(copiedCode).toContain("SystemProvider");
    expect(copiedCode).toContain("./system");
    await user.click(screen.getByRole("button", { name: "نسخ الطلب" }));
    expect(write.mock.calls.at(-1)![0].endsWith(copiedCode + "```")).toBe(true);
    expect(code).not.toMatch(/https?:\/\/.*\.(jpg|png)/);
    if (["avatar", "avatar-group", "empty-state"].includes(id))
      expect(screen.queryByRole("status", { name: "آخر حدث" })).toBeNull();
  }
});
