import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ScreenFrame } from "./ScreenFrame";
import { ScreenAgentHeading } from "./ScreenDemo";

afterEach(() => vi.useRealTimers());

it("keeps an agent's blocked state during another opening demo and pauses its motion", () => {
  vi.useFakeTimers();
  const { container } = render(
    <ScreenFrame slug="agent-control-room">
      <ScreenAgentHeading
        agent="campaigns"
        title="Campaign designer"
        state="blocked"
      />
    </ScreenFrame>,
  );
  const mascot = container.querySelector(".screen-agent-heading .khayt");
  expect(mascot).toHaveAttribute("data-state", "blocked");
  expect(mascot).toHaveAttribute("aria-hidden", "true");
  expect(
    container.querySelector(".screen-agent-heading [aria-live]"),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "إيقاف العرض مؤقتًا" }));
  expect(mascot).toHaveAttribute("data-animated", "false");
  act(() => vi.advanceTimersByTime(1000));
  expect(mascot).toHaveAttribute("data-state", "blocked");
});

it("shares a chosen color between the same agent's areas while keeping another agent distinct", async () => {
  window.history.replaceState(
    null,
    "",
    "/examples/agent-control-room?lang=en&demo=off",
  );
  const user = userEvent.setup();
  const { container } = render(
    <ScreenFrame slug="agent-control-room">
      <ScreenAgentHeading
        agent="finance"
        title="Finance agent"
        state="waiting"
      />
      <ScreenAgentHeading
        agent="finance"
        title="Finance task"
        state="working"
      />
      <ScreenAgentHeading
        agent="campaigns"
        title="Campaign designer"
        state="blocked"
      />
    </ScreenFrame>,
  );
  const areas = container.querySelectorAll<HTMLElement>(
    ".screen-agent-heading",
  );
  const otherColor = areas[2].style.getPropertyValue("--agent-color");
  const trigger = within(areas[0]).getByRole("button", { name: "Agent color" });
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Ochre" }));
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(areas[0]).toHaveStyle({ "--agent-color": "#B59255" });
  expect(areas[1]).toHaveStyle({ "--agent-color": "#B59255" });
  expect(areas[2].style.getPropertyValue("--agent-color")).toBe(otherColor);
  expect(localStorage.getItem("tiraz.agent-color.finance.v1")).toBe("#B59255");
});
