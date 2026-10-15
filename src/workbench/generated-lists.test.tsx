import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import * as ts from "typescript";
import * as system from "../system";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
function copiedExample(
  component: "task-rows" | "notification-list",
  language: "ar" | "en",
) {
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
  "runs copied %s task and notification examples with real local updates",
  async (language) => {
    const ar = language === "ar",
      user = userEvent.setup();
    const Tasks = copiedExample("task-rows", language);
    const view = render(<Tasks />);
    const controls = screen.getAllByRole("checkbox");
    await user.click(controls[0]);
    expect(controls[0]).toBeChecked();
    expect(controls[0]).toHaveFocus();
    expect(screen.getAllByRole("checkbox")).toEqual(controls);
    expect(screen.getByRole("status")).toHaveTextContent(
      ar ? "2 من 3 مكتملة" : "2 of 3 completed",
    );
    view.unmount();
    const Notices = copiedExample("notification-list", language);
    render(<Notices />);
    await user.click(
      screen.getByRole("button", { name: ar ? "غير المقروءة" : "Unread" }),
    );
    const read = screen.getAllByRole("button", {
      name: ar ? /^تحديد كمقروءة:/ : /^Mark as read:/,
    });
    await user.click(read[0]);
    expect(read[1]).toHaveFocus();
    await user.click(read[1]);
    expect(
      screen.getByRole("heading", {
        name: ar ? "لا توجد إشعارات غير مقروءة" : "No unread notifications",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: ar ? "غير المقروءة" : "Unread" }),
    ).toHaveFocus();
  },
);
