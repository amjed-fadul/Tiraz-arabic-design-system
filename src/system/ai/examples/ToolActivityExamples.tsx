import { useEffect, useId, useRef, useState } from "react";
import { Button, ToolCall, ToolChips } from "../../index";
import type { ToolCallState } from "../../index";
type Language = "ar" | "en";
export function ToolCallExample({
  language = "ar",
  defaultExpanded = false,
  longContent = false,
}: {
  language?: Language;
  defaultExpanded?: boolean;
  longContent?: boolean;
}) {
  const ar = language === "ar";
  return (
    <div style={{ display: "grid", gap: "var(--space-2)", minInlineSize: 0 }}>
      <ToolCall
        key={String(defaultExpanded)}
        label={ar ? "قراءة ملاحظات العينة" : "Read sample notes"}
        tool="read_file"
        state="completed"
        duration="0.2s"
        defaultExpanded={defaultExpanded}
        input={JSON.stringify({ path: "sample/notes.txt" }, null, 2)}
        output={
          longContent
            ? Array.from(
                { length: 60 },
                (_, i) => `${i + 1}: ${"sample-output ".repeat(30)}`,
              ).join("\n")
            : JSON.stringify({ notes: 3, topic: "Design review" }, null, 2)
        }
        announcement="off"
      />
      <ToolCall
        label={ar ? "مراجعة تسميات العينة" : "Check sample labels"}
        tool="check_labels"
        state="running"
        input={'{ "language": "ar" }'}
        announcement="off"
      />
      <ToolCall
        label={ar ? "حفظ ملخص العينة" : "Save sample summary"}
        tool="save_summary"
        state="failed"
        defaultExpanded
        error={
          ar
            ? "تعذّر حفظ العينة. لم يتغير أي ملف."
            : "Sample could not be saved. No file was changed."
        }
        input={'{ "name": "sample-summary" }'}
        announcement="off"
      />
      <ToolCall
        label={ar ? "إعداد التصدير" : "Prepare export"}
        tool="prepare_export"
        state="pending"
        announcement="off"
      />
    </div>
  );
}
export function ToolChipsExample({
  language = "ar",
  counts = true,
}: {
  language?: Language;
  counts?: boolean;
}) {
  const ar = language === "ar";
  return (
    <ToolChips
      label={ar ? "ملخص نشاط العينة" : "Sample activity summary"}
      items={[
        {
          id: "read",
          label: ar ? "قراءة ملفات" : "Read files",
          state: "completed",
          count: counts ? 3 : undefined,
        },
        { id: "check", label: ar ? "مراجعة" : "Check", state: "running" },
        {
          id: "save",
          label: ar ? "حفظ" : "Save",
          state: "failed",
          count: counts ? 1 : undefined,
        },
        { id: "export", label: ar ? "تصدير" : "Export", state: "pending" },
      ]}
    />
  );
}
export function ToolRenderedOutputExample({
  language = "ar",
}: {
  language?: Language;
}) {
  const ar = language === "ar";
  return (
    <ToolCall
      label={ar ? "عرض ملاحظات العينة" : "List sample notes"}
      tool="list_notes"
      state="completed"
      defaultExpanded
      duration="0.1s"
      announcement="off"
      output={
        <ul style={{ margin: 0, paddingInlineStart: "var(--space-5)" }}>
          <li>
            {ar ? "مراجعة التصميم · ٣ ملاحظات" : "Design review · 3 notes"}
          </li>
          <li>{ar ? "تخطيط الصفحة · ملاحظتان" : "Page layout · 2 notes"}</li>
        </ul>
      }
    />
  );
}
/** Explicitly started host simulation. Fixed sample data; never executes a tool. */
export function ToolActivityDemo({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar",
    uid = useId();
  const [read, setRead] = useState<ToolCallState>("pending"),
    [save, setSave] = useState<ToolCallState>("pending");
  const [started, setStarted] = useState(false),
    [open, setOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    generation = useRef(0);
  const call = useRef<HTMLDivElement>(null);
  function clearRun() {
    generation.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  useEffect(() => () => clearRun(), []);
  function later(ms: number, callback: () => void) {
    const current = generation.current;
    timers.current.push(
      setTimeout(() => {
        if (generation.current === current) callback();
      }, ms),
    );
  }
  function run() {
    clearRun();
    setStarted(true);
    setRead("running");
    setSave("pending");
    later(1200, () => {
      setRead("completed");
      setSave("failed");
    });
  }
  function retry() {
    clearRun();
    setSave("running");
    later(1000, () => setSave("completed"));
  }
  return (
    <div style={{ display: "grid", gap: "var(--space-3)", minInlineSize: 0 }}>
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: "var(--text-meta)",
        }}
      >
        {ar
          ? "محاكاة محلية ببيانات نموذجية؛ تبدأ عند الضغط فقط."
          : "Local simulation with sample data; starts only when pressed."}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Button size="sm" variant="secondary" onClick={run}>
          {started
            ? ar
              ? "إعادة العرض"
              : "Replay demo"
            : ar
              ? "تشغيل العرض"
              : "Run demo"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clearRun();
            setRead("pending");
            setSave("pending");
            setStarted(false);
          }}
        >
          {ar ? "إعادة الضبط" : "Reset demo"}
        </Button>
      </div>
      <ToolChips
        label={ar ? "نشاط العرض" : "Demo activity"}
        items={[
          {
            id: "read",
            label: ar ? "قراءة ملاحظات" : "Read notes",
            count: 3,
            state: read,
            onActivate: () => {
              setOpen(true);
              call.current
                ?.querySelector<HTMLButtonElement>("button[aria-expanded]")
                ?.focus();
            },
            controls: uid,
            expanded: open,
          },
          {
            id: "save",
            label: ar ? "حفظ الملخص" : "Save summary",
            state: save,
          },
        ]}
      />
      <ToolCall
        ref={call}
        id={uid}
        label={ar ? "قراءة ملاحظات العينة" : "Read sample notes"}
        tool="read_notes"
        state={read}
        expanded={open}
        onExpandedChange={setOpen}
        input={'{ "source": "local-sample" }'}
        output={read === "completed" ? '{ "notes": 3 }' : undefined}
        duration={read === "completed" ? "0.2s" : undefined}
      />
      <ToolCall
        label={ar ? "حفظ ملخص العينة" : "Save sample summary"}
        tool="save_summary"
        state={save}
        defaultExpanded
        input={'{ "name": "sample-summary" }'}
        error={
          ar
            ? "عينة فشل محلية. يمكنك إعادة المحاولة."
            : "Local failure sample. You can try again."
        }
        output={
          save === "completed"
            ? ar
              ? "حُفظت العينة في ذاكرة العرض."
              : "Sample saved in demo memory."
            : undefined
        }
        onRetry={retry}
      />
    </div>
  );
}
