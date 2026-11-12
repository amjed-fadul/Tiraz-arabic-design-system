import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChatComposer } from "../../ChatComposer";
import { ModelSelector } from "../../ModelSelector";
import { Tray } from "../../Tray";
import { applyActivityEvent } from "./agent-workspace/activity-runtime";
import { EffortChoice } from "./agent-workspace/EffortChoice";
import { startWorkspaceDemo } from "./agent-workspace/demo-host";
import type { WorkspaceRun } from "./agent-workspace/demo-host";
import {
  WorkspaceDock,
  WorkspaceRails,
} from "./agent-workspace/WorkspaceRails";
import { WorkspaceTurn } from "./agent-workspace/WorkspaceTurn";
import type { WorkspaceReply } from "./agent-workspace/WorkspaceTurn";
import { useWorkspacePanels } from "./agent-workspace/useWorkspacePanels";
import { workspaceStatus } from "./agent-workspace/workspace-copy";
import "./agent-workspace/workspace.css";

/** Local example composition. Replace the fixture host with your tool transport. */
export function AgentWorkspaceExample({
  language = "ar",
  agentAvatar,
}: {
  language?: "ar" | "en";
  agentAvatar?: ReactNode;
}) {
  const ar = language === "ar";
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const uid = useId();
  const [draft, setDraft] = useState(
    t(
      "راجع مسار التسجيل في نواة، واقترح أهم ثلاثة تحسينات قبل الإطلاق.",
      "Review Nawa’s onboarding flow and recommend the three most useful improvements before launch.",
    ),
  );
  const [model, setModel] = useState("reviewer");
  const [effort, setEffort] = useState(1);
  const [replies, setReplies] = useState<WorkspaceReply[]>([
    { key: `${uid}-1`, run: null, snapshot: null },
  ]);
  const cancel = useRef<() => void>(() => {});
  const generation = useRef(0);
  const runNumber = useRef(0);
  const runningRef = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const latest = replies.at(-1)!;
  const running = latest.snapshot?.status === "running";
  // Before the first request the composer waits near the top, in view as soon
  // as the canvas is; the conversation's space stays reserved beneath it.
  const fresh = !replies.some((reply) => reply.run);
  // Where the composer sat on screen when the first request was sent.
  const lifted = useRef<number | null>(null);
  useEffect(() => {
    const from = lifted.current;
    if (fresh || from === null) return;
    lifted.current = null;
    const entry = stage.current?.querySelector<HTMLElement>(
      ".tz-workspace-entry",
    );
    if (!entry) return;
    // The page moves with the composer as it glides down, so it stays where
    // the person is looking while the conversation opens above it.
    let frame = 0;
    const follow = () => {
      const shift = entry.getBoundingClientRect().top - from;
      if (Math.abs(shift) >= 0.5)
        window.scrollBy({ top: shift, behavior: "instant" });
      if (entry.getAnimations?.().some((item) => item.playState === "running"))
        frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [fresh]);
  const panels = useWorkspacePanels(replies);
  // The latest reply's activity hangs off the composer unless an earlier one is chosen.
  const [chosen, setChosen] = useState<string | null>(null);
  const attached = replies.find((reply) => reply.key === chosen) ?? latest;
  // Show activity leaves with its reply's attachment; focus follows to the panels.
  const focusActivity = useRef(false);
  useLayoutEffect(() => {
    if (!focusActivity.current) return;
    focusActivity.current = false;
    stage.current
      ?.querySelector<HTMLElement>(
        "[data-workspace-slot] > *, .tz-workspace-dock [data-workspace-chip]",
      )
      ?.focus();
  });
  // Rails need room beside the composer; the stylesheet decides when there is.
  const [layout, setLayout] = useState<"rails" | "dock">("rails");
  useLayoutEffect(() => {
    const node = stage.current;
    if (!node) return;
    const read = () =>
      setLayout(
        getComputedStyle(node).getPropertyValue("--workspace-layout").trim() ===
          "dock"
          ? "dock"
          : "rails",
      );
    const observer = new ResizeObserver(read);
    observer.observe(node.parentElement!);
    read();
    return () => observer.disconnect();
  }, []);
  useEffect(
    () => () => {
      generation.current++;
      cancel.current();
    },
    [],
  );
  useEffect(() => {
    const node = history.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const follow = () => {
      const selection = node.ownerDocument.getSelection();
      if (
        nearBottom.current &&
        !(
          selection &&
          !selection.isCollapsed &&
          node.contains(selection.anchorNode)
        )
      )
        node.scrollTop = node.scrollHeight;
    };
    const observer = new ResizeObserver(follow);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    follow();
    return () => observer.disconnect();
  }, []);
  function start(request: string) {
    if (runningRef.current || !request.trim()) return;
    runningRef.current = true;
    if (fresh)
      lifted.current =
        stage.current
          ?.querySelector(".tz-workspace-entry")
          ?.getBoundingClientRect().top ?? null;
    cancel.current();
    const version = ++generation.current;
    const run: WorkspaceRun = {
      runId: `${uid}-${++runNumber.current}`,
      request,
      model,
      effort,
    };
    setReplies((current) =>
      current.at(-1)?.run
        ? [...current, { key: run.runId, run, snapshot: null }]
        : [{ ...current[0], run }],
    );
    setChosen(null);
    setDraft("");
    cancel.current = startWorkspaceDemo(run, (event) => {
      if (generation.current !== version) return;
      setReplies((current) =>
        current.map((reply) =>
          reply.run?.runId === run.runId
            ? { ...reply, snapshot: applyActivityEvent(reply.snapshot, event) }
            : reply,
        ),
      );
      if (event.type === "run.finished") runningRef.current = false;
    });
  }
  function stop() {
    generation.current++;
    cancel.current();
    runningRef.current = false;
    setReplies((current) =>
      current.map((reply) =>
        reply.snapshot?.status === "running"
          ? {
              ...reply,
              snapshot: applyActivityEvent(reply.snapshot, {
                type: "run.finished",
                runId: reply.snapshot.runId,
                sequence: reply.snapshot.sequence + 1,
                at: Date.now(),
                status: "stopped",
              }),
            }
          : reply,
      ),
    );
  }
  const attachment = {
    replyKey: attached.key,
    snapshot: attached.snapshot,
    panels,
    language,
    agentAvatar,
    idPrefix: `${uid}-${attached.key}`,
  };
  return (
    <div
      className="tz-workspace"
      aria-label={t("مساحة عمل الوكلاء", "Agent workspace")}
    >
      <div className="tz-workspace-stage" ref={stage} data-fresh={fresh}>
        <div
          className="tz-workspace-history"
          ref={history}
          role="region"
          aria-label={t("المحادثة", "Conversation")}
          tabIndex={0}
          onScroll={(event) => {
            const node = event.currentTarget;
            nearBottom.current =
              node.scrollHeight - node.clientHeight - node.scrollTop <= 48;
          }}
        >
          <div>
            {replies.map((reply) => (
              <WorkspaceTurn
                key={reply.key}
                reply={reply}
                language={language}
                agentAvatar={agentAvatar}
                attached={reply.key === attached.key}
                hasActivity={panels.seen(reply.key).length > 0}
                onShowActivity={() => {
                  focusActivity.current = true;
                  setChosen(reply.key);
                }}
              />
            ))}
          </div>
        </div>
        {fresh && (
          <p className="tz-workspace-welcome">
            {agentAvatar && (
              <span className="tz-workspace-message-avatar" aria-hidden="true">
                {agentAvatar}
              </span>
            )}
            {t(
              "ثلاثة وكلاء جاهزون لطلبك",
              "Three agents are ready for your request",
            )}
          </p>
        )}
        <div className="tz-workspace-entry">
          {layout === "dock" && (
            <WorkspaceDock key={attached.key} {...attachment} />
          )}
          <Tray
            className="tz-workspace-composer"
            header={
              <>
                <ModelSelector
                  disabled={running}
                  value={model}
                  onValueChange={setModel}
                  label={t("النموذج التجريبي", "Demo model")}
                  models={[
                    {
                      id: "reviewer",
                      name: t("مراجع المنتج", "Product reviewer"),
                      description: t(
                        "للتجربة فقط، دون اتصال بنموذج",
                        "Demo option; no model connection",
                      ),
                    },
                    {
                      id: "editor",
                      name: t("محرر المنتج", "Product editor"),
                      description: t(
                        "للتجربة فقط، دون اتصال بنموذج",
                        "Demo option; no model connection",
                      ),
                    },
                  ]}
                />
                <EffortChoice
                  value={effort}
                  onChange={setEffort}
                  language={language}
                  disabled={running}
                />
              </>
            }
          >
            <ChatComposer
              appearance="plain"
              // Typed text sets its own direction; an empty entry follows the page.
              dir={draft.trim() ? "auto" : ar ? "rtl" : "ltr"}
              value={draft}
              onValueChange={setDraft}
              onSubmit={start}
              state={running ? "streaming" : "idle"}
              onStop={stop}
              label={t("طلب المراجعة", "Review request")}
              placeholder={t(
                "ما الذي تريد مراجعته؟",
                "What would you like to review?",
              )}
              labels={{
                send: t("بدء المراجعة", "Start sample review"),
                stop: t("إيقاف المراجعة", "Stop review"),
              }}
            />
          </Tray>
        </div>
        {layout === "rails" && <WorkspaceRails stage={stage} {...attachment} />}
      </div>
      <span className="tz-visually-hidden" role="status">
        {latest.snapshot ? workspaceStatus(latest.snapshot, ar) : ""}
      </span>
    </div>
  );
}
