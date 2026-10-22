import { createRoot } from "react-dom/client";
import { SystemProvider, defaultConfig } from "../../src/system";
import type { SystemConfig } from "../../src/system";
import { AnalyticsExample } from "../../src/system/ai/examples/ChartExamples";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
// AnalyticsExample (connected period selector) is no longer on a docs page;
// charts.mjs drives it here. Params: dir=ltr|rtl, theme=light|dark.
const params = new URLSearchParams(location.search);
const config: SystemConfig = {
  ...defaultConfig,
  direction: params.get("dir") === "ltr" ? "ltr" : "rtl",
  theme: params.get("theme") === "dark" ? "dark" : "light",
};
const language = config.direction === "rtl" ? "ar" : "en";
document.documentElement.lang = language;
document.documentElement.dir = config.direction;
createRoot(document.getElementById("root")!).render(
  <SystemProvider config={config}>
    <main
      style={{
        padding: 16,
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "var(--surface)",
      }}
    >
      <AnalyticsExample language={language} />
    </main>
  </SystemProvider>,
);
