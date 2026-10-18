import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { AlertCircle, Check, Code2, Copy, Eye, Play } from "lucide-react";
import { Button } from "../../Button";
import { highlightCode } from "../../code-highlight";

type View = "preview" | "code";

/**
 * Documentation/example chrome only; not a public component family. With
 * `code`, the header switches between the live example and its source, and
 * the copy button copies that source.
 */
export function DemoFrame({
  title,
  language,
  code,
  fileName = "src/Example.tsx",
  replayLabel,
  onReplay,
  children,
  className = "",
  label,
}: {
  title?: string;
  language: "ar" | "en";
  code?: string;
  fileName?: string;
  replayLabel?: string;
  onReplay?: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const ar = language === "ar";
  const id = useId();
  const [view, setView] = useState<View>("preview");
  const [feedback, setFeedback] = useState<{
    code: string;
    result: "copied" | "failed";
  } | null>(null);
  const generation = useRef({ value: 0 });
  useLayoutEffect(() => {
    const request = generation.current;
    request.value++;
    return () => {
      request.value++;
    };
  }, [code]);
  const result = code && feedback?.code === code ? feedback.result : "idle";
  const copyName = ar ? "نسخ الكود" : "Copy code";
  const playName =
    replayLabel ?? (ar ? "إعادة تشغيل المثال" : "Replay example");
  const message =
    result === "copied"
      ? ar
        ? "نُسخ الكود"
        : "Code copied"
      : result === "failed"
        ? ar
          ? "تعذّر نسخ الكود. حاول مرة أخرى."
          : "Could not copy the code. Try again."
        : "";
  async function copy() {
    if (!code) return;
    const request = generation.current;
    const current = ++request.value;
    try {
      await navigator.clipboard.writeText(code);
      if (current === request.value) setFeedback({ code, result: "copied" });
    } catch {
      if (current === request.value) setFeedback({ code, result: "failed" });
    }
  }
  const showCode = code !== undefined && view === "code";
  return (
    <div
      className={`tz-demo-frame ${className}`.trim()}
      role={label ? "group" : undefined}
      aria-label={label}
      data-view={code === undefined ? undefined : view}
    >
      <header className="tz-demo-header">
        {code === undefined ? (
          title && <span className="tz-demo-title">{title}</span>
        ) : (
          <ViewSwitch id={id} view={view} onViewChange={setView} ar={ar} />
        )}
        <div className="tz-demo-actions">
          {code !== undefined && (
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
          )}
          {onReplay && !showCode && (
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
      {code === undefined ? (
        children
      ) : (
        <>
          {/* The example stays mounted while the code is shown, so whatever
              someone typed or opened is still there when they switch back. */}
          <div
            role="tabpanel"
            id={`${id}-preview`}
            aria-labelledby={`${id}-preview-tab`}
            className="tz-demo-panel"
            hidden={view !== "preview"}
          >
            {children}
          </div>
          <div
            role="tabpanel"
            id={`${id}-code`}
            aria-labelledby={`${id}-code-tab`}
            className="tz-demo-panel"
            hidden={view !== "code"}
          >
            {view === "code" && (
              <SourceView code={code} fileName={fileName} ar={ar} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ViewSwitch({
  id,
  view,
  onViewChange,
  ar,
}: {
  id: string;
  view: View;
  onViewChange: (view: View) => void;
  ar: boolean;
}) {
  const list = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ x: 0, width: 0 });
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const tab = el.querySelector<HTMLElement>('[aria-selected="true"]');
      if (tab) setThumb({ x: tab.offsetLeft, width: tab.offsetWidth });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [view, ar]);
  const views: Array<{ value: View; name: string; icon: ReactNode }> = [
    {
      value: "preview",
      name: ar ? "معاينة" : "Preview",
      icon: <Eye size={14} aria-hidden="true" />,
    },
    {
      value: "code",
      name: ar ? "الكود" : "Code",
      icon: <Code2 size={14} aria-hidden="true" />,
    },
  ];
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: View =
      event.key === "Home"
        ? "preview"
        : event.key === "End"
          ? "code"
          : view === "preview"
            ? "code"
            : "preview";
    onViewChange(next);
    list.current?.ownerDocument.getElementById(`${id}-${next}-tab`)?.focus();
  }
  return (
    <div
      ref={list}
      role="tablist"
      aria-label={ar ? "طريقة العرض" : "View"}
      className="tz-demo-views"
      style={
        {
          "--thumb-x": `${thumb.x}px`,
          "--thumb-w": `${thumb.width}px`,
        } as CSSProperties
      }
      data-ready={thumb.width > 0 || undefined}
    >
      <span aria-hidden="true" className="tz-demo-views-thumb" />
      {views.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          id={`${id}-${item.value}-tab`}
          aria-controls={`${id}-${item.value}`}
          aria-selected={view === item.value}
          tabIndex={view === item.value ? 0 : -1}
          className="tz-demo-view"
          onClick={() => onViewChange(item.value)}
          onKeyDown={onKeyDown}
        >
          {item.icon}
          <span>{item.name}</span>
        </button>
      ))}
    </div>
  );
}

/** Read-only source with a line gutter; the clipboard gets the exact string. */
function SourceView({
  code,
  fileName,
  ar,
}: {
  code: string;
  fileName: string;
  ar: boolean;
}) {
  const highlighted = useMemo(() => highlightCode(code, "tsx"), [code]);
  const lines = useMemo(
    () =>
      Array.from(
        { length: code.split("\n").length },
        (_, index) => index + 1,
      ).join("\n"),
    [code],
  );
  return (
    <div className="tz-demo-source" dir="ltr">
      <div className="tz-demo-source-file">{fileName}</div>
      <div
        className="tz-demo-source-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${ar ? "الكود" : "Code"}: ${fileName}`}
      >
        <span className="tz-demo-source-lines" aria-hidden="true">
          {lines}
        </span>
        <pre>
          <code>{highlighted}</code>
        </pre>
      </div>
    </div>
  );
}
