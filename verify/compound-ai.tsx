import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  ChartColumn,
  FileText,
  Folder,
  House,
  MessageSquare,
  Settings,
} from "lucide-react";
import {
  Button,
  ChatThread,
  ChatThreadMessage,
  Sidebar,
  SidebarAction,
  SidebarContent,
  SidebarDisclosure,
  SidebarGroup,
  SidebarItem,
  SidebarToggle,
  SystemProvider,
  TaskStarter,
  ToolChip,
  ToolChips,
  defaultConfig,
} from "../src/system";
import type { LucideIcon } from "lucide-react";
import type { ChatMessage, SidebarIconName } from "../src/system";
import "../src/system/styles.css";

// Every request a part reports, in order, for the driver to count.
declare global {
  interface Window {
    __requests: string[];
  }
}
window.__requests = [];

type Say = (ar: string, en: string) => string;
type Record_ = (kind: string, value: string) => number;

export function Chat({ t, record }: { t: Say; record: Record_ }) {
  const [failed, setFailed] = useState(true);
  const [extra, setExtra] = useState(0);
  const messages: ChatMessage[] = [
    {
      id: "question",
      role: "user",
      content: t("ما صافي التدفق النقدي؟", "What was net cash flow?"),
    },
    {
      id: "answer",
      role: "assistant",
      identity: t("ترياز", "Tiraz"),
      status: failed ? "failed" : "completed",
      error: t(
        "انقطع الاتصال بدفتر الأستاذ.",
        "The ledger connection dropped.",
      ),
      onRetry: () => {
        record("retry", "answer");
        setFailed(false);
      },
      content: t("انخفض صافي التدفق النقدي", "Net cash flow fell"),
    },
    ...Array.from({ length: extra }, (_, index): ChatMessage => ({
      id: `more-${index}`,
      role: "assistant",
      status: "streaming",
      content: t(`رد إضافي ${index + 1}`, `Extra reply ${index + 1}`),
    })),
  ];
  return (
    <>
      <div className="pair">
        <div className="thread">
          <ChatThread label={t("الأجزاء", "Parts")} data-variant="parts">
            {messages.map((message) => (
              <ChatThreadMessage
                key={message.id}
                id={message.id}
                role={message.role}
                identity={message.identity as string | undefined}
                status={message.status}
                error={message.error as string | undefined}
                onRetry={message.onRetry}
              >
                {message.content}
              </ChatThreadMessage>
            ))}
          </ChatThread>
        </div>
        <div className="thread">
          <ChatThread
            label={t("السجلات", "Records")}
            data-variant="records"
            messages={messages}
          />
        </div>
      </div>
      <div className="row">
        <Button variant="secondary" onClick={() => setExtra(extra + 1)}>
          {t("أضف ردًا", "Add reply")}
        </Button>
      </div>
    </>
  );
}

export function Tools({ t, record }: { t: Say; record: Record_ }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => {
    record("activate", expanded ? "close" : "open");
    setExpanded(!expanded);
  };
  return (
    <>
      <ToolChips label={t("نشاط الأدوات (أجزاء)", "Tool activity (parts)")}>
        <ToolChip
          id="read"
          label={t("قراءة ملفات", "Read files")}
          state="completed"
          count={3}
          onActivate={toggle}
          controls="tool-details"
          expanded={expanded}
        />
        <ToolChip id="check" label={t("تدقيق", "Proofread")} state="running" />
        <ToolChip
          id="send"
          label={t("إرسال", "Send")}
          state="failed"
          onActivate={() => record("activate", "send")}
        />
        <ToolChip
          id="wait"
          label={t("بانتظارك", "Waiting")}
          state="needs-you"
        />
      </ToolChips>
      <p id="tool-details" hidden={!expanded}>
        {t("قُرئت ثلاثة ملفات.", "Three files were read.")}
      </p>
      <ToolChips
        label={t("نشاط الأدوات (عناصر)", "Tool activity (items)")}
        items={[
          {
            id: "read",
            label: t("قراءة ملفات", "Read files"),
            state: "completed",
            count: 3,
            onActivate: toggle,
            controls: "tool-details",
            expanded,
          },
          { id: "check", label: t("تدقيق", "Proofread"), state: "running" },
          {
            id: "send",
            label: t("إرسال", "Send"),
            state: "failed",
            onActivate: () => record("activate", "send-items"),
          },
          { id: "wait", label: t("بانتظارك", "Waiting"), state: "needs-you" },
        ]}
      />
    </>
  );
}

