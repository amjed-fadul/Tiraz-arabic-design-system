import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Box,
  Check,
  ChevronDown,
  FileText,
  Folder,
  GitBranch,
  Globe2,
  Image,
  Layers2,
  Minus,
  Moon,
  Plus,
  SlidersHorizontal,
  Sun,
  Users,
  X,
} from "lucide-react";
import { SystemProvider } from "../../system/Provider";
import { defaultConfig } from "../../system/config";
import { ChatComposer } from "../../system/ChatComposer";
import { ModelSelector } from "../../system/ModelSelector";
import { ContextChoice } from "./ContextChoice";
import { EffortControl } from "./EffortControl";
import { effortNames, arabicEffortNames } from "./effort-labels";
import { agentPhase, useDemoRun } from "./useDemoRun";
import { AttachedPanel as Panel } from "./AttachedPanel";
import { AgentActivity as AgentCard } from "./AgentActivity";
import { agentDefinitions } from "./agent-data";
import { Connections } from "./Connections";
import { TirazMark } from "../../brand/TirazMark";
import { Khayt } from "../../mascot/Khayt";
import { latestActivity } from "./activity-runtime";
import type { ActivityPanel } from "./activity-runtime";
import { useActivityPanels } from "./useActivityPanels";
import "./agent-composer.css";

