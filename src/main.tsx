import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
import "./workbench/workbench.css";
import { Dashboard } from "./examples/dashboard/Dashboard";
import { ChatAppDemo } from "./examples/chat-app/ChatApp";
import { Workbench } from "./workbench/Workbench";
import { StandalonePlayground } from "./workbench/StandalonePlayground";
import { navigationCatalog } from "./workbench/catalog";
const path = window.location.pathname.replace(/\/$/, "");
// A docs page's playground on its own: /examples/playground/<page>.
const playground = navigationCatalog.find(
  (item) => path === `/examples/playground/${item.id}`,
);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {path === "/examples/dashboard" ? (
      <Dashboard />
    ) : path === "/examples/chat-app" ? (
      <ChatAppDemo />
    ) : playground ? (
      <StandalonePlayground component={playground.id} />
    ) : (
      <Workbench />
    )}
  </StrictMode>,
);
