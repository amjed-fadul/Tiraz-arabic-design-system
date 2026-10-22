import { expect, it } from "vitest";
import { khaytPose, khaytStates, mixPose } from "./khayt-motion";
import { auditFamily } from "../system/css-audit";
import { readFileSync } from "node:fs";

it("settles completion, waiting, and blocked poses instead of repeatedly asking for attention", () => {
  for (const state of ["done", "waiting", "blocked"] as const)
    expect(khaytPose(state, 2)).toEqual(khaytPose(state, 40));
  expect(khaytPose("working", 1)).not.toEqual(khaytPose("working", 2));
});

it("provides stable reduced-motion poses for every state", () => {
  for (const state of khaytStates) {
    expect(khaytPose(state, 0, true)).toEqual(khaytPose(state, 20, true));
    expect(
      Object.values(khaytPose(state, 10, true)).every(Number.isFinite),
    ).toBe(true);
  }
});

it("keeps the approved expressions distinct when animation is turned off", () => {
  const ready = khaytPose("idle", 0, true);
  const thinking = khaytPose("thinking", 0, true);
  const working = khaytPose("working", 0, true);
  const waiting = khaytPose("waiting", 0, true);
  const done = khaytPose("done", 0, true);
  const blocked = khaytPose("blocked", 0, true);
  expect(ready.whites).toBe(0);
  expect(thinking.whites).toBe(1);
  expect(thinking.gazeY).toBeLessThan(0);
  expect(working.gazeX).toBeGreaterThan(0);
  expect(waiting.eyeRound).toBeGreaterThan(working.eyeRound);
  expect(waiting.stretch).toBeGreaterThan(ready.stretch);
  expect(done.happy).toBe(1);
  expect(blocked.concern).toBe(1);
  expect(blocked.stretch).toBeLessThan(ready.stretch);
});

it("blends expressions from the current pose when a state is interrupted", () => {
  const working = khaytPose("working", 0.6);
  const waiting = khaytPose("waiting", 0.2);
  const interrupted = mixPose(working, waiting, 0.5);
  expect(interrupted.eyeRound).toBeGreaterThan(working.eyeRound);
  expect(interrupted.eyeRound).toBeLessThan(waiting.eyeRound);
  const blocked = khaytPose("blocked", 0.1);
  expect(mixPose(interrupted, blocked, 0)).toEqual(interrupted);
  expect(mixPose(interrupted, blocked, 1)).toEqual(blocked);
});

it("keeps every state drawable after a nonfinite clock value", () => {
  for (const state of khaytStates)
    for (const time of [NaN, Infinity, -Infinity])
      expect(Object.values(khaytPose(state, time)).every(Number.isFinite)).toBe(
        true,
      );
});

it("keeps the studio and identity controls within the CSS audit", () => {
  for (const file of ["khayt.css", "khayt-studio.css", "agent-color.css"])
    expect(
      auditFamily(readFileSync(`src/mascot/${file}`, "utf8"), [
        ".khayt",
        ".agent-color",
      ]),
    ).toEqual([]);
});