type PanelId = "repo" | "folders" | "skills" | "refs" | "agents";
const panelIds: PanelId[] = ["repo", "folders", "skills", "refs", "agents"];
const models = [
  {
    id: "opus",
    name: "Opus",
    provider: "Anthropic",
    description: "Sample model choice",
  },
  {
    id: "sonnet",
    name: "Sonnet",
    provider: "Anthropic",
    description: "Sample model choice",
  },
  {
    id: "codex",
    name: "Codex",
    provider: "OpenAI",
    description: "Sample model choice",
  },
];
const folderOptions = ["app/composer", "packages/ui", "app/canvas", "docs"];
const skillOptions = ["motion", "accessibility", "copy"];
const referenceOptions = [
  { name: "Composer", image: "/library-previews/chat-composer-en-dark.jpg" },
  { name: "Agent task", image: "/library-previews/agent-task-en-dark.jpg" },
  { name: "Workspace", image: "/library-previews/chat-app-en-dark.jpg" },
];
export function AgentComposerStudy() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [ar, setAr] = useState(false);
  const t = (english: string, arabic: string) => (ar ? arabic : english);
  const [draft, setDraft] = useState(
    "Map the composer, then refine its interactions.",
  );
  const [model, setModel] = useState("opus");
  const [effort, setEffort] = useState(1);
  const [branch, setBranch] = useState("main");
  const [folders, setFolders] = useState(["app/composer", "packages/ui"]);
  const [skills, setSkills] = useState(["motion", "accessibility"]);
  const [references, setReferences] = useState([
    "Composer",
    "Agent task",
    "Workspace",
  ]);
  const [research, setResearch] = useState(true);
  const [agentCount, setAgentCount] = useState(3);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderRows, setFolderRows] = useState(folderOptions.slice(0, 2));
  const addFolderButton = useRef<HTMLButtonElement>(null);
  const folderPicker = useRef<HTMLDivElement>(null);
  const researchButton = useRef<HTMLButtonElement>(null);
  const helpButton = useRef<HTMLButtonElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const triggers = useRef<Partial<Record<PanelId, HTMLButtonElement | null>>>(
    {},
  );
  const stage = useRef<HTMLDivElement>(null);
  const { run, start, stop } = useDemoRun();
  const visibleAgentCount = run?.status === "running" ? run.agents : agentCount;
  const panels = useActivityPanels(run?.activity ?? null, visibleAgentCount);
  const running = run?.status === "running";
  const activeSources =
    run?.activity.activities
      .filter((activity) => activity.status === "running")
      .map((activity) => activity.panel)
      .join(",") ?? "";
  const agentPanelIds = Array.from(
    { length: visibleAgentCount },
    (_, index) => `agent-${index}` as ActivityPanel,
  );
  const open = {
    repo: panels.isOpen("repo"),
    folders: panels.isOpen("folders"),
    skills: panels.isOpen("skills"),
    refs: panels.isOpen("refs"),
    agents: agentPanelIds.some(panels.isOpen),
  };
  const researchOpen = panels.isOpen("research");
  const someOpen = panelIds.some((id) => open[id]) || researchOpen;
  const phases = agentDefinitions
    .slice(0, visibleAgentCount)
    .map((_, index) => agentPhase(run, index));
  const activeIndex = Math.max(
    0,
    phases.findIndex((phase) => phase.status === "running"),
  );
  const activeAgent = agentDefinitions[activeIndex];
  const panelLabels = {
    repo: t("Repo", "مستودع"),
    folders: t("Folders", "مجلدات"),
    skills: t("Skills", "مهارات"),
    refs: t("Refs", "مراجع"),
    agents: t("Agents", "وكلاء"),
  };
  const panelIcons = {
    repo: BookOpen,
    folders: Folder,
    skills: SlidersHorizontal,
    refs: FileText,
    agents: Users,
  };
  const counts = {
    repo: 0,
    folders: folders.length,
    skills: skills.length,
    refs: references.length,
    agents: visibleAgentCount,
  };

  function closePanel(id: PanelId) {
    if (id === "folders") setAddingFolder(false);
    if (id === "agents") agentPanelIds.forEach(panels.dismiss);
    else panels.dismiss(id);
    triggers.current[id]?.focus();
  }
  function togglePanel(id: PanelId) {
    if (id === "folders") setAddingFolder(false);
    if (id === "agents")
      agentPanelIds.forEach(open.agents ? panels.dismiss : panels.pin);
    else panels.toggle(id);
  }
  function panelBehavior(id: ActivityPanel) {
    return {
      pinned: panels.isPinned(id),
      onPin: () => {
        panels.togglePin(id);
        if (panels.isPinned(id) && !panels.isFollowing(id)) {
          if (id === "research") researchButton.current?.focus();
          else
            triggers.current[
              id.startsWith("agent-") ? "agents" : (id as PanelId)
            ]?.focus();
        }
      },
      pinLabel: panels.isPinned(id)
        ? t("Let panel follow activity", "اترك اللوحة تتبع النشاط")
        : t("Keep panel open", "إبقاء اللوحة مفتوحة"),
      onInspect: () => panels.pin(id),
      onHoverChange: (inside: boolean) => panels.hold(id, inside),
      onFocusWithinChange: (inside: boolean) => panels.focusWithin(id, inside),
      activity: latestActivity(run?.activity ?? null, id),
      ar,
    };
  }
  function toggleItem(items: string[], item: string) {
    return items.includes(item)
      ? items.filter((value) => value !== item)
      : [...items, item];
  }
  useEffect(() => {
    if (!addingFolder || !open.folders) return;
    const inputs =
      folderPicker.current?.querySelectorAll<HTMLInputElement>("input");
    const first =
      inputs &&
      (Array.from(inputs).find((input) => !input.checked) ?? inputs[0]);
    // The reveal must become visible before the browser can accept focus.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        first?.focus({ preventScroll: true }),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [addingFolder, open.folders]);

  return (
    <SystemProvider
      className="ac-study"
      lang={ar ? "ar" : "en"}
      config={{
        ...defaultConfig,
        theme,
        direction: ar ? "rtl" : "ltr",
        numerals: "latn",
        accent: "ink",
        radius: 5,
      }}
    >
      <header className="ac-page-header">
        <a
          href="/"
          className="ac-wordmark"
          aria-label={t("Tiraz documentation", "توثيق طراز")}
        >
          <TirazMark /> طِراز<span>Tiraz</span>
        </a>
        <span className="ac-header-divider" />
        <h1>{t("Agent workspace", "مساحة الوكلاء")}</h1>
        <div className="ac-preview-settings">
          <button
            onClick={() => setAr(!ar)}
            aria-label={t("Switch to Arabic", "Switch to English")}
          >
            {ar ? "EN" : "عربي"}
          </button>
          <button
            className="ac-icon-button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t(
              `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
              theme === "dark" ? "المظهر الفاتح" : "المظهر الداكن",
            )}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>
      <main className="ac-workspace">
        <div className="ac-stage" ref={stage}>
          <Connections
            stage={stage}
            revision={`${JSON.stringify(open)}-${agentPanelIds.map(panels.isOpen)}-${visibleAgentCount}-${ar}-${researchOpen}-${addingFolder}-${phases.map((phase) => phase.status).join()}`}
            activeSources={activeSources}
          />
          <div className="ac-center">
            <div
              className="ac-conversation"
              aria-label={t("Demo conversation", "محادثة توضيحية")}
            >
              {!run ? (
                <>
                  <span className="ac-conversation-meta">
                    {t("Working in", "مساحة العمل")}{" "}
                    <bdi>field-notes / {branch}</bdi>
                  </span>
                  <p className="ac-welcome">
                    <Khayt size={40} color="#B59255" />
                    <span>
                      {t(
                        "What are we making? Bring a little context. I’ll pull in the right tools as we go.",
                        "ماذا نصنع اليوم؟ أضف سياقك، وسأستعين بالأدوات المناسبة أثناء العمل.",
                      )}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <div className="ac-user-message" data-testid="run-receipt">
                    <p dir="auto">{run.prompt}</p>
                    <span>
                      {t("Demo", "معاينة")} ·{" "}
                      {(ar ? arabicEffortNames : effortNames)[run.effort]} ·{" "}
                      {run.agents} {t("agents", "وكلاء")} ·{" "}
                      {run.status === "running"
                        ? t("Running", "قيد التنفيذ")
                        : run.status === "done"
                          ? t("Complete", "مكتمل")
                          : t("Stopped", "متوقف")}
                    </span>
                  </div>
                  {run.status === "done" && (
                    <p>
                      {t(
                        "The demo run is complete. Open an agent to inspect its steps, or send a follow-up.",
                        "اكتملت المعاينة. افتح أي وكيل لمراجعة خطواته، أو أرسل متابعة.",
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="ac-run-line" role="status">
              {running ? (
                <>
                  <span className="ac-working-mark" aria-hidden="true" />
                  {activeAgent.name[ar ? 1 : 0]} ·{" "}
                  {
                    activeAgent.actions[Math.min(phases[activeIndex].step, 4)][
                      ar ? 1 : 0
                    ]
                  }
                </>
              ) : run?.status === "done" ? (
                <>
                  <Check size={13} />
                  {t("Preview complete", "اكتملت المعاينة")}
                </>
              ) : run?.status === "stopped" ? (
                t(
                  "Stopped. Your context is still here.",
                  "توقف التنفيذ. سياقك محفوظ.",
                )
              ) : (
                t("Ready when you are", "جاهز للبدء")
              )}
            </div>
            <div className="ac-composer" data-composer-anchor>
              <div className="ac-composer-head">
                <ModelSelector
                  models={models}
                  value={model}
                  onValueChange={setModel}
                  label={t("Model", "النموذج")}
                />
                <EffortControl value={effort} onChange={setEffort} ar={ar} />
              </div>
              <ChatComposer
                value={draft}
                onValueChange={setDraft}
                dir="auto"
                appearance="plain"
                label={t("Your message", "رسالتك")}
                placeholder={t(
                  "Ask anything, or add a follow-up…",
                  "اكتب طلبك أو أضف متابعة…",
                )}
                state={running ? "streaming" : "idle"}
                onStop={stop}
                onSubmit={(prompt) => {
                  if (
                    start({
                      prompt,
                      model,
                      effort: Math.round(effort),
                      agents: agentCount,
                      folders,
                      skills,
                      references,
                      branch,
                      research,
                    })
                  ) {
                    setDraft("");
                  }
                }}
                tools={{
                  start: (
                    <>
                      <button
                        className="ac-reference-tool"
                        aria-label={t("Attach references", "إرفاق مراجع")}
                        onClick={() => panels.pin("refs")}
                      >
                        <Image size={13} />
                      </button>
                      <button
                        ref={researchButton}
                        className="ac-research-toggle"
                        aria-expanded={researchOpen}
                        aria-controls="ac-panel-research"
                        onClick={() => panels.toggle("research")}
                      >
                        <Globe2 size={13} />
                        <span>{t("Research", "بحث")}</span>
                        {research && <i aria-hidden="true" />}
                      </button>
                    </>
                  ),
                  end: (
                    <div
                      className="ac-agent-count"
                      aria-label={t("Number of agents", "عدد الوكلاء")}
                    >
                      <button
                        aria-label={t("Fewer agents", "تقليل الوكلاء")}
                        aria-disabled={agentCount <= 1 || running}
                        onClick={() => {
                          if (agentCount <= 1 || running) return;
                          setAgentCount(agentCount - 1);
                          if (open.agents) panels.pin("agent-0");
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span>
                        <Users size={13} />
                        {agentCount}
                      </span>
                      <button
                        aria-label={t("More agents", "زيادة الوكلاء")}
                        aria-disabled={agentCount >= 3 || running}
                        onClick={() => {
                          if (agentCount >= 3 || running) return;
                          setAgentCount(agentCount + 1);
                          if (open.agents) panels.pin(`agent-${agentCount}`);
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ),
                }}
              />
            </div>
            <nav
              className="ac-dock"
              aria-label={t("Context panels", "لوحات السياق")}
            >
              {panelIds.map((id) => {
                const Icon = panelIcons[id];
                return (
                  <button
                    key={id}
                    ref={(node) => {
                      triggers.current[id] = node;
                    }}
                    className="ac-panel-trigger"
                    data-panel={id}
                    data-active={
                      id === "agents"
                        ? running
                        : activeSources.split(",").includes(id)
                    }
                    aria-expanded={open[id]}
                    aria-controls={`ac-panel-${id}`}
                    onClick={() => togglePanel(id)}
                  >
                    <Icon size={12} />
                    <span>{panelLabels[id]}</span>
                    {counts[id] > 0 && (
                      <span className="ac-trigger-count">{counts[id]}</span>
                    )}
                    {(id === "agents"
                      ? running
                      : activeSources.split(",").includes(id)) && (
                      <i
                        className="ac-trigger-running"
                        aria-label={t("Working", "يعمل")}
                      />
                    )}
                  </button>
                );
              })}
              <button
                className="ac-dock-collapse"
                aria-label={
                  someOpen
                    ? t("Hide all panels", "إخفاء جميع اللوحات")
                    : t("Show all panels", "إظهار جميع اللوحات")
                }
                title={
                  someOpen
                    ? t("Hide all panels", "إخفاء جميع اللوحات")
                    : t("Show all panels", "إظهار جميع اللوحات")
                }
                onClick={() => {
                  setAddingFolder(false);
                  panels.toggleAll();
                }}
              >
                <Layers2 size={13} />
              </button>
            </nav>
            <div className="ac-follow-row">
              <button
                role="switch"
                aria-checked={panels.follow}
                aria-label={t("Follow activity", "متابعة النشاط")}
                onClick={() => panels.setFollow(!panels.follow)}
              >
                <span className="ac-follow-indicator" aria-hidden="true" />
                {t("Follow activity", "متابعة النشاط")}
              </button>
              <span>
                {panels.follow
                  ? t(
                      "Tools open as they’re used",
                      "تظهر الأدوات عند استخدامها",
                    )
                  : t(
                      "You choose what stays open",
                      "أنت تختار اللوحات المفتوحة",
                    )}
              </span>
            </div>
            <Panel
              id="research"
              title={t("Research", "بحث")}
              icon={<Globe2 size={12} />}
              open={researchOpen}
              onClose={() => {
                panels.dismiss("research");
                researchButton.current?.focus();
              }}
              closeLabel={t("Close research", "إغلاق البحث")}
              className="ac-research-panel"
              {...panelBehavior("research")}
            >
              <div className="ac-research-mode">
                <span>{t("Web research", "البحث على الويب")}</span>
                <button
                  role="switch"
                  aria-checked={research}
                  aria-label={t("Web research", "البحث على الويب")}
                  onClick={() => setResearch(!research)}
                />
              </div>
              {research && (
                <ul className="ac-research-items">
                  <li>
                    <FileText size={11} />
                    {t("Composer anatomy", "أجزاء المحرر")}
                  </li>
                  <li>
                    <FileText size={11} />
                    {t("Motion and continuity", "الحركة والاستمرارية")}
                  </li>
                  <li>
                    <FileText size={11} />
                    {t("Keyboard interaction", "التفاعل بلوحة المفاتيح")}
                  </li>
                </ul>
              )}
            </Panel>
          </div>

          <aside
            className="ac-context"
            aria-label={t("Attached context", "السياق المرفق")}
          >
            <Panel
              id="repo"
              title={t("Repository", "المستودع")}
              icon={<BookOpen size={14} />}
              open={open.repo}
              onClose={() => closePanel("repo")}
              closeLabel={t("Close repository", "إغلاق المستودع")}
              {...panelBehavior("repo")}
            >
              <div className="ac-repo-name">
                <bdi>maya / field-notes</bdi>
                <span>{t("Your working context", "سياق العمل")}</span>
              </div>
              <label className="ac-branch">
                <GitBranch size={13} />
                <span className="tz-visually-hidden">
                  {t("Branch", "الفرع")}
                </span>
                <select
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                  dir="ltr"
                >
                  <option value="main">main</option>
                  <option value="motion-pass">motion-pass</option>
                  <option value="fix/composer-focus">fix/composer-focus</option>
                </select>
                <ChevronDown size={12} aria-hidden="true" />
              </label>
            </Panel>
            <div className="ac-folder-group">
              <Panel
                id="folders"
                title={t("Folders", "المجلدات")}
                icon={<Folder size={14} />}
                open={open.folders}
                onClose={() => closePanel("folders")}
                closeLabel={t("Close folders", "إغلاق المجلدات")}
                {...panelBehavior("folders")}
              >
                <div className="ac-check-list">
                  {folderRows.map((folder) => (
                    <ContextChoice
                      key={folder}
                      label={folder}
                      icon={<Folder size={11} />}
                      meta={[14, 31, 22, 6][folderOptions.indexOf(folder)]}
                      checked={folders.includes(folder)}
                      onChange={() => setFolders(toggleItem(folders, folder))}
                    />
                  ))}
                </div>
                <button
                  ref={addFolderButton}
                  className="ac-text-button"
                  aria-expanded={addingFolder}
                  aria-controls="ac-panel-folder-picker"
                  data-folder-trigger
                  onClick={() => setAddingFolder(!addingFolder)}
                >
                  <Plus size={13} />
                  {t("Add folder", "إضافة مجلد")}
                </button>
              </Panel>
              <div ref={folderPicker}>
                <Panel
                  id="folder-picker"
                  title={t("Project folders", "مجلدات المشروع")}
                  icon={<Folder size={11} />}
                  open={addingFolder && open.folders}
                  className="ac-folder-picker"
                  onClose={() => {
                    setAddingFolder(false);
                    addFolderButton.current?.focus();
                  }}
                  closeLabel={t("Close folder picker", "إغلاق اختيار المجلدات")}
                >
                  <div className="ac-check-list">
                    {folderOptions.map((folder) => (
                      <ContextChoice
                        key={folder}
                        label={folder}
                        icon={<Folder size={11} />}
                        checked={folders.includes(folder)}
                        onChange={() => {
                          setFolders(toggleItem(folders, folder));
                          if (!folderRows.includes(folder))
                            setFolderRows([...folderRows, folder]);
                        }}
                      />
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
            <Panel
              id="skills"
              title={t("Skills", "المهارات")}
              icon={<SlidersHorizontal size={14} />}
              open={open.skills}
              onClose={() => closePanel("skills")}
              closeLabel={t("Close skills", "إغلاق المهارات")}
              {...panelBehavior("skills")}
            >
              <div className="ac-check-list">
                {skillOptions.map((skill) => (
                  <ContextChoice
                    key={skill}
                    label={`/${skill}`}
                    icon={<Box size={11} />}
                    checked={skills.includes(skill)}
                    onChange={() => setSkills(toggleItem(skills, skill))}
                  />
                ))}
              </div>
            </Panel>
            <Panel
              id="refs"
              title={t("References", "المراجع")}
              icon={<FileText size={14} />}
              open={open.refs}
              onClose={() => closePanel("refs")}
              closeLabel={t("Close references", "إغلاق المراجع")}
              {...panelBehavior("refs")}
            >
              <div className="ac-ref-grid">
                {referenceOptions.map((reference) => (
                  <button
                    key={reference.name}
                    aria-label={reference.name}
                    title={reference.name}
                    aria-pressed={references.includes(reference.name)}
                    onClick={() =>
                      setReferences(toggleItem(references, reference.name))
                    }
                  >
                    <img src={reference.image} alt="" />
                    {references.includes(reference.name) && (
                      <span className="ac-ref-selected">
                        <Check size={9} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="ac-ref-caption">
                {references.length} {t("references attached", "مراجع مرفقة")}
              </p>
            </Panel>
          </aside>
          <aside
            id="ac-panel-agents"
            className="ac-agents"
            aria-label={t("Agents", "الوكلاء")}
          >
            {agentDefinitions.slice(0, visibleAgentCount).map((_, index) => (
              <AgentCard
                key={index}
                index={index}
                run={run}
                open={panels.isOpen(`agent-${index}`)}
                {...panelBehavior(`agent-${index}`)}
                onClose={() => {
                  panels.dismiss(`agent-${index}`);
                  triggers.current.agents?.focus();
                }}
              />
            ))}
          </aside>
        </div>
      </main>
      <footer className="ac-page-footer">
        <span>
          {t("Interactive study", "دراسة تفاعلية")}
          <span className="ac-footer-dot">·</span>
          {t(
            "Local demo · sample context and agent activity",
            "معاينة محلية · سياق ونشاط توضيحيان",
          )}
        </span>
        <button
          ref={helpButton}
          onClick={() => {
            setAnnouncement(
              t(
                "Send a prompt to see tools appear in context. Open any panel yourself to keep it here, or pin an automatic panel. Dismissed panels stay closed for this run. Drag the colored effort threads or choose a named level.",
                "أرسل طلبًا لتظهر الأدوات في سياقها. افتح أي لوحة بنفسك أو ثبّتها لتبقى. اللوحات المغلقة لا تعود أثناء التنفيذ الحالي. اسحب خيوط التفكير الملونة أو اختر مستوى.",
              ),
            );
          }}
        >
          {t("How to try it", "طريقة التجربة")}
        </button>
      </footer>
      {announcement && (
        <div className="ac-help" role="status">
          {announcement}
          <button
            className="ac-icon-button"
            aria-label={t("Close help", "إغلاق المساعدة")}
            onClick={() => {
              setAnnouncement("");
              helpButton.current?.focus();
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </SystemProvider>
  );
}
