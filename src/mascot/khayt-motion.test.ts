import { expect, it } from "vitest";
import { khaytPose, khaytStates } from "./khayt-motion";
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

it("keeps the studio and identity controls within the CSS audit", () => {
  for (const file of ["khayt.css", "khayt-studio.css", "agent-color.css"])
    expect(
      auditFamily(readFileSync(`src/mascot/${file}`, "utf8"), [
        ".khayt",
        ".agent-color",
      ]),
    ).toEqual([]);
});
