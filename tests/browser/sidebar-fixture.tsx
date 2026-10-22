import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, Home, Info } from "lucide-react";
import {
  SystemProvider,
  defaultConfig,
  Sidebar,
  SidebarHeader,
  SidebarIdentity,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
  SidebarDisclosure,
  SidebarToggle,
  SidebarLabel,
  SidebarAction,
  Avatar,
} from "../../src/system";
import { SidebarExample } from "../../src/system/ai/examples/SidebarExamples";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";

export function Fixture() {
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [reducedMotion, setMotion] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [details, setDetails] = useState(false);
  const language = direction === "rtl" ? "ar" : "en";
  return (
    <div lang={language}>
      <SystemProvider
        config={{ ...defaultConfig, direction, theme, reducedMotion }}
      >
        <div style={{ padding: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label>
            Direction
            <select
              aria-label="Direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as "rtl" | "ltr")}
            >
              <option>rtl</option>
              <option>ltr</option>
            </select>
          </label>
          <label>
            Theme
            <select
              aria-label="Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark")}
            >
              <option>light</option>
              <option>dark</option>
            </select>
          </label>
          <button
            onClick={() => setMotion(!reducedMotion)}
            aria-pressed={reducedMotion}
          >
            Reduce motion
          </button>
          <button onClick={() => setTimeout(() => setCollapsed(true), 250)}>
            Collapse shortly
          </button>
        </div>
        <div style={{ display: "flex", minWidth: 0, padding: 8, gap: 16 }}>
          <Sidebar
            aria-label="Stress navigation"
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            style={{ height: 300 }}
          >
            <SidebarHeader>
              <SidebarIdentity>
                <BookOpen aria-hidden="true" />
                <SidebarLabel>طِراز · Tiraz</SidebarLabel>
              </SidebarIdentity>
              <SidebarToggle
                collapseLabel="Collapse navigation"
                expandLabel="Expand navigation"
              />
            </SidebarHeader>
            <SidebarContent aria-label="Stress notes">
              <SidebarGroup heading="ملاحظات · Notes">
                <SidebarItem
                  icon={<Home size={18} />}
                  label="دليل طويل جدًا للمكتبة العربية · A very long library guide label that must truncate"
                  href="#destination"
                  count="12345678901234567890"
                />
                <SidebarDisclosure
                  label="Notes"
                  icon={<BookOpen size={18} />}
                  defaultOpen
                  activeChild
                >
                  <SidebarItem
                    href="#destination"
                    label="Current child"
                    active
                    icon={<BookOpen size={18} />}
                  />
                </SidebarDisclosure>
                {Array.from({ length: 24 }, (_, index) => (
                  <SidebarItem
                    key={index}
                    href={`#note-${index}`}
                    label={`ملاحظة ${index + 1} · Note ${index + 1}`}
                    icon={<BookOpen size={18} />}
                  />
                ))}
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarIdentity>
                <Avatar name="Sara" fallback="SA" />
              </SidebarIdentity>
              <SidebarAction
                label="Details"
                icon={<Info size={18} />}
                aria-pressed={details}
                onClick={() => setDetails(!details)}
              />
            </SidebarFooter>
          </Sidebar>
          <main style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <h1 id="destination" tabIndex={-1}>
              Sidebar test destinations
            </h1>
            <p>{details ? "Details shown" : "Details hidden"}</p>
            {Array.from({ length: 24 }, (_, index) => (
              <h2 key={index} id={`note-${index}`} tabIndex={-1}>
                Note {index + 1}
              </h2>
            ))}
          </main>
        </div>
        <SidebarExample language={language} />
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
