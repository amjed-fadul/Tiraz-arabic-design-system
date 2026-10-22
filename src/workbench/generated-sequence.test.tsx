import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import * as ts from "typescript";
import * as system from "../system";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
function copiedExample(component: "steps" | "timeline", language: "ar" | "en") {
  const model = defaultPlaygrounds(language)[component];
  const code = generateCode(
    component,
    model,
    { ...system.defaultConfig, direction: language === "ar" ? "rtl" : "ltr" },
    language,
  );
  const javascript = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports: { default?: React.ComponentType } = {};
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsx,
    "lucide-react": icons,
    "./system": system,
  };
  new Function("require", "exports", javascript)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    exports,
  );
  return exports.default!;
}
it.each(["ar", "en"] as const)(
  "runs copied %s process and event examples without workbench runtime",
  async (language) => {
    const user = userEvent.setup(),
      ar = language === "ar";
    const Steps = copiedExample("steps", language);
    const view = render(<Steps />);
    // The copied code renders only the interactive stages the preview shows.
    expect(screen.queryByRole("textbox")).toBeNull();
    const stages = screen.getByRole("list", {
      name: ar ? "مراحل الطلب" : "Application stages",
    });
    const statuses = () =>
      Array.from(stages.querySelectorAll(".tz-step"), (step) =>
        step.getAttribute("data-status"),
      );
    const stage = (label: string) =>
      within(stages).getByRole("button", { name: new RegExp(label) });
    expect(statuses()).toEqual(["completed", "current", "upcoming"]);
    expect(stage(ar ? "التفاصيل" : "Details")).toHaveAttribute(
      "aria-current",
      "step",
    );
    const back = screen.getByRole("button", { name: ar ? "السابق" : "Back" });
    await user.click(back);
    expect(statuses()).toEqual(["current", "upcoming", "upcoming"]);
    expect(back).toBeDisabled();
    await user.click(stage(ar ? "المراجعة" : "Review"));
    expect(statuses()).toEqual(["completed", "completed", "current"]);
    await user.click(
      screen.getByRole("button", { name: ar ? "إنهاء" : "Finish" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      ar ? "اكتملت جميع المراحل." : "All stages are complete.",
    );
    expect(statuses()).toEqual(["completed", "completed", "completed"]);
    expect(stages.querySelector('[aria-current="step"]')).toBeNull();
    expect(
      screen.queryByRole("button", { name: ar ? "التالي" : "Next" }),
    ).toBeNull();
    await user.click(back);
    expect(screen.queryByRole("status")).toBeNull();
    expect(statuses()).toEqual(["completed", "completed", "current"]);
    view.unmount();
    const Timeline = copiedExample("timeline", language);
    render(<Timeline />);
    const list = screen.getByRole("list", {
      name: ar ? "سجل النشاط" : "Activity log",
    });
    const original = within(list).getAllByRole("listitem")[0];
    await user.click(
      screen.getByRole("button", {
        name: ar ? "تسجيل مكالمة" : "Log a call",
      }),
    );
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getAllByRole("listitem")[0]).toBe(original);
    expect(list.querySelectorAll("time")).toHaveLength(3);
  },
);
