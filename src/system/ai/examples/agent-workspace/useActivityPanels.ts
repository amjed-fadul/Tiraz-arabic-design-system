import { useEffect, useRef, useState } from "react";
import { activePanels } from "./activity-runtime";
import type { ActivityPanel, ActivitySnapshot } from "./activity-runtime";

const allPanels: ActivityPanel[] = [
  "repo",
  "folders",
  "skills",
  "refs",
  "research",
  "agent-0",
  "agent-1",
  "agent-2",
];

/** Visibility is a user preference, separate from execution and tool permission. */
export function useActivityPanels(
  snapshot: ActivitySnapshot | null,
  agentCount = 3,
) {
  const [follow, setFollow] = useState(true);
  const [pinned, setPinned] = useState<ActivityPanel[]>([]);
  const [held, setHeld] = useState<ActivityPanel[]>([]);
  const [focused, setFocused] = useState<ActivityPanel[]>([]);
  const [dismissed, setDismissed] = useState<{
    runId: string | undefined;
    panels: ActivityPanel[];
  }>({ runId: undefined, panels: [] });
  const remembered = useRef<ActivityPanel[]>(allPanels);
  const runId = snapshot?.runId;
  const wanted = activePanels(snapshot).join(",");
  const [retained, setRetained] = useState({
    runId,
    wanted,
    panels: wanted ? (wanted.split(",") as ActivityPanel[]) : [],
  });
  // Adjust the previous activity snapshot before commit, rather than opening
  // panels in a second render from an effect. The effect owns only expiry time.
  if (retained.runId !== runId || retained.wanted !== wanted) {
    setRetained({
      runId,
      wanted,
      panels: wanted
        ? (wanted.split(",") as ActivityPanel[])
        : retained.runId === runId
          ? retained.panels
          : [],
    });
  }
  const automatic = wanted
    ? (wanted.split(",") as ActivityPanel[])
    : retained.runId === runId
      ? retained.panels
      : [];
  useEffect(() => {
    if (wanted) return;
    // Let a finished result settle. No execution status is inferred by this timer.
    const timer = window.setTimeout(
      () =>
        setRetained((current) =>
          current.runId === runId && !current.wanted
            ? { ...current, panels: [] }
            : current,
        ),
      1800,
    );
    return () => window.clearTimeout(timer);
  }, [wanted, runId]);

  const suppressed = dismissed.runId === runId ? dismissed.panels : [];
  const isPinned = (id: ActivityPanel) => pinned.includes(id);
  const isOpen = (id: ActivityPanel) =>
    pinned.includes(id) ||
    (follow &&
      !suppressed.includes(id) &&
      (automatic.includes(id) || held.includes(id) || focused.includes(id)));
  const isFollowing = (id: ActivityPanel) => follow && automatic.includes(id);
  function pin(id: ActivityPanel) {
    setPinned((current) => (current.includes(id) ? current : [...current, id]));
    setDismissed((current) =>
      current.runId === runId
        ? { ...current, panels: current.panels.filter((panel) => panel !== id) }
        : current,
    );
  }
  function dismiss(id: ActivityPanel) {
    setPinned((current) => current.filter((panel) => panel !== id));
    setHeld((current) => current.filter((panel) => panel !== id));
    setFocused((current) => current.filter((panel) => panel !== id));
    setDismissed((current) => ({
      runId,
      panels: [
        ...new Set([...(current.runId === runId ? current.panels : []), id]),
      ],
    }));
  }
  function togglePin(id: ActivityPanel) {
    if (isPinned(id))
      setPinned((current) => current.filter((panel) => panel !== id));
    else pin(id);
  }
  function toggle(id: ActivityPanel) {
    if (isOpen(id)) dismiss(id);
    else pin(id);
  }
  function hold(id: ActivityPanel, inside: boolean) {
    setHeld((current) =>
      inside
        ? [...new Set([...current, id])]
        : current.filter((panel) => panel !== id),
    );
  }
  function toggleAll() {
    const available = allPanels.filter(
      (id) => !id.startsWith("agent-") || Number(id.slice(6)) < agentCount,
    );
    const visible = available.filter(isOpen);
    if (visible.length) {
      remembered.current = visible;
      setPinned([]);
      setHeld([]);
      setFocused([]);
      setDismissed({ runId, panels: allPanels });
    } else {
      const restore = remembered.current.filter((id) => available.includes(id));
      setPinned(restore.length ? restore : available);
      setDismissed({ runId, panels: [] });
    }
  }
  function focusWithin(id: ActivityPanel, inside: boolean) {
    setFocused((current) =>
      inside
        ? [...new Set([...current, id])]
        : current.filter((panel) => panel !== id),
    );
  }
  return {
    follow,
    setFollow,
    isOpen,
    isPinned,
    isFollowing,
    pin,
    togglePin,
    dismiss,
    toggle,
    hold,
    focusWithin,
    toggleAll,
  };
}
