import { useState } from "react";
import { SystemProvider, defaultConfig } from "../../system";
import { ChatAppExample } from "../../system/ai/examples/ChatAppExample";
export function ChatAppDemo() {
  const query = new URLSearchParams(window.location.search);
  const [language, setLanguage] = useState<"ar" | "en">(
      query.get("lang") === "en" ? "en" : "ar",
    ),
    [theme, setTheme] = useState<"light" | "dark">(
      query.get("theme") === "dark" ? "dark" : "light",
    );
  const ar = language === "ar";
  return (
    <SystemProvider
      config={{ ...defaultConfig, theme, direction: ar ? "rtl" : "ltr" }}
    >
      <main
        lang={language}
        style={{
          padding: "var(--space-3)",
          maxInlineSize: 1200,
          marginInline: "auto",
          minInlineSize: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
            flexWrap: "wrap",
            marginBlockEnd: "var(--space-3)",
          }}
        >
          <h1 style={{ fontSize: "var(--text-title)", margin: 0, flex: 1 }}>
            ChatApp
          </h1>
          <label>
            {ar ? "اللغة" : "Language"}{" "}
            <select
              aria-label="Language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as "ar" | "en")
              }
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            {ar ? "المظهر" : "Theme"}{" "}
            <select
              aria-label="Theme"
              value={theme}
              onChange={(event) =>
                setTheme(event.target.value as "light" | "dark")
              }
            >
              <option value="light">{ar ? "فاتح" : "Light"}</option>
              <option value="dark">{ar ? "داكن" : "Dark"}</option>
            </select>
          </label>
        </div>
        <ChatAppExample language={language} />
      </main>
    </SystemProvider>
  );
}
