import { useEffect, useState } from "react";
import { Button } from "../system/Button";
import { SystemProvider } from "../system/Provider";
import { AgentWorkspaceExample } from "../system/ai/examples/AgentWorkspaceExample";
import { Khayt } from "../mascot/Khayt";
import { readDocumentation, readSystem, readTheme } from "./storage";
import "./agent-workspace-docs.css";

/** Full canvas for the same source composition shown in the documentation. */
export function StandaloneWorkspace() {
  const [language, setLanguage] = useState(() => readDocumentation().language);
  const [theme, setTheme] = useState(readTheme);
  const [settings] = useState(readSystem);
  const ar = language === "ar";
  const config = {
    ...settings,
    theme,
    direction: ar ? ("rtl" as const) : ("ltr" as const),
  };
  useEffect(() => {
    document.title = `${ar ? "مساحة عمل سياقية · طِراز" : "Contextual workspace · Tiraz"}`;
    document.documentElement.dir = ar ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.style.colorScheme = theme;
  }, [ar, language, theme]);
  return (
    <SystemProvider config={config} lang={language}>
      <main className="workspace-preview">
        <header className="workspace-preview-header">
          <a href="/library/contextual-workspace">{ar ? "طِراز" : "Tiraz"}</a>
          <h1>{ar ? "مساحة عمل سياقية" : "Contextual workspace"}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            aria-label={ar ? "Switch to English" : "Switch to Arabic"}
          >
            {ar ? "EN" : "عربي"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {ar
              ? theme === "dark"
                ? "فاتح"
                : "داكن"
              : theme === "dark"
                ? "Light"
                : "Dark"}
          </Button>
        </header>
        <AgentWorkspaceExample
          language={language}
          agentAvatar={<Khayt size={28} animated={false} />}
        />
      </main>
    </SystemProvider>
  );
}
