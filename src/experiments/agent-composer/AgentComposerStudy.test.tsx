import {
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentComposerStudy } from "./AgentComposerStudy";

afterEach(() => vi.useRealTimers());

describe("the agent composer study", () => {
  it("holds automatic panels while their pin control has keyboard focus", () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const pin = within(
      screen.getByRole("region", { name: "Repository" }),
    ).getByRole("button", { name: "Keep panel open" });
    act(() => pin.focus());
    act(() => vi.advanceTimersByTime(3000));
    expect(pin).toHaveFocus();
    expect(screen.getByRole("region", { name: "Repository" })).toBeVisible();
    fireEvent.keyDown(pin, { key: "Escape" });
    expect(screen.getByRole("button", { name: /^Repo/ })).toHaveFocus();
  });

  it("can resume following a dismissed panel and returns focus when an inactive pin closes", () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Close repository" }));
    fireEvent.click(screen.getByRole("button", { name: /^Repo/ }));
    fireEvent.click(
      within(screen.getByRole("region", { name: "Repository" })).getByRole(
        "button",
        { name: "Let panel follow activity" },
      ),
    );
    expect(screen.getByRole("region", { name: "Repository" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^Skills/ }));
    const pin = within(
      screen.getByRole("region", { name: "Skills" }),
    ).getByRole("button", { name: "Let panel follow activity" });
    act(() => pin.focus());
    fireEvent.click(pin);
    expect(screen.getByRole("button", { name: /^Skills/ })).toHaveFocus();
    expect(screen.queryByRole("region", { name: "Skills" })).toBeNull();
  });

  it("restores visible panels after the agent count is reduced", () => {
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: /^Agents/ }));
    fireEvent.click(screen.getByRole("button", { name: "Fewer agents" }));
    fireEvent.click(screen.getByRole("button", { name: "Fewer agents" }));
    fireEvent.click(screen.getByRole("button", { name: /^Agents/ }));
    fireEvent.click(screen.getByRole("button", { name: "Show all panels" }));
    expect(screen.getByRole("region", { name: "Explorer" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Folders" })).toBeVisible();
  });

  it("starts compact and reveals tools and agents from activity without taking focus", () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    expect(screen.queryByRole("region", { name: "Repository" })).toBeNull();
    const draft = screen.getByRole("textbox", { name: "Your message" });
    draft.focus();
    fireEvent.keyDown(draft, { key: "Enter" });
    expect(screen.getByRole("region", { name: "Repository" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Explorer" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Builder" })).toBeNull();
    expect(draft).toHaveFocus();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("region", { name: "Folders" })).toBeVisible();
    expect(draft).toHaveFocus();
  });

  it("keeps manually opened panels and respects dismissal for the rest of the run", () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: /^Skills/ }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Close Explorer" }));
    act(() => vi.advanceTimersByTime(14000));
    expect(screen.queryByRole("region", { name: "Explorer" })).toBeNull();
    expect(screen.getByRole("region", { name: "Skills" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Stop generating" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("region", { name: "Skills" })).toBeVisible();
  });

  it("can turn off automatic reveals while keeping manual panels usable", () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("switch", { name: "Follow activity" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.queryByRole("region", { name: "Explorer" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Folders/ }));
    expect(screen.getByRole("region", { name: "Folders" })).toBeVisible();
  });

  it("offers a native effort slider with its tradeoff and keeps focus", async () => {
    const user = userEvent.setup();
    render(<AgentComposerStudy />);
    const choice = screen.getByRole("slider", { name: "Effort" });
    await user.click(choice);
    fireEvent.change(choice, { target: { value: "2" } });
    expect(choice).toHaveAttribute("aria-valuetext", "Deep");
    expect(choice).toHaveAccessibleDescription(
      "Complex changes, more reasoning",
    );
    expect(choice).toHaveFocus();
  });

  it("keeps a pinned automatic panel after completion and clears dismissals for a new run", async () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {});
    fireEvent.click(
      within(screen.getByRole("region", { name: "Explorer" })).getByRole(
        "button",
        { name: "Keep panel open" },
      ),
    );
    act(() => vi.advanceTimersByTime(30000));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("region", { name: "Explorer" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Reviewer" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close Explorer" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Your message" }), {
      target: { value: "Refine the motion" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {});
    expect(screen.getByRole("region", { name: "Explorer" })).toBeVisible();
  });

  it("keeps automatic panels open while a keyboard user is inspecting them", () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const branch = screen.getByRole("combobox", { name: "Branch" });
    act(() => branch.focus());
    act(() => vi.advanceTimersByTime(10000));
    expect(branch).toHaveFocus();
    expect(screen.getByRole("region", { name: "Repository" })).toBeVisible();
  });

  it("signals research only when it was enabled for the submitted run", async () => {
    vi.useFakeTimers();
    const { container } = render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Research" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {});
    act(() => vi.advanceTimersByTime(7000));
    fireEvent.click(screen.getByRole("switch", { name: "Web research" }));
    expect(container.querySelector('[data-wire="research"]')).toHaveAttribute(
      "data-active",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Stop generating" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Your message" }), {
      target: { value: "Continue with attached context" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {});
    act(() => vi.advanceTimersByTime(7000));
    expect(container.querySelector('[data-wire="research"]')).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("dismisses research without turning it off and returns keyboard focus", async () => {
    const user = userEvent.setup();
    render(<AgentComposerStudy />);
    await user.click(screen.getByRole("button", { name: "Research" }));
    await user.click(screen.getByRole("button", { name: "Close research" }));
    const trigger = screen.getByRole("button", {
      name: "Research",
    });
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(
      screen.getByRole("switch", { name: "Web research" }),
    ).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "How to try it" }));
    await user.click(screen.getByRole("button", { name: "Close help" }));
    expect(screen.getByRole("button", { name: "How to try it" })).toHaveFocus();
  });

  it("keeps focus on folder controls when adding or unchecking a new folder", async () => {
    const user = userEvent.setup();
    render(<AgentComposerStudy />);
    await user.click(screen.getByRole("button", { name: /^Folders/ }));
    await user.click(screen.getByRole("button", { name: "Add folder" }));
    const picker = screen.getByRole("region", { name: "Project folders" });
    const choice = within(picker).getByRole("checkbox", { name: "app/canvas" });
    await waitFor(() => expect(choice).toHaveFocus());
    await user.click(choice);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Add folder" })).toHaveFocus();
    const folder = screen.getByRole("checkbox", { name: "app/canvas" });
    await user.click(folder);
    expect(folder).toHaveFocus();
    expect(folder).not.toBeChecked();
  });

  it("shows the remaining agent when its count changes after a card was hidden", async () => {
    const user = userEvent.setup();
    render(<AgentComposerStudy />);
    await user.click(screen.getByRole("button", { name: /^Agents/ }));
    await user.click(screen.getByRole("button", { name: "Close Explorer" }));
    await user.click(screen.getByRole("button", { name: "Fewer agents" }));
    await user.click(screen.getByRole("button", { name: "Fewer agents" }));
    expect(screen.getByRole("region", { name: "Explorer" })).toBeVisible();
    expect(screen.getByRole("button", { name: /^Agents/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("retains folder selection and the draft when a panel is dismissed, and returns focus", async () => {
    const user = userEvent.setup();
    render(<AgentComposerStudy />);
    const draft = screen.getByRole("textbox", { name: "Your message" });
    await user.clear(draft);
    await user.type(draft, "Keep this draft");
    await user.click(screen.getByRole("button", { name: /^Folders/ }));
    const folder = screen.getByRole("checkbox", { name: "app/composer" });
    await user.click(folder);
    await user.click(screen.getByRole("button", { name: "Close folders" }));
    const trigger = screen.getByRole("button", { name: /^Folders/ });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(
      screen.getByRole("checkbox", { name: "app/composer" }),
    ).not.toBeChecked();
    expect(draft).toHaveValue("Keep this draft");
  });

  it("exposes discrete named effort levels through the native range", () => {
    render(<AgentComposerStudy />);
    const effort = screen.getByRole("slider", { name: "Effort" });
    effort.focus();
    expect(effort).toHaveAttribute("step", "1");
    fireEvent.change(effort, { target: { value: "3" } });
    expect(effort).toHaveAttribute("aria-valuetext", "Thorough");
    expect(effort).toHaveFocus();
  });

  it("keeps a run's original effort, survives hidden panels, and stops all remaining work", async () => {
    vi.useFakeTimers();
    render(<AgentComposerStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {});
    fireEvent.change(screen.getByRole("slider", { name: "Effort" }), {
      target: { value: "3" },
    });
    expect(screen.getByTestId("run-receipt")).toHaveTextContent("Balanced");
    fireEvent.click(screen.getByRole("button", { name: /^Agents/ }));
    act(() => vi.advanceTimersByTime(6500));
    fireEvent.click(screen.getByRole("button", { name: /^Agents/ }));
    expect(
      within(screen.getByRole("region", { name: "Explorer" })).getByRole(
        "button",
        {
          name: /Explorer: Trace dependencies/,
        },
      ),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Stop generating" }));
    const stopped = screen.getByTestId("run-receipt").textContent;
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByTestId("run-receipt").textContent).toBe(stopped);
    expect(screen.getAllByText("Stopped").length).toBeGreaterThan(0);
  });
});
