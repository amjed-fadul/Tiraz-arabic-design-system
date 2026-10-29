import { useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import "./effort-choice.css";

const choices = {
  en: [
    ["Quick", "Small edits, quick questions"],
    ["Balanced", "Everyday work, considered answers"],
    ["Deep", "Complex changes, more reasoning"],
    ["Thorough", "Hard problems, the most thinking"],
  ],
  ar: [
    ["سريع", "للتعديلات الصغيرة والأسئلة السريعة"],
    ["متوازن", "للمهام اليومية بإجابات مدروسة"],
    ["عميق", "للتغييرات المعقدة بتفكير أعمق"],
    ["شامل", "للمسائل الصعبة بأقصى تفكير"],
  ],
} as const;

const levelAt = (fill: number) =>
  Math.max(0, Math.min(3, Math.round(fill * 4) - 1));

/**
 * A compact meter for the composer's top row. Drag anywhere on it: the fill
 * follows the pointer, the name changes as each stop is crossed, and release
 * settles on the nearest stop. A native range underneath carries the keyboard,
 * the name and the value; the host maps these product levels to its model.
 */
export function EffortChoice({
  value,
  onChange,
  language,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  language: "ar" | "en";
  disabled?: boolean;
}) {
  const id = useId();
  const levels = choices[language];
  const label = language === "ar" ? "مستوى التفكير" : "Effort";
  const current = Math.max(0, Math.min(3, Math.round(value)));
  const track = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  function follow(clientX: number) {
    const node = track.current;
    const box = node?.getBoundingClientRect();
    if (!node || !box?.width) return;
    const rtl = getComputedStyle(node).direction === "rtl";
    const fill = Math.max(
      0.08,
      Math.min(1, (rtl ? box.right - clientX : clientX - box.left) / box.width),
    );
    setDrag(fill);
    if (levelAt(fill) !== current) onChange(levelAt(fill));
  }
  return (
    <div
      className="tz-example-effort"
      data-level={current}
      data-disabled={disabled}
      data-dragging={drag !== null}
      title={`${label}: ${levels[current][0]} · ${levels[current][1]}`}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) return;
        event.preventDefault();
        input.current?.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture?.(event.pointerId);
        follow(event.clientX);
      }}
      onPointerMove={(event) => {
        if (drag !== null) follow(event.clientX);
      }}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
    >
      <label htmlFor={id} className="tz-visually-hidden">
        {label}
      </label>
      <span className="tz-example-effort-name" aria-hidden="true">
        {levels.map(([name], index) => (
          <span key={name} data-current={index === current}>
            {name}
          </span>
        ))}
      </span>
      <span className="tz-example-effort-track" ref={track} aria-hidden="true">
        <span
          className="tz-example-effort-fill"
          style={{ "--fill": drag ?? (current + 1) / 4 } as CSSProperties}
        />
      </span>
      <input
        ref={input}
        id={id}
        className="tz-example-effort-input"
        type="range"
        min={0}
        max={3}
        step={1}
        value={current}
        disabled={disabled}
        aria-valuetext={levels[current][0]}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="tz-visually-hidden" id={`${id}-hint`}>
        {levels[current][1]}
      </span>
    </div>
  );
}
