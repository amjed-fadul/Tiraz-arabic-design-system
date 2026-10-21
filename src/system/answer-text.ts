import { numberLocale } from "./config";
import type { Direction, Numerals } from "./config";
import { answerSourcesCopy } from "./cited-answer-copy";
import { sourceHref } from "./source-url";
import type { SourceReference } from "./Sources";

/**
 * An answer as plain text for the clipboard: the body as written, then the
 * method when there is one, then the sources under their heading, one numbered
 * line each in the reader's digits, with the link wherever `sourceHref` accepts
 * it. A blank line separates the blocks, and a block with nothing in it is left
 * out, so an answer with no sources ends with its body.
 */
export function answerText(
  body: string,
  sources: readonly SourceReference[],
  config: { direction?: Direction; numerals?: Numerals },
  method?: { title: string; lines: readonly string[] },
): string {
  const digits = new Intl.NumberFormat(numberLocale(config), {
    useGrouping: false,
  });
  return [
    body,
    method && [method.title, ...method.lines].join("\n"),
    sources.length > 0 &&
      [
        answerSourcesCopy[config.direction === "rtl" ? "ar" : "en"],
        ...sources.map((source) => {
          const href = sourceHref(source.href);
          return `${digits.format(source.number)}. ${source.title}${href ? ` — ${href}` : ""}`;
        }),
      ].join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}
