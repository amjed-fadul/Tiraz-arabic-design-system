import { agentStyle } from "../frame/screen-agents";
import { useId, useState } from "react";
import {
  Button,
  ContextMeter,
  DecisionInbox,
  Progress,
  Sheet,
  StatusPill,
  TaskRows,
  ToolCall,
  Tray,
  useSystem,
} from "../../system";
import type {
  DecisionInboxItem,
  StatusPillState,
  TaskRowItem,
} from "../../system";
import { story } from "../../system/ai/examples/finance-story";
import { formatCount } from "../../system/format";
import {
  accruals,
  jeddah,
  reminderTitle,
  reminders,
} from "../month-end-close/data";
import type { Text } from "../month-end-close/data";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { recorded, useScreen } from "../frame/screen";
import type { ScreenSlug } from "../frame/screen";
import {
  agentIds,
  anHourAgo,
  closeContext,
  closeName,
  cover,
  minutes,
  panels,
  receipts,
} from "./data";
import type { AgentId, Summary } from "./data";
import "./agent-control-room.css";
import { useScreenDemo } from "../frame/useScreenDemo";
import { ScreenAgentAvatar, ScreenAgentHeading } from "../frame/ScreenAgent";
import { useAgentColor } from "../../mascot/useAgentColor";
import type { KhaytState } from "../../mascot/khayt-motion";

function mascotState(state: StatusPillState): KhaytState {
  return state === "failed"
    ? "blocked"
    : state === "needs-you"
      ? "waiting"
      : state === "running"
        ? "working"
        : state === "completed"
          ? "done"
          : "idle";
}

export function AgentControlRoom() {
  return (
    <ScreenFrame slug="agent-control-room">
      <Room />
    </ScreenFrame>
  );
}

/** What the person did to an item, as the host recorded it. */
type Outcome = "approved" | "rejected" | "answered" | "retried";

/** Where an item's «افتح» or «راجع» goes: the screen it belongs to. */
function screenOf(id: string): ScreenSlug {
  if (reminders.some((reminder) => reminder.id === id)) return "invoices";
  return id === "campaign" ? "content-studio" : "month-end-close";
}

