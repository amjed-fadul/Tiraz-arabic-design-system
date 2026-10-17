import { createRoot } from "react-dom/client";
import { AIDecisionsExample } from "../../src/system/ai/examples/AIDecisionsExamples";
import { SystemProvider, defaultConfig } from "../../src/system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const params = new URLSearchParams(location.search),
  ar = params.get("lang") === "ar";
document.documentElement.lang = ar ? "ar" : "en";
createRoot(document.getElementById("root")!).render(
  <SystemProvider
    config={{
      ...defaultConfig,
      direction: ar ? "rtl" : "ltr",
      theme: params.get("theme") === "dark" ? "dark" : "light",
      accent: params.get("custom") ? "plum" : "sage",
      density: params.get("custom") ? "standard" : "compact",
      radius: params.get("custom") ? 2 : 8,
      typography: params.get("custom") ? "large" : "standard",
      reducedMotion: params.get("motion") === "true",
    }}
  >
    <main
      style={{
        padding: 12,
        maxWidth: 700,
        marginInline: "auto",
        minHeight: "100dvh",
      }}
    >
      <h1 style={{ fontSize: 20 }}>
        {ar ? "قرارات مساعد الاستوديو" : "Studio Assistant decisions"}
      </h1>
      <h2 style={{ fontSize: 16 }}>
        {ar ? "مثال محلي" : "Local assistant example"}
      </h2>
      <AIDecisionsExample language={ar ? "ar" : "en"} />
    </main>
  </SystemProvider>,
);
