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
    await user.click(
      screen.getByRole("button", { name: ar ? "التالي" : "Next" }),
    );
    const name = screen.getByRole("textbox", { name: ar ? /الاسم/ : /Name/ });
    expect(name).toHaveFocus();
    await user.type(name, "Sara");
    await user.click(
      screen.getByRole("button", { name: ar ? "التالي" : "Next" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: ar ? /البريد الإلكتروني/ : /Email/ }),
      "sara@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: ar ? "السابق" : "Back" }),
    );
    expect(screen.getByRole("textbox")).toHaveValue("Sara");
    await user.click(
      screen.getByRole("button", { name: ar ? "التالي" : "Next" }),
    );
    expect(screen.getByRole("textbox")).toHaveValue("sara@example.com");
    await user.click(
      screen.getByRole("button", { name: ar ? "التالي" : "Next" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: ar ? "إرسال الطلب" : "Submit application",
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("sara@example.com");
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