function Room() {
  const [financeColor] = useAgentColor("finance");
  const [collectionsColor] = useAgentColor("collections");
  const [campaignsColor] = useAgentColor("campaigns");
  const colors = {
    finance: financeColor,
    collections: collectionsColor,
    campaigns: campaignsColor,
  };
  const { language, t, number, money, size, open, endSide } = useScreen();
  const { config } = useSystem();
  const text = (value: Text) => t(value.ar, value.en);
  // Who is picked in the strip, and what the host recorded for each item.
  const demo = useScreenDemo();
  const [tab, setTab] = useState<"all" | "needs-you" | "running" | "completed">(
    "needs-you",
  );
  const [agent, setAgent] = useState<AgentId | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const record = (id: string, outcome: Outcome) =>
    setOutcomes((current) => ({ ...current, [id]: outcome }));
  const ago = (count: number) =>
    t(`قبل ${number(count)} د`, `${number(count)} min ago`);
  const by = (id: AgentId) => ({ id, name: story.agents[id][language] });
  const entries = story.closeSteps[2];

  const request = {
    id: accruals.id,
    action: text(accruals.action),
    target: story.sources[0].title[language],
    details: t(
      `الإجمالي ${money(entries.amount)}`,
      `${money(entries.amount)} in total`,
    ),
    consequences: [text(accruals.consequence)],
    approveLabel: text(accruals.approve),
    rejectLabel: text(accruals.reject),
  };
  // Most urgent first, as the host orders them: the accruals request, which is
  // reversible, so its row decides without opening; the question; the three
  // reminders, each reviewed where the invoices are; the failed cover; then
  // what runs and what finished.
  const items: DecisionInboxItem[] = (
    [
      {
        id: accruals.id,
        title: request.action,
        agent: by("finance"),
        context: text(closeContext),
        status: "needs-you",
        time: ago(minutes.accruals),
        request,
        approval: { reversible: true },
      },
      {
        id: jeddah.id,
        title: text(jeddah.label),
        agent: by("finance"),
        context: text(closeContext),
        status: "needs-you",
        time: ago(minutes.jeddah),
        questions: [
          {
            id: jeddah.id,
            label: text(jeddah.label),
            choices: jeddah.choices.map((choice) => ({
              value: choice.value,
              label: text(choice.label),
            })),
          },
        ],
      },
      ...reminders.map((reminder, index): DecisionInboxItem => ({
        id: reminder.id,
        title: `${text(reminderTitle)} ${reminder.customer[language]}`,
        agent: by("collections"),
        context: (
          <>
            <bdi dir="ltr">{reminder.invoice}</bdi> · {money(reminder.amount)}
          </>
        ),
        status: "needs-you",
        time: ago(minutes.drafts[index]),
        draft: true,
      })),
      {
        id: "campaign",
        title: text(cover.title),
        agent: by("campaigns"),
        status: "failed",
        time: ago(minutes.campaign),
        error: text(cover.error),
      },
      {
        id: "close",
        title: text(closeName),
        agent: by("finance"),
        status: "running",
        time: t(
          `منذ ${number(minutes.close)} د`,
          `for ${number(minutes.close)} min`,
        ),
      },
      {
        id: "suppliers",
        title: story.closeSteps[0].title[language],
        agent: by("finance"),
        context: text(closeContext),
        status: "completed",
        time: text(anHourAgo),
      },
    ] satisfies DecisionInboxItem[]
  ).map((item): DecisionInboxItem => {
    const outcome = outcomes[item.id];
    return !outcome
      ? demo.active && item.status === "needs-you"
        ? { ...item, status: "running" }
        : item
      : outcome === "retried"
        ? { ...item, status: "running", error: undefined }
        : { ...item, status: "completed", receipt: text(receipts[outcome]) };
  });
  const retried = outcomes.campaign === "retried";

  // Each agent's state comes from its items: waiting first, then failed, then
  // running.
  const stateOf = (id: AgentId): StatusPillState => {
    const own = items.filter((item) => item.agent.id === id);
    return own.some((item) => item.status === "needs-you")
      ? "needs-you"
      : own.some((item) => item.status === "failed")
        ? "failed"
        : own.some((item) => item.status === "running")
          ? "running"
          : own.length > 0 && own.every((item) => item.status === "completed")
            ? "completed"
            : "idle";
  };
  // The inbox's own counts, in words that agree: failed tasks wait on the
  // person too.
  const waiting = items.filter(
    (item) => item.status === "needs-you" || item.status === "failed",
  ).length;
  const running = items.filter((item) => item.status === "running").length;
  const summary =
    [
      waiting > 0
        ? t(
            `${formatCount(waiting, "request", config)} بانتظارك`,
            `${formatCount(waiting, "request", config)} ${waiting === 1 ? "needs" : "need"} you`,
          )
        : "",
      running > 0
        ? t(
            `${formatCount(running, "task", config)} ${running === 2 ? "تعملان" : "تعمل"}`,
            `${formatCount(running, "task", config)} running`,
          )
        : "",
    ]
      .filter(Boolean)
      .join(" · ") || t("لا شيء بانتظارك", "Nothing needs you");

  // The inbox starts with every agent; its companion workspace already shows
  // Finance so the person can see what the team is doing before filtering.
  const focusedAgent = agent ?? "finance";
  const name = story.agents[focusedAgent][language];
  const waitingFor = (id: AgentId) =>
    items.filter((item) => item.agent.id === id && item.status === "needs-you")
      .length;
  const activityFor = (id: AgentId) => {
    const count = waitingFor(id);
    if (id === "finance")
      return count
        ? t(
            "أنهى المطابقة · ينتظر قراراتك",
            "Checks finished · awaiting your decisions",
          )
        : t(
            "المطابقة مكتملة · يتابع الإقفال",
            "Checks complete · following the close",
          );
    if (id === "collections")
      return t(
        `مسودات جاهزة للمراجعة: ${number(count)}`,
        `${number(count)} drafts ready for review`,
      );
    return retried
      ? t("يعيد توليد غلاف الحملة", "Generating the campaign cover again")
      : t(
          "توقّف التوليد · يحتاج إعادة المحاولة",
          "Generation stopped · retry needed",
        );
  };
  return (
    <>
      <ScreenHeader
        description={summary}
        // The panel sits beside the inbox only when wide. Below that the
        // focused agent gets this button, which opens the panel in a Sheet; the
        // strip's toggles belong to the inbox and can't open one.
        actions={
          size !== "wide" ? (
            <Sheet
              side={endSide}
              title={t(`مهام ${name}`, `${name} tasks`)}
              description={t(
                "سياق الوكيل ومهامه وخطوته الجارية.",
                "The agent's context, tasks and current step.",
              )}
              closeLabel={t("إغلاق مهام الوكيل", "Close agent tasks")}
              trigger={
                <Button variant="secondary">
                  {t(`مهام ${name}`, `${name} tasks`)}
                </Button>
              }
            >
              <AgentPanel
                key={focusedAgent}
                id={focusedAgent}
                retried={retried}
                state={stateOf(focusedAgent)}
                waiting={waitingFor(focusedAgent)}
                level={3}
              />
            </Sheet>
          ) : undefined
        }
      />
      <section
        className="agent-control-room-overview"
        aria-label={t("نشاط وكلاء الذكاء الاصطناعي", "AI agent activity")}
      >
        {agentIds.map((id) => {
          const card = (
            <button
              key={id}
              type="button"
              className="agent-control-room-card"
              data-agent={id}
              style={agentStyle(colors[id])}
              aria-pressed={agent === id}
              onClick={() => setAgent(agent === id ? null : id)}
            >
              <span className="agent-control-room-card-top">
                <ScreenAgentAvatar
                  agent={id}
                  state={mascotState(stateOf(id))}
                />
                <span className="agent-control-room-card-identity">
                  <span className="agent-control-room-eyebrow">
                    {t("وكيل ذكاء اصطناعي", "AI agent")}
                  </span>
                  <strong>{story.agents[id][language]}</strong>
                </span>
                <StatusPill state={stateOf(id)} />
              </span>
              <span className="agent-control-room-card-activity">
                {activityFor(id)}
              </span>
              <span className="agent-control-room-card-footer">
                <span>
                  {t(
                    `مهام مكتملة: ${number(panels[id].tasks.filter((task) => task.state === "completed").length)}`,
                    `Tasks completed: ${number(panels[id].tasks.filter((task) => task.state === "completed").length)}`,
                  )}
                </span>
                <span>{t("عرض مساحة العمل", "View workspace")}</span>
              </span>
            </button>
          );
          return size === "wide" ? (
            card
          ) : (
            <Sheet
              key={id}
              trigger={card}
              side={endSide}
              title={t(
                `مهام ${story.agents[id][language]}`,
                `${story.agents[id][language]} tasks`,
              )}
              description={t(
                "سياق الوكيل ومهامه وخطوته الجارية.",
                "The agent's context, tasks and current step.",
              )}
              closeLabel={t("إغلاق مهام الوكيل", "Close agent tasks")}
            >
              <AgentPanel
                id={id}
                retried={retried}
                state={stateOf(id)}
                waiting={waitingFor(id)}
                level={3}
              />
            </Sheet>
          );
        })}
      </section>
      <div className="agent-control-room">
        <DecisionInbox
          tab={demo.active ? "running" : tab}
          onTabChange={setTab}
          items={items}
          agents={agentIds.map((id) => ({
            id,
            name: story.agents[id][language],
            state: stateOf(id),
          }))}
          agent={agent}
          onAgentChange={(id) => setAgent(id as AgentId | null)}
          // Recorded after the host's moment; Escape or leaving aborts it.
          onDecision={async (given, decision, { signal }) => {
            await recorded(signal);
            record(given.id, decision);
          }}
          onAnswer={async (id, _answers, { signal }) => {
            await recorded(signal);
            record(id, "answered");
          }}
          // Start the cover again: it runs, and leaves «بانتظارك».
          onRetry={(id) => record(id, "retried")}
          onOpen={(id) => open(screenOf(id))}
          headingLevel={2}
        />
        {size === "wide" && (
          <Tray
            className="agent-control-room-panel screen-agent-panel"
            style={agentStyle(colors[focusedAgent])}
          >
            <AgentPanel
              key={focusedAgent}
              id={focusedAgent}
              retried={retried}
              state={stateOf(focusedAgent)}
              waiting={waitingFor(focusedAgent)}
              level={2}
            />
          </Tray>
        )}
      </div>
    </>
  );
}

