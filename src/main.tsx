import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
import "./workbench/workbench.css";
import { Dashboard } from "./examples/dashboard/Dashboard";
import { Workbench } from "./workbench/Workbench";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname.replace(/\/$/, "") === "/examples/dashboard" ? (
      <Dashboard />
    ) : (
      <Workbench />
    )}
  </StrictMode>,
);
