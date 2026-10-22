import type { ReactNode } from "react";
const aliases: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  jsx: "javascript",
  ts: "typescript",
  typescript: "typescript",
  tsx: "typescript",
  json: "json",
  py: "python",
  python: "python",
  sh: "bash",
  shell: "bash",
  bash: "bash",
};
// Presentation only: deliberately small lexical highlighting, never HTML or execution.
export function highlightCode(code: string, language: string): ReactNode {
  const key = language.toLowerCase();
  const syntax = Object.hasOwn(aliases, key) ? aliases[key] : undefined;
  if (!syntax) return code;
  const comments =
    syntax === "python" || syntax === "bash"
      ? "#[^\\r\\n]*"
      : syntax === "json"
        ? "(?!)"
        : "//[^\\r\\n]*|/\\*[\\s\\S]*?(?:\\*/|$)";
  const pattern = new RegExp(
    `${comments}|"(?:\\\\[\\s\\S]|[^"\\\\])*"|'(?:\\\\[\\s\\S]|[^'\\\\])*'|\x60(?:\\\\[\\s\\S]|[^\x60\\\\])*\x60|\\b(?:export|import|from|const|let|var|function|return|async|await|if|else|for|while|class|new|throw|try|catch|true|false|null|undefined|type|interface|extends|def|in|and|or|not|None|True|False|pass|with|as|echo|then|fi|do|done)\\b|\\b\\d+(?:\\.\\d+)?\\b`,
    "g",
  );
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const match of code.matchAll(pattern)) {
    const index = match.index!,
      value = match[0];
    if (index > offset) nodes.push(code.slice(offset, index));
    const kind = /^(\/\/|\/\*|#)/.test(value)
      ? "comment"
      : /^["'`]/.test(value)
        ? // A JSON string directly followed by a colon is a key.
          syntax === "json" && /^\s*:/.test(code.slice(index + value.length))
          ? "key"
          : "string"
        : /^\d/.test(value)
          ? "number"
          : "keyword";
    nodes.push(
      <span key={index} className="tz-code-token" data-kind={kind}>
        {value}
      </span>,
    );
    offset = index + value.length;
  }
  if (offset < code.length) nodes.push(code.slice(offset));
  return nodes;
}
