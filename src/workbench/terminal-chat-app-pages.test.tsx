import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
import { generateCode, generatePrompt } from "./generate";
import { defaultPlaygrounds } from "./model";
import { defaultConfig } from "../system";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as system from "../system";
import * as ts from "typescript";
afterEach(() => vi.useRealTimers());
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
    expect(
      screen.getByRole("heading", { name: "Interactive playground" }),
    ).toBeVisible();
    // The playground frame carries the code; there is no usage section.
    for (const name of ["Usage example", "Examples"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(
      document.querySelectorAll(".tz-demo-frame").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("tablist", { name: "View" })).toBeVisible();
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
it.each(["chat-composer", "prompt-bar"] as const)(
  "fails %s playground sends from the inspector while keeping the draft",
  async (active) => {
    vi.useFakeTimers();
    persist(storageKeys.documentation, { language: "ar", active });
    render(<Workbench />);
    const failSend = within(
      screen.getByRole("complementary", { name: "التخصيص" }),
    ).getByRole("switch", { name: "تعذّر الإرسال" });
    expect(failSend).not.toBeChecked();
    fireEvent.click(failSend);
    const stage = within(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    );
    // Let any opening exchange finish before sending.
    await act(async () => vi.advanceTimersByTime(10000));
    const input = stage.getByRole("textbox", {
      name: active === "prompt-bar" ? "طلبك" : "رسالتك",
    });
    fireEvent.change(input, { target: { value: "لخّص الملاحظات" } });
    await act(async () => fireEvent.keyDown(input, { key: "Enter" }));
    await act(async () => vi.advanceTimersByTime(800));
    expect(input).toHaveAccessibleDescription(
      "تعذّر الإرسال. مسودتك محفوظة، حاول مرة أخرى.",
    );
    expect(input).toHaveValue("لخّص الملاحظات");
  },
);
it("brings the chat-thread playground answer after a thinking beat, and replays it without resetting the panel", async () => {
  vi.useFakeTimers();
  persist(storageKeys.documentation, { language: "en", active: "chat-thread" });
  render(<Workbench />);
  const longContent = within(
    screen.getByRole("complementary", { name: "Customization" }),
  ).getByRole("switch", { name: "Long content" });
  fireEvent.click(longContent);
  const region = () =>
    screen.getByRole("region", { name: "Interactive playground" });
  const stage = () => within(region());
  const thinking = () => region().querySelector(".tz-thinking-indicator");
  expect(thinking()).toHaveTextContent("Preparing reply");
  expect(stage().queryByRole("button", { name: "Good response" })).toBeNull();
  await act(async () => vi.advanceTimersByTime(1400));
  expect(thinking()).toBeNull();
  expect(stage().getByRole("button", { name: "Good response" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Replay example" }));
  expect(thinking()).toHaveTextContent("Preparing reply");
  expect(stage().queryByRole("button", { name: "Good response" })).toBeNull();
  expect(longContent).toBeChecked();
  await act(async () => vi.advanceTimersByTime(1400));
  expect(stage().getByRole("button", { name: "Good response" })).toBeVisible();
});
