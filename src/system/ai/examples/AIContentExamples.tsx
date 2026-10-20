import { useCallback, useEffect, useRef, useState } from "react";
import { CodeBlock, Markdown, StreamingText, useSystem } from "../../index";
import { DemoFrame } from "./DemoFrame";
type Language = "ar" | "en";
function usePrefersReducedMotion() {
  const { config } = useSystem();
  return (
    config.reducedMotion ||
    (typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}
const ledgerNote =
  "Partial delivery, second shipment pending — الشحنة الثانية بانتظار تأكيد المستودع الرئيسي في الرياض";
const ledger = Array.from({ length: 45 }, (_, i) => ({
  invoice: `INV-${1044 + i}`,
  po: `PO-${7744 + i}`,
  total: 12000 + i * 375,
}));
function codeSample(codeLanguage: string, longContent: boolean) {
  if (codeLanguage === "python")
    return (
      'def total_due(invoices):\n    # المبلغ المستحق بالريال\n    return sum(i["total"] for i in invoices if not i["paid"])\n' +
      (longContent
        ? `\nLEDGER = [\n${ledger.map((row) => `    {"invoice": "${row.invoice}", "total": ${row.total}, "note": "${ledgerNote}"},`).join("\n")}\n]\n`
        : "")
    );
  if (codeLanguage === "json")
    return longContent
      ? `{\n  "supplier": "شركة مدار / Madar",\n  "invoices": [\n${ledger.map((row) => `    ${JSON.stringify({ ...row, note: ledgerNote })}`).join(",\n")}\n  ]\n}\n`
      : '{\n  "invoice": "INV-1043",\n  "supplier": "شركة مدار / Madar",\n  "total": 17250,\n  "currency": "SAR",\n  "paid": false\n}\n';
  if (codeLanguage === "text" || codeLanguage === "unsupported")
    return (
      "invoice,supplier,total,status,note\nINV-1041,شركة مدار,18400,matched,\nINV-1042,شركة مدار,12650,matched,\nINV-1043,شركة مدار,17250,review,partial delivery\n" +
      (longContent
        ? ledger
            .map(
              (row) =>
                `${row.invoice},شركة مدار,${row.total},review,"${ledgerNote}"`,
            )
            .join("\n") + "\n"
        : "")
    );
  return (
    "type Invoice = { id: string; po: string; total: number };\n\n// الفواتير التي لا تطابق أوامر الشراء\nexport function unmatched(invoices: Invoice[], orders: Map<string, number>) {\n\treturn invoices.filter((invoice) => orders.get(invoice.po) !== invoice.total);  \n}\n" +
    (longContent
      ? `\nexport const ledger: Invoice[] = [\n${ledger.map((row) => `  { id: "${row.invoice}", po: "${row.po}", total: ${row.total} }, // ${ledgerNote}`).join("\n")}\n];\n`
      : "")
  );
}
export function CodeBlockExample({
  language = "ar",
  codeLanguage = "ts",
  longContent = false,
}: {
  language?: Language;
  codeLanguage?: string;
  longContent?: boolean;
}) {
  return (
    <CodeBlock
      code={codeSample(codeLanguage, longContent)}
      language={codeLanguage}
      label={
        codeLanguage === "python"
          ? "invoices.py"
          : codeLanguage === "unsupported"
            ? "invoices-october.csv"
            : undefined
      }
      labels={{ copy: language === "ar" ? "نسخ الكود" : "Copy code" }}
    />
  );
}
function sampleMarkdown(ar: boolean, longContent = false) {
  const note = longContent
    ? ar
      ? "شحنة جزئية: ننتظر تأكيد المستودع الرئيسي في الرياض للشحنة الثانية، ونعلّق باقي المبلغ حتى يصل إشعار التسليم من المورّد ونرفقه بأمر الشراء PO-7781 — partial delivery, balance on hold"
      : "Partial delivery; the second shipment awaits confirmation from the Riyadh warehouse, and the balance stays on hold until the supplier’s delivery note is attached to PO-7781 — شحنة جزئية"
    : ar
      ? "شحنة جزئية"
      : "Partial delivery";
  return ar
    ? `# ملخص مطابقة أكتوبر\n\nراجعتُ **٢١٧ فاتورة** من شركة مدار، ويطابق معظمها أوامر الشراء. الفروقات *صغيرة*، لكنها تحتاج قرارًا قبل إقفال الشهر حسب شروط Net 30.\n\n- فواتير تحتاج مراجعة\n  - INV-1043: فرق ١٬٢٥٠ ر.س\n  - INV-1047: أمر الشراء غير مرفق\n- فواتير جاهزة للدفع: \`status = "matched"\`\n\n1. تأكيد الشحنة الثانية مع المورّد\n2. اعتماد الدفع من المالية\n\n> ملاحظة المورّد: «Partial delivery — second shipment on Nov 20».\n\n[سياسة المطابقة](https://madar.sa/finance/matching-policy) · ~~الإقفال في ٣١ أكتوبر~~ الإقفال في ٥ نوفمبر\n\n| الفاتورة / Invoice | الحالة | ملاحظات |\n| --- | --- | --- |\n| INV-1043 | مراجعة | ${note} |\n| INV-1047 | مراجعة | أمر الشراء غير مرفق |\n\n\`\`\`ts\nconst pending = invoices.filter((invoice) => invoice.status === "review");\n\`\`\``
    : `# October reconciliation\n\nI reviewed **217 invoices** from Madar, and most match their purchase orders. The differences are *small* but need a decision before month-end close under Net 30 terms — شروط الدفع ٣٠ يومًا.\n\n- Invoices to review\n  - INV-1043: 1,250 SAR gap\n  - INV-1047: purchase order missing\n- Ready to pay: \`status = "matched"\`\n\n1. Confirm the second shipment with the supplier\n2. Get payment approval from finance\n\n> Supplier note: «تم التسليم جزئيًا، والشحنة الثانية تصل في ٢٠ نوفمبر».\n\n[Matching policy](https://madar.sa/finance/matching-policy) · ~~Close on Oct 31~~ Close on Nov 5\n\n| Invoice / الفاتورة | Status | Notes |\n| --- | --- | --- |\n| INV-1043 | Review | ${note} |\n| INV-1047 | Review | Purchase order missing |\n\n\`\`\`ts\nconst pending = invoices.filter((invoice) => invoice.status === "review");\n\`\`\``;
}
export function MarkdownExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  return <Markdown text={sampleMarkdown(language === "ar", longContent)} />;
}
export function StreamingTextExample({
  language = "ar",
  markdown = false,
  phase,
}: {
  language?: Language;
  markdown?: boolean;
  /**
   * "streaming" or "done": shows that phase and stays in it. Without a phase
   * the example plays once in its own frame.
   */
  phase?: string;
  /** Part of the phase pair; nothing here moves the text, so it never fires. */
  onPhaseChange?: (phase: string) => void;
}) {
  return (
    <StreamingDemo
      language={language}
      markdown={markdown}
      autoStart
      phase={phase}
    />
  );
}
function streamChunks(ar: boolean, markdown: boolean) {
  if (markdown)
    return ar
      ? [
          "## ملخص المطابقة\n\n",
          "تطابقت **٢١٤ فاتورة**",
          " مع أوامر الشراء، وتحتاج **٣ فواتير** إلى مراجعة.\n\n",
          "```ts\n",
          "const pending = invoices",
          '.filter((i) => i.status === "review");\n',
          "```\n\n",
          "| الفاتورة | الفرق |\n",
          "| --- | --- |\n",
          "| INV-1043 | ١٬٢٥٠ ر.س |",
        ]
      : [
          "## Reconciliation summary\n\n",
          "**214 invoices**",
          " match their purchase orders; **3** need review.\n\n",
          "```ts\n",
          "const pending = invoices",
          '.filter((i) => i.status === "review");\n',
          "```\n\n",
          "| Invoice | Gap |\n",
          "| --- | --- |\n",
          "| INV-1043 | 1,250 SAR |",
        ];
  return (
    (ar
      ? "اكتملت مطابقة فواتير أكتوبر: تطابقت ٢١٤ فاتورة، وتحتاج ٣ فواتير إلى مراجعة. أكبر فرق ١٬٢٥٠ ر.س في الفاتورة INV-1043 من شركة مدار."
      : "October reconciliation is done: 214 invoices match and 3 need review. The largest gap is 1,250 SAR on INV-1043 from Madar (شركة مدار)."
    ).match(/\S+\s*/gu) ?? []
  );
}
/** Fixed chunks, no network; optional one-shot autoplay, instant under reduced motion. */
export function StreamingDemo({
  language = "ar",
  markdown = false,
  autoStart = false,
  code,
  phase,
}: {
  language?: Language;
  markdown?: boolean;
  autoStart?: boolean;
  code?: string;
  /**
   * "streaming" streams the chunks and stays streaming; "done" shows them
   * all. A phase leaves the frame to the page, so there is none here.
   */
  phase?: string;
}) {
  const ar = language === "ar",
    reduced = usePrefersReducedMotion();
  const [identity, setIdentity] = useState({
    language,
    markdown,
    autoStart,
    phase,
  });
  const [text, setText] = useState("");
  const [run, setRun] = useState<"idle" | "streaming" | "completed">("idle");
  const generation = useRef(0),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const invalidate = useCallback(() => {
    generation.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  if (
    identity.language !== language ||
    identity.markdown !== markdown ||
    identity.autoStart !== autoStart ||
    identity.phase !== phase
  ) {
    setIdentity({ language, markdown, autoStart, phase });
    setText("");
    setRun("idle");
  }
  const start = useCallback(() => {
    invalidate();
    const current = generation.current;
    const chunks = streamChunks(ar, markdown);
    if (reduced) {
      setText(chunks.join(""));
      setRun("completed");
      return;
    }
    setText("");
    setRun("streaming");
    chunks.forEach((_, i) =>
      timers.current.push(
        setTimeout(
          () => {
            if (generation.current !== current) return;
            setText(chunks.slice(0, i + 1).join(""));
            if (i === chunks.length - 1) {
              timers.current = [];
              setRun("completed");
            }
          },
          (i + 1) * (markdown ? 320 : 160),
        ),
      ),
    );
  }, [ar, markdown, reduced, invalidate]);
  useEffect(() => {
    invalidate();
    // Defer autoplay to a cancellable host callback: StrictMode cleanup, prop
    // changes and unmount all invalidate it before a run can start.
    if (phase === undefined ? autoStart : phase === "streaming")
      timers.current.push(setTimeout(start, 0));
    return invalidate;
  }, [autoStart, phase, start, invalidate]);
  const stream = (
    <div style={{ minBlockSize: 100 }}>
      <StreamingText
        text={phase === "done" ? streamChunks(ar, markdown).join("") : text}
        state={(phase ?? run) === "streaming" ? "streaming" : "completed"}
        markdown={markdown}
        statusLabel={run === "idle" && phase !== "done" ? "" : undefined}
      />
    </div>
  );
  if (phase !== undefined) return stream;
  const playLabel =
    run === "idle"
      ? ar
        ? "تشغيل المثال"
        : "Start local demo"
      : ar
        ? "إعادة تشغيل المثال"
        : "Replay local demo";
  return (
    <DemoFrame
      className="tz-stream-demo"
      language={language}
      label={ar ? "مثال محلي لنص يظهر تباعًا" : "Local text demo"}
      title={
        markdown ? (ar ? "ماركداون" : "Markdown") : ar ? "الافتراضي" : "Default"
      }
      code={code}
      replayLabel={playLabel}
      onReplay={start}
    >
      {stream}
    </DemoFrame>
  );
}
