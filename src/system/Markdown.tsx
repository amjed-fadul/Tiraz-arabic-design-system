import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components, ExtraProps } from "react-markdown";
import {
  Children,
  Fragment,
  createContext,
  createElement,
  isValidElement,
  useContext,
} from "react";
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";
import { Table } from "./Table";
import { sourceHref } from "./source-url";
import { useSystem } from "./useSystem";
export type MarkdownProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  text: string;
  /** Turns each number of a `[n]` marker in the text into this node, one call
   * per number: `[1]`, `[1,3]` and `[٢، ٣]` in any digits, a group as adjacent
   * nodes. Code is left alone, and a marker is left as written when it returns
   * nothing for any of its numbers. */
  renderCitation?: (marker: number) => ReactNode;
  /** "strict" sends link and image targets through `sourceHref`, so only http,
   * https, relative and fragment targets survive; the default keeps the
   * parser's own policy. */
  links?: "default" | "strict";
};
const plugins = [remarkGfm];
// A citation marker: a number in brackets, or several after commas, in the
// digits Arabic text drifts between (ASCII, Arabic-Indic, Persian) and with
// either comma: [1], [١], [۴], [1,3] and [٢، ٣].
const numberSource = String.raw`[0-9\u0660-\u0669\u06F0-\u06F9]+`;
const markerPattern = new RegExp(
  String.raw`(\[${numberSource}(?:\s*[,،]\s*${numberSource})*\])`,
  "u",
);
const numberPattern = new RegExp(numberSource, "gu");
// Each digit block starts on a multiple of 16, so a digit's low four bits are
// its value in all three.
const markerNumber = (written: string) =>
  Number(
    Array.from(written, (digit) => String(digit.charCodeAt(0) & 15)).join(""),
  );
// The component map below is fixed so a growing answer never remounts its
// nodes; the citation renderer reaches the text through this context.
const CitationContext =
  createContext<MarkdownProps["renderCitation"]>(undefined);
const strictUrl = (url: string) => sourceHref(url) ?? "";
function MarkdownTable({ children }: ComponentPropsWithRef<"table">) {
  const ar = useSystem().config.direction === "rtl";
  return (
    <Table aria-label={ar ? "جدول الرد" : "Response table"}>{children}</Table>
  );
}
// Only split rendered text; the maintained parser still owns all Markdown syntax.
// Stable word nodes keep a selection in received prose intact when its paragraph grows.
function wordSpans(text: string, prefix: string) {
  return (text.match(/\S+|\s+/gu) ?? []).map((word, index) =>
    /\S/u.test(word) ? (
      <span className="tz-markdown-word" key={`${prefix}${index}`}>
        {word}
      </span>
    ) : (
      word
    ),
  );
}
function words(
  children: ReactNode,
  renderCitation?: MarkdownProps["renderCitation"],
) {
  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    if (!renderCitation) return wordSpans(child, "");
    // A marker may touch its word or the punctuation after it, so the text is
    // cut at each marker before it is cut into words.
    return child.split(markerPattern).map((part, index) => {
      // The odd parts are the markers the pattern caught.
      if (index % 2 === 0) return wordSpans(part, `${index}-`);
      const numbers = part.match(numberPattern)?.map(markerNumber) ?? [];
      if (!numbers.every(Number.isSafeInteger))
        return wordSpans(part, `${index}-`);
      // Every number is asked for once; one that renders nothing leaves the
      // whole marker as written.
      const nodes = numbers.map((number) => renderCitation(number));
      const rendered = nodes.every(
        (node) => node !== null && node !== undefined && node !== false,
      );
      return (
        <Fragment key={`${index}-citation`}>
          {rendered
            ? nodes.map((node, at) => <Fragment key={at}>{node}</Fragment>)
            : part}
        </Fragment>
      );
    });
  });
}
function prose(
  tag:
    | "p"
    | "li"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "strong"
    | "em"
    | "del"
    | "td",
) {
  return function Prose({
    node: _node,
    children,
    ...props
  }: HTMLAttributes<HTMLElement> & ExtraProps) {
    const renderCitation = useContext(CitationContext);
    return createElement(tag, props, words(children, renderCitation));
  };
}
// Stable component identities preserve code/copy focus across partial host updates.
const components: Components = {
  p: prose("p"),
  li: prose("li"),
  h1: prose("h1"),
  h2: prose("h2"),
  h3: prose("h3"),
  h4: prose("h4"),
  h5: prose("h5"),
  h6: prose("h6"),
  strong: prose("strong"),
  em: prose("em"),
  del: prose("del"),
  td: prose("td"),
  pre({ children }) {
    if (!isValidElement<{ children?: ReactNode; className?: string }>(children))
      return <pre>{children}</pre>;
    return (
      <CodeBlock
        code={String(children.props.children ?? "")}
        language={children.props.className?.replace(/^language-/, "")}
      />
    );
  },
  code({ node: _node, children, ...props }) {
    return (
      <code {...props} dir="ltr">
        {words(children)}
      </code>
    );
  },
  a({ node: _node, href, children, ...props }) {
    return href ? (
      <a {...props} href={href}>
        {words(children)}
      </a>
    ) : (
      <>{words(children)}</>
    );
  },
  table: MarkdownTable,
  th({ node: _node, children, ...props }) {
    return (
      <th {...props} scope="col">
        {words(children)}
      </th>
    );
  },
  img({ node: _node, src, alt, ...props }) {
    return src ? (
      <img
        {...props}
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    ) : (
      <>{alt}</>
    );
  },
};
/** CommonMark plus GFM; raw HTML is discarded and parser URL filtering stays enabled. */
export function Markdown({
  text,
  renderCitation,
  links = "default",
  className = "",
  ...props
}: MarkdownProps) {
  return (
    <div {...props} className={`tz-markdown ${className}`}>
      <CitationContext value={renderCitation}>
        <ReactMarkdown
          skipHtml
          remarkPlugins={plugins}
          components={components}
          urlTransform={links === "strict" ? strictUrl : defaultUrlTransform}
        >
          {text}
        </ReactMarkdown>
      </CitationContext>
    </div>
  );
}
