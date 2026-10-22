import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SystemProvider } from "../system/Provider";
import { defaultConfig } from "../system/config";
import { KhaytStudio } from "./KhaytStudio";
import { useAgentColor } from "./useAgentColor";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const setup = (reduced = false, language: "ar" | "en" = "en") => {
  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
    delay: null,
  });
  const result = render(
    <SystemProvider
      config={{
        ...defaultConfig,
        reducedMotion: reduced,
        direction: language === "ar" ? "rtl" : "ltr",
      }}
    >
      <KhaytStudio language={language} navigate={vi.fn()} />
    </SystemProvider>,
  );
  return { user, ...result };
};

it("runs a task only when requested, waits for review, and never claims a message was sent", async () => {
  const { user } = setup();
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await act(async () => vi.advanceTimersByTime(10000));
  expect(screen.getByRole("button", { name: "Ready" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await user.click(screen.getByRole("button", { name: "Play a task" }));
  expect(screen.getByRole("status")).toHaveTextContent("Thinking");
  await act(async () => vi.advanceTimersByTime(2000));
  expect(screen.getByRole("status")).toHaveTextContent("Working");
  await act(async () => vi.advanceTimersByTime(5000));
  expect(screen.getByRole("status")).toHaveTextContent("Needs you");
  await act(async () => vi.advanceTimersByTime(20000));
  expect(screen.getByRole("status")).toHaveTextContent("Needs you");
  const finish = screen.getByRole("button", { name: "Finish preview review" });
  await user.click(finish);
  expect(finish).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("No message was sent");
});

it("pauses the task clock, cancels it on manual state selection, and cleans up on unmount", async () => {
  const { user, unmount } = setup();
  await user.click(screen.getByRole("button", { name: "Play a task" }));
  await act(async () => vi.advanceTimersByTime(1000));
  await user.click(screen.getByRole("button", { name: "Pause" }));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(screen.getByRole("status")).toHaveTextContent("Thinking");
  expect(screen.getByRole("button", { name: "Resume" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Resume" }));
  await act(async () => vi.advanceTimersByTime(1000));
  expect(screen.getByRole("status")).toHaveTextContent("Working");
  await user.click(screen.getByRole("button", { name: "Blocked" }));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Contact details are missing",
  );
  await user.click(screen.getByRole("button", { name: "Play a task" }));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps Arabic digits and static poses under reduced motion", async () => {
  const { user, container } = setup(true, "ar");
  expect(screen.getByText("٢٤ بكسل")).toBeVisible();
  expect(screen.getByText("٣٢ بكسل")).toBeVisible();
  expect(
    container.querySelectorAll('.khayt[data-animated="true"]'),
  ).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "جرّب مهمة" }));
  await act(async () => vi.advanceTimersByTime(6500));
  expect(screen.getByRole("status")).toHaveTextContent("بانتظارك");
  expect(
    container.querySelectorAll('.khayt[data-animated="true"]'),
  ).toHaveLength(0);
});

function OtherAgent() {
  const [color] = useAgentColor("customer");
  return <output aria-label="Customer color">{color}</output>;
}

it("saves the selected agent color, keeps the other agent distinct, and leaves feedback quiet", async () => {
  const { user } = setup();
  render(<OtherAgent />);
  await user.click(screen.getByRole("button", { name: "Ochre" }));
  expect(localStorage.getItem("tiraz.agent-color.collections.v1")).toBe(
    "#B59255",
  );
  expect(
    screen.getByLabelText("Collections agent color", {
      selector: 'input[type="text"]',
    }),
  ).toHaveValue("#B59255");
  expect(screen.getByLabelText("Customer color")).toHaveTextContent("#738D76");
  expect(screen.getAllByRole("status")[0]).toBeEmptyDOMElement();
});
