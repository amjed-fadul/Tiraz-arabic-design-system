import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { AlertCircle, Check, Code2, Copy, Eye, Play } from "lucide-react";
import { Button } from "../../Button";
import { highlightCode } from "../../code-highlight";
import { useChanged } from "../../useChanged";

type View = "preview" | "code";

/** One state the example can show: the word on its button, in both languages. */
export type DemoFrameState = { id: string; label: { ar: string; en: string } };

/**
 * The guidance row under the stage. A column with no items is left out, and
 * `replaces` (a pattern's parts) takes the middle column from `instead`.
 */
export type DemoFrameNotes = {
  useWhen: ReactNode[];
  instead?: ReactNode[];
  replaces?: ReactNode[];
  notice?: ReactNode[];
};

/**
 * Documentation/example chrome only; not a public component family. With
 * `code`, the header switches between the live example and its source, and
 * the copy button copies that source. `name`, `states` and `notes` are
 * optional: the frame shows the state it is given, reports a press through
 * `onStateChange` and leaves what a state means to its caller.
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
  name,
  states,
  state,
  onStateChange,
  notes,
  onViewChange,
  replaying,
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
  /** The example's name in both languages; the interface language comes first. */
  name?: { ar: string; en: string };
  states?: readonly DemoFrameState[];
  /** The id of the state the example is in. */
  state?: string;
  onStateChange?: (id: string) => void;
  notes?: DemoFrameNotes;
  /** Called when the View tablist moves to the other view. */
  onViewChange?: (view: View) => void;
  /** True while the caller steps through the states: the status stays silent. */
  replaying?: boolean;
}) {
  const ar = language === "ar";
  const id = useId();
  const [view, setView] = useState<View>("preview");
  const [feedback, setFeedback] = useState<{
    code: string;
    result: "copied" | "failed";
  } | null>(null);
  // The frame has one polite status. It says what a copy did or the state the
  // example moved to, whichever came last. A state is announced when `state`
  // changes after the first render; steps of a replay are not, and the state
  // it ends on is, once.
  const playing = replaying === true;
  const [heard, setHeard] = useState<{
    state: string | undefined;
    playing: boolean;
    said: string | undefined;
    copyLast: boolean;
  }>({ state, playing, said: undefined, copyLast: false });
  if (heard.state !== state || heard.playing !== playing)
    setHeard({
      state,
      playing,
      said: playing ? undefined : state,
      copyLast: false,
    });
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
  const said =
    heard.said === undefined
      ? undefined
      : states?.find((item) => item.id === heard.said)?.label[language];
  const stateMessage =
    said === undefined ? "" : `${ar ? "الحالة" : "State"}: ${said}`;
  async function copy() {
    if (!code) return;
    const request = generation.current;
    const current = ++request.value;
    try {
      await navigator.clipboard.writeText(code);
      if (current === request.value) {
        setFeedback({ code, result: "copied" });
        setHeard((now) => ({ ...now, copyLast: true }));
      }
    } catch {
      if (current === request.value) {
        setFeedback({ code, result: "failed" });
        setHeard((now) => ({ ...now, copyLast: true }));
      }
    }
  }
  function changeView(next: View) {
    if (next === view) return;
    setView(next);
    onViewChange?.(next);
  }
  const showCode = code !== undefined && view === "code";
  return (
    <div
      className={`tz-demo-frame ${className}`.trim()}
      role={label ? "group" : undefined}
      aria-label={label}
      data-view={code === undefined ? undefined : view}
    >
      <div className="tz-demo-bar">
        {name && <DemoName name={name} ar={ar} />}
        {states && states.length > 0 && (
          <div
            className="tz-demo-states"
            role="group"
            aria-label={ar ? "حالات المثال" : "Example states"}
          >
            {states.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tz-demo-state"
                aria-pressed={state === item.id}
                onClick={() => onStateChange?.(item.id)}
              >
                {item.label[language]}
              </button>
            ))}
          </div>
        )}
        <header className="tz-demo-header">
          {code === undefined && title && (
            <span className="tz-demo-title" lang={language}>
              {title}
            </span>
          )}
          {onReplay && !showCode && (
            <button
              type="button"
              className="tz-demo-replay"
              aria-label={playName}
              title={replayLabel ? playName : undefined}
              data-icon-only={replayLabel ? true : undefined}
              onClick={onReplay}
            >
              <Play
                className="tz-demo-play-icon"
                size={14}
                aria-hidden="true"
              />
              {!replayLabel && <span>{ar ? "إعادة تشغيل" : "Replay"}</span>}
            </button>
          )}
          {code !== undefined && (
            <>
              <ViewSwitch
                id={id}
                view={view}
                onViewChange={changeView}
                ar={ar}
              />
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
            </>
          )}
          <span role="status" className="tz-visually-hidden">
            {heard.copyLast ? message : stateMessage}
          </span>
        </header>
      </div>
      <div className="tz-demo-stage">
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
      {notes && <DemoNotes notes={notes} language={language} />}
    </div>
  );
}

/** Both names, each in its own language and direction, the interface's first. */
function DemoName({
  name,
  ar,
}: {
  name: { ar: string; en: string };
  ar: boolean;
}) {
  const order = ar ? (["ar", "en"] as const) : (["en", "ar"] as const);
  return (
    <div className="tz-demo-name">
      {order.map((lang) => (
        <span key={lang} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
          {name[lang]}
        </span>
      ))}
    </div>
  );
}

function DemoNotes({
  notes,
  language,
}: {
  notes: DemoFrameNotes;
  language: "ar" | "en";
}) {
  const ar = language === "ar";
  const columns: Array<[heading: string, items: ReactNode[] | undefined]> = [
    [ar ? "استخدمه عندما" : "Use it when", notes.useWhen],
    notes.replaces?.length
      ? [ar ? "يحل محل" : "Replaces", notes.replaces]
      : [ar ? "استخدم غيره عندما" : "Use something else when", notes.instead],
    [ar ? "لاحظ" : "What to notice", notes.notice],
  ];
  return (
    <div className="tz-demo-notes">
      {columns.map(
        ([heading, items]) =>
          items &&
          items.length > 0 && (
            <div key={heading}>
              <h3 lang={language}>{heading}</h3>
              <ul>
                {items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ),
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
  // The thumb is placed on mount and glides only once the view changes.
  const changed = useChanged(view);
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
      data-changed={changed || undefined}
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
