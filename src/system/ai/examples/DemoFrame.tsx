import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Check, Copy, Play } from "lucide-react";
import { Button } from "../../Button";

/** Documentation/example chrome only; not a public component family. */
export function DemoFrame({
  title,
  language,
  prompt,
  copyLabel,
  replayLabel,
  onReplay,
  children,
  className = "",
  label,
}: {
  title: string;
  language: "ar" | "en";
  prompt: string;
  copyLabel?: string;
  replayLabel?: string;
  onReplay?: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const ar = language === "ar";
  const [feedback, setFeedback] = useState<{
    prompt: string;
    result: "copied" | "failed";
  } | null>(null);
  const generation = useRef({ value: 0 });
  useLayoutEffect(() => {
    const request = generation.current;
    request.value++;
    return () => {
      request.value++;
    };
  }, [prompt]);
  const result = feedback?.prompt === prompt ? feedback.result : "idle";
  const copyName = copyLabel ?? (ar ? "نسخ طلب المثال" : "Copy demo prompt");
  const playName =
    replayLabel ?? (ar ? "إعادة تشغيل المثال" : "Replay example");
  const message =
    result === "copied"
      ? ar
        ? "نُسخ الطلب"
        : "Prompt copied"
      : result === "failed"
        ? ar
          ? "تعذّر نسخ الطلب. حاول مرة أخرى."
          : "Could not copy prompt. Try again."
        : "";
  async function copy() {
    const request = generation.current;
    const current = ++request.value;
    try {
      await navigator.clipboard.writeText(prompt);
      if (current === request.value) setFeedback({ prompt, result: "copied" });
    } catch {
      if (current === request.value) setFeedback({ prompt, result: "failed" });
    }
  }
  return (
    <div
      className={`tz-demo-frame ${className}`.trim()}
      role={label ? "group" : undefined}
      aria-label={label}
    >
      <header className="tz-demo-header">
        <span className="tz-demo-title">{title}</span>
        <div className="tz-demo-actions">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={copyName}
            title={result === "failed" ? message : copyName}
            data-copy-state={result}
            onClick={copy}
          >
            {result === "copied" ? (
              <Check size={16} aria-hidden="true" />
            ) : result === "failed" ? (
              <AlertCircle size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
          </Button>
          {onReplay && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={playName}
              title={playName}
              onClick={onReplay}
            >
              <Play
                className="tz-demo-play-icon"
                size={16}
                aria-hidden="true"
              />
            </Button>
          )}
          <span role="status" className="tz-visually-hidden">
            {message}
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
