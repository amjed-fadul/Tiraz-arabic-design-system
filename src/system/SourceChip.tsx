import { FileText, Globe } from "lucide-react";
import { sourceHref } from "./source-url";
import type { SourceReference } from "./Sources";

/**
 * A source as a small chip: its icon, its title and, when it has one, its
 * metadata. A source with a safe destination is a link, one with only `onOpen`
 * a button, and any other a static chip.
 */
export function SourceChip({
  source,
  onOpen,
}: {
  source: SourceReference;
  onOpen?: () => void;
}) {
  const href = sourceHref(source.href);
  // A web page shows a globe; a document or local file, a page.
  const Icon = href && /^https?:\/\//i.test(href) ? Globe : FileText;
  const content = (
    <>
      <Icon size={12} aria-hidden="true" />
      <bdi className="tz-source-chip-title">{source.title}</bdi>
      {source.metadata && (
        <small className="tz-source-chip-meta" dir="auto">
          {source.metadata}
        </small>
      )}
    </>
  );
  if (href)
    return (
      <a className="tz-source-chip" href={href} data-source-id={source.id}>
        {content}
      </a>
    );
  if (onOpen)
    return (
      <button
        type="button"
        className="tz-source-chip"
        data-source-id={source.id}
        onClick={() => onOpen()}
      >
        {content}
      </button>
    );
  return (
    <span className="tz-source-chip" data-source-id={source.id}>
      {content}
    </span>
  );
}
