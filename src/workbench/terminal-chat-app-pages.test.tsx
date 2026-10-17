import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { generateCode, generatePrompt } from "./generate";
import { defaultPlaygrounds } from "./model";
import { defaultConfig } from "../system";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as system from "../system";
import * as ts from "typescript";
it.each([
  ["الطرفية", "Terminal"],
  ["تطبيق المحادثة", "ChatApp"],
])(
  "documents %s under AI patterns with continuous shared frames",
  async (ar, en) => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.click(
      within(
        screen.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
      ).getByRole("button", { name: ar }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "لغة التوثيق" }),
      "en",
    );
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    for (const name of ["Interactive playground", "Examples", "Usage example"])
      expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(
      document.querySelectorAll(".tz-demo-frame").length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("switch", { name: "Long output" })).toBeVisible();
  },
);
it.each(["terminal", "chat-app"] as const)(
  "runs generated %s with portable host ownership guidance",
  async (component) => {
    const model = defaultPlaygrounds("en")[component],
      config = { ...defaultConfig, direction: "ltr" as const };
    const code = generateCode(component, model, config, "en");
    const js = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    const result: { default?: React.ComponentType } = {},
      modules: Record<string, unknown> = {
        react: React,
        "react/jsx-runtime": jsx,
        "./system": system,
      };
    new Function("require", "exports", js)(
      (name: string) => (name.endsWith(".css") ? {} : modules[name]),
      result,
    );
    const Example = result.default!;
    render(<Example />);
    expect(screen.getAllByRole("region").length).toBeGreaterThan(0);
    const prompt = generatePrompt(component, model, config, "en");
    expect(prompt).toContain("Host owns conversations");
    expect(prompt).toContain("No HTML/ANSI interpretation");
  },
);
