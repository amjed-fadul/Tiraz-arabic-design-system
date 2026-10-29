import { useState } from "react";
import type { ActivityPanel, ActivitySnapshot } from "./activity-runtime";

export const workspacePanels: ActivityPanel[] = [
  "folders",
  "research",
  "skills",
  "agent-0",
  "agent-1",
  "agent-2",
];

type Choice = { seen: ActivityPanel[]; open: ActivityPanel[] };
const none: Choice = { seen: [], open: [] };

/**
 * Panel choices for every keyed reply. A panel attaches on its first activity
 * and stays open until closed; closing leaves its chip. Completion, Stop and
 * focus never change visibility, and a closed panel never reopens on its own.
 */
export function useWorkspacePanels(
  replies: { key: string; snapshot: ActivitySnapshot | null }[],
) {
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  let next = choices;
  for (const { key, snapshot } of replies) {
    const current = next[key] ?? none;
    const arrived = workspacePanels.filter(
      (panel) =>
        !current.seen.includes(panel) &&
        snapshot?.activities.some((item) => item.panel === panel),
    );
    if (arrived.length)
      next = {
        ...next,
        [key]: {
          seen: [...current.seen, ...arrived],
          open: [...current.open, ...arrived],
        },
      };
  }
  // Reconcile before commit so new activity attaches in the same render, without focus effects.
  if (next !== choices) setChoices(next);
  const set = (key: string, panel: ActivityPanel, open: boolean) =>
    setChoices((current) => {
      const choice = current[key] ?? none;
      return {
        ...current,
        [key]: {
          ...choice,
          open: open
            ? [...new Set([...choice.open, panel])]
            : choice.open.filter((item) => item !== panel),
        },
      };
    });
  return {
    /** Panels this reply has received activity for, in their fixed order. */
    seen: (key: string) =>
      workspacePanels.filter((panel) => next[key]?.seen.includes(panel)),
    isOpen: (key: string, panel: ActivityPanel) =>
      !!next[key]?.open.includes(panel),
    open: (key: string, panel: ActivityPanel) => set(key, panel, true),
    close: (key: string, panel: ActivityPanel) => set(key, panel, false),
  };
}

export type WorkspacePanels = ReturnType<typeof useWorkspacePanels>;
