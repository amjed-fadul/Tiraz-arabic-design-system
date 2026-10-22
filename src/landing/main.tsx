import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../system/tokens.css";
import "../system/components.css";
import "lenis/dist/lenis.css";
import "./fonts.css";
import "./landing.css";
import { Landing } from "./Landing";
import { SiteAnalytics } from "../SiteAnalytics";

createRoot(document.getElementById("landing-root")!).render(
  <StrictMode>
    <Landing />
    <SiteAnalytics />
  </StrictMode>,
);
