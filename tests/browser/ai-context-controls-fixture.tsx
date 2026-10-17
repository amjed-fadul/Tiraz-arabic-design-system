import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AIContextExample } from "../../src/system/ai/examples/AIContextExamples";
import {
  Button,
  ContextMeter,
  Modal,
  ModelSelector,
  SelectionActions,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const p = new URLSearchParams(location.search),
  ar = p.get("lang") === "ar";
export function App() {
  const [value, setValue] = useState("draft"),
    [result, setResult] = useState("");
  const models = [
    {
      id: "draft",
      name: "Draft",
      provider: "Studio",
      description: "Sample draft model",
    },
    {
      id: "offline",
      name: "Offline",
      provider: "Studio",
      disabled: true,
      description: "Unavailable sample",
    },
    {
      id: "review",
      name: "Review",
      provider: "Local",
      description: "Sample review model",
    },
  ];
  const nested = (
    <>
      <ModelSelector
        label="Nested model"
        models={models}
        value={value}
        onValueChange={setValue}
      />
      <ContextMeter label="Nested context" used={50} capacity={100} />
      <SelectionActions
        label="Nested selection"
        actions={[
          { id: "nested", label: "Use nested text", onSelect: setResult },
        ]}
      >
        <p id="nested-text">Nested mixed text — مرحبا Tiraz.</p>
      </SelectionActions>
      <output>{result}</output>
    </>
  );
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: ar ? "rtl" : "ltr",
          theme: p.get("theme") === "dark" ? "dark" : "light",
          accent: p.get("custom") === "true" ? "plum" : "sage",
          typography: p.get("custom") === "true" ? "large" : "standard",
          radius: p.get("custom") === "true" ? 16 : 8,
          density: p.get("custom") === "true" ? "standard" : "compact",
          reducedMotion: p.get("motion") === "true",
        }}
      >
        <main
          style={{
            maxWidth: 760,
            margin: "auto",
            padding: 16,
            minHeight: "100vh",
          }}
        >
          <h1 style={{ fontSize: 20 }}>
            Tiraz · {ar ? "أدوات سياق المحادثة" : "AI context controls"}
          </h1>
          <AIContextExample language={ar ? "ar" : "en"} longContent />
          <p id="outside">Outside text — نص خارج النطاق</p>
          <SelectionActions
            label="Boundary scope"
            actions={[
              { id: "capture", label: "Capture", onSelect: setResult },
              {
                id: "disabled",
                label: "Disabled",
                disabled: true,
                onSelect: setResult,
              },
              { id: "extra", label: "Extra", onSelect: setResult },
            ]}
          >
            <p id="boundary">
              Mixed Arabic مرحبا بالعالم and English selection.
            </p>
            <p id="cross-start">Start of range.</p>
            <code id="code">Code must not trigger actions.</code>
            <p id="cross-end">End of range.</p>
            <input aria-label="Excluded input" defaultValue="Editable input" />
            <div contentEditable suppressContentEditableWarning id="editable">
              Editable content
            </div>
            <button id="excluded-button">Interactive text</button>
            <div id="custom" role="button" tabIndex={0}>
              Custom button text
            </div>
            <p data-selection-actions-exclude id="excluded">
              Explicit exclusion
            </p>
          </SelectionActions>
          <output id="captured">{result}</output>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBlock: 12,
            }}
          >
            <ContextMeter label="Over" used={120} capacity={100} />
            <ContextMeter label="Zero" used={0} capacity={0} />
            <ContextMeter label="Missing" />
            <ContextMeter label="Invalid" used={NaN} capacity={-1} />
            <ContextMeter label="Estimate" used={12} capacity={100} estimated />
            <ContextMeter label="Empty usage" used={0} capacity={100} />
          </div>
          <Modal
            title="Model settings"
            description="Nested overlay verification"
            closeLabel="Close settings"
            trigger={<Button>Open settings</Button>}
          >
            {nested}
          </Modal>
          <div style={{ height: 300 }} />
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
