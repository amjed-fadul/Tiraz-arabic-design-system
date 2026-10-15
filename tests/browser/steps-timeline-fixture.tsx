import { createRoot } from "react-dom/client";
import { useState } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import {
  SystemProvider,
  defaultConfig,
  Steps,
  Timeline,
} from "../../src/system";
import {
  StepsExample,
  StepsFormExample,
  ActivatableStepsExample,
} from "../../src/system/ai/examples/StepsExamples";
import { TimelineExample } from "../../src/system/ai/examples/TimelineExamples";
export function Fixture() {
  const query = new URLSearchParams(location.search);
  const language = query.get("lang") === "en" ? "en" : "ar";
  const [theme, setTheme] = useState<"light" | "dark">(
    query.get("theme") === "dark" ? "dark" : "light",
  );
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    query.get("orientation") === "vertical" ? "vertical" : "horizontal",
  );
  const [motion, setMotion] = useState(query.get("motion") === "true");
  const [accent, setAccent] = useState<"sage" | "blue">("sage");
  return (
    <div lang={language}>
      <SystemProvider
        config={{
          ...defaultConfig,
          theme,
          direction: language === "ar" ? "rtl" : "ltr",
          reducedMotion: motion,
          accent,
        }}
      >
        <main
          style={{
            maxInlineSize: 960,
            marginInline: "auto",
            padding: "var(--space-6)",
            boxSizing: "border-box",
            minBlockSize: "100vh",
            display: "grid",
            gap: "var(--space-6)",
            overflowWrap: "anywhere",
          }}
        >
          <h1 style={{ margin: 0 }}>
            {language === "ar" ? "الخطوات والخط الزمني" : "Steps and Timeline"}
          </h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <label>
              Theme{" "}
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as typeof theme)}
              >
                <option>light</option>
                <option>dark</option>
              </select>
            </label>
            <label>
              Orientation{" "}
              <select
                value={orientation}
                onChange={(e) =>
                  setOrientation(e.target.value as typeof orientation)
                }
              >
                <option>horizontal</option>
                <option>vertical</option>
              </select>
            </label>
            <label>
              Accent{" "}
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value as typeof accent)}
              >
                <option>sage</option>
                <option>blue</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={motion}
                onChange={(e) => setMotion(e.target.checked)}
              />
              Reduced motion
            </label>
          </div>
          <section aria-label="Long steps">
            <h2>{language === "ar" ? "مراحل الطلب" : "Application stages"}</h2>
            <StepsExample
              language={language}
              orientation={orientation}
              longLabels
              currentState="current"
            />
          </section>
          <section aria-label="All states">
            <Steps
              label="Four states"
              locale={language}
              orientation={orientation}
              items={[
                { id: "done", label: "Completed", status: "completed" },
                { id: "now", label: "Current", status: "current" },
                { id: "error", label: "Error", status: "error" },
                {
                  id: "later",
                  label:
                    "LongUnbrokenIdentifier0123456789012345678901234567890123456789",
                  status: "upcoming",
                },
              ]}
            />
          </section>
          <section aria-label="Local form">
            <StepsFormExample language={language} />
          </section>
          <section aria-label="Activation">
            <ActivatableStepsExample language={language} />
          </section>
          <section aria-label="Activity">
            <h2>{language === "ar" ? "النشاط المحلي" : "Local activity"}</h2>
            <TimelineExample language={language} longContent />
          </section>
          <section aria-label="Empty activity">
            <TimelineExample language={language} empty />
          </section>
          <section aria-label="Input order">
            <Timeline
              label="Supplied order"
              items={[
                {
                  id: "late",
                  title: "Later supplied first",
                  timestamp: "October 15",
                  dateTime: "2026-10-15",
                  description: (
                    <bdi dir="ltr">
                      DOC-42/2026—LongUnbrokenIdentifier0123456789012345678901234567890123456789
                    </bdi>
                  ),
                },
                {
                  id: "early",
                  title: "Earlier supplied second",
                  timestamp: "October 14",
                  dateTime: "2026-10-14",
                },
              ]}
            />
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
