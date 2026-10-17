import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  SystemProvider,
  Terminal,
  defaultConfig,
} from "../../src/system";
import { ChatAppExample } from "../../src/system/ai/examples/ChatAppExample";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const p = new URLSearchParams(location.search),
  ar = p.get("lang") === "ar";
export function Fixture() {
  const [count, setCount] = useState(0);
  const output = Array.from(
    { length: 90 + count },
    (_, i) => `  line ${i + 1}\t${"supplied output ".repeat(14)}\n`,
  ).join("");
  return (
    <SystemProvider
      config={{
        ...defaultConfig,
        direction: ar ? "rtl" : "ltr",
        theme: p.get("theme") === "dark" ? "dark" : "light",
        accent: p.has("custom") ? "plum" : "sage",
        radius: p.has("custom") ? 16 : 8,
        typography: p.has("custom") ? "large" : "standard",
        density: p.has("custom") ? "standard" : "compact",
        reducedMotion: p.has("motion"),
      }}
    >
      <main
        lang={ar ? "ar" : "en"}
        style={{
          padding: 12,
          maxInlineSize: 1100,
          marginInline: "auto",
          minInlineSize: 0,
        }}
      >
        <h1 style={{ fontSize: 22 }}>
          Terminal and ChatApp · local verification
        </h1>
        <ChatAppExample language={ar ? "ar" : "en"} />
        <h2>Terminal follow fixture</h2>
        <Terminal
          label="Long supplied log"
          command="  npm run sample  "
          output={output}
          state="running"
          followOutput
        />
        <Button onClick={() => setCount((value) => value + 10)}>
          Append ten supplied lines
        </Button>
        <h2>Unsafe text fixture</h2>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Terminal
            label="Unsafe supplied text"
            command="  echo sample  "
            output={
              "  a\t b\n<img src=x onerror=alert(1)>\n\u001b[31mred\u001b[0m\n<script>alert(1)</script>\n"
            }
            state="failed"
            exitCode={1}
          />
        </div>
      </main>
    </SystemProvider>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
