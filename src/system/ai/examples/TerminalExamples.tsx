import { useState } from "react";
import { Button, Terminal } from "../../index";
type Language = "ar" | "en";
export function TerminalExample({
  language = "ar",
  state = "completed",
  longContent = false,
  followOutput = false,
}: {
  language?: Language;
  state?: "running" | "completed" | "failed";
  longContent?: boolean;
  followOutput?: boolean;
}) {
  const ar = language === "ar",
    [appended, setAppended] = useState(0);
  const output =
    state === "failed"
      ? "src/sample.ts(4,9): error TS2322\n  Type 'string' is not assignable to type 'number'.\nFound 1 error.\n"
      : "vite building for production…\n  ✓ 418 modules transformed.\n  dist/index.html    0.40 kB\n" +
        (state === "completed" ? "✓ built in 1.63s\n" : "");
  return (
    <div style={{ display: "grid", gap: "var(--space-2)", minInlineSize: 0 }}>
      <p className="tz-chat-app-note">
        {ar
          ? "نص يزوّده التطبيق · لا تنفيذ أو اتصال"
          : "Application-supplied text · no execution or connection"}
      </p>
      <Terminal
        command={state === "failed" ? "tsc -b" : "npm run build"}
        output={
          output +
          (longContent
            ? Array.from(
                { length: 80 },
                (_, i) => `  supplied line ${i + 1}: ${"output ".repeat(14)}\n`,
              ).join("")
            : "") +
          Array.from(
            { length: appended },
            (_, i) => `  appended local output ${i + 1}\n`,
          ).join("")
        }
        state={state}
        exitCode={state === "running" ? undefined : state === "failed" ? 1 : 0}
        duration={state === "running" ? undefined : "2s"}
        followOutput={followOutput}
      />
      {state === "running" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAppended((value) => value + 1)}
        >
          {ar ? "إضافة مخرجات محلية" : "Append local output"}
        </Button>
      )}
    </div>
  );
}
export function TerminalStates({ language = "ar" }: { language?: Language }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-5)", minInlineSize: 0 }}>
      {(["running", "failed"] as const).map((state) => (
        <TerminalExample key={state} language={language} state={state} />
      ))}
    </div>
  );
}
