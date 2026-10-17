import { describe, expect, it } from "vitest";
import { createLoomClock } from "./loom-clock";

describe("loom clock", () => {
  it("follows real time even when the browser delivers frames slowly", () => {
    const clock = createLoomClock();
    // A throttled pane may deliver one frame per second. The opening weave
    // must still finish on time instead of crawling at a tenth of its speed.
    clock.tick(0);
    clock.tick(1000);
    clock.tick(2000);
    expect(clock.seconds).toBe(2);
  });

  it("does not count time while paused", () => {
    const clock = createLoomClock();
    clock.tick(0);
    clock.tick(500);
    clock.pause();
    clock.tick(60_000);
    clock.tick(60_100);
    expect(clock.seconds).toBeCloseTo(0.6);
  });

  it("can begin part way through the timeline and never runs backwards", () => {
    const clock = createLoomClock(8);
    clock.tick(100);
    expect(clock.seconds).toBe(8);
    clock.tick(50);
    expect(clock.seconds).toBe(8);
  });
});
