import { useEffect, useState } from "react";
import {
  Terminal,
  numberLocale,
  useSystem,
  useReducedMotion,
} from "../../index";
type Language = "ar" | "en";
const header = "vite v7.1.4 building for production…\n";
const progress = [
  "transforming (96) src/system/Button.tsx",
  "transforming (241) src/system/ChatThread.tsx",
  "transforming (418) src/main.tsx",
  "✓ 418 modules transformed.",
  "rendering chunks (3)...",
  "computing gzip size (2)...",
];
const built =
  "✓ 418 modules transformed.\ndist/index.html                  0.40 kB │ gzip:  0.27 kB\ndist/assets/index-4f2a9c1e.css  38.12 kB │ gzip:  7.41 kB\ndist/assets/index-b7d3a1f5.js  182.41 kB │ gzip: 58.12 kB\n";
const error =
  "src/billing/invoice.ts(42,9): error TS2322: Type 'string' is not assignable to type 'number'.\n";
export function TerminalExample({
  state = "completed",
  longContent = false,
  followOutput = false,
}: {
  /** Accepted for compatibility; the log text is the same in every language. */
  language?: Language;
  state?: "running" | "completed" | "failed";
  longContent?: boolean;
  followOutput?: boolean;
}) {
  const { config } = useSystem(),
    reduced = useReducedMotion(),
    live = state === "running" && !reduced,
    [shown, setShown] = useState(0);
  // Each time the log goes live it streams again from the first line.
  const [liveFor, setLiveFor] = useState(live);
  if (liveFor !== live) {
    setLiveFor(live);
    setShown(0);
  }
  useEffect(() => {
    if (!live) return;
    let count = 0;
    const timer = setInterval(() => {
      setShown(++count);
      if (count === progress.length) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [live]);
  const long = longContent
    ? Array.from({ length: 80 }, (_, i) =>
        state === "failed"
          ? `src/billing/lines/item-${i + 1}.ts(18,7): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.\n`
          : state === "running"
            ? `transforming (${i + 1}) src/routes/customers/invoices/line-items/section-${i + 1}.tsx\n`
            : `dist/assets/route-${String(i + 1).padStart(2, "0")}-${((0x9e3779b1 * (i + 1)) >>> 0).toString(16).padStart(8, "0")}.js   ${(1 + ((i * 37) % 900) / 100).toFixed(2)} kB │ gzip: ${(0.4 + ((i * 37) % 900) / 300).toFixed(2)} kB\n`,
      ).join("")
    : "";
  const output =
    state === "failed"
      ? error +
        long +
        (longContent
          ? "\nFound 81 errors in 81 files.\n"
          : "\nFound 1 error in src/billing/invoice.ts:42\n")
      : state === "running"
        ? header +
          long +
          progress
            .slice(0, live ? shown : progress.length)
            .map((line) => `${line}\n`)
            .join("")
        : header + built + long + "✓ built in 1.63s\n";
  return (
    <Terminal
      command={state === "failed" ? "tsc -b" : "npm run build"}
      output={output}
      state={state}
      exitCode={state === "running" ? undefined : state === "failed" ? 1 : 0}
      // The duration is display text you format, in the reader's digits.
      duration={
        state === "running"
          ? undefined
          : `${new Intl.NumberFormat(numberLocale(config)).format(2)}${config.direction === "rtl" ? "ث" : "s"}`
      }
      followOutput={followOutput}
    />
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
