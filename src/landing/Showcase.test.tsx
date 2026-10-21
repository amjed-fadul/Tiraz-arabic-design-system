import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultConfig, SystemProvider } from "../system";
import { Showcase } from "./Showcase";

function showcase(ar = false, numerals: "arab" | "latn" = "arab") {
  return render(
    <SystemProvider
      config={{
        ...defaultConfig,
        direction: ar ? "rtl" : "ltr",
        reducedMotion: true,
        numerals,
      }}
    >
      <Showcase ar={ar} />
    </SystemProvider>,
  );
}

const updates = () =>
  screen
    .getAllByRole("status")
    .find((node) => node.getAttribute("aria-live") === "polite")!;

afterEach(() => vi.useRealTimers());

describe("landing pattern previews", () => {
  it("starts quiet and links each actual pattern to its documentation", () => {
    showcase();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(updates()).toBeEmptyDOMElement();
    for (const [name, id] of [
      ["TaskStarter", "task-starter"],
      ["AgentTask", "agent-task"],
      ["ApprovalCard", "approval-card"],
      ["ImageGeneration", "image-generation"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        `/library/components/${id}`,
      );
    }
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(4);
  });

  it("previews the edited request with its current context and keeps entry focus", async () => {
    const user = userEvent.setup();
    showcase();
    const entry = screen.getByRole("combobox", { name: "Your request" });
    await user.click(screen.getByRole("button", { name: "Review the brief" }));
    expect(entry).toHaveValue(
      "Review the project brief and list the open questions.",
    );
    await user.click(
      screen.getByRole("button", { name: "Remove Product notes" }),
    );
    await user.clear(entry);
    await user.type(entry, "Prepare a launch checklist.");
    await user.keyboard("{Enter}");
    expect(entry).toHaveFocus();
    expect(entry).toHaveValue("Prepare a launch checklist.");
    expect(
      screen.getByText("Prepare a launch checklist.", { selector: "p" }),
    ).toBeVisible();
    expect(updates()).toHaveTextContent(/Local preview ready.*1/);
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("runs only on request, stops its pending steps, and replays from the start", async () => {
    vi.useFakeTimers();
    const view = showcase();
    await act(async () => vi.advanceTimersByTime(12_000));
    expect(screen.getByRole("button", { name: /Start now/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /Start now/ }));
    await act(async () => vi.advanceTimersByTime(1_500));
    const stop = screen.getByRole("button", { name: "Stop" });
    stop.focus();
    fireEvent.click(stop);
    expect(
      screen.getByRole("region", { name: "Prepare the launch plan" }),
    ).toHaveFocus();
    await act(async () => vi.advanceTimersByTime(12_000));
    expect(updates()).toHaveTextContent("Task preview stopped");
    const replay = screen.getByRole("button", { name: "Replay task" });
    replay.focus();
    fireEvent.click(replay);
    expect(
      screen.getByRole("region", { name: "Prepare the launch plan" }),
    ).toHaveFocus();
    for (let step = 0; step < 3; step++) {
      await act(async () => vi.advanceTimersByTime(1_500));
    }
    expect(updates()).toHaveTextContent("Task preview complete");
    expect(
      screen.getByText("Launch checklist", { selector: "bdi" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Replay task" }));
    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("records a reversible local decision and can reset it for a different choice", async () => {
    const user = userEvent.setup();
    showcase();
    await user.click(screen.getByRole("button", { name: /Approve plan/ }));
    const approval = screen.getByRole("group", {
      name: "Approve the launch plan?",
    });
    expect(
      within(approval).getByText("Plan approved for this preview"),
    ).toBeVisible();
    expect(updates()).toHaveTextContent("Plan approval recorded locally");
    await user.click(screen.getByRole("button", { name: "Reset decision" }));
    expect(
      screen.getByRole("button", { name: "Reset decision" }),
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: /Keep reviewing/ }));
    expect(screen.getByText("Plan kept in review")).toBeVisible();
    expect(updates()).toHaveTextContent("Plan kept in review locally");
  });

  it("finishes image previews, selects a local version, and reruns variations", async () => {
    vi.useFakeTimers();
    const view = showcase();
    expect(screen.getByRole("radio", { name: "Version 1" })).toBeDisabled();
    const generate = screen.getByRole("button", { name: "Generate preview" });
    generate.focus();
    fireEvent.click(generate);
    expect(
      screen.getByRole("region", { name: "Image generation" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("progressbar", { name: "Image progress" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Use image" })).toBeDisabled();
    await act(async () => vi.advanceTimersByTime(4_500));
    fireEvent.click(screen.getByRole("radio", { name: "Version 2" }));
    expect(screen.getByRole("radio", { name: "Version 2" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Use image" }));
    expect(updates()).toHaveTextContent("Version 2 selected for this preview");
    expect(
      screen.getByText("Version 2 selected for this preview", {
        selector: "p",
      }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Generate variations" }),
    );
    await act(async () => vi.advanceTimersByTime(4_500));
    expect(screen.getByRole("button", { name: "Use image" })).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Generate variations" }),
    );
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the English prompt and uses the configured digits in Arabic feedback", async () => {
    vi.useFakeTimers();
    showcase(true, "latn");
    expect(screen.getByRole("combobox", { name: "طلبك" })).toHaveValue(
      "Turn this project brief into a clear launch plan.",
    );
    expect(screen.getByRole("combobox", { name: "طلبك" })).toHaveAttribute(
      "dir",
      "auto",
    );
    fireEvent.click(screen.getByRole("button", { name: "جرّب التوليد" }));
    await act(async () => vi.advanceTimersByTime(4_500));
    fireEvent.click(screen.getByRole("radio", { name: "النسخة 2" }));
    fireEvent.click(screen.getByRole("button", { name: "استخدم الصورة" }));
    expect(updates()).toHaveTextContent("اختيرت النسخة 2 لهذه المعاينة");
  });
});
