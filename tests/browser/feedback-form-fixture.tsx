import { createRoot } from "react-dom/client";
import { SystemProvider, defaultConfig } from "../../src/system";
import { FeedbackForm } from "../../src/system/ai/examples/FeedbackForm";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
// Renders the exported FeedbackForm example under a chosen system config.
// ?lang=ar|en&theme=light|dark&density=compact|standard&typography=standard|large
export function Fixture() {
  const params = new URLSearchParams(location.search),
    language = params.get("lang") === "en" ? "en" : "ar";
  return (
    <div lang={language}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
          theme: params.get("theme") === "dark" ? "dark" : "light",
          density:
            params.get("density") === "standard" ? "standard" : "compact",
          typography:
            params.get("typography") === "large" ? "large" : "standard",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            padding: 16,
            display: "grid",
            alignContent: "start",
            gap: 16,
            background: "var(--background)",
            color: "var(--text)",
          }}
        >
          <h1 style={{ fontSize: "var(--text-heading)", margin: 0 }}>
            {language === "ar" ? "نموذج الملاحظات" : "Feedback form"}
          </h1>
          <section style={{ maxWidth: 560, minWidth: 0 }}>
            <FeedbackForm language={language} />
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
