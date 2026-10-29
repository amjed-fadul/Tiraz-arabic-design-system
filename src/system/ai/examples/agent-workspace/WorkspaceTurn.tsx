import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Button } from "../../../Button";
import { ChatThreadMessage } from "../../../ChatThread";
import type { ActivitySnapshot } from "./activity-runtime";
import type { WorkspaceRun } from "./demo-host";
import { useNow, useWorkFormat } from "./work-time";
import {
  effortNames,
  isAgent,
  panelCopy,
  workspaceStatus,
} from "./workspace-copy";

export type WorkspaceReply = {
  key: string;
  run: WorkspaceRun | null;
  snapshot: ActivitySnapshot | null;
};

/** "Worked for 7.2s · 3 agents": the run's time, opening onto each agent's work. */
function WorkLog({
  snapshot,
  language,
}: {
  snapshot: ActivitySnapshot | null;
  language: "ar" | "en";
}) {
  const ar = language === "ar";
  const format = useWorkFormat(language);
  const running = snapshot?.status === "running";
  const now = useNow(running);
  if (snapshot?.startedAt === undefined)
    return (
      <p className="tz-workspace-turn-status">
        {workspaceStatus(snapshot, ar)}
      </p>
    );
  const time = format.time(
    (snapshot.finishedAt ?? now) - snapshot.startedAt,
    !running,
  );
  const names = panelCopy(language).names;
  const agents = snapshot.activities.filter((step) => isAgent(step.panel));
  const steps = (agents.length ? agents : snapshot.activities)
    .slice()
    .sort(
      (a, b) =>
        (a.startedAt ?? 0) - (b.startedAt ?? 0) || a.sequence - b.sequence,
    );
  const count = agents.length
    ? format.agents(agents.length)
    : format.steps(steps.length);
  const summary = running
    ? `${workspaceStatus(snapshot, ar)} · ${time}`
    : snapshot.status === "stopped"
      ? ar
        ? `أُوقف بعد ${time} · ${count}`
        : `Stopped after ${time} · ${count}`
      : ar
        ? `استغرق العمل ${time} · ${count}`
        : `Worked for ${time} · ${count}`;
  return (
    <details className="tz-workspace-worklog">
      <summary>
        <span>{summary}</span>
        <span className="tz-workspace-reveal" aria-hidden="true" />
      </summary>
      <ol>
        {steps.map((step) => (
          <li key={step.id} data-state={step.status}>
            <span className="tz-workspace-step-mark" aria-hidden="true">
              {step.status === "complete" ? (
                <Check size={11} strokeWidth={2.5} />
              ) : step.status === "error" ? (
                <X size={11} strokeWidth={2.5} />
              ) : null}
            </span>
            <span className="tz-workspace-step-title">
              {isAgent(step.panel) && (
                <span className="tz-workspace-step-who">
                  {names[step.panel]}
                </span>
              )}
              {step.label[ar ? 0 : 1]}
            </span>
            {step.startedAt !== undefined && (
              <time className="tz-workspace-step-time">
                {format.time(
                  (step.endedAt ?? now) - step.startedAt,
                  step.endedAt !== undefined,
                )}
              </time>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

/**
 * One request and its reply. Its activity hangs off the composer while it is
 * attached; an earlier reply can bring its own panels back.
 */
export function WorkspaceTurn({
  reply,
  language,
  agentAvatar,
  attached,
  hasActivity,
  onShowActivity,
}: {
  reply: WorkspaceReply;
  language: "ar" | "en";
  agentAvatar?: ReactNode;
  attached: boolean;
  hasActivity: boolean;
  onShowActivity: () => void;
}) {
  const { run, snapshot } = reply;
  const ar = language === "ar";
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  if (!run) return null;
  const finished = snapshot?.status === "complete";
  return (
    <div className="tz-workspace-turn" data-workspace-reply={run.runId}>
      <div className="tz-workspace-messages">
        <ChatThreadMessage
          message={{
            id: `${run.runId}-request`,
            role: "user",
            identity: t("أنت", "You"),
            content: <p>{run.request}</p>,
          }}
        />
        <small className="tz-workspace-request-settings">
          {t("الإعدادات:", "This request:")} {effortNames[language][run.effort]}{" "}
          ·{" "}
          {run.model === "reviewer"
            ? t("مراجع المنتج", "Product reviewer")
            : t("محرر المنتج", "Product editor")}
        </small>
      </div>
      <div className="tz-workspace-turn-meta">
        <WorkLog snapshot={snapshot} language={language} />
        {hasActivity && !attached && (
          <Button variant="ghost" size="sm" onClick={onShowActivity}>
            {t("عرض النشاط", "Show activity")}
          </Button>
        )}
      </div>
      <div className="tz-workspace-messages">
        <ChatThreadMessage
          message={{
            id: `${run.runId}-reply`,
            role: "assistant",
            identity: t("خيط", "Khayt"),
            avatar: agentAvatar && (
              <span className="tz-workspace-message-avatar" aria-hidden="true">
                {agentAvatar}
              </span>
            ),
            status: finished
              ? "completed"
              : snapshot?.status === "stopped"
                ? "stopped"
                : "streaming",
            content: finished ? (
              <div className="tz-workspace-result">
                <strong>
                  {t(
                    "ثلاث توصيات لمسار التسجيل",
                    "Three recommendations from the Nawa sample",
                  )}
                </strong>
                <ol>
                  <li>
                    {t(
                      "أخبر المستخدم بعد إنشاء الحساب أن الخطوة التالية هي تأكيد بريده.",
                      "Explain that email confirmation comes immediately after account creation.",
                    )}
                  </li>
                  <li>
                    {t(
                      "احفظ ما أدخله المستخدم إذا رجع لتصحيح بريده.",
                      "Keep entered details when someone returns to correct their email.",
                    )}
                  </li>
                  <li>
                    {t(
                      "أضف إلى شاشة الانتظار خيارًا لإعادة إرسال الرابط.",
                      "Offer resend on the confirmation waiting screen.",
                    )}
                  </li>
                </ol>
              </div>
            ) : snapshot?.status === "stopped" ? (
              <p>
                {t(
                  "أُوقفت المراجعة، وبقي ما جُمع حتى الآن متاحًا في اللوحات.",
                  "Demo stopped. Received activity remains available to review.",
                )}
              </p>
            ) : !snapshot?.activities.length ? (
              <p>
                {t(
                  "أقرأ طلبك وأوزّع العمل على الوكلاء…",
                  "Reading your request and deciding who does what…",
                )}
              </p>
            ) : (
              <p>
                {t(
                  "وزّعتُ العمل على ثلاثة وكلاء: الأول يتتبّع المسار، والثاني يقرأ ملاحظات الاختبار، والثالث يراجع النتائج ويرتّب التوصيات.",
                  "I’ve split this across three agents: one traces the flow, one reads the test notes, and one reviews the findings and ranks the advice.",
                )}
              </p>
            ),
          }}
        />
      </div>
    </div>
  );
}
