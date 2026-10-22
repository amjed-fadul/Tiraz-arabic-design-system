import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  Button,
  DatePicker,
  OTPInput,
  Slider,
  Modal,
  Sheet,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
export function Fixture() {
  const p = new URLSearchParams(location.search),
    ar = p.get("lang") === "ar";
  const [config, setConfig] = useState<SystemConfig>({
    ...defaultConfig,
    direction: ar ? "rtl" : "ltr",
    theme: p.get("theme") === "dark" ? "dark" : "light",
    reducedMotion: p.has("reduced"),
  });
  const [code, setCode] = useState("001"),
    [date, setDate] = useState("2024-02-29"),
    [range, setRange] = useState(0.4);
  const [cancel, setCancel] = useState(false);
  const dateControl = (
    <DatePicker
      label={ar ? "تاريخ داخل اللوحة" : "Overlay date"}
      locale={ar ? "ar" : "en"}
      defaultValue="2024-12-31"
    />
  );
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider config={config}>
        <main
          style={{
            padding: 16,
            minHeight: "100vh",
            display: "grid",
            alignContent: "start",
            gap: 16,
          }}
        >
          <h1>{ar ? "اختبار عناصر النماذج" : "Form controls test"}</h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button
              onClick={() =>
                setConfig((c) => ({
                  ...c,
                  theme: c.theme === "light" ? "dark" : "light",
                }))
              }
            >
              Theme
            </Button>
            <Button
              onClick={() =>
                setConfig((c) => ({
                  ...c,
                  density: c.density === "compact" ? "standard" : "compact",
                  typography: c.typography === "large" ? "standard" : "large",
                  accent: c.accent === "blue" ? "plum" : "blue",
                  radius: c.radius === 0 ? 16 : 0,
                  reducedMotion: !c.reducedMotion,
                }))
              }
            >
              Customize
            </Button>
            <label>
              <input
                type="checkbox"
                checked={cancel}
                onChange={(e) => setCancel(e.target.checked)}
              />
              Cancel reset
            </label>
          </div>
          <form
            id="fixture-form"
            style={{ display: "grid", gap: 16, maxWidth: 440 }}
            onReset={(event) => {
              if (cancel) {
                event.preventDefault();
                return;
              }
              setCode("001");
              setDate("2024-02-29");
              setRange(0.4);
            }}
          >
            <Slider
              label="Range"
              name="range"
              min={0.1}
              max={0.95}
              step={0.1}
              defaultValue={0.4}
              formatValue={(v) => String(v)}
            />
            <Slider
              label="Controlled range"
              name="controlledRange"
              min={0}
              max={1}
              step={0.1}
              value={range}
              onValueChange={setRange}
            />
            <OTPInput label="Code" name="code" defaultValue="001" length={6} />
            <OTPInput label="Read only code" value="0012" readOnly />
            <OTPInput
              label="Controlled code"
              name="controlledCode"
              value={code}
              onValueChange={setCode}
            />
            <DatePicker
              label="Date"
              name="date"
              locale={ar ? "ar" : "en"}
              defaultValue="2024-02-29"
              min="2024-02-28"
              max="2025-01-02"
            />
            <DatePicker
              label="Controlled date"
              name="controlledDate"
              locale={ar ? "ar" : "en"}
              value={date}
              onValueChange={setDate}
            />
            <DatePicker
              label="Invalid date"
              value="2023-02-29"
              locale={ar ? "ar" : "en"}
            />
            <DatePicker
              label="Outside bounds"
              value="2024-01-01"
              min="2024-02-01"
              locale={ar ? "ar" : "en"}
            />
            <Button type="reset">Reset form</Button>
          </form>
          <DatePicker
            label="External date"
            form="fixture-form"
            name="externalDate"
            defaultValue="2024-12-31"
            locale={ar ? "ar" : "en"}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Sheet
              trigger={<Button>Open Sheet</Button>}
              title="Sheet"
              description="Calendar layering test"
              closeLabel="Close Sheet"
            >
              {dateControl}
            </Sheet>
            <Modal
              trigger={<Button>Open Modal</Button>}
              title="Modal"
              description="Calendar layering test"
              closeLabel="Close Modal"
            >
              {dateControl}
            </Modal>
          </div>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
