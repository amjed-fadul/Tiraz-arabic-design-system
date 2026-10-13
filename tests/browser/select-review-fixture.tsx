import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Input,
  Select,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const params = new URLSearchParams(location.search);
const external = params.get("association") === "external",
  controlled = params.get("mode") === "controlled",
  scenario = params.get("scenario") ?? "reset",
  reset = params.get("reset"),
  invalid = params.get("invalid"),
  order = params.get("order") ?? "selects";
export function SelectReviewFixture() {
  const [value, setValue] = useState("a"),
    [application, setApplication] = useState("a"),
    [changes, setChanges] = useState<string[]>([]);
  const summary = useRef<HTMLHeadingElement>(null);
  function cancelReset(event: FormEvent) {
    event.preventDefault();
  }
  function handleInvalid(event: FormEvent) {
    event.preventDefault();
    if (params.get("summary") === "true") summary.current?.focus();
  }
  const select = (
    <Select
      id="first-choice"
      aria-label="Choice"
      name="choice"
      form={external ? "review-form" : undefined}
      required={scenario === "validation"}
      value={scenario === "reset" && controlled ? value : undefined}
      defaultValue={scenario === "reset" ? "a" : ""}
      options={[
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta" },
      ]}
      onValueChange={(next) => {
        setValue(next);
        setApplication(next);
        setChanges((previous) => [...previous, next]);
      }}
    />
  );
  const input = (
    <Input
      id="invalid-input"
      aria-label="Required input"
      required
      name="text"
      form={order.startsWith("external") ? "review-form" : undefined}
    />
  );
  return (
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <main
        style={{ maxWidth: 400 }}
        onInvalid={invalid === "bubble" ? handleInvalid : undefined}
        onInvalidCapture={invalid === "capture" ? handleInvalid : undefined}
      >
        <h1>Native form ownership</h1>
        <h2 id="summary" tabIndex={-1} ref={summary}>
          Error summary
        </h2>
        <Button id="anchor">Anchor</Button>
        {order === "external-input-before-select" && input}
        {external && select}
        <form
          id="review-form"
          onReset={reset === "bubble" ? cancelReset : undefined}
          onResetCapture={reset === "capture" ? cancelReset : undefined}
          onSubmit={(event) => event.preventDefault()}
        >
          {scenario === "validation" &&
            order === "input-before-select" &&
            input}
          {!external && select}
          {scenario === "validation" &&
            order === "select-before-input" &&
            input}
          {scenario === "validation" && order === "selects" && (
            <Select
              aria-label="Second choice"
              name="second"
              required
              options={[{ value: "a", label: "Alpha" }]}
            />
          )}
          <Input aria-label="Enter source" defaultValue="Ready" />
          <Button id="submit" type="submit">
            Submit
          </Button>
          <Button type="reset">Reset</Button>
        </form>
        {order === "external-select-before-input" && input}
        <Button onClick={() => setChanges([])}>Clear changes</Button>
        <output data-testid="application">{application}</output>
        <output data-testid="changes">{JSON.stringify(changes)}</output>
      </main>
    </SystemProvider>
  );
}
createRoot(document.getElementById("root")!).render(<SelectReviewFixture />);
