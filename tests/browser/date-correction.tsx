import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  Button,
  DatePicker,
  Modal,
  Sheet,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
export function Fixture() {
  const params = new URLSearchParams(location.search),
    ar = params.get("lang") === "ar";
  const initial = params.get("date") || "2024-12-31";
  const [value, setValue] = useState(initial),
    [changes, setChanges] = useState(0);
  const t = (a: string, e: string) => (ar ? a : e);
  const field = (overlay = false) => (
    <DatePicker
      label={
        overlay
          ? t("تاريخ داخل النافذة", "Overlay date")
          : t("موعد", "Local date")
      }
      name={overlay ? "overlayDate" : "date"}
      value={value}
      locale={ar ? "ar" : "en"}
      onValueChange={(next) => {
        setValue(next);
        setChanges((n) => n + 1);
      }}
      yearRange={params.has("fixed") ? [1900, 2100] : undefined}
      min={params.has("bounded") ? "2024-12-20" : undefined}
      max={params.has("bounded") ? "2025-02-10" : undefined}
    />
  );
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: ar ? "rtl" : "ltr",
          theme: params.get("theme") === "dark" ? "dark" : "light",
          density:
            params.get("density") === "standard" ? "standard" : "compact",
          typography: params.get("type") === "large" ? "large" : "standard",
          reducedMotion: params.has("reduced"),
        }}
      >
        <main
          style={{
            padding: 16,
            minHeight: "100vh",
            display: "grid",
            gap: 16,
            alignContent: "start",
            background: "var(--background)",
            color: "var(--text)",
          }}
        >
          <h1 style={{ fontSize: "var(--text-heading)", margin: 0 }}>
            {t("اختيار التاريخ", "DatePicker")}
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Sheet
              trigger={<Button>Open Sheet</Button>}
              title="Sheet"
              description="Calendar dropdown test"
              closeLabel="Close Sheet"
            >
              {field(true)}
            </Sheet>
            <Modal
              trigger={<Button>Open Modal</Button>}
              title="Modal"
              description="Calendar dropdown test"
              closeLabel="Close Modal"
            >
              {field(true)}
            </Modal>
          </div>
          <form
            style={{ maxWidth: 440, display: "grid", gap: 12 }}
            onReset={() => {
              setValue(initial);
              setChanges(0);
            }}
          >
            {field()}
            <output data-summary dir="ltr">
              {value || "empty"}
            </output>
            <output data-changes>{changes}</output>
            <Button type="reset">Reset</Button>
          </form>
          <Button variant="ghost">Outside</Button>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
