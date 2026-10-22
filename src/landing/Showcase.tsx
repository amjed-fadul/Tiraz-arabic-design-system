import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpLeft, ArrowUpRight, FileText, ListChecks } from "lucide-react";
import {
  AgentTask,
  ApprovalCard,
  approvalRequestKey,
  Button,
  ImageGeneration,
  TaskStarter,
} from "../system";
import type {
  AgentPresentation,
  AgentStep,
  AgentTaskProps,
  ApprovalDecision,
  ApprovalRequest,
  ImageGenerationProps,
} from "../system";
import { Khayt } from "../mascot/Khayt";
import type { KhaytState } from "../mascot/khayt-motion";
import { numberLocale } from "../system/config";
import { useSystem } from "../system/useSystem";
import finishedBand from "./assets/loom/finished-band.webp";
import weavingDraft from "./assets/loom/draft.webp";
import "./showcase.css";

type DemoProps = { ar: boolean; announce: (message: string) => void };

function previewAgent(state: KhaytState): AgentPresentation {
  const color = "#946D91";
  return {
    avatar: <Khayt state={state} color={color} size={48} animated />,
    color,
  };
}

function Tile({
  title,
  caption,
  component,
  tag,
  ar,
  children,
}: {
  title: string;
  caption: string;
  component: string;
  tag: string;
  ar: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  return (
    <article className="lp-showcase-tile" aria-labelledby={id}>
      <header className="lp-showcase-heading">
        <div>
          <h3 id={id}>{title}</h3>
          <p>{caption}</p>
        </div>
        <a
          className="lp-showcase-source"
          href={`/library/components/${component}`}
        >
          <bdi dir="ltr">{tag}</bdi>
          <Arrow size={14} aria-hidden="true" />
        </a>
      </header>
      <div className="lp-showcase-stage">{children}</div>
    </article>
  );
}

function StarterPreview({ ar, announce }: DemoProps) {
  const { config } = useSystem();
  const digits = new Intl.NumberFormat(numberLocale(config, ar ? "ar" : "en"));
  const [value, setValue] = useState(
    "Turn this project brief into a clear launch plan.",
  );
  const [contextIds, setContextIds] = useState(["brief", "notes"]);
  const [receipt, setReceipt] = useState<{ prompt: string; count: number }>();
  const records = [
    {
      id: "brief",
      label: ar ? "ملخّص المشروع" : "Project brief",
      kind: ar ? "مستند" : "Document",
      icon: <FileText size={14} aria-hidden="true" />,
    },
    {
      id: "notes",
      label: ar ? "ملاحظات المنتج" : "Product notes",
      kind: ar ? "مستند" : "Document",
      icon: <ListChecks size={14} aria-hidden="true" />,
    },
  ];
  const suggestions = [
    {
      id: "launch",
      label: ar ? "جهّز خطة الإطلاق" : "Draft a launch plan",
      prompt: "Turn this project brief into a clear launch plan.",
    },
    {
      id: "review",
      label: ar ? "راجع الملخّص" : "Review the brief",
      prompt: "Review the project brief and list the open questions.",
    },
  ];
  const receiptLabel = (count: number) =>
    ar
      ? `المعاينة المحلية جاهزة، مستندات مرفقة: ${digits.format(count)}`
      : `Local preview ready · Attached documents: ${digits.format(count)}`;
  return (
    <div className="lp-showcase-demo">
      <TaskStarter
        agentPresentation={{
          ...previewAgent(receipt ? "done" : "idle"),
          name: ar ? "مساعد المشروع" : "Project assistant",
        }}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          setReceipt(undefined);
        }}
        onSubmit={(prompt, context) => {
          setReceipt({ prompt, count: context.length });
          announce(receiptLabel(context.length));
        }}
        context={records.filter((record) => contextIds.includes(record.id))}
        mentionOptions={records}
        onAddContext={(id) => {
          setReceipt(undefined);
          setContextIds((current) => [...new Set([...current, id])]);
          const label = records.find((record) => record.id === id)?.label;
          announce(
            ar ? `أُضيف إلى السياق: ${label}` : `Added to context: ${label}`,
          );
        }}
        onRemoveContext={(id) => {
          setReceipt(undefined);
          setContextIds((current) => current.filter((record) => record !== id));
          const label = records.find((record) => record.id === id)?.label;
          announce(
            ar ? `أُزيل من السياق: ${label}` : `Removed from context: ${label}`,
          );
        }}
        suggestions={suggestions}
        onSuggestion={(id) => {
          const suggestion = suggestions.find((item) => item.id === id);
          if (suggestion) {
            setReceipt(undefined);
            setValue(suggestion.prompt);
            announce(
              ar
                ? "أُضيف الاقتراح إلى طلبك"
                : "Suggestion added to your request",
            );
          }
        }}
        greeting={ar ? "مساحة المشروع" : "Project workspace"}
        headingLevel={4}
        labels={{ send: ar ? "عاين الطلب" : "Preview request" }}
        announcement="off"
      />
      {receipt && (
        <div className="lp-showcase-receipt">
          <strong>{receiptLabel(receipt.count)}</strong>
          <p dir="auto">{receipt.prompt}</p>
        </div>
      )}
    </div>
  );
}

