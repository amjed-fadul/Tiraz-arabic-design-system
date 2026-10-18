import { FileText, PackageOpen, Save, SpellCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ToolCall, ToolChips, useSystem } from "../../index";
import type { ToolCallState } from "../../index";
type Language = "ar" | "en";
const clause =
  "The supplier delivers the goods within thirty days of each purchase order and replaces damaged items at no cost. ";
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
    <div className="tz-tool-calls">
      <ToolCall
        key={String(defaultExpanded)}
        label={ar ? "قراءة عقد التوريد" : "Read supply contract"}
        tool="read_file"
        icon={<FileText />}
        state="completed"
        duration="0.4s"
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
        state="failed"
        defaultExpanded
        error={
          ar
            ? "رفض Drive الطلب لأن المساحة المتاحة لا تكفي."
            : "Drive rejected the request: storage quota exceeded."
        }
        input={'{ "folder": "Finance/2026", "name": "october-summary.md" }'}
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
}: {
  language?: Language;
  counts?: boolean;
}) {
  const ar = language === "ar";
  return (
    <ToolChips
      label={ar ? "نشاط الأدوات" : "Tool activity"}
      items={[
        {
          id: "read",
          label: ar ? "قراءة ملفات" : "Read files",
          state: "completed",
          count: counts ? 3 : undefined,
        },
        { id: "check", label: ar ? "تدقيق" : "Proofread", state: "running" },
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
      label={ar ? "عرض صفقات هذا الأسبوع" : "List this week's deals"}
      tool="crm.list_deals"
      state="completed"
      defaultExpanded
      duration="0.3s"
      announcement="off"
      output={
        <ul style={{ margin: 0, paddingInlineStart: "var(--space-5)" }}>
          <li>
            {ar
              ? "شركة الندى للتجارة · ٤٨٬٠٠٠ د.إ · قيد التفاوض"
              : "Al Nada Trading · AED 48,000 · Negotiation"}
          </li>
          <li>
            {ar
              ? "مؤسسة رواسي · ٢٢٬٥٠٠ د.إ · أُرسل عرض السعر"
              : "Rawasi Est. · AED 22,500 · Quote sent"}
          </li>
          <li>
            {ar
              ? "مجموعة سَنا · ١٢٠٬٠٠٠ د.إ · قريبة من الإغلاق"
              : "Sana Group · AED 120,000 · Closing"}
          </li>
        </ul>
      }
    />
  );
}
/** Config or OS preference; the scripted run starts on its final state. */
function useReducedMotion() {
  const { config } = useSystem();
  return (
    config.reducedMotion ||
    (typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}
/** Host-owned run with fixed results; never executes a tool. Plays once on mount, then retry belongs to ToolCall. */
export function ToolActivityDemo({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar",
    uid = useId(),
    reduced = useReducedMotion();
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
          duration={read === "completed" ? "1.2s" : undefined}
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
