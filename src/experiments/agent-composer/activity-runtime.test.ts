import { describe, expect, it } from "vitest";
import {
  activePanels,
  applyActivityEvent,
  latestActivity,
} from "./activity-runtime";
import type { ActivitySnapshot } from "./activity-runtime";

function start() {
  return applyActivityEvent(null, {
    type: "run.started",
    runId: "a",
    sequence: 0,
  })!;
}
function tool(
  state: ActivitySnapshot,
  panel: "folders" | "skills",
  sequence: number,
) {
  return applyActivityEvent(state, {
    type: "activity.changed",
    runId: "a",
    sequence,
    activity: {
      id: panel,
      panel,
      status: "running",
      label: [panel, panel],
      detail: ["context", "سياق"],
    },
  })!;
}

describe("application activity events", () => {
  it("keeps unresolved attention visible when another call on the same panel completes", () => {
    const pending = applyActivityEvent(start(), {
      type: "activity.changed",
      runId: "a",
      sequence: 1,
      activity: {
        id: "permission",
        panel: "folders",
        status: "needs-input",
        label: ["Choose a folder", "اختر مجلدًا"],
        detail: ["Waiting", "بانتظارك"],
      },
    })!;
    const state = applyActivityEvent(pending, {
      type: "activity.changed",
      runId: "a",
      sequence: 2,
      activity: {
        id: "other",
        panel: "folders",
        status: "complete",
        label: ["Done", "مكتمل"],
        detail: ["Read another folder", "تمت قراءة مجلد آخر"],
      },
    })!;
    expect(latestActivity(state, "folders")?.id).toBe("permission");
    expect(activePanels(state)).toEqual(["folders"]);
  });
  it("keeps the newest context and rejects replayed or stale events", () => {
    const folders = tool(start(), "folders", 2);
    const skills = tool(folders, "skills", 3);
    expect(activePanels(skills)).toEqual(["skills"]);
    expect(tool(skills, "folders", 1)).toBe(skills);
    expect(tool(skills, "folders", 3)).toBe(skills);
    expect(
      applyActivityEvent(skills, {
        type: "run.finished",
        runId: "old",
        sequence: 4,
        status: "complete",
      }),
    ).toBe(skills);
  });
  it("does not let late tool updates revive a stopped run", () => {
    const state = tool(start(), "folders", 1);
    const stopped = applyActivityEvent(state, {
      type: "run.finished",
      runId: "a",
      sequence: 2,
      status: "stopped",
    })!;
    expect(stopped.activities[0].status).toBe("stopped");
    expect(tool(stopped, "skills", 3)).toBe(stopped);
    expect(activePanels(stopped)).toEqual([]);
  });
});