function AgentPreview({ ar, announce }: DemoProps) {
  const [status, setStatus] = useState<AgentTaskProps["status"]>("plan");
  const [completed, setCompleted] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  // These timers advance a local demonstration, only after Start is pressed.
  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setTimeout(() => {
      const next = completed + 1;
      setCompleted(next);
      if (next === 3) {
        setStatus("completed");
        announce(ar ? "اكتملت معاينة المهمة" : "Task preview complete");
      }
    }, 1_400);
    return () => window.clearTimeout(timer);
  }, [status, completed, ar, announce]);

  const steps: AgentStep[] = [
    {
      id: "read",
      title: ar ? "قراءة ملخّص المشروع" : "Read the project brief",
      detail: ar ? "الأهداف والجمهور" : "Goals and audience",
      state: "planned",
    },
    {
      id: "organize",
      title: ar ? "ترتيب مراحل الإطلاق" : "Organize the launch stages",
      detail: ar ? "المهام وأولوياتها" : "Tasks and priorities",
      state: "planned",
    },
    {
      id: "prepare",
      title: ar ? "تجهيز قائمة المراجعة" : "Prepare the checklist",
      detail: ar ? "مسودّة جاهزة للمراجعة" : "A draft ready to review",
      state: "planned",
    },
  ].map((step, index) => ({
    ...step,
    state:
      index < completed
        ? "completed"
        : status === "plan"
          ? "planned"
          : status === "running" && index === completed
            ? "running"
            : "pending",
  }));
  function start() {
    if (status === "stopped")
      root.current?.querySelector<HTMLElement>("section")?.focus();
    setCompleted(0);
    setStatus("running");
    announce(ar ? "بدأت معاينة المهمة" : "Task preview started");
  }
  const replay = ar ? "أعد تجربة المهمة" : "Replay task";
  const mascotState =
    status === "plan"
      ? "waiting"
      : status === "running"
        ? "working"
        : status === "completed"
          ? "done"
          : "idle";
  return (
    <div ref={root} className="lp-showcase-demo">
      <AgentTask
        agentPresentation={previewAgent(mascotState)}
        title={ar ? "تجهيز خطة الإطلاق" : "Prepare the launch plan"}
        agent={ar ? "معاينة محلية" : "Local preview"}
        status={status}
        steps={steps}
        onStart={start}
        onStop={() => {
          setStatus("stopped");
          announce(ar ? "أُوقفت معاينة المهمة" : "Task preview stopped");
        }}
        outputs={[
          {
            id: "checklist",
            label: ar ? "قائمة مراجعة الإطلاق" : "Launch checklist",
          },
        ]}
        primaryAction={{ label: replay, onSelect: start }}
        headingLevel={4}
        announcement="off"
      />
      {status === "stopped" && (
        <div className="lp-showcase-controls">
          <Button variant="secondary" size="sm" onClick={start}>
            {replay}
          </Button>
        </div>
      )}
    </div>
  );
}

