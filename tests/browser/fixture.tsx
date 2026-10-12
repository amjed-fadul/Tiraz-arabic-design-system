import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  Button,
  DropdownMenu,
  Sheet,
  SystemProvider,
  Switch,
  defaultConfig,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
export function Fixture() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [event, setEvent] = useState("");
  const items = Array.from({ length: 40 }, (_, i) => ({
    id: `item-${i + 1}`,
    label: `Item ${i + 1}`,
    onSelect: () => setEvent(`Selected ${i + 1}`),
  }));
  const controls = () => (
    <div>
      {Object.entries({
        theme: ["light", "dark"],
        accent: ["sage", "blue", "plum", "clay"],
        typography: ["standard", "large"],
        density: ["compact", "standard"],
        radius: ["0", "8", "16"],
        reducedMotion: ["false", "true"],
        direction: ["rtl", "ltr"],
      }).map(([key, options]) => (
        <label key={key} style={{ display: "block" }}>
          Fixture {key}
          <select
            aria-label={`Fixture ${key}`}
            value={String(config[key as keyof SystemConfig])}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                [key]:
                  key === "radius"
                    ? Number(e.target.value)
                    : key === "reducedMotion"
                      ? e.target.value === "true"
                      : e.target.value,
              }))
            }
          >
            {options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
  const menu = (label: string) => (
    <DropdownMenu trigger={<Button>{label}</Button>} items={items} />
  );
  return (
    <SystemProvider config={config}>
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <Button
          onClick={() =>
            setConfig((c) => ({
              ...c,
              theme: c.theme === "light" ? "dark" : "light",
              accent: "blue",
              typography: "large",
              radius: 16,
              reducedMotion: true,
            }))
          }
        >
          Change configuration
        </Button>
        <Button
          onClick={() =>
            setConfig((c) => ({
              ...c,
              direction: c.direction === "rtl" ? "ltr" : "rtl",
            }))
          }
        >
          Change direction
        </Button>
        {menu("Long menu")}
        {controls()}
        <Sheet
          trigger={<Button>Open sheet</Button>}
          title="Nested menu"
          description="Real dropdown in a modal"
          closeLabel="Close sheet"
        >
          {menu("Nested menu trigger")}
          {controls()}
          <Button
            onClick={() =>
              setConfig((c) => ({
                ...c,
                theme: "dark",
                accent: "plum",
                typography: "large",
                density: "standard",
                radius: 16,
                reducedMotion: true,
              }))
            }
          >
            Update open overlay
          </Button>
        </Sheet>
        <SystemProvider config={{ ...defaultConfig, density: "standard" }}>
          <Button>Scoped standard</Button>
        </SystemProvider>
        <p id="external">External help</p>
        <Switch label="External description" aria-describedby="external" />
        <output>{event}</output>
      </main>
    </SystemProvider>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
