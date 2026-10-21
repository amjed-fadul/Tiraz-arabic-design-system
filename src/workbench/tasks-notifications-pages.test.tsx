import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
it.each([
  ["صفوف المهام", "TaskRows", "أنماط الذكاء الاصطناعي", "Appearance"],
  ["قائمة الإشعارات", "NotificationList", "العرض والتنبيهات", "Read controls"],
])(
  "documents %s with continuous examples, inspector and complete copied source",
  async (ar, en, group, inspector) => {
    const user = userEvent.setup();
    render(<Workbench />);
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
    // TaskRows is one of the AI parts, folded until their disclosure opens.
    await user.click(nav.getByRole("button", { name: "الأجزاء" }));
    await user.click(
      within(nav.getByRole("group", { name: group })).getByRole("button", {
        name: ar,
      }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    // The playground frame is the only stage and carries the code.
    for (const name of ["مثال الاستخدام", "أمثلة"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(screen.getByRole("tablist", { name: "طريقة العرض" })).toBeVisible();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Customize" }));
    if (en === "TaskRows")
      await user.click(
        within(screen.getByRole("group", { name: inspector })).getByRole(
          "button",
          { name: "Connected list" },
        ),
      );
    else await user.click(screen.getByRole("switch", { name: inspector }));
    await user.click(screen.getByRole("tab", { name: "Code" }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(en + "Example");
    expect(code).not.toContain("workbench/");
    expect(code).toContain(
      en === "TaskRows" ? '"appearance":"list"' : '"readControls":false',
    );
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    expect(String(copy.mock.calls.at(-1)?.[0])).toContain(code);
    expect(String(copy.mock.calls.at(-1)?.[0])).toContain("ai/README.md");
  },
);
