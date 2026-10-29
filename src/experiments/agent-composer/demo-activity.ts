import { agentDefinitions, demoStepEnds } from "./agent-data";
import type { RunSettings } from "./useDemoRun";
import type {
  ActivityEvent,
  ActivityPanel,
  ComposerActivity,
} from "./activity-runtime";

/** A replaceable local fixture. A real app supplies these events from its server. */
export function demoActivityEvents(settings: RunSettings, runId: string) {
  const timeline: { at: number; event: ActivityEvent }[] = [];
  const duration = 18000 + (settings.agents - 1) * 5000;
  function add(at: number, activity: Omit<ComposerActivity, "sequence">) {
    timeline.push({
      at,
      event: { type: "activity.changed", runId, sequence: 0, activity },
    });
  }
  function tool(
    panel: ActivityPanel,
    start: number,
    end: number,
    label: [string, string],
    detail: [string, string],
    outcome: [string, string],
  ) {
    const activity = {
      id: `${runId}:${panel}`,
      panel,
      label,
      detail,
      status: "running" as const,
    };
    add(start, activity);
    add(Math.min(end, duration), {
      ...activity,
      status: "complete",
      label: outcome,
    });
  }
  tool(
    "repo",
    0,
    2200,
    ["Read project context", "قراءة سياق المشروع"],
    [`field-notes / ${settings.branch}`, `field-notes / ${settings.branch}`],
    ["Project context ready", "سياق المشروع جاهز"],
  );
  if (settings.folders.length)
    tool(
      "folders",
      2200,
      8500,
      ["Read selected files", "قراءة الملفات المحددة"],
      [settings.folders.join(" · "), settings.folders.join(" · ")],
      ["Selected files read", "تمت قراءة الملفات"],
    );
  if (settings.research)
    tool(
      "research",
      6500,
      12500,
      ["Look up interaction patterns", "البحث عن أنماط التفاعل"],
      [
        "Composer behavior · keyboard access",
        "سلوك المحرر · التنقل بلوحة المفاتيح",
      ],
      ["3 demo sources collected", "جُمعت 3 مصادر توضيحية"],
    );
  if (settings.references.length)
    tool(
      "refs",
      10500,
      14500,
      ["Compare attached references", "مقارنة المراجع المرفقة"],
      [
        settings.references.join(" · "),
        `${settings.references.length} مراجع محددة`,
      ],
      ["Reference comparison ready", "مقارنة المراجع جاهزة"],
    );
  if (settings.skills.length)
    tool(
      "skills",
      14000,
      20000,
      ["Apply selected skills", "تطبيق المهارات المحددة"],
      [
        settings.skills.map((skill) => `/${skill}`).join(" · "),
        settings.skills.map((skill) => `/${skill}`).join(" · "),
      ],
      ["Skill checks complete", "اكتمل فحص المهارات"],
    );
  agentDefinitions.slice(0, settings.agents).forEach((definition, index) => {
    const activity = {
      id: `${runId}:agent-${index}`,
      panel: `agent-${index}` as const,
      status: "running" as const,
      detail: definition.name as [string, string],
    };
    add(index * 5000, {
      ...activity,
      label: definition.actions[0] as [string, string],
    });
    demoStepEnds.forEach((at, step) =>
      add(index * 5000 + at, {
        ...activity,
        status: step === 4 ? "complete" : "running",
        label: (step === 4
          ? definition.outcome
          : definition.actions[step + 1]) as [string, string],
      }),
    );
  });
  timeline.sort((a, b) => a.at - b.at);
  return timeline.map((item, index) => ({
    ...item,
    event: { ...item.event, sequence: index + 1 },
  }));
}
