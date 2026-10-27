import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DatePicker,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalRoot,
  ModalTrigger,
  Select,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetRoot,
  SheetTrigger,
  SystemProvider,
  defaultConfig,
} from "../src/system";
import "../src/system/styles.css";
import "./overlays.css";

// ?mode=unbounded omits every collisionBoundary, for the before measurement.
const mode = new URLSearchParams(location.search).get("mode");

function Popups({ arabic }: { arabic: boolean }) {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  const name = arabic ? "Arabic RTL" : "English LTR";
  const bounded = mode === "unbounded" ? undefined : boundary;
  return (
    <section aria-label={name} className="panel">
      <h2>{name}</h2>
      <div ref={setBoundary} className="boundary" data-boundary={name}>
        <SystemProvider
          lang={arabic ? "ar" : "en"}
          config={{ ...defaultConfig, direction: arabic ? "rtl" : "ltr" }}
        >
          <Select
            aria-label={arabic ? "الخطة" : "Plan"}
            placeholder={arabic ? "اختر الخطة" : "Choose a plan"}
            collisionBoundary={bounded}
            options={[
              {
                value: "starter",
                label: arabic
                  ? "الخطة الأساسية للفرق الصغيرة التي تبدأ للتو"
                  : "Starter plan for small teams that are just beginning",
              },
              { value: "team", label: arabic ? "الفريق" : "Team" },
              { value: "scale", label: arabic ? "التوسع" : "Scale" },
            ]}
          />
          <DatePicker
            label={arabic ? "تاريخ الاستحقاق" : "Due date"}
            defaultValue="2026-10-27"
            collisionBoundary={bounded}
          />
          <DropdownMenuRoot>
            <DropdownMenuTrigger>
              {arabic ? "إجراءات" : "Actions"}
            </DropdownMenuTrigger>
            <DropdownMenuContent collisionBoundary={bounded}>
              <DropdownMenuItem>
                {arabic ? "تعديل الفاتورة بالكامل" : "Edit the whole invoice"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {arabic ? "نسخ" : "Duplicate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </SystemProvider>
      </div>
    </section>
  );
}

function Dialogs() {
  const [count, setCount] = useState(0);
  const [last, setLast] = useState("none");
  return (
    <SystemProvider lang="en" config={{ ...defaultConfig, direction: "ltr" }}>
      <div className="row">
        <button onClick={() => setCount((value) => value + 1)}>
          Sibling action
        </button>
        <output aria-label="Sibling count">{count}</output>
      </div>
      <div className="row">
        <ModalRoot>
          <ModalTrigger>Open compound modal</ModalTrigger>
          <ModalContent
            title="Compound modal"
            description="Describes the compound modal"
            closeLabel="Close compound modal"
          >
            <ModalBody>
              <label>
                Modal name <input defaultValue="Al Noor" />
              </label>
            </ModalBody>
            <ModalFooter>
              <button>Save modal</button>
            </ModalFooter>
          </ModalContent>
        </ModalRoot>
        <SheetRoot>
          <SheetTrigger>Open compound sheet</SheetTrigger>
          <SheetContent
            title="Compound sheet"
            description="Describes the compound sheet"
            closeLabel="Close compound sheet"
          >
            <SheetBody>
              <label>
                Sheet name <input defaultValue="Al Noor" />
              </label>
            </SheetBody>
            <SheetFooter>
              <button>Save sheet</button>
            </SheetFooter>
          </SheetContent>
        </SheetRoot>
        <DropdownMenuRoot>
          <DropdownMenuTrigger>Open compound menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem shortcut="E" onSelect={() => setLast("edit")}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Archive</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLast("duplicate")}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setLast("delete")}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
        <output aria-label="Last selection">{last}</output>
      </div>
    </SystemProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main>
      <h1>Tiraz overlay verification</h1>
      <Dialogs />
      <div className="panels">
        <Popups arabic />
        <Popups arabic={false} />
      </div>
    </main>
  </StrictMode>,
);
