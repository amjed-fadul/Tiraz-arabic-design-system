import { useState } from "react";
import type { FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Select,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const params = new URLSearchParams(location.search);
export function SelectAssociationFixture() {
  const [generation, setGeneration] = useState(
    params.get("lifecycle") === "late" ? -1 : 0,
  );
  const [value, setValue] = useState("a");
  const [changes, setChanges] = useState<string[]>([]);
  const cancellation = params.get("cancel");
  const cancel = (event: FormEvent) => event.preventDefault();
  function form(version: number, previous = false) {
    return (
      <form
        key={version}
        id={previous ? "previous-choices" : "choices"}
        onReset={cancellation === "bubble" ? cancel : undefined}
        onResetCapture={cancellation === "capture" ? cancel : undefined}
      >
        <Button type="reset">{previous ? "Previous reset" : "Reset"}</Button>
      </form>
    );
  }
  return (
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <Select
        id="choice"
        aria-label="Choice"
        name="choice"
        form="choices"
        value={params.get("mode") === "controlled" ? value : undefined}
        defaultValue="a"
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        onValueChange={(next) => {
          setValue(next);
          setChanges((previous) => [...previous, next]);
        }}
      />
      <Button onClick={() => setGeneration((previous) => previous + 1)}>
        Change form
      </Button>
      <Button onClick={() => setChanges([])}>Clear changes</Button>
      {params.get("lifecycle") === "retain" && generation > 0 && form(0, true)}
      {generation >= 0 && form(generation)}
      <output data-testid="application">{value}</output>
      <output data-testid="changes">{JSON.stringify(changes)}</output>
    </SystemProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <SelectAssociationFixture />,
);