function ApprovalPreview({ ar, announce }: DemoProps) {
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const request: ApprovalRequest = {
    id: "launch-plan-preview",
    action: ar ? "هل تعتمد خطة الإطلاق؟" : "Approve the launch plan?",
    target: ar ? "خطة إطلاق المشروع" : "Project launch plan",
    consequences: [
      ar
        ? "تسجيل قرارك في هذه المعاينة فقط."
        : "Record your decision in this preview.",
      ar
        ? "يمكنك إعادة القرار وتجربة الخيار الآخر."
        : "Reset the decision to try the other choice.",
    ],
    approveLabel: ar ? "اعتمد الخطة" : "Approve plan",
    rejectLabel: ar ? "واصل المراجعة" : "Keep reviewing",
  };
  return (
    <div className="lp-showcase-demo">
      <ApprovalCard
        request={request}
        value={
          decision
            ? {
                requestId: request.id,
                requestKey: approvalRequestKey(request),
                decision,
              }
            : null
        }
        resetKey={resetKey}
        onDecision={(_, next) => {
          setDecision(next);
          announce(
            next === "approved"
              ? ar
                ? "سُجّل اعتماد الخطة محليًا"
                : "Plan approval recorded locally"
              : ar
                ? "بقيت الخطة قيد المراجعة محليًا"
                : "Plan kept in review locally",
          );
        }}
        impact={[
          {
            id: "scope",
            label: ar ? "النطاق" : "Scope",
            value: ar ? "هذه المعاينة" : "This preview",
          },
        ]}
        agent={ar ? "مساعد المشروع" : "Project assistant"}
        reversible
        headingLevel={4}
        labels={{
          approved: ar
            ? "اعتُمدت الخطة لهذه المعاينة"
            : "Plan approved for this preview",
          rejected: ar ? "بقيت الخطة قيد المراجعة" : "Plan kept in review",
          scope: ar
            ? "قرار محلي قابل لإعادة الضبط."
            : "A local decision you can reset.",
        }}
        announcement="off"
      />
      <div className="lp-showcase-controls">
        <Button
          variant="ghost"
          size="sm"
          aria-disabled={decision === null || undefined}
          onClick={() => {
            if (decision === null) return;
            setDecision(null);
            setResetKey((current) => current + 1);
            announce(
              ar ? "أُعيد القرار للمراجعة" : "Decision reset for review",
            );
          }}
        >
          {ar ? "أعد القرار" : "Reset decision"}
        </Button>
      </div>
    </div>
  );
}

