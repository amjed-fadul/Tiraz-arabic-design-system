import { useCallback, useEffect, useRef, useState } from "react";
import { Button, CodeBlock, Markdown, StreamingText } from "../../index";
import { Play, Square } from "lucide-react";
type Language = "ar" | "en";
export function CodeBlockExample({
  language = "ar",
  codeLanguage = "ts",
  longContent = false,
}: {
  language?: Language;
  codeLanguage?: string;
  longContent?: boolean;
}) {
  const sample =
    codeLanguage === "python"
      ? 'def greet(name):\n    # Local sample / عينة محلية\n    return f"Hello {name}"\n'
      : codeLanguage === "json"
        ? '{\n  "name": "مدار / Madar",\n  "ready": true\n}\n'
        : "// Local sample / عينة محلية\nexport function greet(name: string) {\n\treturn `Hello ${name}`;  \n}\n";
  return (
    <CodeBlock
      code={
        longContent
          ? sample +
            Array.from(
              { length: 45 },
              (_, i) => `// ${i + 1}: ${"long-line ".repeat(25)}`,
            ).join("\n")
          : sample
      }
      language={codeLanguage}
      label={codeLanguage === "python" ? "greet.py" : undefined}
      labels={{ copy: language === "ar" ? "نسخ الشيفرة" : "Copy code" }}
    />
  );
}
function sampleMarkdown(ar: boolean, longContent = false) {
  return (
    (ar
      ? "# ملاحظات الواجهة\n\nنستخدم **طِراز** لعرض ردود واضحة، مع *مسافات مدمجة* ونص مختلط: Tiraz يدعم RTL.\n\n"
      : "# Interface notes\n\nUse **Tiraz** for readable responses, with *compact spacing* and mixed text: مرحبًا بالعالم.\n\n") +
    "- Review labels / راجع التسميات\n  - Arabic and English\n- Keep `response.text` readable\n\n1. Prepare\n2. Review\n\n> Local sample / عينة محلية\n\n[Source / المصدر](https://example.com) · ~~old draft~~\n\n| الاسم / Name | State | Notes |\n| --- | --- | --- |\n| مدار / Madar | Ready | " +
    (longContent ? "Long cell content ".repeat(30) : "Arabic + English") +
    ' |\n| طِراز / Tiraz | Reviewed | Compact |\n\n```ts\nconst response = { text: "مرحبًا / Hello", ready: true };\n```'
  );
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
}: {
  language?: Language;
  markdown?: boolean;
}) {
  return <StreamingDemo language={language} markdown={markdown} autoStart />;
}
/** Host example only: fixed chunks, no network; optional one-shot autoplay. */
export function StreamingDemo({
  language = "ar",
  markdown = false,
  autoStart = false,
}: {
  language?: Language;
  markdown?: boolean;
  autoStart?: boolean;
}) {
  const ar = language === "ar";
  const [identity, setIdentity] = useState({ language, markdown, autoStart });
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<
    "idle" | "streaming" | "completed" | "cancelled"
  >("idle");
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
    identity.autoStart !== autoStart
  ) {
    setIdentity({ language, markdown, autoStart });
    setText("");
    setPhase("idle");
  }
  const start = useCallback(() => {
    invalidate();
    const run = generation.current;
    const chunks = markdown
      ? [
          ar ? "## ملخص محلي\n\n" : "## Local summary\n\n",
          "**Tiraz",
          "** · مرحبًا / Hello\n\n",
          "```ts\n",
          "const ready",
          " = true;\n",
          "```\n\n",
          "| Name | State |\n",
          "| --- | --- |\n",
          "| Tiraz | Ready |",
        ]
      : ar
        ? [
            "هذه ",
            "عينة ",
            "محلية ",
            "ثابتة. ",
            "Tiraz ",
            "يعرض ",
            "النص ",
            "عند ",
            "وصوله ",
            "من ",
            "التطبيق. ",
            "اكتمل ",
            "الرد.",
          ]
        : [
            "This ",
            "is ",
            "a ",
            "fixed ",
            "local ",
            "sample. ",
            "Tiraz ",
            "renders ",
            "text ",
            "as ",
            "the ",
            "host ",
            "supplies ",
            "it. ",
            "مرحبًا ",
            "بالعالم.",
          ];
    setText("");
    setPhase("streaming");
    chunks.forEach((_, i) =>
      timers.current.push(
        setTimeout(
          () => {
            if (generation.current !== run) return;
            setText(chunks.slice(0, i + 1).join(""));
            if (i === chunks.length - 1) {
              timers.current = [];
              setPhase("completed");
            }
          },
          (i + 1) * (markdown ? 320 : 160),
        ),
      ),
    );
  }, [ar, markdown, invalidate]);
  useEffect(() => {
    invalidate();
    // Defer autoplay to a cancellable host callback: StrictMode cleanup, prop
    // changes and unmount all invalidate it before a run can start.
    if (autoStart) timers.current.push(setTimeout(start, 0));
    return invalidate;
  }, [autoStart, start, invalidate]);
  const status = {
    idle: ar ? "العرض جاهز" : "Demo ready",
    streaming: ar ? "جارٍ استلام العينة المحلية" : "Receiving local sample",
    completed: ar ? "اكتملت العينة المحلية" : "Local sample complete",
    cancelled: ar
      ? "أُلغيت العينة؛ احتُفظ بالنص"
      : "Sample cancelled; received text kept",
  }[phase];
  const playLabel =
    phase === "idle"
      ? ar
        ? "بدء العرض المحلي"
        : "Start local demo"
      : ar
        ? "إعادة العرض المحلي"
        : "Replay local demo";
  const cancelLabel = ar ? "إلغاء العرض" : "Cancel demo";
  return (
    <div className="tz-stream-demo">
      <header className="tz-stream-demo-header">
        <span className="tz-stream-demo-title">
          {markdown
            ? ar
              ? "ماركداون"
              : "Markdown"
            : ar
              ? "الافتراضي"
              : "Default"}
        </span>
        <div className="tz-stream-demo-actions">
          <Button
            variant="ghost"
            iconOnly
            aria-label={cancelLabel}
            title={cancelLabel}
            aria-disabled={phase !== "streaming"}
            onClick={() => {
              if (phase !== "streaming") return;
              invalidate();
              setPhase("cancelled");
            }}
          >
            <Square size={14} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            iconOnly
            aria-label={playLabel}
            title={playLabel}
            onClick={start}
          >
            <Play size={16} aria-hidden="true" />
          </Button>
        </div>
      </header>
      <div style={{ minBlockSize: 100 }}>
        <StreamingText
          text={text}
          state={phase === "streaming" ? "streaming" : "completed"}
          markdown={markdown}
          statusLabel={status}
        />
      </div>
      <p className="tz-stream-demo-note">
        {ar
          ? "عرض محلي بقطع ثابتة؛ دون طلب شبكة أو ذكاء اصطناعي."
          : "Local demo with fixed chunks; no AI or network request."}
      </p>
    </div>
  );
}
