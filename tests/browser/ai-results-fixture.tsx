import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  SystemProvider,
  defaultConfig,
  Sources,
  InlineCitation,
  ImageResult,
  InsightCards,
  Button,
  Sheet,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import {
  ImageResultExample,
  ImageResultStates,
  SourcesExample,
  SourcesStates,
  InsightCardsExample,
} from "../../src/system/ai/examples/AIResultsExamples";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import { sampleSources } from "../../src/system/ai/examples/ai-result-samples";
export function App() {
  const [config, setConfig] = useState<SystemConfig>({
    ...defaultConfig,
    direction: "ltr",
  });
  const [language, setLanguage] = useState<"ar" | "en">("en"),
    [long, setLong] = useState(false);
  const ar = language === "ar",
    source = sampleSources(language)[0];
  const [page, setPage] = useState("images");
  return (
    <div lang={language}>
      <SystemProvider config={config}>
        <main
          style={{
            maxWidth: 800,
            padding: 16,
            marginInline: "auto",
            minWidth: 0,
          }}
        >
          <h1>AI results · local verification</h1>
          <div className="tz-ai-results-controls">
            <label>
              Language{" "}
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as "ar" | "en");
                  setConfig({
                    ...config,
                    direction: e.target.value === "ar" ? "rtl" : "ltr",
                  });
                }}
              >
                <option>en</option>
                <option>ar</option>
              </select>
            </label>
            <label>
              Theme{" "}
              <select
                value={config.theme}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    theme: e.target.value as "light" | "dark",
                  })
                }
              >
                <option>light</option>
                <option>dark</option>
              </select>
            </label>
            <label>
              Accent{" "}
              <select
                value={config.accent}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    accent: e.target.value as "sage" | "blue",
                  })
                }
              >
                <option>sage</option>
                <option>blue</option>
              </select>
            </label>
            <label>
              Density{" "}
              <select
                value={config.density}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    density: e.target.value as "compact" | "standard",
                  })
                }
              >
                <option>compact</option>
                <option>standard</option>
              </select>
            </label>
            <label>
              Typography{" "}
              <select
                value={config.typography}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    typography: e.target.value as "standard" | "large",
                  })
                }
              >
                <option>standard</option>
                <option>large</option>
              </select>
            </label>
            <label>
              Radius{" "}
              <input
                type="number"
                value={config.radius}
                onChange={(e) =>
                  setConfig({ ...config, radius: Number(e.target.value) })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.reducedMotion}
                onChange={(e) =>
                  setConfig({ ...config, reducedMotion: e.target.checked })
                }
              />
              Reduced motion
            </label>
            <label>
              <input
                type="checkbox"
                checked={long}
                onChange={(e) => setLong(e.target.checked)}
              />
              Long content
            </label>
          </div>
          <nav className="tz-ai-results-controls" style={{ marginBlock: 16 }}>
            {["images", "sources", "insights", "edge"].map((id) => (
              <Button
                key={id}
                size="sm"
                variant={id === page ? "primary" : "secondary"}
                onClick={() => setPage(id)}
              >
                {id}
              </Button>
            ))}
          </nav>
          <div key={language + page}>
            {page === "images" && (
              <div className="tz-ai-results-example">
                <ImageResultExample language={language} />
                <ImageResultStates language={language} />
                <ImageResultExample
                  language={language}
                  aspectRatio="portrait"
                />
              </div>
            )}
            {page === "sources" && (
              <>
                <SourcesExample language={language} longContent={long} />
                <SourcesStates language={language} />
                <Sheet
                  trigger={<Button size="sm">Sheet citation</Button>}
                  title="Sheet review"
                  description="Nested source details"
                  closeLabel="Close sheet"
                >
                  <InlineCitation source={source} />
                </Sheet>
              </>
            )}
            {page === "insights" && (
              <InsightCardsExample language={language} longContent={long} />
            )}
            {page === "edge" && (
              <div className="tz-ai-results-example">
                <p>
                  Unsafe destination{" "}
                  <InlineCitation
                    source={{ ...source, href: "javascript:alert(1)" }}
                    mode="link"
                  />
                </p>
                <Sources
                  items={[{ ...source, href: "javascript:alert(1)" }]}
                  defaultExpanded
                />
                <Sources items={[]} />
                <InsightCards items={[]} />
                <ImageResult
                  alt={
                    long
                      ? "Missing sample / عينة ".repeat(70)
                      : "Missing sample"
                  }
                />
                <InsightCards
                  items={[
                    {
                      id: "one",
                      title: "One supplied finding",
                      details: "0 is a supplied value",
                    },
                  ]}
                />
                <p>{ar ? "قيمة صفرية موثقة" : "Documented zero value"}</p>
              </div>
            )}
          </div>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
