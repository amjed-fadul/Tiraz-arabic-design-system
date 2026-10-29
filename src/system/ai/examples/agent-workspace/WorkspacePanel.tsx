import { useRef } from "react";
import type { ReactNode } from "react";
import { BookOpen, CheckCheck, Globe, X } from "lucide-react";
import { Button } from "../../../Button";
import { latestActivity } from "./activity-runtime";
import type { ActivityPanel, ActivitySnapshot } from "./activity-runtime";
import { useNow, useWorkFormat } from "./work-time";
import { isAgent, panelCopy } from "./workspace-copy";

const icons: Partial<Record<ActivityPanel, ReactNode>> = {
  folders: <BookOpen size={14} />,
  research: <Globe size={14} />,
  skills: <CheckCheck size={14} />,
};

function stateLabel(state: string, ar: boolean) {
  const words: Record<string, [string, string]> = {
    running: ["قيد العمل", "Running"],
    complete: ["اكتمل", "Done"],
    error: ["تعثّر", "Failed"],
    "needs-input": ["ينتظرك", "Waiting for you"],
    stopped: ["أُوقف", "Stopped"],
  };
  return (words[state] ?? ["جاهز", "Ready"])[ar ? 0 : 1];
}

/** A closed panel stays on its thread as a chip that reopens it. */
export function WorkspaceChip({
  panel,
  snapshot,
  language,
  agentAvatar,
  label,
  expanded = false,
  onOpen,
}: {
  panel: ActivityPanel;
  snapshot: ActivitySnapshot | null;
  language: "ar" | "en";
  agentAvatar?: ReactNode;
  label: string;
  expanded?: boolean;
  onOpen: () => void;
}) {
  const state = latestActivity(snapshot, panel)?.status ?? "idle";
  const status = stateLabel(state, language === "ar");
  return (
    <button
      type="button"
      className="tz-workspace-chip"
      data-workspace-chip={panel}
      data-state={state}
      aria-expanded={expanded}
      aria-description={status}
      title={status}
      onClick={onOpen}
    >
      <span className="tz-workspace-chip-icon" aria-hidden="true">
        {isAgent(panel) ? agentAvatar : icons[panel]}
      </span>
      {label}
      <span className="tz-workspace-chip-state" aria-hidden="true" />
    </button>
  );
}

/**
 * Activity a host has supplied for one panel: an agent and the one thing it is
 * doing, or a tool's evidence. Never configuration.
 */
export function WorkspacePanel({
  id,
  panel,
  snapshot,
  language,
  agentAvatar,
  onClose,
}: {
  id: string;
  panel: ActivityPanel;
  snapshot: ActivitySnapshot | null;
  language: "ar" | "en";
  agentAvatar?: ReactNode;
  onClose: (card: HTMLElement) => void;
}) {
  const ar = language === "ar";
  const local = (copy: [string, string]) => copy[ar ? 0 : 1];
  const card = useRef<HTMLElement>(null);
  const copy = panelCopy(language);
  const agent = isAgent(panel);
  const title = copy.names[panel]!;
  const activity = latestActivity(snapshot, panel);
  const state = activity?.status ?? "idle";
  // The panel's work spans its first report to its last settled one.
  const items = snapshot?.activities.filter((item) => item.panel === panel);
  const start = Math.min(
    ...(items ?? []).map((item) => item.startedAt ?? Infinity),
  );
  const open = !!items?.some((item) => item.endedAt === undefined);
  const now = useNow(open && snapshot?.status === "running");
  const format = useWorkFormat(language);
  const end = open
    ? now
    : Math.max(...(items ?? []).map((item) => item.endedAt ?? 0));
  return (
    <section
      ref={card}
      id={id}
      tabIndex={-1}
      className="tz-workspace-panel"
      data-workspace-socket={panel}
      data-state={state}
      aria-labelledby={`${id}-title`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          onClose(card.current!);
        }
      }}
    >
      <div className="tz-workspace-panel-heading">
        {agent ? (
          agentAvatar && (
            <span className="tz-workspace-task-avatar" aria-hidden="true">
              {agentAvatar}
            </span>
          )
        ) : (
          <span className="tz-workspace-panel-icon" aria-hidden="true">
            {icons[panel]}
          </span>
        )}
        <h4 id={`${id}-title`}>{title}</h4>
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          aria-label={`${copy.close} ${title}`}
          onClick={() => onClose(card.current!)}
        >
          <X size={14} aria-hidden="true" />
        </Button>
      </div>
      {activity && (
        <div className="tz-workspace-panel-body">
          <span className="tz-workspace-state" data-state={state}>
            <span>{stateLabel(state, ar)}</span>
            {Number.isFinite(start) && (
              <time className="tz-workspace-state-time">
                {format.time(end - start, !open)}
              </time>
            )}
          </span>
          <p className="tz-workspace-current-action">
            {local(activity.detail)}
          </p>
          {agent && (
            // One task each: the line fills when it is done; while it runs it
            // carries a sheen, never a guessed fraction.
            <span
              className="tz-workspace-agent-bar"
              data-state={state}
              aria-hidden="true"
            />
          )}
          {!!activity.evidence?.length && (
            <div className="tz-workspace-evidence">
              {activity.evidence.map((item) => (
                <details key={item.id}>
                  <summary>
                    {local(item.title)}
                    <span className="tz-workspace-reveal" aria-hidden="true" />
                  </summary>
                  <p>{local(item.detail)}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
