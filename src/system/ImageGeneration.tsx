import { agentPresentationStyle } from "./agent-presentation";
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties, FocusEvent, ReactNode } from "react";
import { Check, Pencil, ShieldAlert } from "lucide-react";
import { AgentAvatar, AgentHeaderActions } from "./AgentPresentation";
import type { AgentPresentation } from "./AgentPresentation";
import { Button } from "./Button";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { ImageResult } from "./ImageResult";
import { StatusPill } from "./StatusPill";
import type { StatusPillState } from "./StatusPill";
import { Tooltip } from "./Tooltip";
import { Tray } from "./Tray";
import { WeaveCanvas } from "./WeaveCanvas";
import { numberLocale } from "./config";
import { formatCount, formatElapsed } from "./format";
import { imageGenerationCopy } from "./image-generation-copy";
import { useSystem } from "./useSystem";

/** Every built-in string Image generation shows; `labels` overrides any of them. */
export interface ImageGenerationLabels {
  /** The heading: «توليد صورة». */
  title: string;
  /** The pill's word, and the canvas tag's, while queued. */
  queued: string;
  /** The pill's word while weaving, and the canvas tag's when progress is unknown. */
  weaving: string;
  /** The pill's word when done, which agrees with الصورة: «جاهزة». */
  completed: string;
  failedPill: string;
  /** The progress tag's name for assistive technology. */
  progress: string;
  /** The canvas tag while progress is known: «يُنسج · ٤٢٪». */
  weavingAt: (percent: string) => string;
  /** The list of options: ratio, style and count. */
  options: string;
  /** The group of versions: «اختر نسخة». */
  versions: string;
  /** Each version: «النسخة ١». */
  version: (number: string) => string;
  /** The failure's text, which is also its announcement. */
  failed: string;
  retry: string;
  /** What a refused request is called, before its reason. */
  blocked: string;
  edit: string;
  use: string;
  variations: string;
  /** The announcements for queued, weaving and completed. */
  saysQueued: string;
  saysWeaving: string;
  saysCompleted: string;
}
export interface ImageGenerationProps {
  /** Optional avatar, name, identity controls and tray color in the existing header. */
  agentPresentation?: AgentPresentation;
  /** The person's description of the image. */
  prompt: ReactNode;
  /** What the request asked for besides the description: ratio, style, count. */
  options?: readonly { id: string; label: ReactNode }[];
  status: "queued" | "weaving" | "completed" | "failed" | "blocked";
  /** Actual host progress from 0 to 100; omit or pass null while it is unknown. */
  progress?: number | null;
  images: readonly {
    id: string;
    src?: string;
    alt: string;
    width: number;
    height: number;
  }[];
  /** The chosen version. Without it the pattern keeps its own, from the first. */
  selected?: string;
  onSelectedChange?(id: string): void;
  onUse?(id: string): void;
  onVariations?(id: string): void;
  onEditPrompt?(): void;
  onRetry?(): void;
  /** Why the request was refused, shown while `status` is "blocked". */
  blockedReason?: ReactNode;
  /** The agent that made the images, first in the footer. */
  agent?: ReactNode;
  /** Seconds the generation took, last in the footer. */
  duration?: number;
  /** The heading's level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<ImageGenerationLabels>;
  /** Speak status changes politely, or leave announcements to the host. */
  announcement?: "polite" | "off";
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

const pills: Record<ImageGenerationProps["status"], StatusPillState> = {
  queued: "idle",
  weaving: "running",
  completed: "completed",
  failed: "failed",
  blocked: "needs-you",
};

/**
 * Image generation (spec section 12.7): make an image from a description and
 * pick the version to use. The host owns the status, the progress and the
 * images. While it is queued or weaving the canvas is a WeaveCanvas, with the
 * versions and actions quiet; once it is done or failed the canvas is the
 * chosen image as an ImageResult. Its polite region says each change of status
 * once unless the host owns announcements, never the progress.
 */
export function ImageGeneration({
  agentPresentation,
  prompt,
  options,
  status,
  progress,
  images,
  selected,
  onSelectedChange,
  onUse,
  onVariations,
  onEditPrompt,
  onRetry,
  blockedReason,
  agent,
  duration,
  headingLevel = 3,
  labels,
  announcement = "polite",
  appearance = "card",
}: ImageGenerationProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: ImageGenerationLabels = {
    ...imageGenerationCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    said = useRef<HTMLSpanElement>(null),
    live = useRef<HTMLSpanElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    heard = useRef<string | null>(null);
  const [own, setOwn] = useState<string>();
  const Heading = `h${headingLevel}` as const;
  const done = status === "completed",
    working = status === "queued" || status === "weaving",
    blocked = status === "blocked";
  const current =
    images.find((image) => image.id === (selected ?? own)) ?? images[0];
  const alt = current?.alt ?? copy.title;
  const digits = new Intl.NumberFormat(numberLocale(config), {
    useGrouping: false,
  });
  // Progress as a whole percent, held to 0 to 100; undefined while unknown.
  const value =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : undefined;
  const percent =
    value === undefined
      ? ""
      : new Intl.NumberFormat(numberLocale(config), {
          style: "percent",
          maximumFractionDigits: 0,
        })
          .format(value / 100)
          // The percent sign comes without the direction marks Intl adds.
          .replace(/\p{Cf}/gu, "");

  // One polite region, one sentence per status, never the progress. It mounts
  // empty: the status the pattern mounts in is not news. The sentence renders
  // hidden, so a reason that is markup still reads as its text.
  const sentence =
    status === "queued" ? (
      copy.saysQueued
    ) : status === "weaving" ? (
      copy.saysWeaving
    ) : status === "completed" ? (
      copy.saysCompleted
    ) : status === "failed" ? (
      copy.failed
    ) : (
      <>
        {copy.blocked}
        {blockedReason != null && <>: {blockedReason}</>}
      </>
    );
  useEffect(() => {
    const text = said.current?.textContent ?? "";
    if (announcement === "off") {
      heard.current = text;
      return;
    }
    if (heard.current === null) {
      heard.current = text;
      return;
    }
    if (live.current && text !== heard.current) live.current.textContent = text;
    heard.current = text;
  });
  // When a change removes the focused control (Retry, or an action that goes
  // quiet), focus moves to the pattern rather than dropping to the page.
  useLayoutEffect(() => {
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node) return;
    if (element.isConnected && !(element as HTMLButtonElement).disabled) return;
    lastFocus.current = null;
    const active = node.ownerDocument.activeElement;
    if (!active || active === node.ownerDocument.body || active === element)
      node.focus();
  });

  function choose(id: string) {
    setOwn(id);
    onSelectedChange?.(id);
  }

  const header = (
    <div className="tz-image-generation-header" data-zone="header">
      <AgentAvatar agent={agentPresentation} working={status === "weaving"} />
      <Heading id={`${uid}-title`} className="tz-image-generation-title">
        {copy.title}
      </Heading>
      <StatusPill
        state={pills[status]}
        label={
          {
            queued: copy.queued,
            weaving: copy.weaving,
            completed: copy.completed,
            failed: copy.failedPill,
            blocked: undefined,
          }[status]
        }
      />
      <AgentHeaderActions agent={agentPresentation} />
    </div>
  );

  const ratio = current ? current.width / current.height : 1.5;
  const shape: CSSProperties = {
    "--weave-ratio": current ? `${current.width} / ${current.height}` : "3 / 2",
    "--weave-aspect": ratio.toFixed(3),
  } as CSSProperties;
  const text = value === undefined ? copy.weaving : copy.weavingAt(percent);
  // The pencil at the end of the prompt names itself in a tooltip, so the text
  // keeps the row's width.
  const edit = onEditPrompt && (
    <Tooltip
      trigger={
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={copy.edit}
          onClick={() => onEditPrompt()}
        >
          <Pencil size={16} aria-hidden="true" />
        </Button>
      }
      content={copy.edit}
    />
  );
  const canvas = blocked ? (
    <div className="tz-image-generation-blocked">
      <ShieldAlert size={24} aria-hidden="true" />
      <strong>{copy.blocked}</strong>
      {blockedReason != null && <span dir="auto">{blockedReason}</span>}
      {onEditPrompt && (
        <Button variant="primary" size="sm" onClick={() => onEditPrompt()}>
          {copy.edit}
        </Button>
      )}
    </div>
  ) : (
    <>
      {/* The weave is one picture from queued to done. Once the images are
          done it stays under the result, hidden from assistive technology, so
          the result's own loading never blinks over a finished weave or a
          change of version. */}
      {(working || done) && (
        <div
          className="tz-image-generation-weave"
          data-under={done || undefined}
          aria-hidden={done || undefined}
        >
          <WeaveCanvas
            status={status}
            src={current?.src}
            progress={progress}
            alt={alt}
          />
        </div>
      )}
      {(done || status === "failed") && (
        <ImageResult
          src={current?.src}
          alt={alt}
          state={status === "failed" ? "error" : "loaded"}
          aspectRatio={
            ratio >= 1.2 ? "landscape" : ratio <= 0.85 ? "portrait" : "square"
          }
          onRetry={status === "failed" ? onRetry : undefined}
          labels={{ error: copy.failed, retry: copy.retry }}
          announcement={announcement}
        />
      )}
    </>
  );

  const paper = (
    <>
      <div className="tz-image-generation-prompt">
        <p className="tz-image-generation-prompt-text" dir="auto">
          {prompt}
        </p>
        {!blocked && edit}
      </div>
      {!!options?.length && (
        <ul
          role="list"
          aria-label={copy.options}
          className="tz-image-generation-options"
        >
          {options.map((option) => (
            <li key={option.id}>{option.label}</li>
          ))}
        </ul>
      )}
      <div className="tz-image-generation-canvas" style={shape}>
        {canvas}
        {!blocked && current && (
          <span className="tz-image-generation-tag tz-image-generation-size">
            {/* Each number is its own isolate, so Arabic-Indic digits keep
                width first on the left instead of the bidi order flipping
                around the sign. */}
            <bdi dir="ltr">
              <bdi>{digits.format(current.width)}</bdi>×
              <bdi>{digits.format(current.height)}</bdi>
            </bdi>
          </span>
        )}
        {status === "weaving" && (
          <span
            className="tz-image-generation-tag tz-image-generation-progress"
            role="progressbar"
            aria-label={copy.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-valuetext={text}
          >
            {text}
          </span>
        )}
        {status === "queued" && (
          <span className="tz-image-generation-tag tz-image-generation-progress">
            {copy.queued}
          </span>
        )}
      </div>
      {!blocked && images.length > 1 && (
        <div
          role="radiogroup"
          aria-label={copy.versions}
          className="tz-image-generation-variants"
        >
          {images.map((image, index) => (
            <label
              key={image.id}
              className="tz-image-generation-variant"
              style={
                {
                  "--thumb-ratio": `${image.width} / ${image.height}`,
                } as CSSProperties
              }
            >
              <input
                type="radio"
                name={`${uid}-versions`}
                value={image.id}
                checked={current?.id === image.id}
                disabled={!done}
                onChange={() => choose(image.id)}
              />
              <span className="tz-image-generation-thumb">
                {done && image.src && <img src={image.src} alt="" />}
                <Check
                  className="tz-image-generation-check"
                  size={12}
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
              <span className="tz-visually-hidden">
                {copy.version(digits.format(index + 1))}
              </span>
            </label>
          ))}
        </div>
      )}
    </>
  );

  // The agent, the images and the time, then what the person can do. The
  // actions wait, in place, until the images are done.
  const facts: ReactNode[] = [];
  const attribution = agentPresentation?.name ?? agent;
  if (attribution != null) facts.push(attribution);
  if (!blocked && images.length > 0)
    facts.push(formatCount(images.length, "image", config));
  if (duration !== undefined) facts.push(formatElapsed(duration, config));
  const actions: DecisionAction[] =
    blocked || !current
      ? []
      : [
          ...(onVariations
            ? [
                {
                  id: "variations",
                  label: copy.variations,
                  disabled: !done,
                  onSelect: () => onVariations(current.id),
                },
              ]
            : []),
          ...(onUse
            ? [
                {
                  id: "use",
                  label: copy.use,
                  tone: "primary" as const,
                  disabled: !done,
                  onSelect: () => onUse(current.id),
                },
              ]
            : []),
        ];
  const footer =
    facts.length > 0 || actions.length > 0 ? (
      <>
        {facts.length > 0 && (
          <span className="tz-image-generation-meta" data-zone="meta">
            {facts.map((fact, index) => (
              <Fragment key={index}>
                {index > 0 && " · "}
                {fact}
              </Fragment>
            ))}
          </span>
        )}
        {actions.length > 0 && (
          <div className="tz-image-generation-decision" data-zone="decision">
            <DecisionBar actions={actions} scope={root} />
          </div>
        )}
      </>
    ) : null;

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-image-generation"
      data-agent-presentation={agentPresentation?.color ? "" : undefined}
      style={agentPresentationStyle(agentPresentation)}
      data-status={status}
      data-appearance={appearance}
      onFocus={(event) => {
        lastFocus.current = event.target as HTMLElement;
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null))
          return;
        // Focus moved to another control on purpose is never reclaimed. A
        // control that is disabled or removed drops focus to the page.
        if (event.relatedTarget) lastFocus.current = null;
      }}
    >
      {announcement === "polite" && (
        <span
          ref={live}
          className="tz-visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
      )}
      <span ref={said} hidden>
        {sentence}
      </span>
      {appearance === "card" ? (
        <Tray paper={false} header={header} footer={footer}>
          <div
            className="tz-tray-paper tz-image-generation-paper"
            data-zone="paper"
            aria-busy={working || undefined}
          >
            {paper}
          </div>
        </Tray>
      ) : (
        <>
          {header}
          <div
            className="tz-image-generation-paper"
            data-zone="paper"
            aria-busy={working || undefined}
          >
            {paper}
          </div>
          {footer && <div className="tz-image-generation-footer">{footer}</div>}
        </>
      )}
    </section>
  );
}