/**
 * The picked agent: its name and context, its tasks and the operation its
 * running step is on. On the panel it is one level under the page's headings;
 * in a Sheet, one under the Sheet's title.
 */
function AgentPanel({
  id,
  retried,
  state,
  waiting,
  level,
}: {
  id: AgentId;
  retried: boolean;
  state: StatusPillState;
  waiting: number;
  level: 2 | 3;
}) {
  const [color] = useAgentColor(id);
  const { language, t, number } = useScreen();
  const demo = useScreenDemo();
  const uid = useId();
  const text = (value: Text) => t(value.ar, value.en);
  const panel = panels[id];
  const name = story.agents[id][language];
  const Section = `h${level + 1}` as "h3" | "h4";
  const said = (summary: Summary) =>
    summary.count === undefined
      ? text(summary)
      : `${number(summary.count)} ${text(summary)}`;
  // A failed task the host retried is running again.
  const tasks = panel.tasks.map((task, index) =>
    demo.active && id === "finance"
      ? {
          ...task,
          state:
            index < demo.step
              ? ("completed" as const)
              : index === demo.step
                ? ("running" as const)
                : ("pending" as const),
        }
      : task.state === "failed" && retried && task.retried
        ? { ...task, ...task.retried, state: "running" as const }
        : task,
  );
  const rows: TaskRowItem[] = tasks.map((task) => ({
    id: task.id,
    title: text(task.title),
    summary: said(task.summary),
    state: task.state,
    content: <p className="agent-control-room-note">{text(task.note)}</p>,
  }));
  const step = tasks.find((task) => task.state === "running")?.tool;
  const completed = tasks.filter((task) => task.state === "completed").length;
  const currentRun =
    id === "finance"
      ? text(closeName)
      : id === "collections"
        ? t("تذكيرات الفواتير المتأخرة", "Overdue invoice reminders")
        : text(cover.title);
  return (
    <div className="agent-control-room-panel-content" style={agentStyle(color)}>
      <div className="agent-control-room-agent">
        <ScreenAgentHeading
          agent={id}
          title={name}
          state={mascotState(state)}
          headingLevel={level}
        />
        {/* Keyed by agent, so one agent's open details don't carry over to
            the next. Quiet: the inbox's region is the page's one. */}
        <ContextMeter
          key={id}
          announcement="off"
          used={panel.context.used}
          capacity={panel.context.capacity}
          details={panel.context.parts.map((part) => ({
            id: part.id,
            label: text(part.label),
            value: part.value,
          }))}
        />
      </div>
      <section
        className="agent-control-room-run"
        aria-labelledby={`${uid}-run`}
      >
        <div className="agent-control-room-run-heading">
          <Section id={`${uid}-run`} className="agent-control-room-heading">
            {t("العمل الحالي", "Current run")}
          </Section>
          <StatusPill state={state} />
        </div>
        <p className="agent-control-room-run-title">{currentRun}</p>
        <Progress
          label={t(
            `${number(completed)} من ${number(tasks.length)} مهام مكتملة`,
            `${number(completed)} of ${number(tasks.length)} tasks complete`,
          )}
          value={(completed / tasks.length) * 100}
          locale={language}
        />
        <p className="agent-control-room-note">
          {demo.active
            ? t(
                "يراجع الوكيل بيانات المهمة ويجهّز النتائج.",
                "The agent is inspecting task records and preparing results.",
              )
            : waiting
              ? t(
                  `بانتظار مراجعتك في صندوق القرارات: ${number(waiting)}.`,
                  `${number(waiting)} ${waiting === 1 ? "request awaits" : "requests await"} your review in the decision inbox.`,
                )
              : step
                ? t(
                    "ينفّذ الوكيل الخطوة التالية.",
                    "The agent is working on the next step.",
                  )
                : id === "campaigns"
                  ? text(cover.error)
                  : t(
                      "اكتملت المطابقة. يتابع الوكيل الخطوات المتبقية.",
                      "Checks are complete. The agent is tracking the remaining steps.",
                    )}
        </p>
      </section>
      <section
        className="agent-control-room-section"
        aria-labelledby={`${uid}-tasks`}
      >
        <Section id={`${uid}-tasks`} className="agent-control-room-heading">
          {t("المهام", "Tasks")}
        </Section>
        <TaskRows
          label={t(`مهام ${name}`, `${name} tasks`)}
          items={rows}
          appearance="plain"
        />
      </section>
      <section
        className="agent-control-room-section"
        aria-labelledby={`${uid}-step`}
      >
        <Section id={`${uid}-step`} className="agent-control-room-heading">
          {t("الخطوة الجارية", "Current step")}
        </Section>
        {step ? (
          <div className="agent-control-room-step">
            <ToolCall
              label={text(step.label)}
              tool={step.tool}
              state="running"
              input={step.input}
              appearance="plain"
              announcement="off"
              headingLevel={(level + 2) as 4 | 5}
            />
          </div>
        ) : (
          <p className="agent-control-room-note">
            {t("لا توجد خطوة تعمل الآن.", "No step is running now.")}
          </p>
        )}
      </section>
    </div>
  );
}
