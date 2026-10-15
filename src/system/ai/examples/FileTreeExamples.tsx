import { useState } from "react";
import { EmptyState, FileTree } from "../../index";
import type { FileTreeFile, FileTreeNode } from "../../index";
export interface FileTreeExampleProps {
  language?: "ar" | "en";
  mode?: "controlled" | "uncontrolled";
  metadata?: boolean;
  empty?: boolean;
}
/** All names and preview strings belong to this application example. */
export function FileTreeExample({
  language = "ar",
  mode = "uncontrolled",
  metadata = true,
  empty = false,
}: FileTreeExampleProps) {
  const ar = language === "ar";
  const [expanded, setExpanded] = useState<string[]>([
    "project",
    "src",
    "components",
  ]);
  const [selected, setSelected] = useState<string | null>("app");
  const files: Record<string, string> = {
    app: 'import { Welcome } from "./components/Welcome";\n\nexport function App() {\n  return <Welcome />;\n}',
    welcome: ar
      ? "// محتوى نموذجي يملكه التطبيق\nexport const Welcome = () => <h1>مرحبًا بك</h1>;"
      : "export const Welcome = () => <h1>Welcome</h1>;",
    tokens: ":root {\n  --space: 8px;\n  --surface: #ffffff;\n}",
    guide: ar
      ? "# دليل المشروع\n\nأسماء ومحتوى نموذجي يزوّدها التطبيق."
      : "# Project guide\n\nSample names and content supplied by the application.",
    package: '{ "name": "tiraz-project", "private": true }',
  };
  const file = (id: string, name: string, detail: string): FileTreeFile => ({
    id,
    kind: "file",
    name,
    metadata: metadata ? detail : undefined,
  });
  const nodes: FileTreeNode[] = [
    {
      id: "project",
      kind: "folder",
      name: ar ? "مشروع طراز" : "tiraz-project",
      children: [
        {
          id: "src",
          kind: "folder",
          name: "src",
          children: [
            {
              id: "components",
              kind: "folder",
              name: "components",
              children: [file("welcome", "Welcome.tsx", "1.2 KB")],
            },
            file("app", "App.tsx", "860 B"),
            file("tokens", "tokens.css", "420 B"),
          ],
        },
        {
          id: "docs",
          kind: "folder",
          name: ar ? "التوثيق" : "docs",
          children: [
            file(
              "guide",
              "دليل-project-setup-and-contribution-notes.md",
              "2.4 KB",
            ),
          ],
        },
        file("package", "package.json", "310 B"),
      ],
    },
  ];
  const selectedName = (function find(
    items: readonly FileTreeNode[],
  ): string | undefined {
    for (const node of items) {
      if (node.id === selected && node.kind === "file") return node.name;
      if (node.kind === "folder") {
        const name = find(node.children);
        if (name) return name;
      }
    }
  })(nodes);
  return (
    <div style={{ display: "grid", gap: "var(--space-4)", minInlineSize: 0 }}>
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: "var(--text-meta)",
        }}
      >
        {ar
          ? "بيانات يزوّدها التطبيق. انقر أو اضغط المسافة لتحديد ملف ومعاينة نصه النموذجي. Enter ينشط الملف؛ الأسهم تنقل التركيز فقط."
          : "Application-supplied data. Click or press Space to select a file and preview its sample text. Enter activates the file; arrows move focus only."}
      </p>
      <FileTree
        nodes={empty ? [] : nodes}
        label={ar ? "ملفات المشروع" : "Project files"}
        {...(mode === "controlled"
          ? {
              expandedIds: expanded,
              onExpandedChange: setExpanded,
              selectedId: selected,
            }
          : {
              defaultExpandedIds: ["project", "src", "components"],
              defaultSelectedId: "app",
            })}
        onSelectedChange={setSelected}
        onActivate={(node) => setSelected(node.id)}
        emptyState={
          <EmptyState
            title={ar ? "لا توجد ملفات" : "No files"}
            description={
              ar
                ? "أضف بيانات المشروع في تطبيقك لعرضها هنا."
                : "Supply project data from your application to display it here."
            }
          />
        }
      />
      {!empty && (
        <section
          aria-label={ar ? "معاينة الملف" : "File preview"}
          style={{
            minInlineSize: 0,
            borderBlockStart: "1px solid var(--border)",
            paddingBlockStart: "var(--space-3)",
          }}
        >
          {selectedName ? (
            <>
              <p
                style={{
                  margin: "0 0 var(--space-2)",
                  fontSize: "var(--text-meta)",
                  overflowWrap: "anywhere",
                }}
              >
                <bdi>{selectedName}</bdi> · {ar ? "نص نموذجي" : "Sample text"}
              </p>
              <pre
                dir="auto"
                style={{
                  margin: 0,
                  padding: "var(--space-3)",
                  background: "var(--surface-subtle)",
                  borderRadius: "var(--radius)",
                  fontSize: "var(--text-meta)",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {selected ? files[selected] : ""}
              </pre>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
              }}
            >
              {ar
                ? "حدد ملفًا لمعاينة نصه النموذجي."
                : "Select a file to preview its sample text."}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
