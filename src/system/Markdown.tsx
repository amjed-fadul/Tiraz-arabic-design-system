import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components, ExtraProps } from "react-markdown";
import { Children, createElement, isValidElement } from "react";
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";
import { Table } from "./Table";
import { useSystem } from "./useSystem";
export type MarkdownProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  text: string;
};
const plugins = [remarkGfm];
function MarkdownTable({ children }: ComponentPropsWithRef<"table">) {
  const ar = useSystem().config.direction === "rtl";
  return (
    <Table aria-label={ar ? "جدول الرد" : "Response table"}>{children}</Table>
  );
}
// Only split rendered text; the maintained parser still owns all Markdown syntax.
// Stable word nodes keep a selection in received prose intact when its paragraph grows.
function words(children: ReactNode) {
  return Children.map(children, (child) =>
    typeof child === "string"
      ? (child.match(/\S+|\s+/gu) ?? []).map((word, index) =>
          /\S/u.test(word) ? (
            <span className="tz-markdown-word" key={index}>
              {word}
            </span>
          ) : (
            word
          ),
        )
      : child,
  );
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
    return createElement(tag, props, words(children));
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
export function Markdown({ text, className = "", ...props }: MarkdownProps) {
  return (
    <div {...props} className={`tz-markdown ${className}`}>
      <ReactMarkdown
        skipHtml
        remarkPlugins={plugins}
        components={components}
        urlTransform={defaultUrlTransform}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
