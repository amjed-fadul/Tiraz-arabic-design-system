import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CodeBlock,
  Markdown,
  StreamingText,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import { StreamingDemo } from "../../src/system/ai/examples/AIContentExamples";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const originalClipboard = navigator.clipboard;
export function App() {
  const [config, setConfig] = useState<SystemConfig>({
    ...defaultConfig,
    direction: "ltr",
  });
  const [code, setCode] = useState('\tconst name = "مدار / Madar";  \r\n\n');
  const [source, setSource] = useState(
    "# مرحبًا / Hello\n\n**Tiraz** و *نص عربي* with `const x = 1`.\n\n- one\n  - nested\n\n> A local quote\n\n| الاسم | State | Notes |\n| --- | --- | --- |\n| مدار | Ready | " +
      "long-cell ".repeat(35) +
      " |\n\n```ts\nconst ready = true;\n```",
  );
  const [text, setText] = useState("Hello عالم "),
    [streaming, setStreaming] = useState(true),
    [failure, setFailure] = useState(false);
  return (
    <div lang={config.direction === "rtl" ? "ar" : "en"}>
      <SystemProvider config={config}>
        <main
          style={{
            maxWidth: 900,
            padding: 16,
            marginInline: "auto",
            minWidth: 0,
          }}
        >
          <h1>AI content · local verification</h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <label>
              Direction{" "}
              <select
                value={config.direction}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    direction: e.target.value as "rtl" | "ltr",
                  })
                }
              >
                <option>ltr</option>
                <option>rtl</option>
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
                checked={failure}
                onChange={(e) => {
                  setFailure(e.target.checked);
                  Object.defineProperty(navigator, "clipboard", {
                    configurable: true,
                    value: e.target.checked
                      ? {
                          writeText: () =>
                            Promise.reject(
                              new Error("Local denied clipboard simulation"),
                            ),
                        }
                      : originalClipboard,
                  });
                }}
              />
              Simulate clipboard denial
            </label>
          </div>
          <h2>CodeBlock</h2>
          <label>
            Code source
            <textarea
              aria-label="Code source"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                height: 70,
              }}
            />
          </label>
          <button
            onClick={() => setCode('\tconst name = "مدار / Madar";  \r\n\n')}
          >
            Restore exact whitespace source
          </button>
          <button
            onClick={() =>
              setCode(
                Array.from(
                  { length: 80 },
                  (_, i) => `// ${i}: ${"long-line ".repeat(40)}`,
                ).join("\n"),
              )
            }
          >
            Long source
          </button>
          <CodeBlock code={code} language="ts" />
          <h2>Markdown</h2>
          <label>
            Markdown source
            <textarea
              aria-label="Markdown source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                height: 70,
              }}
            />
          </label>
          <button onClick={() => setSource((value) => value + " and more")}>
            Append Markdown text
          </button>
          <Markdown text={source} />
          <h2>Host text updates</h2>
          <label>
            Host text
            <input value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={streaming}
              onChange={(e) => setStreaming(e.target.checked)}
            />
            Streaming
          </label>
          <StreamingText
            text={text}
            state={streaming ? "streaming" : "completed"}
          />
          <h2>Streaming · local fixed chunks</h2>
          <StreamingDemo language={config.direction === "rtl" ? "ar" : "en"} />
          <h2>Incremental Markdown · local fixed chunks</h2>
          <StreamingDemo
            language={config.direction === "rtl" ? "ar" : "en"}
            markdown
          />
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
