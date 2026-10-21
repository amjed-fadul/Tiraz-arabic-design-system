import * as Popover from "@radix-ui/react-popover";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { useSystem } from "./useSystem";
import { Tick } from "./Tick";
import { numberLocale } from "./config";
import { contextStatus } from "./context-status";
import type { ContextStatusKey } from "./context-status";

export interface ContextMeterPart {
  id: string;
  label: string;
  value?: number | null;
}
export interface ContextMeterProps {
  used?: number | null;
  capacity?: number | null;
  estimated?: boolean;
  details?: readonly ContextMeterPart[];
  /** Supplied metadata, e.g. a model or cost. Never looked up by this component. */
  metadata?: string;
  label?: string;
  unit?: string;
  locale?: string;
  /**
   * Where the status moves, as a share of capacity: "high" is where the meter
   * fills up (0.8) and "near" where it nears capacity (0.95). Over capacity is
   * always above 1.
   */
  thresholds?: { high?: number; near?: number };
  /** Controls the details; pair `open` with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shows the details in place of the ring and its popover. */
  inline?: boolean;
  /**
   * A way out once the meter fills up, such as «لخّص المحادثة»: a button in
   * the details while the status is high, near or over.
   */
  action?: { label: ReactNode; onSelect(): void };
  /**
   * "polite" says «السياق: يقترب من الامتلاء» once each time the status word
   * changes; "off" when an owner speaks for the meter.
   */
  announcement?: "polite" | "off";
  className?: string;
}
const valid = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0;
export function ContextMeter({
  used,
  capacity,
  estimated = false,
  details,
  metadata,
  label,
  unit,
  locale,
  thresholds,
  open,
  onOpenChange,
  inline = false,
  action,
  announcement = "polite",
  className = "",
}: ContextMeterProps) {
  const { config, container } = useSystem(),
    ar = config.direction === "rtl",
    title = useId();
  const live = useRef<HTMLSpanElement>(null),
    heard = useRef<ContextStatusKey | null>(null),
    // The action's button while it holds focus, and the box that holds it.
    lastAction = useRef<HTMLElement | null>(null),
    box = useRef<HTMLDivElement>(null);
  // A pinned "ar" still follows the system numerals; other locales are used as given.
  const numbers = numberLocale(config, locale);
  const format = new Intl.NumberFormat(numbers, {
    maximumFractionDigits: 2,
  });
  const percent = new Intl.NumberFormat(numbers, {
    style: "percent",
    maximumFractionDigits: 2,
  });
  // A part's share in whole percent, without the direction marks Intl adds.
  const share = new Intl.NumberFormat(numbers, {
    style: "percent",
    maximumFractionDigits: 0,
  });
  const compact = new Intl.NumberFormat(numbers, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const u = valid(used),
    c = valid(capacity);
  const { ratio, tone, key, status } = contextStatus(
    { used, capacity, thresholds },
    ar,
  );
  const percentage =
    ratio !== null && Number.isFinite(ratio * 100)
      ? percent.format(ratio)
      : null;
  const name = label ?? (ar ? "السياق" : "Context"),
    units = unit ?? (ar ? "رمز" : "tokens");
  const estimate = estimated ? (ar ? "تقديري" : "Estimated") : "";
  // The numbers the trigger shows, which its name must hold (Label in Name).
  const shown = `${estimated ? "≈ " : ""}${u ? compact.format(used) : "—"} / ${c ? compact.format(capacity) : "—"}`;
  const usage = u
    ? format.format(used)
    : ar
      ? "الاستخدام غير متاح"
      : "Usage unavailable";
  const limit = c
    ? format.format(capacity)
    : ar
      ? "السعة غير متاحة"
      : "Capacity unavailable";
  const summary =
    u && c
      ? ar
        ? `${usage} من ${limit} ${units}`
        : `${usage} of ${limit} ${units}`
      : `${usage} · ${limit}${c ? ` ${units}` : ""}`;

  // Once the action works, usage drops and its button is removed: focus moves
  // to the box that holds the meter rather than dropping to the page.
  useLayoutEffect(() => {
    const el = lastAction.current;
    if (!el || el.isConnected) return;
    lastAction.current = null;
    if (el.ownerDocument.activeElement === el.ownerDocument.body)
      box.current?.focus({ preventScroll: true });
  });

  // One polite sentence each time the status word changes: never the status
  // the meter mounts with, and never a number. Back to room empties it, so
  // the next crossing is heard.
  useEffect(() => {
    const was = heard.current;
    heard.current = key;
    if (was === null || was === key || !live.current) return;
    live.current.textContent = status ? `${name}: ${status}` : "";
  });

  // Each part's share of the capacity; the bar sums them in the tone's tints.
  const parts = (details ?? []).map((part, index) => ({
    ...part,
    index,
    share:
      c && capacity > 0 && valid(part.value) ? part.value / capacity : null,
  }));
  const content = (
    <>
      <strong id={title}>
        {name}
        {estimate ? ` · ${estimate}` : ""}
      </strong>
      <p>{summary}</p>
      {percentage && (
        <p>
          {percentage} {ar ? "مستخدم" : "used"}
        </p>
      )}
      {status && (
        <p className="tz-context-status" data-tone={tone}>
          {status}
        </p>
      )}
      {parts.some((part) => part.share) && (
        <span className="tz-context-bar" data-tone={tone} aria-hidden="true">
          {parts.map(
            (part) =>
              !!part.share && (
                <span
                  key={part.id}
                  data-tint={part.index % 4}
                  style={{ flexBasis: `${part.share * 100}%` }}
                />
              ),
          )}
        </span>
      )}
      {parts.length > 0 && (
        <dl data-tone={tone}>
          {parts.map((part) => (
            <div key={part.id}>
              <dt>
                {part.share !== null && (
                  <span
                    className="tz-context-swatch"
                    data-tint={part.index % 4}
                    aria-hidden="true"
                  />
                )}
                <bdi>{part.label}</bdi>
              </dt>
              <dd>
                <bdi>
                  {valid(part.value)
                    ? format.format(part.value)
                    : ar
                      ? "غير متاح"
                      : "Unavailable"}
                </bdi>
                {part.share !== null && (
                  <span className="tz-context-share">
                    {share.format(part.share).replace(/\p{Cf}/gu, "")}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {metadata && <small dir="auto">{metadata}</small>}
      {action && tone !== "normal" && (
        <div className="tz-context-action">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => action.onSelect()}
            onFocus={(event) => {
              lastAction.current = event.currentTarget;
            }}
            onBlur={(event) => {
              // Focus moved on purpose is never reclaimed; a removed button
              // drops it with no related target.
              if (event.relatedTarget) lastAction.current = null;
            }}
          >
            {action.label}
          </Button>
        </div>
      )}
    </>
  );
  const region = announcement === "polite" && (
    <span
      ref={live}
      className="tz-visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
  );

  if (inline)
    return (
      <>
        <div
          ref={box}
          role="group"
          tabIndex={-1}
          aria-labelledby={title}
          className={`tz-context-inline ${className}`}
          data-tone={tone}
        >
          {content}
        </div>
        {region}
      </>
    );
  return (
    <>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger
          type="button"
          className={`tz-context-trigger ${className}`}
          data-tone={tone}
          aria-label={[name, shown, status, estimate, summary, percentage]
            .filter(Boolean)
            .join(": ")}
        >
          <svg
            className="tz-context-ring"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="7.5" />
            <circle
              cx="10"
              cy="10"
              r="7.5"
              pathLength="100"
              style={{
                strokeDasharray: `${ratio === null ? 0 : Math.min(100, Math.max(0, ratio * 100))} 100`,
              }}
            />
          </svg>
          <span>
            {estimated && "≈ "}
            <bdi>
              <Tick value={u ? used : "—"}>
                {u ? compact.format(used) : "—"}
              </Tick>{" "}
              / {c ? compact.format(capacity) : "—"}
            </bdi>
          </span>
          {status && (
            <>
              {/* A space, so the text it shows reads as the name does. */}{" "}
              <span className="tz-context-status" data-tone={tone}>
                {status}
              </span>
            </>
          )}
        </Popover.Trigger>
        <Popover.Portal container={container}>
          <Popover.Content
            ref={box}
            className="tz-context-details"
            dir={config.direction}
            aria-labelledby={title}
            sideOffset={6}
            collisionPadding={8}
            // The details open with focus on themselves, never on the action,
            // so the Enter that opened them can't press it.
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (event.currentTarget as HTMLElement | null)?.focus({
                preventScroll: true,
              });
            }}
          >
            {content}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {region}
    </>
  );
}
