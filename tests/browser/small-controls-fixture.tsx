import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  Checkbox,
  RadioGroup,
  Textarea,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
export function Fixture() {
  const [cancel, setCancel] = useState(false),
    [checked, setChecked] = useState(true),
    [value, setValue] = useState("a"),
    [text, setText] = useState("original"),
    [config, setConfig] = useState(defaultConfig);
  return (
    <SystemProvider config={config}>
      <main style={{ padding: 24, maxWidth: 600 }}>
        <h1>Native form checks</h1>
        <Button
          onClick={() =>
            setConfig({
              ...config,
              theme: "dark",
              accent: "plum",
              density: "standard",
              typography: "large",
              radius: 0,
              reducedMotion: true,
            })
          }
        >
          Customize
        </Button>
        <Badge tone="success">Active</Badge>
        <Checkbox
          label="Cancel reset"
          checked={cancel}
          onChange={(e) => setCancel(e.currentTarget.checked)}
        />
        <form
          id="native"
          onReset={(e) => {
            if (cancel) e.preventDefault();
          }}
        >
          <Checkbox
            label="Consent"
            helper="Help"
            error="Error"
            name="consent"
            value="yes"
            defaultChecked
            required
          />
          <RadioGroup
            label="Native choice"
            name="choice"
            defaultValue="a"
            required
            helper="Choose once"
            options={[
              { value: "a", label: "Alpha" },
              { value: "disabled", label: "Disabled", disabled: true },
              { value: "b", label: "Beta" },
            ]}
          />
          <Textarea
            label="Native notes"
            name="notes"
            defaultValue="original"
            rows={3}
            required
          />
          <Button type="reset">Native reset</Button>
        </form>
        <RadioGroup
          form="native"
          label="External choice"
          name="external"
          defaultValue="x"
          options={[
            { value: "x", label: "External X" },
            { value: "y", label: "External Y" },
          ]}
        />
        <form
          id="controlled"
          onReset={(e) => {
            if (cancel) {
              e.preventDefault();
              return;
            }
            setChecked(true);
            setValue("a");
            setText("original");
          }}
        >
          <Checkbox
            label="Controlled consent"
            checked={checked}
            name="consent"
            value="yes"
            onChange={(e) => setChecked(e.currentTarget.checked)}
          />
          <RadioGroup
            label="Controlled choice"
            name="choice"
            value={value}
            onValueChange={setValue}
            options={[
              { value: "a", label: "Controlled A" },
              { value: "b", label: "Controlled B" },
            ]}
          />
          <Textarea
            label="Controlled notes"
            name="notes"
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
          />
          <Button type="reset">Controlled reset</Button>
        </form>
        <form id="required">
          <Checkbox label="Required checkbox" required />
          <RadioGroup
            label="Required choice"
            name="required"
            required
            options={[{ value: "r", label: "Required radio" }]}
          />
          <Textarea label="Required notes" required />
          <Button type="submit">Submit required</Button>
        </form>
      </main>
    </SystemProvider>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
