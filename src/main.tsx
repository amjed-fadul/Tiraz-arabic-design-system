import { StrictMode } from "react";
import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
import "./workbench/workbench.css";
import { Dashboard } from "./examples/dashboard/Dashboard";
import { ChatAppDemo } from "./examples/chat-app/ChatApp";
import { MonthEndClose } from "./examples/month-end-close/MonthEndClose";
import { Invoices } from "./examples/invoices/Invoices";
import { CustomerProfile } from "./examples/customer-profile/CustomerProfile";
import { Onboarding } from "./examples/onboarding/Onboarding";
import { HelpCenter } from "./examples/help-center/HelpCenter";
import { ContractReview } from "./examples/contract-review/ContractReview";
import { ContentStudio } from "./examples/content-studio/ContentStudio";
import { AgentControlRoom } from "./examples/agent-control-room/AgentControlRoom";
import { TeamSettings } from "./examples/team-settings/TeamSettings";
import { SalesPipeline } from "./examples/sales-pipeline/SalesPipeline";
import { screenPath } from "./examples/frame/screen";
import { Workbench } from "./workbench/Workbench";
import { StandalonePlayground } from "./workbench/StandalonePlayground";
import { navigationCatalog } from "./workbench/catalog";
// The standalone pages: the Dashboard, the chat app, then the ten screens.
const routes: { path: string; component: ComponentType }[] = [
  { path: screenPath("dashboard"), component: Dashboard },
  { path: "/examples/chat-app", component: ChatAppDemo },
  { path: screenPath("month-end-close"), component: MonthEndClose },
  { path: screenPath("invoices"), component: Invoices },
  { path: screenPath("customer-profile"), component: CustomerProfile },
  { path: screenPath("onboarding"), component: Onboarding },
  { path: screenPath("help-center"), component: HelpCenter },
  { path: screenPath("contract-review"), component: ContractReview },
  { path: screenPath("content-studio"), component: ContentStudio },
  { path: screenPath("agent-control-room"), component: AgentControlRoom },
  { path: screenPath("team-settings"), component: TeamSettings },
  { path: screenPath("sales-pipeline"), component: SalesPipeline },
];
const path = window.location.pathname.replace(/\/$/, "");
const Page = routes.find((route) => route.path === path)?.component;
// A docs page's playground on its own: /examples/playground/<page>.
const playground = navigationCatalog.find(
  (item) => path === `/examples/playground/${item.id}`,
);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {Page ? (
      <Page />
    ) : playground ? (
      <StandalonePlayground component={playground.id} />
    ) : (
      <Workbench />
    )}
  </StrictMode>,
);
