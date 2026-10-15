import { createRoot } from "react-dom/client";
import { useState } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import { SystemProvider, defaultConfig, TaskRows } from "../../src/system";
import type { SystemConfig } from "../../src/system";
import {
  TaskRowsExample,
  TaskRowsStatesExample,
} from "../../src/system/ai/examples/TaskRowsExamples";
import { NotificationListExample } from "../../src/system/ai/examples/NotificationListExamples";
export function Fixture() {
  const query = new URLSearchParams(location.search);
  const language = query.get("lang") === "en" ? "en" : "ar";
  const appearance = query.get("appearance") === "list" ? "list" : "capsules";
  const [externalOpen, setExternalOpen] = useState(true);
  const [theme, setTheme] = useState<SystemConfig["theme"]>(
    query.get("theme") === "dark" ? "dark" : "light",
  );
  const [density, setDensity] = useState<SystemConfig["density"]>("compact");
  const [typography, setTypography] =
    useState<SystemConfig["typography"]>("standard");
  const [accent, setAccent] = useState<SystemConfig["accent"]>("sage");
  const [motion, setMotion] = useState(query.get("motion") === "true");
  return (
    <div lang={language}>
      <SystemProvider
        config={{
          ...defaultConfig,
          theme,
          direction: language === "ar" ? "rtl" : "ltr",
          density,
          typography,
          accent,
          reducedMotion: motion,
        }}
      >
        <main
          style={{
            maxInlineSize: 920,
            marginInline: "auto",
            padding: "var(--space-4)",
            minBlockSize: "100vh",
            boxSizing: "border-box",
            display: "grid",
            gap: "var(--space-6)",
            minInlineSize: 0,
          }}
        >
          <h1 style={{ margin: 0 }}>
            {language === "ar"
              ? "المهام والإشعارات"
              : "Tasks and notifications"}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <label>
              Theme{" "}
              <select
                aria-label="Theme"
                value={theme}
                onChange={(e) =>
                  setTheme(e.target.value as SystemConfig["theme"])
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Density{" "}
              <select
                aria-label="Density"
                value={density}
                onChange={(e) =>
                  setDensity(e.target.value as SystemConfig["density"])
                }
              >
                <option value="compact">Compact</option>
                <option value="standard">Standard</option>
              </select>
            </label>
            <label>
              Typography{" "}
              <select
                aria-label="Typography"
                value={typography}
                onChange={(e) =>
                  setTypography(e.target.value as SystemConfig["typography"])
                }
              >
                <option value="standard">Standard</option>
                <option value="large">Large</option>
              </select>
            </label>
            <label>
              Accent{" "}
              <select
                aria-label="Accent"
                value={accent}
                onChange={(e) =>
                  setAccent(e.target.value as SystemConfig["accent"])
                }
              >
                <option value="sage">Sage</option>
                <option value="blue">Blue</option>
              </select>
            </label>
            <label>
              Reduced motion{" "}
              <input
                type="checkbox"
                checked={motion}
                onChange={(e) => setMotion(e.target.checked)}
              />
            </label>
          </div>
          <section aria-label="Task example">
            <h2>TaskRows</h2>
            <TaskRowsExample
              language={language}
              appearance={appearance}
              longContent
            />
          </section>
          <section aria-label="Notification example">
            <h2>NotificationList</h2>
            <NotificationListExample language={language} longContent />
          </section>
          <section aria-label="Static tasks">
            <h2>{language === "ar" ? "الحالات الأربع" : "Four states"}</h2>
            <TaskRowsStatesExample
              language={language}
              appearance={appearance}
            />
          </section>
          <section aria-label="Controlled focus">
            <h2>Controlled panel focus</h2>
            <button
              type="button"
              onClick={() => {
                window.setTimeout(() => setExternalOpen(false), 500);
              }}
            >
              Schedule external collapse
            </button>
            <TaskRows
              label="Controlled task"
              appearance={appearance}
              expandedIds={externalOpen ? ["focus"] : []}
              onExpandedChange={(ids) => setExternalOpen(ids.includes("focus"))}
              items={[
                {
                  id: "focus",
                  title: "Editable sample",
                  state: "pending",
                  content: (
                    <input
                      aria-label="Detail draft"
                      defaultValue="Local draft"
                    />
                  ),
                },
              ]}
            />
          </section>
          <section aria-label="Empty examples">
            <h2>{language === "ar" ? "الحالات الفارغة" : "Empty states"}</h2>
            <TaskRowsExample language={language} empty />
            <NotificationListExample language={language} empty />
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
