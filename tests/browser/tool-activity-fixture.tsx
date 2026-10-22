import { createRoot } from "react-dom/client";
import { useState } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import {
  Button,
  ToolCall,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import {
  ToolCallExample,
  ToolChipsExample,
  ToolActivityDemo,
} from "../../src/system/ai/examples/ToolActivityExamples";
export function Fixture() {
  const q = new URLSearchParams(location.search),
    ar = q.get("lang") !== "en",
    custom = q.has("custom");
  const [mounted, setMounted] = useState(true),
    [open, setOpen] = useState(true),
    [replaced, setReplaced] = useState(false);
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: ar ? "rtl" : "ltr",
          theme: q.get("theme") === "dark" ? "dark" : "light",
          reducedMotion: q.has("reduced"),
          accent: custom ? "plum" : "sage",
          density: custom ? "standard" : "compact",
          typography: custom ? "large" : "standard",
          radius: custom ? 2 : 8,
        }}
      >
        <main
          style={{
            maxInlineSize: 800,
            marginInline: "auto",
            padding: "var(--space-4)",
            display: "grid",
            gap: "var(--space-4)",
            minBlockSize: "100vh",
            minInlineSize: 0,
          }}
        >
          <h1 style={{ margin: 0, fontSize: "var(--text-title)" }}>
            {ar ? "نشاط الأدوات" : "Tool activity"}
          </h1>
          <section aria-label="Static calls">
            <ToolCallExample
              language={ar ? "ar" : "en"}
              defaultExpanded={q.has("long")}
              longContent={q.has("long")}
            />
          </section>
          <section aria-label="Static chips">
            <ToolChipsExample language={ar ? "ar" : "en"} />
          </section>
          <section aria-label="Simulation">
            {mounted && <ToolActivityDemo language={ar ? "ar" : "en"} />}
          </section>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMounted(!mounted)}
          >
            {mounted ? "Unmount demo" : "Mount demo"}
          </Button>
          <section aria-label="Focus probe">
            <ToolCall
              label="Controlled probe"
              tool="focus_sample"
              state="completed"
              expanded={open}
              onExpandedChange={setOpen}
              output={
                !replaced ? (
                  <button
                    onClick={() => {
                      setReplaced(true);
                      setOpen(false);
                    }}
                  >
                    Replace details and collapse
                  </button>
                ) : (
                  "Host replaced details"
                )
              }
            />
          </section>
          <Button size="sm" variant="ghost">
            Outside
          </Button>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
