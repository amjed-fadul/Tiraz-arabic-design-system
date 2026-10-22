import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Eye,
  RotateCcw,
} from "lucide-react";
import { highlightCode } from "../../code-highlight";
import { useChanged } from "../../useChanged";

type View = "preview" | "code";

/** One state the example can show: the word on its button, in both languages. */
export type DemoFrameState = { id: string; label: { ar: string; en: string } };

/**
 * A page's usage guidelines (`DemoNotes`). A column with no items is left out,
 * and `replaces` (a pattern's parts) takes the middle column from `instead`.
 */
export type DemoFrameNotes = {
  useWhen: ReactNode[];
  instead?: ReactNode[];
  replaces?: ReactNode[];
  notice?: ReactNode[];
};

/**
 * Documentation/example chrome only; not a public component family. A toolbar
 * above the stage holds the View switch (with `code`), the states, the page's
 * own control (`customize`) and the new-tab link (`openHref`); Replay sits in
 * the stage's corner and Copy in the code's header. The frame shows the state it is given, reports a press
 * through `onStateChange` and leaves what a state means to its caller.
 */
export function DemoFrame({
  language,
  code,
  fileName = "src/Example.tsx",
  replayLabel,
  onReplay,
  children,
  className = "",
  label,
  states,
  state,
  onStateChange,
  customize,
  openHref,
  onViewChange,
  replaying,
}: {
  language: "ar" | "en";
  code?: string;
  fileName?: string;
  /** Names Replay, and is its tooltip, in place of «إعادة تشغيل المثال». */
  replayLabel?: string;
  onReplay?: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
  states?: readonly DemoFrameState[];
  /** The id of the state the example is in. */
  state?: string;
  onStateChange?: (id: string) => void;
  /** Sits between the states and the new-tab link: the workbench's «تخصيص». */
  customize?: ReactNode;
  /** Where the new-tab link opens the example on its own. */
  openHref?: string;
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
  // A copy shows its check for 2 s; then the button is Copy again.
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(settle.current), []);
  const result = code && feedback?.code === code ? feedback.result : "idle";
  const copyName = ar ? "نسخ الكود" : "Copy code";
  const playName =
    replayLabel ?? (ar ? "إعادة تشغيل المثال" : "Replay example");
  const openName = ar
    ? "فتح المعاينة في تبويب جديد"
    : "Open the playground in a new tab";
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
    clearTimeout(settle.current);
    try {
      await navigator.clipboard.writeText(code);
      if (current === request.value) {
        setFeedback({ code, result: "copied" });
        setHeard((now) => ({ ...now, copyLast: true }));
        settle.current = setTimeout(() => {
          if (current === request.value) setFeedback(null);
        }, 2000);
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
  const hasStates = states !== undefined && states.length > 0;
  return (
    <div
      className={`tz-demo-frame ${className}`.trim()}
      role={label ? "group" : undefined}
      aria-label={label}
      data-view={code === undefined ? undefined : view}
    >
      <span role="status" className="tz-visually-hidden">
        {heard.copyLast ? message : stateMessage}
      </span>
      {(code !== undefined || hasStates || customize || openHref) && (
        <div className="tz-demo-bar">
          {code !== undefined && (
            <ViewSwitch id={id} view={view} onViewChange={changeView} ar={ar} />
          )}
          {(hasStates || customize || openHref) && (
            <div className="tz-demo-bar-end">
              {hasStates && (
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
              {customize}
              {openHref && (
                <a
                  className="tz-demo-icon"
                  href={openHref}
                  target="_blank"
                  rel="noopener"
                  aria-label={openName}
                  title={openName}
                >
                  {/* Out and forward: the arrow follows the reading direction. */}
                  <ArrowUpRight
                    className="tz-mirror-rtl"
                    size={18}
                    aria-hidden="true"
                  />
                </a>
              )}
            </div>
          )}
        </div>
      )}
      <div className="tz-demo-stage">
        {onReplay && !showCode && (
          <button
            type="button"
            className="tz-demo-icon tz-demo-replay"
            aria-label={playName}
            title={playName}
            onClick={onReplay}
          >
            <RotateCcw size={18} aria-hidden="true" />
          </button>
        )}
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
                <SourceView code={code} fileName={fileName} ar={ar}>
                  <button
                    type="button"
                    className="tz-demo-icon"
                    aria-label={copyName}
                    title={result === "failed" ? message : copyName}
                    data-copy-state={result}
                    onClick={copy}
                  >
                    {result === "copied" ? (
                      <Check size={18} aria-hidden="true" />
                    ) : result === "failed" ? (
                      <AlertCircle size={18} aria-hidden="true" />
                    ) : (
                      <Copy size={18} aria-hidden="true" />
                    )}
                  </button>
                </SourceView>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A page's usage guidelines: one column each for when to use the example,
 * when to use something else (or, on a pattern page, what it replaces) and
 * what to notice. The page gives them their own section and heading.
 */
export function DemoNotes({
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

/**
 * Read-only source with a line gutter; the clipboard gets the exact string.
 * Its header row follows the page's direction, the file name at the start and
 * the action (Copy) at the end; the code itself stays left to right.
 */
function SourceView({
  code,
  fileName,
  ar,
  children,
}: {
  code: string;
  fileName: string;
  ar: boolean;
  children: ReactNode;
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
    <div className="tz-demo-source">
      <div className="tz-demo-source-head">
        <span className="tz-demo-source-file" dir="ltr">
          {fileName}
        </span>
        {children}
      </div>
      <div
        className="tz-demo-source-scroll"
        dir="ltr"
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
