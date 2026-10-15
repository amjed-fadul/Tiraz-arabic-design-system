import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  OTPInput,
  SystemProvider,
  defaultConfig,
  Button,
} from "../../src/system";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
export function Fixture() {
  const query = new URLSearchParams(location.search),
    ar = query.get("language") === "ar";
  const [controlled, setControlled] = useState("001234");
  const [frozen, setFrozen] = useState(false);
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: ar ? "rtl" : "ltr",
          theme: query.get("theme") === "dark" ? "dark" : "light",
          density: query.get("density") === "standard" ? "standard" : "compact",
          typography:
            query.get("typography") === "large" ? "large" : "standard",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            padding: 24,
            display: "grid",
            alignContent: "start",
            gap: 24,
          }}
        >
          <h1>{ar ? "تصحيح إدخال الرمز" : "OTP input correction"}</h1>
          <form
            style={{ display: "grid", gap: 24, maxWidth: 440 }}
            onReset={() => setControlled("001234")}
          >
            <OTPInput
              label={ar ? "رمز تجريبي" : "Sample code"}
              name="code"
              helper={
                ar
                  ? "أرقام عربية أو إنجليزية؛ دون تحقق."
                  : "Arabic or ASCII digits; no verification."
              }
            />
            <OTPInput
              label="Controlled code"
              name="controlled"
              value={controlled}
              onValueChange={(next) => {
                if (!frozen) setControlled(next);
              }}
            />
            <OTPInput
              label="Read only"
              name="readonly"
              value="001234"
              readOnly
            />
            <OTPInput
              label="Disabled"
              name="disabled"
              value="001234"
              disabled
            />
            <OTPInput
              label="Error code"
              name="error"
              defaultValue="001"
              error={ar ? "راجع الرمز المدخل." : "Review the entered code."}
            />
            <label>
              <input
                type="checkbox"
                checked={frozen}
                onChange={(event) => setFrozen(event.target.checked)}
              />
              Freeze controlled value
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button type="reset">Reset</Button>
              <Button onClick={() => setControlled("000000")}>
                External value
              </Button>
              <Button>Outside</Button>
            </div>
          </form>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
