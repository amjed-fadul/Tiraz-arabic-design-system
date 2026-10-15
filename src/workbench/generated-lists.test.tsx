import { act, render, screen } from "@testing-library/react";
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
  component: "task-rows" | "notification-list" | "file-tree",
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
    expect(screen.queryByRole("checkbox")).toBeNull();
    const disclosure = screen.getByRole("button", {
      name: ar ? /بناء مخطط نموذجي/ : /Build sample outline/,
    });
    await user.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", {
        name: ar ? "إعادة المحاولة محليًا" : "Retry local simulation",
      }),
    ).toHaveAttribute("aria-disabled", "true");
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

it.each(["ar", "en"] as const)(
  "runs copied %s FileTree source with host-owned sample text",
  async (language) => {
    const user = userEvent.setup(),
      Example = copiedExample("file-tree", language);
    render(<Example />);
    const tree = screen.getByRole("tree");
    const file = tree.querySelector('[aria-selected="true"]') as HTMLElement;
    act(() => file.focus());
    await user.keyboard("{ArrowDown} ");
    expect(
      screen.getByRole("treeitem", { name: "tokens.css" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("region", {
        name: language === "ar" ? "معاينة الملف" : "File preview",
      }),
    ).toHaveTextContent("--space: 8px");
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("region", {
        name: language === "ar" ? "معاينة الملف" : "File preview",
      }),
    ).toHaveTextContent("--space: 8px");
  },
);
