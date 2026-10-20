import { useId } from "react";
import { followUpsCopy } from "./cited-answer-copy";
import { useSystem } from "./useSystem";

export interface FollowUpsProps {
  items: readonly { id: string; label: string }[];
  /** The person picked a question; the host asks it. */
  onSelect: (id: string) => void;
  /** The list's name; «أسئلة تالية» by default. */
  label?: string;
}

/** Suggested next questions (spec section 11): a named list of buttons. */
export function FollowUps({ items, onSelect, label }: FollowUpsProps) {
  const { config } = useSystem(),
    labelId = useId();
  if (!items.length) return null;
  return (
    <div className="tz-follow-ups">
      <p id={labelId} className="tz-follow-ups-label">
        {label ?? followUpsCopy[config.direction === "rtl" ? "ar" : "en"]}
      </p>
      <ul role="list" aria-labelledby={labelId}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="tz-follow-ups-item"
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
