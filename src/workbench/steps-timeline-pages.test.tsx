import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { defaultPlaygrounds, normalizePlaygrounds } from "./model";
import { generateCode, generatePrompt } from "./generate";
import { defaultConfig } from "../system";
it.each([
  ["steps", "الخطوات", "Steps", "التنقّل"],
  ["timeline", "الخط الزمني", "Timeline", "البيانات"],
] as const)(
  "documents %s in its group with continuous examples, synchronized code and full prompt",
  async (id, ar, en, group) => {
    const user = userEvent.setup();
    render(<Workbench />);
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      within(
        within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
          "group",
          { name: group },
        ),
      ).getByRole("button", { name: ar }),
    );
    expect(screen.getByRole("heading", { name: ar, level: 1 })).toBeVisible();
    for (const name of ["أمثلة", "مثال الاستخدام"])
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    if (id === "steps") {
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Orientation" }),
        "vertical",
      );
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Current state" }),
        "error",
      );
    }
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const code = String(copy.mock.calls.at(-1)?.[0]);
    expect(code).toContain(`${en}Example`);
    expect(code).not.toContain("workbench/");
    if (id === "steps") {
      expect(code).toContain('"orientation":"vertical"');
      expect(code).toContain('"currentState":"error"');
    }
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    const prompt = String(copy.mock.calls.at(-1)?.[0]);
    expect(prompt).toContain(code);
    expect(prompt).toContain("ai/README.md");
    const model = defaultPlaygrounds("en")[id];
    expect(generatePrompt(id, model, defaultConfig, "en")).toContain(
      generateCode(id, model, defaultConfig, "en"),
    );
  },
);
it("normalizes persisted sequence options against the real enums", () => {
  const p = normalizePlaygrounds(
    { steps: { orientation: "diagonal", currentState: "saving" } },
    "en",
  );
  expect(p.steps).toEqual(defaultPlaygrounds("en").steps);
});
