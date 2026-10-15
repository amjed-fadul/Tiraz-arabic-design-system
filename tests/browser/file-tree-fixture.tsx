import { createRoot } from "react-dom/client";
import { useState } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import { FileTree, SystemProvider, defaultConfig } from "../../src/system";
import type { FileTreeNode } from "../../src/system";
import { FileTreeExample } from "../../src/system/ai/examples/FileTreeExamples";
const data: FileTreeNode[] = [
  {
    id: "src",
    name: "src",
    kind: "folder",
    children: [
      {
        id: "ui",
        name: "components",
        kind: "folder",
        children: [
          { id: "app", kind: "file", name: "App.tsx", metadata: "2 KB" },
          { id: "button", kind: "file", name: "Button.tsx" },
        ],
      },
      { id: "base", kind: "file", name: "base.css" },
    ],
  },
  { id: "readme", kind: "file", name: "README.md" },
];
export function Fixture() {
  const q = new URLSearchParams(location.search),
    language = q.get("lang") === "en" ? "en" : "ar";
  const [expanded, setExpanded] = useState<string[]>(["src", "ui"]),
    [nodes, setNodes] = useState(data),
    [selected, setSelected] = useState<string | null>(null),
    [activated, setActivated] = useState("");
  return (
    <div lang={language}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
          theme: q.get("theme") === "dark" ? "dark" : "light",
          density: q.get("density") === "standard" ? "standard" : "compact",
          typography: q.get("typography") === "large" ? "large" : "standard",
          reducedMotion: q.get("motion") === "true",
        }}
      >
        <main
          style={{
            maxInlineSize: 740,
            marginInline: "auto",
            padding: "var(--space-4)",
            minBlockSize: "100vh",
            boxSizing: "border-box",
            display: "grid",
            alignContent: "start",
            gap: "var(--space-6)",
            minInlineSize: 0,
          }}
        >
          <h1 style={{ margin: 0 }}>FileTree</h1>
          <section aria-label="Project example">
            <FileTreeExample language={language} mode="controlled" />
          </section>
          <section aria-label="Focus probe">
            <h2 style={{ fontSize: "var(--text-body)" }}>
              Keyboard and data updates
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                onClick={() => setTimeout(() => setExpanded(["src"]), 160)}
              >
                Collapse nested later
              </button>
              <button
                onClick={() => setTimeout(() => setNodes([data[1]]), 160)}
              >
                Remove branch later
              </button>
              <button onClick={() => setTimeout(() => setNodes([]), 160)}>
                Clear later
              </button>
              <button
                onClick={() =>
                  setTimeout(() => setNodes([data[1], data[0]]), 160)
                }
              >
                Reorder later
              </button>
              <button onClick={() => setTimeout(() => setNodes(data), 160)}>
                Supply data later
              </button>
              <button
                onClick={() => {
                  setNodes(data);
                  setExpanded(["src", "ui"]);
                }}
              >
                Restore
              </button>
            </div>
            <FileTree
              nodes={nodes}
              label="Probe files"
              expandedIds={expanded}
              onExpandedChange={setExpanded}
              selectedId={selected}
              onSelectedChange={setSelected}
              onActivate={(file) => setActivated(file.name)}
            />
            <p aria-label="Activation">{activated || "No activation"}</p>
            <button>Outside</button>
            <h3>Nonfocusable outside</h3>
          </section>
          <section aria-label="Empty example">
            <FileTreeExample language={language} empty />
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
