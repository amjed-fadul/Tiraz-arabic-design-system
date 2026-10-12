import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Field,
  Input,
  Select,
  SystemProvider,
  ToastProvider,
  defaultConfig,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import { CreateCustomer } from "../../src/system/ai/examples/CreateCustomer";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const params = new URLSearchParams(location.search);
const config: SystemConfig = {
  ...defaultConfig,
  direction: params.get("dir") === "ltr" ? "ltr" : "rtl",
  theme: params.get("theme") === "dark" ? "dark" : "light",
  density: params.get("density") === "standard" ? "standard" : "compact",
  typography: params.get("typography") === "large" ? "large" : "standard",
  accent: "plum",
  radius: Number(params.get("radius") ?? 8),
  reducedMotion: params.get("motion") === "reduce",
};
export function Fixture() {
  const [value, setValue] = useState("one"),
    [input, setInput] = useState("Original"),
    [data, setData] = useState("");
  const language = config.direction === "rtl" ? "ar" : "en";
  const options = [
    { value: "one", label: "One" },
    { value: "disabled", label: "Disabled", disabled: true },
    { value: "two", label: "Two" },
    ...Array.from({ length: 45 }, (_, i) => ({
      value: `choice${i}`,
      label: `Choice ${String(i + 1).padStart(2, "0")}`,
    })),
  ];
  return (
    <div lang={language}>
      <SystemProvider config={config}>
        <main style={{ padding: 16, minHeight: "100vh" }}>
          <div style={{ maxWidth: 360 }}>
            <form
              id="native-form"
              onSubmit={(e) => {
                e.preventDefault();
                setData(
                  JSON.stringify(
                    Object.fromEntries(new FormData(e.currentTarget)),
                  ),
                );
              }}
              onReset={() => setInput("Original")}
            >
              <p id="external">External description</p>
              <Field
                label="Native text"
                helper="Helper"
                id="native-text"
                aria-describedby="external"
              >
                {(field) => (
                  <Input field={field} name="text" defaultValue="Initial" />
                )}
              </Field>
              <Field label="Controlled text">
                {(field) => (
                  <Input
                    field={field}
                    name="controlledText"
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                  />
                )}
              </Field>
              <Field label="Uncontrolled choice">
                {(field) => (
                  <Select
                    field={field}
                    name="uncontrolled"
                    defaultValue="one"
                    options={options}
                  />
                )}
              </Field>
              <Field label="Controlled choice">
                {(field) => (
                  <Select
                    field={field}
                    name="controlled"
                    value={value}
                    onValueChange={setValue}
                    defaultValue="one"
                    options={options}
                  />
                )}
              </Field>
              <Field label="Required choice" required>
                {(field) => (
                  <Select
                    field={field}
                    name="required"
                    options={options}
                    placeholder="Choose"
                  />
                )}
              </Field>
              <Input
                aria-label="Disabled"
                name="disabledInput"
                disabled
                defaultValue="Excluded"
              />
              <Input
                aria-label="Read only"
                name="readonly"
                readOnly
                defaultValue="Kept"
              />
              <div style={{ display: "flex", gap: 8, marginBlock: 8 }}>
                <Button type="submit">Submit</Button>
                <Button type="reset" variant="secondary">
                  Reset
                </Button>
              </div>
            </form>
            <output data-testid="form-data">{data}</output>
            <div data-testid="geometry" style={{ display: "grid", gap: 8 }}>
              {(["sm", "md"] as const).map((size) => (
                <div
                  key={size}
                  data-size={size}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                    gap: 8,
                  }}
                >
                  <Button size={size}>Save</Button>
                  <Input
                    size={size}
                    aria-label={`${size} input`}
                    defaultValue="مدار ACME"
                  />
                  <Select
                    size={size}
                    aria-label={`${size} select`}
                    options={options}
                    defaultValue="one"
                  />
                </div>
              ))}
            </div>
          </div>
          <ToastProvider
            label="Notifications"
            closeLabel="Dismiss notification"
          >
            <CreateCustomer language={language} />
          </ToastProvider>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