function ImagePreview({ ar, announce }: DemoProps) {
  const { config } = useSystem();
  const digits = new Intl.NumberFormat(numberLocale(config, ar ? "ar" : "en"));
  const [status, setStatus] =
    useState<ImageGenerationProps["status"]>("queued");
  const [selected, setSelected] = useState("band");
  const [used, setUsed] = useState<string>();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "weaving") return;
    const timer = window.setTimeout(() => {
      setStatus("completed");
      announce(
        ar
          ? "صور المعاينة جاهزة للاختيار"
          : "Preview images are ready to choose",
      );
    }, 4_200);
    return () => window.clearTimeout(timer);
  }, [status, ar, announce]);

  function generate() {
    // The initial trigger lives outside the pattern and disappears on start.
    if (status === "queued")
      root.current?.querySelector<HTMLElement>("section")?.focus();
    setUsed(undefined);
    setStatus("weaving");
    announce(
      ar ? "بدأت معاينة توليد الصور" : "Image generation preview started",
    );
  }
  const selectionLabel = (id: string) => {
    const version = digits.format(id === "band" ? 1 : 2);
    return ar
      ? `اختيرت النسخة ${version} لهذه المعاينة`
      : `Version ${version} selected for this preview`;
  };
  return (
    <div ref={root} className="lp-showcase-demo lp-showcase-demo-image">
      <ImageGeneration
        agentPresentation={previewAgent(
          status === "weaving"
            ? "working"
            : status === "completed"
              ? "done"
              : "idle",
        )}
        prompt="Ivory threads, a deep green woven pattern, and soft studio light."
        status={status}
        images={[
          {
            id: "band",
            src: status === "completed" ? finishedBand : undefined,
            alt: ar
              ? "شريط منسوج بلونَي العاجي والأخضر"
              : "An ivory and green woven band",
            width: 1536,
            height: 864,
          },
          {
            id: "draft",
            src: status === "completed" ? weavingDraft : undefined,
            alt: ar
              ? "مخطّط نسيج وعينته المصنوعة يدويًا"
              : "A weaving draft beside its handmade swatch",
            width: 960,
            height: 1280,
          },
        ]}
        selected={selected}
        onSelectedChange={(id) => {
          setSelected(id);
          setUsed(undefined);
          announce(
            ar
              ? `معاينة النسخة ${digits.format(id === "band" ? 1 : 2)}`
              : `Previewing version ${digits.format(id === "band" ? 1 : 2)}`,
          );
        }}
        onVariations={() => generate()}
        onUse={(id) => {
          setUsed(id);
          announce(selectionLabel(id));
        }}
        agent={ar ? "صور محلية للمعاينة" : "Local preview images"}
        headingLevel={4}
        labels={{
          queued: ar ? "جاهزة للتجربة" : "Ready to try",
          variations: ar ? "جرّب تنويعات" : "Generate variations",
        }}
        announcement="off"
      />
      {status === "queued" && (
        <div className="lp-showcase-controls">
          <Button onClick={generate} size="sm">
            {ar ? "جرّب التوليد" : "Generate preview"}
          </Button>
        </div>
      )}
      {used && <p className="lp-showcase-receipt">{selectionLabel(used)}</p>}
    </div>
  );
}

/** Actual library patterns sharing the landing page's SystemProvider. */
export function Showcase({ ar }: { ar: boolean }) {
  const [notice, setNotice] = useState<{ message: string; revision: number }>();
  const announce = useCallback((message: string) => {
    setNotice((current) => ({
      message,
      revision: (current?.revision ?? 0) + 1,
    }));
  }, []);
  return (
    <div className="lp-showcase">
      <div
        className="lp-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {notice && <span key={notice.revision}>{notice.message}</span>}
      </div>
      <Tile
        ar={ar}
        title={ar ? "طلب يبدأ بسياقه" : "Start with context"}
        caption={
          ar
            ? "اكتب طلبًا، أرفق سياقه، وعاين النتيجة محليًا."
            : "Write a request, attach its context, and preview it locally."
        }
        component="task-starter"
        tag="TaskStarter"
      >
        <StarterPreview ar={ar} announce={announce} />
      </Tile>
      <Tile
        ar={ar}
        title={ar ? "كل خطوة واضحة" : "Follow every step"}
        caption={
          ar
            ? "جرّب خطة قصيرة، أوقفها، أو أعد تشغيلها."
            : "Run a short plan, stop it, or play it again."
        }
        component="agent-task"
        tag="AgentTask"
      >
        <AgentPreview ar={ar} announce={announce} />
      </Tile>
      <Tile
        ar={ar}
        title={ar ? "القرار بيدك" : "Make the decision"}
        caption={
          ar
            ? "اعتماد واضح، مع إيصال لقرار يمكنك تغييره."
            : "A clear approval, with a receipt for a decision you can change."
        }
        component="approval-card"
        tag="ApprovalCard"
      >
        <ApprovalPreview ar={ar} announce={announce} />
      </Tile>
      <Tile
        ar={ar}
        title={ar ? "من الوصف إلى الصورة" : "From prompt to image"}
        caption={
          ar
            ? "جرّب التوليد، ثم اختر من صور طِراز المحلية."
            : "Try the generation preview, then choose from Tiraz’s local images."
        }
        component="image-generation"
        tag="ImageGeneration"
      >
        <ImagePreview ar={ar} announce={announce} />
      </Tile>
    </div>
  );
}