export function Starter({ t, record }: { t: Say; record: Record_ }) {
  const [value, setValue] = useState("");
  return (
    <TaskStarter
      title={t("ماذا نُنجز اليوم؟", "What shall we do today?")}
      value={value}
      onValueChange={setValue}
      context={[{ id: "inv", label: "INV-1043", kind: t("فاتورة", "Invoice") }]}
      onSubmit={(draft) => {
        record("submit", draft);
        setValue("");
      }}
    />
  );
}

// The same icon by name, or as a node.
const pick = (byName: boolean, name: SidebarIconName, Node: LucideIcon) =>
  byName ? { iconName: name } : { icon: <Node size={18} /> };
export function Nav({
  t,
  byName,
  collapsed,
  onCollapsedChange,
}: {
  t: Say;
  byName: boolean;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const icon = (name: SidebarIconName, Node: LucideIcon) =>
    pick(byName, name, Node);
  return (
    <div className="rail">
      <Sidebar
        aria-label={
          byName
            ? t("مساحة العمل (بالاسم)", "Workspace (by name)")
            : t("مساحة العمل (عقدة)", "Workspace (node)")
        }
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      >
        <SidebarToggle
          collapseLabel={t("طيّ التنقل", "Collapse navigation")}
          expandLabel={t("توسيع التنقل", "Expand navigation")}
        />
        <SidebarContent aria-label={t("التنقل الرئيسي", "Primary")}>
          <SidebarGroup heading={t("العمل", "Work")}>
            <SidebarItem
              {...icon("home", House)}
              href="#home"
              label={t("الرئيسية", "Home")}
              active
            />
            <SidebarItem
              {...icon("chat", MessageSquare)}
              href="#chat"
              label={t("المحادثات", "Chats")}
              count={3}
            />
            <SidebarDisclosure
              {...icon("folder", Folder)}
              label={t("المشاريع", "Projects")}
              defaultOpen
            >
              <SidebarItem
                {...icon("file-text", FileText)}
                href="#files"
                label={t("الملفات", "Files")}
              />
              <SidebarItem
                {...icon("chart", ChartColumn)}
                href="#reports"
                label={t("التقارير", "Reports")}
              />
            </SidebarDisclosure>
          </SidebarGroup>
        </SidebarContent>
        <SidebarAction
          {...icon("bell", Bell)}
          label={t("التنبيهات", "Alerts")}
          count="9+"
        />
        <SidebarAction
          {...icon("settings", Settings)}
          label={t("الإعدادات", "Settings")}
        />
      </Sidebar>
    </div>
  );
}

export function Panel({ arabic }: { arabic: boolean }) {
  const t: Say = (ar, en) => (arabic ? ar : en);
  const name = arabic ? "Arabic RTL" : "English LTR";
  const key = arabic ? "ar" : "en";
  const [collapsed, setCollapsed] = useState(false);
  const record: Record_ = (kind, value) =>
    window.__requests.push(`${key}:${kind}:${value}`);
  return (
    <section aria-label={name} className="panel">
      <h2>{name}</h2>
      <SystemProvider
        lang={arabic ? "ar" : "en"}
        config={{ ...defaultConfig, direction: arabic ? "rtl" : "ltr" }}
      >
        <Chat t={t} record={record} />
        <Tools t={t} record={record} />
        <Starter t={t} record={record} />
        <div className="pair">
          <Nav
            t={t}
            byName
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
          />
          <Nav
            t={t}
            byName={false}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
          />
        </div>
      </SystemProvider>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main>
      <h1>Tiraz compound AI verification</h1>
      <div className="panels">
        <Panel arabic />
        <Panel arabic={false} />
      </div>
    </main>
  </StrictMode>,
);
