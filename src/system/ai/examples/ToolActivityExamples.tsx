import { FileText, PackageOpen, Save, SpellCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  ToolCall,
  ToolChips,
  numberLocale,
  useSystem,
  useReducedMotion,
} from "../../index";
import type { ToolCallState } from "../../index";
type Language = "ar" | "en";
const clause =
  "The supplier delivers the goods within thirty days of each purchase order and replaces damaged items at no cost. ";
export function ToolCallExample({
  language = "ar",
  defaultExpanded = false,
  longContent = false,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  defaultExpanded?: boolean;
  longContent?: boolean;
  /**
   * The save's state ("pending", "running", "needs-you", "completed" or
   * "failed"), held until a retry moves it on and reports each step.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem(),
    // Durations are display text you format, in the reader's digits.
    number = new Intl.NumberFormat(numberLocale(config, language)),
    second = ar ? "ث" : "s";
  // Retrying the failed save runs it again, and this time it succeeds.
  const [local, setLocal] = useState<ToolCallState>("failed"),
    retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = (phase as ToolCallState | undefined) ?? local;
  useEffect(() => () => clearTimeout(retryTimer.current), []);
  function move(next: ToolCallState) {
    setLocal(next);
    onPhaseChange?.(next);
  }
  function retry() {
    move("running");
    clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => move("completed"), 1200);
  }
  return (
    <div className="tz-tool-calls">
      <ToolCall
        key={String(defaultExpanded)}
        label={ar ? "قراءة عقد التوريد" : "Read supply contract"}
        tool="read_file"
        icon={<FileText />}
        state="completed"
        duration={`${number.format(0.4)}${second}`}
        defaultExpanded={defaultExpanded}
        input={JSON.stringify(
          { path: "contracts/2026/al-nada-supply.pdf" },
          null,
          2,
        )}
        output={
          longContent
            ? Array.from(
                { length: 60 },
                (_, i) => `§${i + 1}  ${clause.repeat(3)}`,
              ).join("\n")
            : JSON.stringify(
                {
                  pages: 14,
                  parties: ["Al Nada Trading", "Tiraz Studio"],
                  renewal: "2027-01-01",
                },
                null,
                2,
              )
        }
        announcement="off"
      />
      <ToolCall
        label={ar ? "تدقيق النص العربي" : "Proofread Arabic copy"}
        tool="proofread_text"
        icon={<SpellCheck />}
        state="running"
        input={'{ "file": "copy/onboarding.ar.json", "locale": "ar" }'}
        announcement="off"
      />
      <ToolCall
        label={ar ? "حفظ الملخص في Drive" : "Save summary to Drive"}
        tool="drive.create_file"
        icon={<Save />}
        state={save}
        defaultExpanded
        error={
          ar
            ? "رفض Drive الطلب لأن المساحة المتاحة لا تكفي."
            : "Drive rejected the request: storage quota exceeded."
        }
        input={'{ "folder": "Finance/2026", "name": "october-summary.md" }'}
        output={
          save === "completed" ? (
            ar ? (
              "حُفظ الملف في Finance/2026/october-summary.md"
            ) : (
              "Saved to Finance/2026/october-summary.md"
            )
          ) : save === "needs-you" ? (
            // Prose for people, so a paragraph rather than program output.
            <p style={{ margin: 0 }} dir="auto">
              {ar
                ? "يحتاج Drive إذنك للكتابة في Finance/2026."
                : "Drive needs your permission to write to Finance/2026."}
            </p>
          ) : undefined
        }
        duration={
          save === "completed" ? `${number.format(1.2)}${second}` : undefined
        }
        onRetry={retry}
        announcement="off"
      />
      <ToolCall
        label={ar ? "تجهيز حزمة التصدير" : "Prepare export bundle"}
        tool="export.bundle"
        icon={<PackageOpen />}
        state="pending"
        announcement="off"
      />
    </div>
  );
}
export function ToolChipsExample({
  language = "ar",
  counts = true,
  phase,
}: {
  language?: Language;
  counts?: boolean;
  /**
   * "running" or "done": shows that phase and stays in it. Without a phase
   * the example plays its own short run once.
   */
  phase?: string;
  /** Part of the phase pair; nothing here moves the run, so it never fires. */
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    reduced = useReducedMotion(),
    scripted = phase === undefined;
  // One short run: each chip changes state as its tool starts and finishes.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduced || !scripted) return;
    const timers = [900, 1700, 2600].map((delay, index) =>
      setTimeout(() => setStep(index + 1), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced, scripted]);
  const at = reduced ? 3 : step;
  const states: ToolCallState[][] = [
    ["running", "pending", "pending", "pending"],
    ["completed", "running", "pending", "pending"],
    ["completed", "running", "running", "pending"],
    ["completed", "running", "failed", "pending"],
  ];
  const [read, check, save, exporting]: ToolCallState[] = scripted
    ? states[at]
    : phase === "running"
      ? states[2]
      : ["completed", "completed", "completed", "completed"];
  return (
    <ToolChips
      label={ar ? "نشاط الأدوات" : "Tool activity"}
      items={[
        {
          id: "read",
          label: ar ? "قراءة ملفات" : "Read files",
          state: read,
          count: counts && read === "completed" ? 3 : undefined,
        },
        { id: "check", label: ar ? "تدقيق" : "Proofread", state: check },
        {
          id: "save",
          label: ar ? "حفظ" : "Save",
          state: save,
          count: counts && save === "failed" ? 1 : undefined,
        },
        { id: "export", label: ar ? "تصدير" : "Export", state: exporting },
      ]}
    />
  );
}
/** Host-owned run with fixed results; never executes a tool. Plays once on mount, then retry belongs to ToolCall. */
export function ToolActivityDemo({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar",
    uid = useId(),
    reduced = useReducedMotion(),
    { config } = useSystem();
  const [read, setRead] = useState<ToolCallState>(
      reduced ? "completed" : "running",
    ),
    [save, setSave] = useState<ToolCallState>(reduced ? "failed" : "pending");
  const [open, setOpen] = useState(false);
  const call = useRef<HTMLDivElement>(null),
    retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Toggling reduced motion mid-run jumps to the final state or replays.
  const [motion, setMotion] = useState(reduced);
  if (motion !== reduced) {
    setMotion(reduced);
    setRead(reduced ? "completed" : "running");
    setSave(reduced ? "failed" : "pending");
  }
  useEffect(() => {
    if (reduced) return;
    const timers = [
      setTimeout(() => {
        setRead("completed");
        setSave("running");
      }, 1200),
      setTimeout(() => setSave("failed"), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);
  useEffect(() => () => clearTimeout(retryTimer.current), []);
  function retry() {
    setSave("running");
    clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => setSave("completed"), 1000);
  }
  return (
    <div style={{ display: "grid", gap: "var(--space-3)", minInlineSize: 0 }}>
      <ToolChips
        label={ar ? "نشاط الأدوات" : "Tool activity"}
        items={[
          {
            id: "read",
            label: ar ? "قراءة العقود" : "Read contracts",
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
      <div className="tz-tool-calls">
        <ToolCall
          ref={call}
          id={uid}
          label={ar ? "قراءة عقود الموردين" : "Read supplier contracts"}
          tool="read_file"
          icon={<FileText />}
          state={read}
          expanded={open}
          onExpandedChange={setOpen}
          input={
            '{ "paths": ["contracts/al-nada.pdf", "contracts/rawasi.pdf", "contracts/sana.pdf"] }'
          }
          output={
            read === "completed"
              ? '{ "files": 3, "renewals_due": 1 }'
              : undefined
          }
          duration={
            read === "completed"
              ? `${new Intl.NumberFormat(numberLocale(config, language)).format(1.2)}${ar ? "ث" : "s"}`
              : undefined
          }
        />
        <ToolCall
          label={ar ? "حفظ ملخص التجديدات" : "Save renewals summary"}
          tool="drive.create_file"
          icon={<Save />}
          state={save}
          defaultExpanded
          input={'{ "folder": "Legal/2026", "name": "renewals-summary.md" }'}
          error={
            ar
              ? "لم يستجب Drive خلال ٣٠ ثانية."
              : "Drive timed out after 30 seconds."
          }
          output={
            save === "completed"
              ? ar
                ? "حُفظ الملف في Legal/2026/renewals-summary.md"
                : "Saved to Legal/2026/renewals-summary.md"
              : undefined
          }
          onRetry={retry}
        />
      </div>
    </div>
  );
}
