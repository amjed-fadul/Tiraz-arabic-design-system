import { useState } from "react";
import { EmptyState, FileTree } from "../../index";
import type { FileTreeFile, FileTreeNode } from "../../index";
export interface FileTreeExampleProps {
  language?: "ar" | "en";
  mode?: "controlled" | "uncontrolled";
  metadata?: boolean;
  empty?: boolean;
}
/** A project tree beside a preview of the selected file. */
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
      ? "export const Welcome = () => <h1>مرحبًا بك</h1>;"
      : "export const Welcome = () => <h1>Welcome</h1>;",
    tokens: ":root {\n  --space: 8px;\n  --surface: #ffffff;\n}",
    guide: ar
      ? "# دليل المشروع\n\nثبّت الحزم ثم شغّل npm run dev."
      : "# Project guide\n\nInstall dependencies, then run npm run dev.",
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
                ? "ارفع ملفات المشروع لتظهر هنا."
                : "Upload project files to see them here."
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
                <bdi>{selectedName}</bdi>
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
              {ar ? "اختر ملفًا لمعاينته." : "Select a file to preview it."}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
