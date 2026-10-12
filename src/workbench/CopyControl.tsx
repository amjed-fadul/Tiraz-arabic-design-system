import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Language } from "./i18n";
import { label } from "./i18n";
export function CopyControl({
  text,
  caption,
  language,
  iconOnly = false,
}: {
  text: string;
  caption: string;
  language: Language;
  iconOnly?: boolean;
}) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const copied = copiedText === text;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }
  return (
    <span className="copy-control">
      <button
        type="button"
        className={`doc-button copy-button${iconOnly ? " copy-icon" : ""}`}
        aria-label={caption}
        title={failed ? label("failed", language) : caption}
        data-copy-state={failed ? "failed" : copied ? "copied" : "idle"}
        onClick={copy}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {!iconOnly && (
          <span>{copied ? label("copied", language) : caption}</span>
        )}
      </button>
      <span
        role="status"
        className={failed && !iconOnly ? "copy-error" : "sr-only"}
      >
        {failed
          ? label("failed", language)
          : copied
            ? label("copied", language)
            : ""}
      </span>
    </span>
  );
}
