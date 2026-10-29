/** Application-owned events. This module never executes a tool or grants access. */
export type ActivityPanel =
  "repo" | "folders" | "skills" | "refs" | "research" | `agent-${number}`;
export type ActivityStatus =
  "running" | "complete" | "needs-input" | "error" | "stopped";
export interface ComposerActivity {
  id: string;
  panel: ActivityPanel;
  label: [string, string];
  detail: [string, string];
  status: ActivityStatus;
  sequence: number;
  /** Host times (ms) the activity was first reported and when it settled. */
  startedAt?: number;
  endedAt?: number;
  /** Observable host-supplied evidence, never fabricated from elapsed time. */
  evidence?: {
    id: string;
    title: [string, string];
    detail: [string, string];
  }[];
}
export interface ActivitySnapshot {
  runId: string;
  sequence: number;
  status: "running" | "complete" | "stopped";
  activities: ComposerActivity[];
  /** Host times (ms); elapsed work is measured from these, never guessed. */
  startedAt?: number;
  finishedAt?: number;
}
export type ActivityEvent = {
  runId: string;
  sequence: number;
  /** When the host observed the event, in ms. */
  at?: number;
} & (
  | { type: "run.started" }
  | {
      type: "activity.changed";
      activity: Omit<ComposerActivity, "sequence" | "startedAt" | "endedAt">;
    }
  | { type: "run.finished"; status: "complete" | "stopped" }
);
const settled = (status: ActivityStatus) =>
  status === "complete" || status === "error" || status === "stopped";

/** Feed a run.started intent once, then ordered server events for that run. */
export function applyActivityEvent(
  state: ActivitySnapshot | null,
  event: ActivityEvent,
): ActivitySnapshot | null {
  if (event.type === "run.started") {
    if (state?.runId === event.runId) return state;
    return {
      runId: event.runId,
      sequence: event.sequence,
      status: "running",
      activities: [],
      startedAt: event.at,
    };
  }
  if (
    !state ||
    state.runId !== event.runId ||
    state.status !== "running" ||
    event.sequence <= state.sequence
  )
    return state;
  if (event.type === "run.finished") {
    return {
      ...state,
      sequence: event.sequence,
      status: event.status,
      finishedAt: event.at,
      activities: state.activities.map((activity) =>
        activity.status === "running" ||
        (event.status === "stopped" && activity.status === "needs-input")
          ? { ...activity, status: "stopped", endedAt: event.at }
          : activity,
      ),
    };
  }
  const previous = state.activities.find(
    (item) => item.id === event.activity.id,
  );
  const activity: ComposerActivity = {
    ...event.activity,
    sequence: event.sequence,
    startedAt: previous?.startedAt ?? event.at,
    endedAt: settled(event.activity.status)
      ? (previous?.endedAt ?? event.at)
      : undefined,
  };
  return {
    ...state,
    sequence: event.sequence,
    activities: [
      ...state.activities.filter((item) => item.id !== activity.id),
      activity,
    ],
  };
}

export function latestActivity(
  snapshot: ActivitySnapshot | null,
  panel: ActivityPanel,
) {
  const priority = (activity: ComposerActivity) =>
    ["needs-input", "error"].includes(activity.status)
      ? 2
      : activity.status === "running"
        ? 1
        : 0;
  return snapshot?.activities
    .filter((activity) => activity.panel === panel)
    .sort((a, b) => priority(b) - priority(a) || b.sequence - a.sequence)[0];
}

export function activePanels(
  snapshot: ActivitySnapshot | null,
): ActivityPanel[] {
  if (!snapshot || snapshot.status !== "running") return [];
  const active = snapshot.activities.filter((activity) =>
    ["running", "needs-input", "error"].includes(activity.status),
  );
  const context = active
    .filter(
      (activity) =>
        !activity.panel.startsWith("agent-") && activity.panel !== "research",
    )
    .sort(
      (a, b) =>
        Number(["error", "needs-input"].includes(b.status)) -
          Number(["error", "needs-input"].includes(a.status)) ||
        b.sequence - a.sequence,
    )[0];
  return [
    ...new Set([
      ...(context ? [context.panel] : []),
      ...active
        .filter(
          (activity) =>
            activity.panel.startsWith("agent-") ||
            activity.panel === "research",
        )
        .map((activity) => activity.panel),
    ]),
  ];
}
