import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { AIDecisionsExample } from "../../src/system/ai/examples/AIDecisionsExamples";
import { ApprovalFlow, SystemProvider, defaultConfig } from "../../src/system";
import type { ApprovalRequest } from "../../src/system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
const params = new URLSearchParams(location.search),
  ar = params.get("lang") === "ar";
document.documentElement.lang = ar ? "ar" : "en";
const failingRequests: ApprovalRequest[] = [
  {
    id: "archive-drafts",
    action: "Archive 4 stale drafts",
    target: "Marketing workspace",
    consequences: ["The drafts move to the archive and stay restorable."],
    approveLabel: "Archive drafts",
    rejectLabel: "Keep drafts",
  },
  {
    id: "notify-owners",
    action: "Notify draft owners",
    target: "4 workspace members",
    consequences: ["Each owner receives one email."],
    approveLabel: "Notify owners",
    rejectLabel: "Don’t notify",
  },
];
/** Verification host: the first decision fails, later ones are accepted. */
export function FailingHostFlow() {
  const failed = useRef(false);
  return (
    <ApprovalFlow
      label="Workspace cleanup decisions"
      requests={failingRequests}
      onDecision={(_request, _decision, { signal }) =>
        new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            if (!failed.current) {
              failed.current = true;
              reject(new Error("Host rejected the decision"));
            } else resolve();
          }, 400);
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Cancelled", "AbortError"));
          });
        })
      }
    />
  );
}
createRoot(document.getElementById("root")!).render(
  <SystemProvider
    config={{
      ...defaultConfig,
      direction: ar ? "rtl" : "ltr",
      theme: params.get("theme") === "dark" ? "dark" : "light",
      accent: params.get("custom") ? "plum" : "sage",
      density: params.get("custom") ? "standard" : "compact",
      radius: params.get("custom") ? 2 : 8,
      typography: params.get("custom") ? "large" : "standard",
      reducedMotion: params.get("motion") === "true",
    }}
  >
    <main
      style={{
        padding: 12,
        maxWidth: 700,
        marginInline: "auto",
        minHeight: "100dvh",
      }}
    >
      <h1 style={{ fontSize: 20 }}>
        {ar ? "قرارات مطابقة الفواتير" : "Invoice reconciliation decisions"}
      </h1>
      <h2 style={{ fontSize: 16 }}>{ar ? "إقفال أكتوبر" : "October close"}</h2>
      {params.has("failing-host") ? (
        <FailingHostFlow />
      ) : (
        <AIDecisionsExample language={ar ? "ar" : "en"} />
      )}
    </main>
  </SystemProvider>,
);
