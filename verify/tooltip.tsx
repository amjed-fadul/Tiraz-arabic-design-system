import { StrictMode, useState } from "react";
import type { CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import {
  SystemProvider,
  defaultConfig,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
  Modal,
  Sheet,
} from "../src/system";
import "../src/system/styles.css";
import "./tooltip.css";

const mode = new URLSearchParams(location.search).get("mode");
function Panel({ dark = false }: { dark?: boolean }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [replacement, setReplacement] = useState<HTMLDivElement | null>(null);
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  const [destination, setDestination] = useState("first");
  const [open, setOpen] = useState(true);
  const [reduced, setReduced] = useState(false);
  const name = dark ? "English dark" : "Arabic light";
  const target =
    destination === "pending"
      ? null
      : destination === "second"
        ? replacement
        : host;
  return (
    <section aria-label={name} className="panel">
      <h2>{name}</h2>
      <div className="controls">
        <button onClick={() => setDestination("pending")}>
          Withhold {name}
        </button>
        <button onClick={() => setDestination("first")}>
          First host {name}
        </button>
        <button onClick={() => setDestination("second")}>
          Second host {name}
        </button>
        <button onClick={() => setOpen((value) => !value)}>
          Toggle {name}
        </button>
        <button onClick={() => setReduced((value) => !value)}>
          Motion {name}
        </button>
      </div>
      <div
        ref={setBoundary}
        className={mode === "geometry" ? "boundary narrow" : "boundary"}
        data-boundary={name}
      >
        <SystemProvider
          portalContainer={target}
          lang={dark ? "en" : "ar"}
          config={{
            ...defaultConfig,
            theme: dark ? "dark" : "light",
            direction: dark ? "ltr" : "rtl",
            reducedMotion: reduced,
          }}
          style={
            {
              "--surface": dark ? "#202b38" : "#fcf4df",
              "--tiraz-action": "#7b4c98",
            } as CSSProperties
          }
        >
          <TooltipRoot
            {...(mode === "geometry" ? { open, onOpenChange: setOpen } : {})}
          >
            <TooltipTrigger>{dark ? "Details" : "التفاصيل"}</TooltipTrigger>
            <TooltipContent
              collisionBoundary={boundary}
              collisionPadding={8}
              side="bottom"
            >
              {dark
                ? "A longer explanation that must wrap within this narrow embedded page without overflowing its edges."
                : "شرح أطول يجب أن يلتف داخل حدود هذه الصفحة الضيقة دون تجاوز أطرافها."}
            </TooltipContent>
          </TooltipRoot>
          <Tooltip
            trigger={<button>{dark ? "Next help" : "مساعدة أخرى"}</button>}
            content={dark ? "Next explanation" : "توضيح آخر"}
          />
        </SystemProvider>
        <div ref={setHost} data-host={`${name}-first`} />
        <div ref={setReplacement} data-host={`${name}-second`} />
      </div>
    </section>
  );
}
function Nested({
  kind,
  outside,
}: {
  kind: "Modal" | "Sheet";
  outside: boolean;
}) {
  const Dialog = kind === "Modal" ? Modal : Sheet;
  const [outer, setOuter] = useState<HTMLDivElement | null>(null);
  const [inner, setInner] = useState<HTMLDivElement | null>(null);
  const name = `${kind} ${outside ? "outside" : "inside"}`;
  return (
    <section>
      <div ref={setOuter} data-outer={name} />
      <SystemProvider lang="en" config={{ ...defaultConfig, direction: "ltr" }}>
        <Dialog
          trigger={<button>Open {name}</button>}
          title={name}
          description="Nested destination verification"
          closeLabel={`Close ${name}`}
        >
          <button>First focus</button>
          <div ref={setInner} data-inner={name} />
          <SystemProvider
            portalContainer={
              mode === "provider-outside" && outside ? outer : undefined
            }
            lang="en"
            config={{ ...defaultConfig, direction: "ltr" }}
          >
            <TooltipRoot>
              <TooltipTrigger>Nested help</TooltipTrigger>
              <TooltipContent
                portalContainer={
                  mode === "provider-outside"
                    ? undefined
                    : outside
                      ? outer
                      : inner
                }
              >
                Nested explanation
              </TooltipContent>
            </TooltipRoot>
          </SystemProvider>
          <Tooltip
            trigger={<button>Default help</button>}
            content="Default nested explanation"
          />
        </Dialog>
      </SystemProvider>
    </section>
  );
}
function Fixture() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <h1>Tiraz Tooltip verification</h1>
      <button onClick={() => setCount((n) => n + 1)}>Sibling action</button>
      <output aria-label="Sibling count">{count}</output>
      <div className="panels">
        <Panel />
        <Panel dark />
      </div>
      <div className="dialogs">
        {(["Modal", "Sheet"] as const).flatMap((kind) =>
          [false, true].map((outside) => (
            <Nested key={`${kind}-${outside}`} kind={kind} outside={outside} />
          )),
        )}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
