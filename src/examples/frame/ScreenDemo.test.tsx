import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ScreenFrame } from "./ScreenFrame";
import { useScreenDemo } from "./useScreenDemo";

function Probe() {
  const demo = useScreenDemo();
  const [value, setValue] = useState("");
  return (
    <>
      <output data-testid="phase">{demo.phase}</output>
      <output data-testid="draft">{demo.draft("Review this customer")}</output>
      <output data-testid="submitted">{String(demo.submitted)}</output>
      <input
        aria-label="My request"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </>
  );
}

function SavedComposer({ send }: { send: () => void }) {
  const demo = useScreenDemo();
  return (
    <div data-demo-composer>
      <textarea
        aria-label="Saved request"
        readOnly
        value={demo.active ? demo.draft("Animated request") : "My saved draft"}
      />
      <button className="tz-chat-entry-send" onClick={send}>
        Send
      </button>
    </div>
  );
}
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});

it("types, presses send, works and settles once without stealing focus", () => {
  render(
    <ScreenFrame slug="customer-profile">
      <Probe />
    </ScreenFrame>,
  );
  expect(screen.getByTestId("phase")).toHaveTextContent("typing");
  expect(screen.getByTestId("draft")).toBeEmptyDOMElement();
  tick(1000);
  expect(screen.getByTestId("draft").textContent?.length).toBeGreaterThan(0);
  tick(1400);
  expect(screen.getByTestId("phase")).toHaveTextContent("sending");
  expect(screen.getByTestId("draft")).toHaveTextContent("Review this customer");
  tick(400);
  expect(screen.getByTestId("phase")).toHaveTextContent("working");
  expect(screen.getByTestId("submitted")).toHaveTextContent("true");
  tick(4800);
  expect(screen.getByTestId("phase")).toHaveTextContent("complete");
  expect(document.activeElement).toBe(document.body);
  tick(20000);
  expect(screen.getByTestId("phase")).toHaveTextContent("complete");
});

it("pauses and resumes the clock, then lets a focused input take control", () => {
  render(
    <ScreenFrame slug="customer-profile">
      <Probe />
    </ScreenFrame>,
  );
  tick(800);
  fireEvent.click(screen.getByRole("button", { name: "إيقاف العرض مؤقتًا" }));
  const draft = screen.getByTestId("draft").textContent;
  tick(5000);
  expect(screen.getByTestId("draft").textContent).toBe(draft);
  fireEvent.click(screen.getByRole("button", { name: "متابعة العرض" }));
  tick(800);
  expect(screen.getByTestId("draft").textContent?.length).toBeGreaterThan(
    draft!.length,
  );
  fireEvent.click(screen.getByRole("button", { name: "إيقاف العرض مؤقتًا" }));
  fireEvent.focus(screen.getByRole("textbox", { name: "My request" }));
  expect(document.querySelector("[data-demo-paused]")).toBeNull();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "My own request" },
  });
  tick(10000);
  expect(screen.getByRole("textbox")).toHaveValue("My own request");
  expect(screen.getByTestId("phase")).toHaveTextContent("complete");
  expect(screen.getByTestId("submitted")).toHaveTextContent("false");
});

it("replays without dropping focus and clears its clock on unmount", () => {
  const view = render(
    <ScreenFrame slug="invoices">
      <Probe />
    </ScreenFrame>,
  );
  expect(screen.getByTestId("phase")).toHaveTextContent("working");
  tick(4800);
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Keep my work" },
  });
  const replay = screen.getByRole("button", { name: "إعادة العرض" });
  replay.focus();
  fireEvent.click(replay);
  expect(screen.getByTestId("phase")).toHaveTextContent("working");
  expect(
    screen.getByRole("button", { name: "إيقاف العرض مؤقتًا" }),
  ).toHaveFocus();
  expect(screen.getByRole("textbox")).toHaveValue("Keep my work");
  view.unmount();
  act(() => vi.runOnlyPendingTimers());
  expect(vi.getTimerCount()).toBe(0);
});

it("can render a settled screen for still-image evidence", () => {
  window.history.replaceState(null, "", "/examples/customer-profile?demo=off");
  render(
    <ScreenFrame slug="customer-profile">
      <Probe />
    </ScreenFrame>,
  );
  expect(screen.getByTestId("phase")).toHaveTextContent("complete");
  expect(screen.getByTestId("draft")).toBeEmptyDOMElement();
});

it("consumes a synthetic Send activation before revealing a saved draft", () => {
  const send = vi.fn();
  render(
    <ScreenFrame slug="customer-profile">
      <SavedComposer send={send} />
    </ScreenFrame>,
  );
  tick(1000);
  const button = screen.getByRole("button", { name: "Send" });
  expect(screen.getByRole("textbox")).not.toHaveValue("My saved draft");
  fireEvent.pointerDown(button);
  fireEvent.click(button);
  expect(send).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox")).toHaveValue("My saved draft");
  fireEvent.click(button);
  expect(send).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "إعادة العرض" }));
  tick(1000);
  expect(fireEvent.keyDown(button, { key: "Enter" })).toBe(false);
  expect(fireEvent.keyDown(button, { key: "Enter", repeat: true })).toBe(false);
  expect(send).toHaveBeenCalledTimes(1);
  expect(fireEvent.keyUp(button, { key: "Enter" })).toBe(false);
  expect(screen.getByRole("textbox")).toHaveValue("My saved draft");
  expect(fireEvent.keyDown(button, { key: "Enter" })).toBe(true);
});
