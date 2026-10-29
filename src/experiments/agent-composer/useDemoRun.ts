import { useEffect, useRef, useState } from "react";
import { demoStepEnds } from "./agent-data";
import { applyActivityEvent } from "./activity-runtime";
import type { ActivitySnapshot } from "./activity-runtime";
import { demoActivityEvents } from "./demo-activity";

export interface RunSettings {
  prompt: string;
  model: string;
  effort: number;
  agents: number;
  folders: string[];
  skills: string[];
  references: string[];
  branch: string;
  research: boolean;
}
export interface DemoRun extends RunSettings {
  activity: ActivitySnapshot;
  startedAt: number;
  elapsed: number;
  status: "running" | "stopped" | "done";
}

export function agentPhase(
  run: DemoRun | null,
  index: number,
): {
  status: "ready" | "queued" | "running" | "done" | "stopped";
  step: number;
  elapsed: number;
} {
  if (!run || index >= run.agents)
    return { status: "ready" as const, step: 0, elapsed: 0 };
  const elapsed = Math.max(0, run.elapsed - index * 5000);
  const step = demoStepEnds.filter((end) => elapsed >= end).length;
  const status =
    step === 5
      ? "done"
      : run.status === "stopped"
        ? "stopped"
        : run.elapsed < index * 5000
          ? "queued"
          : "running";
  return { status, step, elapsed: Math.min(18000, elapsed) };
}

/** Scripted preview events only. The presentation never owns execution state. */
export function useDemoRun() {
  const [run, setRun] = useState<DemoRun | null>(null);
  const lock = useRef(false);
  const serial = useRef(0);
  const timeline = useRef<ReturnType<typeof demoActivityEvents>>([]);
  useEffect(() => {
    if (run?.status !== "running") {
      lock.current = false;
      return;
    }
    const update = () =>
      setRun((current) => {
        if (!current || current.status !== "running") return current;
        const duration = 18000 + (current.agents - 1) * 5000;
        const elapsed = Math.min(
          duration,
          performance.now() - current.startedAt,
        );
        let activity = current.activity;
        for (const item of timeline.current) {
          if (item.at <= elapsed && item.event.sequence > activity.sequence)
            activity = applyActivityEvent(activity, item.event)!;
        }
        if (elapsed >= duration)
          activity = applyActivityEvent(activity, {
            type: "run.finished",
            runId: activity.runId,
            sequence: activity.sequence + 1,
            status: "complete",
          })!;
        return {
          ...current,
          elapsed,
          activity,
          status: elapsed >= duration ? "done" : "running",
        };
      });
    const timer = window.setInterval(update, 250);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [run?.status]);
  return {
    run,
    start(settings: RunSettings) {
      if (lock.current) return false;
      lock.current = true;
      const runId = `demo-${++serial.current}`;
      timeline.current = demoActivityEvents(settings, runId);
      let activity = applyActivityEvent(null, {
        type: "run.started",
        runId,
        sequence: 0,
      })!;
      for (const item of timeline.current) {
        if (item.at === 0) activity = applyActivityEvent(activity, item.event)!;
      }
      setRun({
        ...settings,
        folders: [...settings.folders],
        skills: [...settings.skills],
        references: [...settings.references],
        startedAt: performance.now(),
        elapsed: 0,
        status: "running",
        activity,
      });
      return true;
    },
    stop() {
      setRun((current) =>
        current?.status === "running"
          ? {
              ...current,
              status: "stopped",
              activity: applyActivityEvent(current.activity, {
                type: "run.finished",
                runId: current.activity.runId,
                sequence: current.activity.sequence + 1,
                status: "stopped",
              })!,
            }
          : current,
      );
      lock.current = false;
    },
  };
}
