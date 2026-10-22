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
import * as icons from "lucide-react";
import * as system from "../system";
import * as financeStory from "../system/ai/examples/finance-story";
import * as ts from "typescript";
afterEach(() => vi.useRealTimers());
it.each([["الطرفية", "Terminal", "العرض والتنبيهات"]])(
  "documents %s in its group with continuous shared frames",
  async (ar, en, group) => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.click(screen.getByRole("button", { name: group }));
    await user.click(
      within(screen.getByRole("group", { name: group })).getByRole("button", {
        name: ar,
      }),
    );
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading", { name: en, level: 1 })).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Interactive playground" }),
    ).toBeVisible();
    // The playground frame carries the code; there is no usage section.
    for (const name of ["Usage example", "Examples"])
      expect(screen.queryByRole("heading", { name })).toBeNull();
    expect(
      document.querySelectorAll(".tz-demo-frame").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("tablist", { name: "View" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Customize" }));
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
        "lucide-react": icons,
        "./system": system,
        "./system/ai/examples/finance-story": financeStory,
      };
    new Function("require", "exports", js)(
      (name: string) => (name.endsWith(".css") ? {} : modules[name]),
      result,
    );
    const Example = result.default!;
    render(<Example />);
    expect(screen.getAllByRole("region").length).toBeGreaterThan(0);
    const prompt = generatePrompt(component, model, config, "en");
    expect(prompt).toContain(
      component === "chat-app"
        ? "Host owns conversations"
        : "No HTML/ANSI interpretation",
    );
    expect(prompt).not.toContain(
      component === "chat-app"
        ? "No HTML/ANSI interpretation"
        : "Host owns conversations",
    );
  },
);
it.each(["chat-composer", "prompt-bar"] as const)(
  "fails %s playground sends from the inspector while keeping the draft",
  async (active) => {
    vi.useFakeTimers();
    persist(storageKeys.documentation, {
      language: "ar",
      active,
      settingsOpen: true,
    });
    render(<Workbench />);
    const failSend = within(
      screen.getByRole("complementary", { name: "تخصيص المعاينة" }),
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
it("opens the chat-thread playground on the new message, and replays the thinking beat without resetting the panel", async () => {
  vi.useFakeTimers();
  persist(storageKeys.documentation, {
    language: "en",
    active: "chat-thread",
    settingsOpen: true,
  });
  render(<Workbench />);
  const longContent = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  ).getByRole("switch", { name: "Long content" });
  fireEvent.click(longContent);
  const region = () =>
    screen.getByRole("region", { name: "Interactive playground" });
  const stage = () => within(region());
  const thinking = () => region().querySelector(".tz-thinking-indicator");
  // The page rests on the answer, and nothing plays on its own.
  expect(thinking()).toBeNull();
  expect(stage().getByRole("button", { name: "Good response" })).toBeVisible();
  await act(async () => vi.advanceTimersByTime(1400));
  expect(thinking()).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Replay example" }));
  expect(thinking()).toHaveTextContent("Preparing reply");
  expect(stage().queryByRole("button", { name: "Good response" })).toBeNull();
  expect(longContent).toBeChecked();
  await act(async () => vi.advanceTimersByTime(1400));
  expect(thinking()).toBeNull();
  expect(stage().getByRole("button", { name: "Good response" })).toBeVisible();
});
